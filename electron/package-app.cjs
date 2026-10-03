const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function buildAndPackage() {
  console.log('=== [0/4] 彻底清理旧版本构建产物与发布包 (Deep Clean) ===');
  const releaseDir = path.join(__dirname, '../release');
  if (fs.existsSync(releaseDir)) {
    try {
      fs.rmSync(releaseDir, { recursive: true, force: true });
      console.log('[Clean] 已彻底删除旧版本 release 目录及所有旧构建安装文件');
    } catch (e) {
      console.warn('[Clean] 删除旧 release 目录出现提示:', e.message);
    }
  }

  const distDir = path.join(__dirname, '../dist');
  if (fs.existsSync(distDir)) {
    try {
      fs.rmSync(distDir, { recursive: true, force: true });
      console.log('[Clean] 已清理前端旧 dist 构建产物与缓存');
    } catch (e) {
      console.warn('[Clean] 删除旧 dist 目录出现提示:', e.message);
    }
  }

  console.log('\n=== [1/4] 生成并验证应用与托盘图标 (ICO & PNG) ===');
  require('./generate-icons.cjs');
  const icoPath = path.join(__dirname, 'icon.ico');
  console.log(`[Icon] Windows 专属多尺寸图标生成就绪: ${icoPath}`);

  console.log('\n=== [2/4] 构建前端生产包 (Vite Production Build) ===');
  execSync('npm run build:vite', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('\n=== [3/4] 打包 Windows 独立应用 (Electron Packager) ===');
  const { packager } = require('@electron/packager');

  const appPaths = await packager({
    dir: path.join(__dirname, '..'),
    name: 'AI-Desktop-Pet',
    executableName: 'AI-Desktop-Pet',
    platform: 'win32',
    arch: 'x64',
    out: path.join(__dirname, '../release'),
    icon: icoPath,
    overwrite: true,
    prune: true,
    appCopyright: 'Copyright © 2026 AI Desktop Pet Team',
    win32metadata: {
      CompanyName: 'AI Desktop Pet Team',
      FileDescription: 'AI 桌面元气伴侣 (AI Desktop Companion Pet)',
      OriginalFilename: 'AI-Desktop-Pet.exe',
      ProductName: 'AI 桌面元气伴侣',
      InternalName: 'AI-Desktop-Pet'
    },
    ignore: [
      /^\/src($|\/)/,
      /^\/\.git($|\/)/,
      /^\/release($|\/)/,
      /^\/\.agents($|\/)/,
      /^\/\.vscode($|\/)/,
      /\.md$/i
    ]
  });

  const outputDir = appPaths[0];
  const exePath = path.join(outputDir, 'AI-Desktop-Pet.exe');
  console.log(`\n[Package] 应用打包完成！可执行文件路径:\n  -> ${exePath}`);

  console.log('\n=== [4/4] 创建 Windows 桌面快捷方式 (Desktop Shortcut) ===');
  createDesktopShortcut(exePath, icoPath);
}

function createDesktopShortcut(exePath, icoPath) {
  // Find desktop directories (standard + OneDrive desktop)
  const candidateDirs = [];
  try {
    const userProfile = process.env.USERPROFILE || 'C:\\Users\\' + (process.env.USERNAME || 'User');
    const oneDriveDesktop = path.join(userProfile, 'OneDrive', 'Desktop');
    const localDesktop = path.join(userProfile, 'Desktop');

    if (fs.existsSync(oneDriveDesktop)) candidateDirs.push(oneDriveDesktop);
    if (fs.existsSync(localDesktop) && !candidateDirs.includes(localDesktop)) candidateDirs.push(localDesktop);
  } catch (err) {
    console.warn('Could not detect user profile desktop:', err);
  }

  // Also query PowerShell Environment.GetFolderPath
  try {
    const psDesktop = execSync('powershell -NoProfile -Command "[Environment]::GetFolderPath(\'Desktop\')"', { encoding: 'utf8' }).trim();
    if (psDesktop && !candidateDirs.includes(psDesktop)) {
      candidateDirs.unshift(psDesktop);
    }
  } catch {}

  const shortcutName = 'AI 桌面元气伴侣.lnk';
  const workDir = path.dirname(exePath);

  // Clean up any previously created AI shortcuts on desktop
  for (const desktopDir of candidateDirs) {
    try {
      const files = fs.readdirSync(desktopDir);
      for (const f of files) {
        if ((f.includes('AI') || f.includes('桌面伴侣') || f.includes('元气伴侣')) && f.endsWith('.lnk')) {
          try {
            fs.unlinkSync(path.join(desktopDir, f));
            console.log(`[Shortcut] 清理旧桌面快捷方式: ${f}`);
          } catch {}
        }
      }
    } catch {}
  }

  const targetShortcuts = candidateDirs.map(d => path.join(d, shortcutName));
  const releaseShortcut = path.join(path.dirname(workDir), shortcutName);
  if (!targetShortcuts.includes(releaseShortcut)) {
    targetShortcuts.push(releaseShortcut);
  }

  const psScript = `
$source = @"
using System;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;

[ComImport]
[Guid("00021401-0000-0000-C000-000000000046")]
public class ShellLink {}

[ComImport]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
[Guid("000214F9-0000-0000-C000-000000000046")]
public interface IShellLinkW {
    void GetPath([Out, MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pszFile, int cchMaxPath, out IntPtr pfd, uint fFlags);
    void GetIDList(out IntPtr ppidl);
    void SetIDList(IntPtr pidl);
    void GetDescription([Out, MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pszName, int cchMaxName);
    void SetDescription([MarshalAs(UnmanagedType.LPWStr)] string pszName);
    void GetWorkingDirectory([Out, MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pszDir, int cchMaxPath);
    void SetWorkingDirectory([MarshalAs(UnmanagedType.LPWStr)] string pszDir);
    void GetArguments([Out, MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pszArgs, int cchMaxPath);
    void SetArguments([MarshalAs(UnmanagedType.LPWStr)] string pszArgs);
    void GetHotkey(out short pwHotkey);
    void SetHotkey(short wHotkey);
    void GetShowCmd(out int piShowCmd);
    void SetShowCmd(int iShowCmd);
    void GetIconLocation([Out, MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pszIconPath, int cchIconPath, out int piIcon);
    void SetIconLocation([MarshalAs(UnmanagedType.LPWStr)] string pszIconPath, int iIcon);
    void SetRelativePath([MarshalAs(UnmanagedType.LPWStr)] string pszPathRel, uint dwReserved);
    void Resolve(IntPtr hwnd, uint fFlags);
    void SetPath([MarshalAs(UnmanagedType.LPWStr)] string pszFile);
}

public class ShortcutCreator {
    public static void Create(string shortcutPath, string targetPath, string workingDir, string iconPath, string description) {
        IShellLinkW link = (IShellLinkW)new ShellLink();
        link.SetPath(targetPath);
        link.SetWorkingDirectory(workingDir);
        link.SetDescription(description);
        if (!string.IsNullOrEmpty(iconPath)) {
            link.SetIconLocation(iconPath, 0);
        }
        IPersistFile file = (IPersistFile)link;
        file.Save(shortcutPath, false);
    }
}
"@
Add-Type -TypeDefinition $source

$targetPath = "${exePath.replace(/\\/g, '\\\\')}"
$workingDir = "${workDir.replace(/\\/g, '\\\\')}"
$iconPath = "${icoPath.replace(/\\/g, '\\\\')}"
$description = "AI 桌面元气伴侣 & Agent 协作中心"

${targetShortcuts.map(sc => `
[ShortcutCreator]::Create("${sc.replace(/\\/g, '\\\\')}", $targetPath, $workingDir, $iconPath, $description)
Write-Host "[Shortcut] 快捷方式已成功创建: ${sc.replace(/\\/g, '/')}"
`).join('\n')}
`;

  const tempPs1 = path.join(__dirname, 'temp_create_shortcut.ps1');
  const bom = Buffer.from([0xFF, 0xFE]); // UTF-16LE BOM
  fs.writeFileSync(tempPs1, Buffer.concat([bom, Buffer.from(psScript, 'utf16le')]));
  try {
    const output = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tempPs1}"`, { encoding: 'utf8' });
    console.log(output.trim());
  } catch (err) {
    console.warn('[Shortcut] 创建快捷方式警告:', err.message);
  } finally {
    if (fs.existsSync(tempPs1)) fs.unlinkSync(tempPs1);
  }
}

buildAndPackage().catch((err) => {
  console.error('[Error] 打包失败:', err);
  process.exit(1);
});
