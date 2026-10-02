import { PetAvatar } from '../types';

// Helper to generate clean standalone SVG data URIs
function svgToUri(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

// 1. Nova Neko (Cyber Anime Cat Companion)
const novaSvg = (emotion: string) => {
  let eyeLeft = `<ellipse cx="80" cy="100" rx="9" ry="14" fill="#38bdf8"/>
    <circle cx="82" cy="95" r="4" fill="#ffffff"/>
    <circle cx="78" cy="104" r="2" fill="#ffffff"/>`;
  let eyeRight = `<ellipse cx="120" cy="100" rx="9" ry="14" fill="#38bdf8"/>
    <circle cx="122" cy="95" r="4" fill="#ffffff"/>
    <circle cx="118" cy="104" r="2" fill="#ffffff"/>`;
  let mouth = `<path d="M 94 116 Q 100 120 106 116" stroke="#fb7185" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  let extras = '';
  let blush = `<ellipse cx="68" cy="112" rx="7" ry="4" fill="#fda4af" opacity="0.6"/>
               <ellipse cx="132" cy="112" rx="7" ry="4" fill="#fda4af" opacity="0.6"/>`;

  if (emotion === 'happy') {
    eyeLeft = `<path d="M 72 102 Q 80 90 88 102" stroke="#0284c7" stroke-width="4.5" stroke-linecap="round" fill="none"/>`;
    eyeRight = `<path d="M 112 102 Q 120 90 128 102" stroke="#0284c7" stroke-width="4.5" stroke-linecap="round" fill="none"/>`;
    mouth = `<path d="M 92 114 Q 100 126 108 114 Z" fill="#f43f5e" stroke="#e11d48" stroke-width="2"/>`;
    blush = `<ellipse cx="66" cy="110" rx="9" ry="5" fill="#f43f5e" opacity="0.75"/>
             <ellipse cx="134" cy="110" rx="9" ry="5" fill="#f43f5e" opacity="0.75"/>`;
    extras = `<g transform="translate(140, 60)"><path d="M0,5 L3,0 L6,5 L11,6 L7,10 L8,15 L4,12 L0,15 L1,10 L-3,6 Z" fill="#fbbf24"/></g>
              <g transform="translate(45, 65)"><path d="M0,4 L2,0 L4,4 L8,5 L5,8 L6,12 L3,9 L0,12 L1,8 L-2,5 Z" fill="#f472b6"/></g>`;
  } else if (emotion === 'thinking') {
    eyeLeft = `<ellipse cx="80" cy="94" rx="8" ry="12" fill="#38bdf8"/>
      <circle cx="80" cy="90" r="3.5" fill="#ffffff"/>`;
    eyeRight = `<ellipse cx="120" cy="94" rx="8" ry="12" fill="#38bdf8"/>
      <circle cx="120" cy="90" r="3.5" fill="#ffffff"/>`;
    mouth = `<ellipse cx="100" cy="118" rx="4" ry="4" fill="#fb7185"/>`;
    extras = `<text x="140" y="70" font-family="Outfit, sans-serif" font-weight="bold" font-size="28" fill="#38bdf8">?</text>
              <text x="156" y="52" font-family="Outfit, sans-serif" font-weight="bold" font-size="20" fill="#818cf8">?</text>`;
  } else if (emotion === 'surprised') {
    eyeLeft = `<circle cx="80" cy="100" r="13" fill="#38bdf8"/>
      <circle cx="80" cy="98" r="6" fill="#0f172a"/>
      <circle cx="83" cy="94" r="3" fill="#ffffff"/>`;
    eyeRight = `<circle cx="120" cy="100" r="13" fill="#38bdf8"/>
      <circle cx="120" cy="98" r="6" fill="#0f172a"/>
      <circle cx="123" cy="94" r="3" fill="#ffffff"/>`;
    mouth = `<ellipse cx="100" cy="120" rx="7" ry="10" fill="#f43f5e"/>`;
    extras = `<text x="145" y="65" font-family="Outfit, sans-serif" font-weight="900" font-size="32" fill="#f59e0b">!</text>`;
  } else if (emotion === 'sleeping') {
    eyeLeft = `<path d="M 72 102 Q 80 108 88 102" stroke="#64748b" stroke-width="4" stroke-linecap="round" fill="none"/>`;
    eyeRight = `<path d="M 112 102 Q 120 108 128 102" stroke="#64748b" stroke-width="4" stroke-linecap="round" fill="none"/>`;
    mouth = `<path d="M 96 118 Q 100 120 104 118" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;
    extras = `<text x="135" y="75" font-family="Outfit, sans-serif" font-weight="bold" font-size="22" fill="#818cf8">Z</text>
              <text x="150" y="55" font-family="Outfit, sans-serif" font-weight="bold" font-size="28" fill="#a855f7">z</text>
              <text x="168" y="38" font-family="Outfit, sans-serif" font-weight="bold" font-size="34" fill="#c084fc">z</text>`;
  } else if (emotion === 'celebrating') {
    eyeLeft = `<path d="M 72 102 Q 80 88 88 102" stroke="#0284c7" stroke-width="4.5" stroke-linecap="round" fill="none"/>`;
    eyeRight = `<path d="M 112 102 Q 120 88 128 102" stroke="#0284c7" stroke-width="4.5" stroke-linecap="round" fill="none"/>`;
    mouth = `<path d="M 90 114 Q 100 128 110 114 Z" fill="#f43f5e" stroke="#e11d48" stroke-width="2"/>`;
    extras = `<g transform="translate(130, 45)"><polygon points="10,0 12,8 20,10 12,12 10,20 8,12 0,10 8,8" fill="#facc15"/></g>
              <g transform="translate(50, 40)"><polygon points="10,0 12,8 20,10 12,12 10,20 8,12 0,10 8,8" fill="#38bdf8"/></g>
              <circle cx="40" cy="100" r="4" fill="#ec4899"/>
              <circle cx="160" cy="95" r="5" fill="#8b5cf6"/>`;
  }

  return svgToUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="100%" height="100%">
      <defs>
        <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f472b6" />
          <stop offset="60%" stop-color="#ec4899" />
          <stop offset="100%" stop-color="#be185d" />
        </linearGradient>
        <linearGradient id="earGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#0284c7" />
        </linearGradient>
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e1b4b" />
          <stop offset="100%" stop-color="#312e81" />
        </linearGradient>
        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Tail -->
      <path d="M 125 170 C 170 170, 185 130, 175 110 C 168 95, 155 105, 158 118 C 162 135, 145 155, 120 162" 
            stroke="url(#hairGrad)" stroke-width="12" stroke-linecap="round" fill="none" filter="url(#neonGlow)"/>

      <!-- Body / Outfit -->
      <path d="M 70 145 C 55 155, 55 195, 60 205 C 75 212, 125 212, 140 205 C 145 195, 145 155, 130 145 Z" fill="url(#bodyGrad)"/>
      <ellipse cx="100" cy="180" rx="22" ry="25" fill="#f8fafc"/>
      <path d="M 88 152 L 112 152 L 100 168 Z" fill="#06b6d4"/>
      <circle cx="100" cy="165" r="4" fill="#fbbf24"/>

      <!-- Cat Ears -->
      <polygon points="52,90 35,42 80,68" fill="url(#earGrad)"/>
      <polygon points="54,84 45,52 74,70" fill="#fbcfe8"/>
      <polygon points="148,90 165,42 120,68" fill="url(#earGrad)"/>
      <polygon points="146,84 155,52 126,70" fill="#fbcfe8"/>

      <!-- Cyber Headphone Band -->
      <path d="M 45 85 C 45 35, 155 35, 155 85" stroke="#0ea5e9" stroke-width="4" fill="none" opacity="0.8"/>
      <rect x="36" y="80" width="14" height="22" rx="6" fill="#0284c7" filter="url(#neonGlow)"/>
      <rect x="150" y="80" width="14" height="22" rx="6" fill="#0284c7" filter="url(#neonGlow)"/>

      <!-- Face Base -->
      <ellipse cx="100" cy="108" rx="46" ry="42" fill="#fff1f2"/>

      <!-- Anime Hair -->
      <path d="M 54 85 C 50 65, 75 52, 100 52 C 125 52, 150 65, 146 85 C 140 76, 125 72, 110 74 C 100 68, 85 70, 78 75 C 68 70, 58 76, 54 85 Z" fill="url(#hairGrad)"/>
      <!-- Side Bangs -->
      <path d="M 52 82 C 48 105, 52 125, 56 132 C 58 120, 58 100, 62 90 Z" fill="url(#hairGrad)"/>
      <path d="M 148 82 C 152 105, 148 125, 144 132 C 142 120, 142 100, 138 90 Z" fill="url(#hairGrad)"/>

      <!-- Blush -->
      ${blush}

      <!-- Eyes -->
      ${eyeLeft}
      ${eyeRight}

      <!-- Nose & Mouth -->
      <circle cx="100" cy="110" r="1.5" fill="#f43f5e"/>
      ${mouth}

      <!-- Cyber Mark / Whisker decals -->
      <line x1="50" y1="110" x2="62" y2="108" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
      <line x1="49" y1="115" x2="60" y2="116" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
      <line x1="150" y1="110" x2="138" y2="108" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
      <line x1="151" y1="115" x2="140" y2="116" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" opacity="0.7"/>

      <!-- Hands (Paws) -->
      <ellipse cx="78" cy="162" rx="9" ry="8" fill="#fff1f2" stroke="#e2e8f0" stroke-width="1.5"/>
      <ellipse cx="122" cy="162" rx="9" ry="8" fill="#fff1f2" stroke="#e2e8f0" stroke-width="1.5"/>

      <!-- Dynamic Expression Extras -->
      ${extras}
    </svg>
  `);
};

// 2. Yuki Kitsune (Mythical Anime Fox Spirit)
const kitsuneSvg = (emotion: string) => {
  let eyeLeft = `<ellipse cx="80" cy="102" rx="8" ry="13" fill="#ea580c"/>
    <circle cx="82" cy="98" r="4" fill="#ffffff"/>`;
  let eyeRight = `<ellipse cx="120" cy="102" rx="8" ry="13" fill="#ea580c"/>
    <circle cx="122" cy="98" r="4" fill="#ffffff"/>`;
  let mouth = `<path d="M 95 116 Q 100 120 105 116" stroke="#c2410c" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  let extras = '';

  if (emotion === 'happy' || emotion === 'celebrating') {
    eyeLeft = `<path d="M 72 102 Q 80 92 88 102" stroke="#c2410c" stroke-width="4.5" stroke-linecap="round" fill="none"/>`;
    eyeRight = `<path d="M 112 102 Q 120 92 128 102" stroke="#c2410c" stroke-width="4.5" stroke-linecap="round" fill="none"/>`;
    mouth = `<path d="M 93 114 Q 100 125 107 114 Z" fill="#ef4444"/>`;
  } else if (emotion === 'thinking') {
    mouth = `<ellipse cx="100" cy="118" rx="4" ry="4" fill="#ea580c"/>`;
    extras = `<text x="145" y="70" font-family="Outfit, sans-serif" font-weight="bold" font-size="28" fill="#f97316">?</text>`;
  } else if (emotion === 'sleeping') {
    eyeLeft = `<path d="M 72 104 Q 80 110 88 104" stroke="#9a3412" stroke-width="3.5" stroke-linecap="round" fill="none"/>`;
    eyeRight = `<path d="M 112 104 Q 120 110 128 104" stroke="#9a3412" stroke-width="3.5" stroke-linecap="round" fill="none"/>`;
    extras = `<text x="140" y="75" font-family="Outfit, sans-serif" font-weight="bold" font-size="24" fill="#f97316">zZ</text>`;
  }

  return svgToUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="100%" height="100%">
      <defs>
        <linearGradient id="foxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fb923c" />
          <stop offset="100%" stop-color="#ea580c" />
        </linearGradient>
        <linearGradient id="flameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#818cf8" />
        </linearGradient>
      </defs>

      <!-- Fluffy Big Fox Tail -->
      <path d="M 130 180 C 185 180, 200 120, 175 80 C 160 55, 140 70, 145 95 C 150 120, 145 160, 115 175 Z" fill="url(#foxGrad)"/>
      <path d="M 175 80 C 165 65, 150 68, 148 85 C 160 78, 168 85, 175 80 Z" fill="#ffffff"/>

      <!-- Body / Kimono -->
      <path d="M 68 140 C 50 160, 52 205, 62 210 C 80 215, 120 215, 138 210 C 148 205, 150 160, 132 140 Z" fill="#fef2f2"/>
      <!-- Red Kimono Collar -->
      <path d="M 78 140 L 100 170 L 122 140" stroke="#dc2626" stroke-width="7" fill="none" stroke-linecap="round"/>
      <circle cx="100" cy="172" r="5" fill="#eab308"/>

      <!-- Spirit Fox Ears -->
      <polygon points="50,92 28,30 84,65" fill="url(#foxGrad)"/>
      <polygon points="52,86 38,45 76,68" fill="#ffffff"/>
      <polygon points="150,92 172,30 116,65" fill="url(#foxGrad)"/>
      <polygon points="148,86 162,45 124,68" fill="#ffffff"/>

      <!-- Head Base -->
      <ellipse cx="100" cy="108" rx="46" ry="42" fill="#fffaf0"/>

      <!-- Kitsune Red Cheek Decals -->
      <path d="M 52 108 Q 62 105 58 114" stroke="#dc2626" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M 50 115 Q 60 112 56 121" stroke="#dc2626" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M 148 108 Q 138 105 142 114" stroke="#dc2626" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M 150 115 Q 140 112 144 121" stroke="#dc2626" stroke-width="2.5" fill="none" stroke-linecap="round"/>

      <!-- Forehead Kitsune Mark -->
      <path d="M 100 78 C 96 86, 94 92, 100 95 C 106 92, 104 86, 100 78 Z" fill="#dc2626"/>

      <!-- Eyes & Mouth -->
      ${eyeLeft}
      ${eyeRight}
      <ellipse cx="100" cy="112" rx="3" ry="2" fill="#9a3412"/>
      ${mouth}

      <!-- Spirit Flame Orb Floating -->
      <g transform="translate(30, 80)">
        <circle cx="12" cy="12" r="10" fill="url(#flameGrad)" opacity="0.85"/>
        <circle cx="12" cy="12" r="5" fill="#ffffff" opacity="0.9"/>
      </g>

      ${extras}
    </svg>
  `);
};

// 3. Bolt-01 (Pixar-style Robo Desktop Pal)
const boltSvg = (emotion: string) => {
  let screenFace = `<circle cx="85" cy="105" r="7" fill="#38bdf8"/>
    <circle cx="115" cy="105" r="7" fill="#38bdf8"/>
    <path d="M 93 118 Q 100 124 107 118" stroke="#38bdf8" stroke-width="3" fill="none" stroke-linecap="round"/>`;

  if (emotion === 'happy' || emotion === 'celebrating') {
    screenFace = `<path d="M 78 108 Q 85 96 92 108" stroke="#38bdf8" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <path d="M 108 108 Q 115 96 122 108" stroke="#38bdf8" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <path d="M 91 116 Q 100 126 109 116" stroke="#38bdf8" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  } else if (emotion === 'thinking') {
    screenFace = `<circle cx="85" cy="102" r="7" fill="#a855f7"/>
      <circle cx="115" cy="102" r="7" fill="#a855f7"/>
      <rect x="94" y="118" width="12" height="4" rx="2" fill="#a855f7"/>`;
  } else if (emotion === 'sleeping') {
    screenFace = `<line x1="78" y1="106" x2="92" y2="106" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
      <line x1="108" y1="106" x2="122" y2="106" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>`;
  } else if (emotion === 'surprised') {
    screenFace = `<circle cx="85" cy="104" r="10" stroke="#f59e0b" stroke-width="3" fill="none"/>
      <circle cx="115" cy="104" r="10" stroke="#f59e0b" stroke-width="3" fill="none"/>
      <ellipse cx="100" cy="120" rx="5" ry="7" fill="#f59e0b"/>`;
  }

  return svgToUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="100%" height="100%">
      <defs>
        <linearGradient id="bodyMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="50%" stop-color="#e2e8f0" />
          <stop offset="100%" stop-color="#cbd5e1" />
        </linearGradient>
        <linearGradient id="thrusterGlow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#0284c7" />
        </linearGradient>
      </defs>

      <!-- Antenna -->
      <line x1="100" y1="58" x2="100" y2="38" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
      <circle cx="100" cy="34" r="7" fill="#ec4899"/>
      <circle cx="100" cy="34" r="3" fill="#ffffff"/>

      <!-- Floating Thruster Glow -->
      <ellipse cx="100" cy="200" rx="20" ry="8" fill="url(#thrusterGlow)" opacity="0.6"/>
      <ellipse cx="100" cy="204" rx="12" ry="5" fill="#ffffff" opacity="0.8"/>

      <!-- Robot Body -->
      <ellipse cx="100" cy="170" rx="35" ry="25" fill="url(#bodyMetallic)" stroke="#94a3b8" stroke-width="2"/>
      <circle cx="100" cy="168" r="8" fill="#38bdf8" opacity="0.8"/>

      <!-- Robot Arms -->
      <ellipse cx="60" cy="168" rx="8" ry="12" fill="url(#bodyMetallic)" stroke="#94a3b8" stroke-width="2"/>
      <ellipse cx="140" cy="168" rx="8" ry="12" fill="url(#bodyMetallic)" stroke="#94a3b8" stroke-width="2"/>

      <!-- Robot Head Dome -->
      <rect x="55" y="60" width="90" height="85" rx="30" fill="url(#bodyMetallic)" stroke="#94a3b8" stroke-width="2.5"/>

      <!-- Face Visor Display Screen -->
      <rect x="66" y="78" width="68" height="52" rx="16" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>

      <!-- Expressive Face Components -->
      ${screenFace}
    </svg>
  `);
};

// 4. Bomi Capy (Zen Capybara Companion)
const capySvg = (emotion: string) => {
  let eyeLeft = `<ellipse cx="82" cy="108" rx="5" ry="3" fill="#3f2e21"/>`;
  let eyeRight = `<ellipse cx="118" cy="108" rx="5" ry="3" fill="#3f2e21"/>`;
  let extras = '';

  if (emotion === 'happy' || emotion === 'celebrating') {
    eyeLeft = `<path d="M 77 108 Q 82 103 87 108" stroke="#3f2e21" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    eyeRight = `<path d="M 113 108 Q 118 103 123 108" stroke="#3f2e21" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  } else if (emotion === 'sleeping') {
    extras = `<text x="145" y="80" font-family="Outfit, sans-serif" font-weight="bold" font-size="22" fill="#84cc16">zZ</text>`;
  }

  return svgToUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="100%" height="100%">
      <defs>
        <linearGradient id="capyFur" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#b45309" />
          <stop offset="100%" stop-color="#92400e" />
        </linearGradient>
      </defs>

      <!-- Body -->
      <path d="M 60 135 C 45 155, 45 195, 55 205 C 70 215, 130 215, 145 205 C 155 195, 155 155, 140 135 Z" fill="url(#capyFur)"/>

      <!-- Capy Ears -->
      <ellipse cx="60" cy="80" rx="8" ry="6" fill="#78350f"/>
      <ellipse cx="140" cy="80" rx="8" ry="6" fill="#78350f"/>

      <!-- Head -->
      <rect x="62" y="75" width="76" height="85" rx="28" fill="#d97706"/>

      <!-- Snout / Nose -->
      <rect x="74" y="115" width="52" height="42" rx="16" fill="#b45309"/>
      <ellipse cx="90" cy="128" rx="4" ry="5" fill="#451a03"/>
      <ellipse cx="110" cy="128" rx="4" ry="5" fill="#451a03"/>
      <path d="M 100 132 L 100 144" stroke="#451a03" stroke-width="2.5"/>

      <!-- Eyes -->
      ${eyeLeft}
      ${eyeRight}

      <!-- Mandarin Orange on Head (Yuzu) -->
      <circle cx="100" cy="65" r="14" fill="#f97316"/>
      <path d="M 100 51 C 104 46, 112 48, 110 53 Z" fill="#65a30d"/>

      ${extras}
    </svg>
  `);
};

export const DEFAULT_PETS: PetAvatar[] = [
  {
    id: 'nova_neko',
    name: '星喵 Nova',
    style: 'anime',
    description: '二次元赛博机能猫娘，充满元气与科技感，对各种Agent指令反应敏捷！',
    sprites: {
      idle: novaSvg('idle'),
      happy: novaSvg('happy'),
      thinking: novaSvg('thinking'),
      surprised: novaSvg('surprised'),
      sleeping: novaSvg('sleeping'),
      celebrating: novaSvg('celebrating'),
      alert: novaSvg('surprised')
    },
    scale: 1
  },
  {
    id: 'yuki_kitsune',
    name: '白狐 Yuki',
    style: 'ghibli',
    description: '和风灵狐守护仙童，身伴幽蓝灵火，拥有洞察代码与文本的治愈灵性。',
    sprites: {
      idle: kitsuneSvg('idle'),
      happy: kitsuneSvg('happy'),
      thinking: kitsuneSvg('thinking'),
      surprised: kitsuneSvg('happy'),
      sleeping: kitsuneSvg('sleeping'),
      celebrating: kitsuneSvg('celebrating')
    },
    scale: 1
  },
  {
    id: 'bolt_01',
    name: '波波 Bolt',
    style: 'cartoon',
    description: '皮克斯3D流线型智能浮游机器人，面部屏幕可实时显示Agent思考与执行状态。',
    sprites: {
      idle: boltSvg('idle'),
      happy: boltSvg('happy'),
      thinking: boltSvg('thinking'),
      surprised: boltSvg('surprised'),
      sleeping: boltSvg('sleeping'),
      celebrating: boltSvg('happy')
    },
    scale: 0.95
  },
  {
    id: 'bomi_capy',
    name: '波米 Capy',
    style: 'chibi',
    description: '头顶橘子的万物皆可佛系水豚，抗压能力MAX，专治各类Coding焦虑。',
    sprites: {
      idle: capySvg('idle'),
      happy: capySvg('happy'),
      thinking: capySvg('thinking'),
      sleeping: capySvg('sleeping'),
      celebrating: capySvg('happy')
    },
    scale: 0.95
  }
];
