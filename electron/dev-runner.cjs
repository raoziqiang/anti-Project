const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const VITE_PORT = 5173;
const DEV_URL = `http://localhost:${VITE_PORT}`;

// Pretty terminal logs with ANSI styling
const log = {
  info: (msg) => console.log(`\x1b[36m[DevRunner]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[DevRunner] ✔\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m[DevRunner] ⚠\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[DevRunner] ✖\x1b[0m ${msg}`),
  hot: (msg) => console.log(`\x1b[35m[DevRunner] ⚡\x1b[0m ${msg}`)
};

let viteProcess = null;
let electronProcess = null;
let restartDebounceTimer = null;
let isShuttingDown = false;

// Safely terminate a process and its child processes on Windows or POSIX
function killProcess(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
    } else {
      proc.kill('SIGKILL');
    }
  } catch {
    try {
      proc.kill();
    } catch {}
  }
}

// 1. Launch Vite Development Server (Provides Frontend React HMR Hot Reload)
function startVite() {
  log.info('正在启动前端 Vite 开发服务器 (支持 React 模块热加载 HMR)...');

  const viteBin = path.join(__dirname, '../node_modules/vite/bin/vite.js');
  
  viteProcess = spawn(process.execPath, [viteBin], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  viteProcess.on('error', (err) => {
    log.error(`Vite 进程启动异常: ${err.message}`);
  });

  viteProcess.on('exit', (code) => {
    if (!isShuttingDown) {
      log.warn(`Vite 开发服务器已退出，退出码: ${code}`);
    }
  });
}

// 2. Wait for Vite server port to be active
function waitForVite(maxAttempts = 50) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const req = http.get(DEV_URL, (res) => {
        resolve();
      });
      req.on('error', () => {
        if (attempts >= maxAttempts) {
          reject(new Error('等待 Vite 开发服务器响应超时。'));
        } else {
          setTimeout(check, 150);
        }
      });
      req.setTimeout(500, () => {
        req.destroy();
        if (attempts >= maxAttempts) {
          reject(new Error('Vite 连接握手超时。'));
        } else {
          setTimeout(check, 150);
        }
      });
    };
    check();
  });
}

// 3. Launch Electron Process
function startElectron() {
  log.info('正在启动 Electron 桌面应用容器...');

  const electronBin = require('electron');
  const mainScript = path.join(__dirname, 'main.cjs');

  electronProcess = spawn(electronBin, [mainScript], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      ELECTRON_IS_DEV: '1',
      FORCE_COLOR: '1'
    }
  });

  electronProcess.on('error', (err) => {
    log.error(`Electron 启动异常: ${err.message}`);
  });

  electronProcess.on('exit', (code) => {
    if (!isShuttingDown && restartDebounceTimer === null) {
      log.info(`Electron 桌面应用已关闭 (退出码: ${code})`);
      cleanup();
    }
  });
}

// 4. Hot Restart Electron Main Process
function hotRestartElectron(filename) {
  if (isShuttingDown) return;

  if (restartDebounceTimer) {
    clearTimeout(restartDebounceTimer);
  }

  restartDebounceTimer = setTimeout(() => {
    restartDebounceTimer = null;
    log.hot(`检测到主进程代码变更 [${filename}]，正在执行热重启 (Hot Restart)...`);

    if (electronProcess) {
      killProcess(electronProcess);
      electronProcess = null;
    }

    startElectron();
    log.success('Electron 主进程热重启完成！\n');
  }, 250);
}

// 5. Watch electron/ directory for changes
function watchMainProcess() {
  const electronDir = path.join(__dirname);
  const ignoredFiles = new Set([
    'dev-runner.cjs',
    'user-config.json',
    'config.json',
    'icon.png',
    'tray-icon.png',
    'icon.ico'
  ]);

  try {
    fs.watch(electronDir, { recursive: false }, (eventType, filename) => {
      if (!filename) return;

      const baseName = path.basename(filename);
      if (ignoredFiles.has(baseName)) return;
      if (baseName.startsWith('.') || baseName.endsWith('.tmp') || baseName.endsWith('~')) return;

      const ext = path.extname(baseName).toLowerCase();
      if (['.cjs', '.js', '.json'].includes(ext)) {
        hotRestartElectron(baseName);
      }
    });

    log.success('主进程文件监听就绪: 修改 electron/*.cjs 将自动热重启应用');
    log.success('前端页面热加载就绪: 修改 src/**/*.{tsx,ts,css} 将自动热替换生效');
  } catch (err) {
    log.warn(`文件监听器初始化提示: ${err.message}`);
  }
}

// 6. Graceful cleanup on Ctrl+C or terminal close
function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  log.info('正在清理并退出开发环境...');

  if (electronProcess) {
    killProcess(electronProcess);
    electronProcess = null;
  }

  if (viteProcess) {
    killProcess(viteProcess);
    viteProcess = null;
  }

  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGHUP', cleanup);

// --- Bootstrap ---
async function run() {
  console.log('\n======================================================');
  console.log('  🐾 AI 桌面伴侣 - 双引擎热启动 & 热加载开发守护中心');
  console.log('  🔥 前端: Vite + React Fast Refresh (热重载无需刷新)');
  console.log('  ⚡ 主端: Electron Watcher (代码保存平滑热重启)');
  console.log('  🛠️ 快捷键: 获焦时按 F12 呼出控制台, F5 重新载入页面');
  console.log('======================================================\n');

  startVite();

  try {
    await waitForVite();
    log.success(`Vite 开发服务器已就绪: ${DEV_URL}`);
  } catch (err) {
    log.error(err.message);
  }

  startElectron();
  watchMainProcess();
}

run();
