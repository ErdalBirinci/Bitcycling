/* ============================================================
   Bitcycling — pixel promo film (canvas, no external assets)
   ------------------------------------------------------------
   A silent, video-like animated explainer rendered on a low
   resolution canvas (384x216) and scaled up with
   image-rendering:pixelated for an authentic pixel look.

   - 5x7 bitmap font (uppercase) drawn pixel by pixel
   - deterministic scenes: no Math.random in the draw loop
   - dither (bayer 4x4) scene transitions
   - play / pause / replay, chapter jumping, progress bar
   - autoplays when scrolled into view, pauses when off screen
   - prefers-reduced-motion: static first frame, manual play

   Scenes: intro -> city -> GPS -> earning -> fair play ->
           market -> social -> CTA   (~41 s)
   ============================================================ */
(function () {
  'use strict';

  const cv = document.getElementById('pixelFilm');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = 384, H = 216;
  cv.width = W; cv.height = H;
  ctx.imageSmoothingEnabled = false;

  /* ---------- palette ---------- */
  const C = {
    ink: '#06110d', deep: '#0b1f19', panel: '#0e2b22',
    emerald: '#10b981', emDark: '#047857', emSoft: '#a7f3d0',
    gold: '#f59e0b', goldDeep: '#b45309', goldLite: '#fde68a',
    red: '#ef4444', white: '#f8fafc', gray: '#94a3b8',
    skin: '#f5c87a', denim: '#1e3a5f', road: '#111c18'
  };

  /* ---------- 5x7 bitmap font ---------- */
  const F = {
    'A': '.###./#...#/#...#/#####/#...#/#...#/#...#',
    'B': '####./#...#/#...#/####./#...#/#...#/####.',
    'C': '.###./#...#/#..../#..../#..../#...#/.###.',
    'D': '####./#...#/#...#/#...#/#...#/#...#/####.',
    'E': '#####/#..../#..../####./#..../#..../#####',
    'F': '#####/#..../#..../####./#..../#..../#....',
    'G': '.###./#...#/#..../#.###/#...#/#...#/.###.',
    'H': '#...#/#...#/#...#/#####/#...#/#...#/#...#',
    'I': '#####/..#../..#../..#../..#../..#../#####',
    'J': '..###/....#/....#/....#/....#/#...#/.###.',
    'K': '#...#/#..#./#.#../##.../#.#../#..#./#...#',
    'L': '#..../#..../#..../#..../#..../#..../#####',
    'M': '#...#/##.##/#.#.#/#...#/#...#/#...#/#...#',
    'N': '#...#/##..#/#.#.#/#..##/#...#/#...#/#...#',
    'O': '.###./#...#/#...#/#...#/#...#/#...#/.###.',
    'P': '####./#...#/#...#/####./#..../#..../#....',
    'Q': '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#',
    'R': '####./#...#/#...#/####./#.#../#..#./#...#',
    'S': '.####/#..../#..../.###./....#/....#/####.',
    'T': '#####/..#../..#../..#../..#../..#../..#..',
    'U': '#...#/#...#/#...#/#...#/#...#/#...#/.###.',
    'V': '#...#/#...#/#...#/#...#/#...#/.#.#./..#..',
    'W': '#...#/#...#/#...#/#...#/#.#.#/##.##/#...#',
    'X': '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
    'Y': '#...#/#...#/.#.#./..#../..#../..#../..#..',
    'Z': '#####/....#/...#./..#../.#.../#..../#####',
    '0': '.###./#...#/#..##/#.#.#/##..#/#...#/.###.',
    '1': '..#../.##../..#../..#../..#../..#../#####',
    '2': '.###./#...#/....#/...#./..#../.#.../#####',
    '3': '.###./#...#/....#/..##./....#/#...#/.###.',
    '4': '...#./..##./.#.#./#..#./#####/...#./...#.',
    '5': '#####/#..../####./....#/....#/#...#/.###.',
    '6': '..##./.#.../#..../####./#...#/#...#/.###.',
    '7': '#####/....#/...#./..#../.#.../.#.../.#...',
    '8': '.###./#...#/#...#/.###./#...#/#...#/.###.',
    '9': '.###./#...#/#...#/.####/....#/...#./.##..',
    ' ': '...../...../...../...../...../...../.....',
    '.': '...../...../...../...../...../.##../.##..',
    ',': '...../...../...../...../.##../.#.../#....',
    ':': '...../.##../.##../...../.##../.##../.....',
    '!': '..#../..#../..#../..#../..#../...../..#..',
    '?': '.###./#...#/....#/...#./..#../...../..#..',
    '-': '...../...../...../#####/...../...../.....',
    '/': '....#/....#/...#./..#../.#.../#..../#....',
    '+': '...../..#../..#../#####/..#../..#../.....',
    '=': '...../...../#####/...../#####/...../.....',
    '(': '...#./..#../.#.../.#.../.#.../..#../...#.',
    ')': '.#.../..#../...#./...#./...#./..#../.#...',
    "'": '..#../..#../...../...../...../...../.....',
    '€': '..###/.#..#/#..../#.##./#..../.#..#/.###.',
    '#': '.#.#./#####/.#.#./.#.#./#####/.#.#./.....'
  };
  const CW = 6; // glyph pitch (5 px + 1 px gap)

  function textW(s, sc) { return s.length * CW * sc - sc; }
  function drawText(s, x, y, color, sc, align) {
    sc = sc || 1;
    s = String(s).toUpperCase();
    let sx = x;
    if (align === 'c') sx = Math.round(x - textW(s, sc) / 2);
    else if (align === 'r') sx = Math.round(x - textW(s, sc));
    ctx.fillStyle = color;
    for (let i = 0; i < s.length; i++) {
      const g = F[s[i]] || F['?'];
      const rows = g.split('/');
      const gx = sx + i * CW * sc;
      for (let r = 0; r < 7; r++)
        for (let c = 0; c < 5; c++)
          if (rows[r][c] === '#') ctx.fillRect(gx + c * sc, y + r * sc, sc, sc);
    }
    return sx + textW(s, sc);
  }
  function typeText(s, p, x, y, color, sc, align) {
    const n = Math.max(0, Math.min(s.length, Math.floor(s.length * Math.min(1, p * 1.6))));
    if (n > 0) drawText(s.slice(0, n), x, y, color, sc, align);
  }

  /* ---------- pixel primitives ---------- */
  function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); }
  function pcircle(cx, cy, r, c, ring) {
    ctx.fillStyle = c;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = x * x + y * y;
      if (ring ? (d <= r * r && d > (r - 1) * (r - 1)) : d <= r * r) ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
  function pline(x0, y0, x1, y1, c) {
    ctx.fillStyle = c;
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    for (;;) {
      ctx.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }
  /* deterministic pseudo-random (never Math.random inside draw) */
  const rnd = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const ease = t => t * t * (3 - 2 * t);

  /* ---------- sprites ---------- */
  function drawBike(x, y, phase, col) {
    col = col || {};
    const frame = col.frame || C.emerald, wheel = col.wheel || '#0f172a';
    const shirt = col.shirt || C.emDark, pant = col.pant || C.denim,
      skin = col.skin || C.skin, helm = col.helm || C.gold;
    // wheels + spinning spokes
    for (const wx of [x, x + 14]) {
      pcircle(wx, y, 4, wheel, true);
      for (let s = 0; s < 3; s++) {
        const a = phase + s * Math.PI / 3;
        pline(wx, y, wx + Math.round(Math.cos(a) * 3), y + Math.round(Math.sin(a) * 3), col.spoke || '#334155');
      }
      pcircle(wx, y, 1, col.spoke || '#334155');
    }
    // frame
    pline(x, y, x + 6, y - 1, frame);          // chainstay
    pline(x, y, x + 5, y - 6, frame);          // seatstay
    pline(x + 6, y - 1, x + 5, y - 6, frame);  // seat tube
    pline(x + 5, y - 6, x + 11, y - 6, frame); // top tube
    pline(x + 6, y - 1, x + 11, y - 6, frame); // down tube
    pline(x + 11, y - 6, x + 14, y, frame);    // fork
    pline(x + 11, y - 6, x + 12, y - 8, frame);// handlebar
    pline(x + 11, y - 8, x + 13, y - 8, frame);
    // crank + pumping legs
    const cx0 = x + 6, cy0 = y - 1;
    for (const off of [0, Math.PI]) {
      const a = phase + off;
      const px0 = cx0 + Math.round(Math.cos(a) * 2), py0 = cy0 + Math.round(Math.sin(a) * 2);
      const kx = cx0 - 1, ky = cy0 - 4;
      pline(cx0, cy0, kx, ky, pant);
      pline(kx, ky, px0, py0, pant);
      rect(px0 - 1, py0, 3, 1, '#0f172a');
    }
    // torso, arm, head, helmet
    const hipX = x + 5, hipY = y - 6;
    const shX = x + 4, shY = y - 11;
    pline(hipX, hipY, shX, shY, shirt);
    pline(shX, shY, x + 12, y - 8, shirt);
    pcircle(x + 4, y - 12, 2, skin);
    pcircle(x + 4, y - 13, 2, helm);
    rect(x + 6, y - 13, 2, 1, helm);
  }

  function drawCoin(x, y, spin) {
    const w = Math.max(2, Math.round(2 + 6 * Math.abs(Math.cos(spin))));
    rect(x - (w >> 1) - 1, y - 4, w + 2, 8, C.goldDeep);
    rect(x - (w >> 1), y - 3, w, 6, C.gold);
    if (w > 4) rect(x - (w >> 1) + 1, y - 2, w - 2, 2, C.goldLite);
  }

  function drawPhone(x, y, routeP, kmTxt) {
    rect(x, y, 16, 28, '#0f172a');
    rect(x + 1, y + 1, 14, 24, '#1e293b');
    rect(x + 2, y + 3, 12, 20, '#ecfdf5');
    // streets
    rect(x + 2, y + 10, 12, 1, '#a7f3d0');
    rect(x + 2, y + 17, 12, 1, '#a7f3d0');
    rect(x + 6, y + 3, 1, 20, '#a7f3d0');
    rect(x + 11, y + 3, 1, 20, '#a7f3d0');
    // route drawn progressively
    const pts = [[4, 21], [6, 21], [6, 17], [11, 17], [11, 10], [8, 10], [8, 5], [13, 5]];
    const total = pts.length - 1;
    const reach = routeP * total;
    let prev = pts[0];
    for (let i = 1; i <= total; i++) {
      if (reach < i - 1) break;
      const a = prev, b = pts[i];
      const seg = Math.min(1, reach - (i - 1));
      pline(x + a[0], y + a[1], x + Math.round(a[0] + (b[0] - a[0]) * seg), y + Math.round(a[1] + (b[1] - a[1]) * seg), C.emerald);
      prev = b;
    }
    const head = pts[Math.min(total, Math.floor(reach))];
    pcircle(x + head[0], y + head[1], 2, C.gold);
    pcircle(x + head[0], y + head[1], 1, C.white);
    // notch + home indicator
    rect(x + 6, y + 1, 4, 1, '#0f172a');
    rect(x + 6, y + 26, 4, 1, '#334155');
    if (kmTxt) { rect(x - 1, y - 9, 18, 8, C.panel); drawText(kmTxt, x + 8, y - 8, C.emSoft, 1, 'c'); }
  }

  function drawTrophy(x, y) {
    rect(x + 3, y, 6, 2, C.gold);
    rect(x + 2, y + 2, 8, 4, C.gold);
    rect(x + 3, y + 6, 6, 2, C.goldDeep);
    rect(x + 1, y + 2, 1, 3, C.goldDeep); rect(x + 10, y + 2, 1, 3, C.goldDeep);
    rect(x + 5, y + 8, 2, 2, C.goldDeep);
    rect(x + 3, y + 10, 6, 2, C.goldDeep);
    rect(x + 4, y + 3, 2, 2, C.goldLite);
  }

  function drawGift(x, y) {
    rect(x, y + 3, 14, 9, C.emerald);
    rect(x, y + 3, 14, 2, C.emSoft);
    rect(x + 6, y + 3, 2, 9, C.gold);
    rect(x + 5, y, 4, 3, C.gold);
    rect(x + 4, y, 2, 2, C.goldDeep); rect(x + 8, y, 2, 2, C.goldDeep);
  }

  const QR_BITS = [
    '111010111', '100010001', '101110101', '000111000', '110101110',
    '011010011', '101011101', '100100010', '111011101'
  ];
  function drawQR(x, y, cell) {
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++)
      if (QR_BITS[r][c] === '1') rect(x + c * cell, y + r * cell, cell, cell, C.ink);
    rect(x, y, cell * 3, cell * 3, C.ink); rect(x + cell, y + cell, cell, cell, C.white);
    rect(x + cell * 6, y, cell * 3, cell * 3, C.ink); rect(x + cell * 7, y + cell, cell, cell, C.white);
    rect(x, y + cell * 6, cell * 3, cell * 3, C.ink); rect(x + cell, y + cell * 7, cell, cell, C.white);
  }

  function drawCity(baseY, seed, bodyC, winC) {
    let x = -6;
    for (let i = 0; i < 14 && x < W + 10; i++) {
      const w = 14 + Math.floor(rnd(seed + i) * 22);
      const h = 16 + Math.floor(rnd(seed + i + 50) * 44);
      rect(x, baseY - h, w, h, bodyC);
      for (let wy = baseY - h + 4; wy < baseY - 4; wy += 6)
        for (let wx = x + 3; wx < x + w - 3; wx += 6)
          if (rnd(wx * 7 + wy) > 0.42) rect(wx, wy, 2, 3, winC);
      x += w + 3 + Math.floor(rnd(seed + i + 90) * 6);
    }
  }

  function drawCar(x, y, bodyC) {
    rect(x, y, 18, 5, bodyC);
    rect(x + 4, y - 3, 9, 3, bodyC);
    rect(x + 5, y - 2, 3, 2, '#bae6fd'); rect(x + 9, y - 2, 3, 2, '#bae6fd');
    pcircle(x + 4, y + 5, 2, '#0f172a'); pcircle(x + 14, y + 5, 2, '#0f172a');
    rect(x + 17, y + 1, 2, 2, C.goldLite);
  }

  function drawSpeedo(cx, cy, v, maxV) {
    const N = 15, a0 = Math.PI * 0.85, a1 = Math.PI * 2.15;
    for (let i = 0; i <= N; i++) {
      const a = a0 + (a1 - a0) * (i / N);
      const lit = i / N <= v / maxV;
      const col = i / N > 0.86 ? C.red : i / N > 0.7 ? C.gold : C.emerald;
      const r0 = 14, r1 = lit ? 20 : 18;
      pline(cx + Math.round(Math.cos(a) * r0), cy + Math.round(Math.sin(a) * r0),
        cx + Math.round(Math.cos(a) * r1), cy + Math.round(Math.sin(a) * r1),
        lit ? col : '#1f4a3d');
    }
    const na = a0 + (a1 - a0) * Math.min(1, v / maxV);
    pline(cx, cy, cx + Math.round(Math.cos(na) * 13), cy + Math.round(Math.sin(na) * 13), C.white);
    pcircle(cx, cy, 2, C.white);
  }

  function drawHelmet(x, y) {
    pcircle(x + 7, y + 5, 7, C.gold);
    rect(x, y + 5, 15, 3, C.gold);
    rect(x, y + 8, 15, 1, C.goldDeep);
    rect(x + 2, y + 2, 2, 2, C.goldDeep); rect(x + 6, y + 1, 2, 2, C.goldDeep);
    rect(x + 10, y + 2, 2, 2, C.goldDeep);
    rect(x + 12, y + 5, 3, 2, C.ink);
  }

  function drawJersey(x, y) {
    rect(x + 3, y, 8, 2, C.emerald);
    rect(x + 1, y + 2, 12, 9, C.emerald);
    rect(x + 4, y + 3, 6, 2, C.emSoft);
    rect(x + 5, y + 6, 4, 4, C.white);
    rect(x + 4, y + 11, 6, 1, C.emDark);
  }

  /* ---------- scene chrome ---------- */
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function dither(cov) {
    if (cov <= 0) return;
    ctx.fillStyle = C.ink;
    const S = 4;
    for (let y = 0; y < H; y += S) for (let x = 0; x < W; x += S)
      if (BAYER[((x / S) & 3) + ((y / S) & 3) * 4] / 16 < cov) ctx.fillRect(x, y, S, S);
  }
  function scanlines() {
    ctx.fillStyle = 'rgba(0,0,0,.10)';
    for (let y = 1; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  }
  function caption(s) {
    rect(0, H - 15, W, 15, 'rgba(4,17,13,.92)');
    drawText(s, W / 2, H - 12, C.emSoft, 1, 'c');
  }
  function hudTag(s, x, y) {
    const w = textW(s, 1) + 8;
    rect(x, y, w, 11, C.panel);
    drawText(s, x + 4, y + 2, C.gold, 1);
  }
  function stars(seed) {
    for (let i = 0; i < 26; i++) {
      const x = Math.floor(rnd(seed + i) * W), y = Math.floor(rnd(seed + i + 7) * (H - 60));
      rect(x, y, 1, 1, rnd(seed + i + 13) > 0.7 ? C.goldLite : '#64748b');
    }
  }

  /* ============================================================
     SCENES  (p = 0..1 progress inside the scene)
     ============================================================ */
  const SCENES = [
    /* 0 — INTRO */
    {
      key: 'Intro', dur: 4300,
      draw(p) {
        rect(0, 0, W, H, C.deep);
        stars(11);
        drawCity(H - 34, 5, '#0a2620', '#123f34');
        rect(0, H - 34, W, 34, C.road);
        rect(0, H - 34, W, 1, '#1f4a3d');
        // moon
        pcircle(W - 52, 34, 12, '#e2e8f0'); pcircle(W - 57, 31, 9, C.deep);
        // rider crosses
        const bx = -30 + p * (W + 60);
        drawBike(bx, H - 26, p * 26, { frame: '#34d399', shirt: '#065f46', wheel: '#022c22', spoke: '#1f4a3d' });
        // title
        const sc = p < 0.25 ? 3 : 4;
        drawText('BITCYCLING', W / 2, 58, C.emerald, sc, 'c');
        if (p > 0.3) drawText('PEDAL TO EARN', W / 2, 104, C.gold, 2, 'c');
        if (p > 0.5) {
          const w = Math.round(ease(Math.min(1, (p - 0.5) * 3)) * 160);
          rect(W / 2 - w / 2, 122, w, 2, C.gold);
        }
        if (p > 0.6) drawText('A 40 SECOND STORY', W / 2, 134, C.emSoft, 1, 'c');
        caption('SCENE 1 OF 8 - THE PIXEL STORY');
      }
    },
    /* 1 — THE CITY */
    {
      key: 'The city', dur: 5000,
      draw(p) {
        rect(0, 0, W, H, '#0e2b22');
        rect(0, 120, W, H - 120, C.road);
        drawCity(120, 21, '#134e4a', '#1d6b5f');
        // cars rolling both ways
        const t = p * 5;
        drawCar(((t * 26) % (W + 40)) - 20, 132, '#3b82f6');
        drawCar(((t * 18) % (W + 40)) - 20, 150, '#f43f5e');
        drawCar(W - ((t * 30) % (W + 40)), 168, '#f59e0b');
        // smog puffs
        for (let i = 0; i < 5; i++) {
          const sx = 30 + i * 70, sy = 108 - Math.round(Math.sin(t * 2 + i) * 3) - (t * 8 + i * 9) % 26;
          rect(sx, sy, 5, 3, 'rgba(148,163,184,.35)');
        }
        if (p < 0.52) {
          typeText('EVERY DAY', W / 2, 24, C.white, 2, 'c');
          typeText('YOU FIGHT TRAFFIC', W / 2, 46, C.white, 2, 'c');
        } else {
          drawText('WHAT IF EACH', W / 2, 24, C.white, 2, 'c');
          drawText('PEDAL EARNED?', W / 2, 46, C.gold, 2, 'c');
          if (p > 0.72) drawText('BITCYCLING SAYS YES', W / 2, 74, C.emerald, 1, 'c');
        }
        caption('THE CITY IS YOUR GYM - AND YOUR WALLET');
      }
    },
    /* 2 — GPS */
    {
      key: 'GPS', dur: 5200,
      draw(p) {
        rect(0, 0, W, H, C.deep);
        rect(0, 0, W, 14, C.panel);
        drawText('BITCYCLING', 6, 4, C.emerald, 1);
        hudTag('GPS ON', W - 66, 4);
        // phone centre with drawing route
        drawPhone(96, 34, Math.min(1, p * 1.35), 'KM ' + Math.round(Math.min(100, p * 140)));
        // satellite signal arcs
        if (p > 0.15) {
          const blink = Math.sin(p * 40) > -0.2;
          if (blink) { rect(124, 30, 3, 3, C.emerald); rect(130, 26, 3, 3, C.emerald); rect(136, 22, 3, 3, C.emerald); }
        }
        // side copy
        drawText('GPS TRACKED', 176, 46, C.white, 2);
        drawText('RIDES', 176, 66, C.white, 2);
        typeText('NO BUTTONS TO', 176, 96, C.emSoft, 1, Math.max(0, p * 2 - 0.5));
        typeText('PRESS. NO CHEATING.', 176, 108, C.emSoft, 1, Math.max(0, p * 2 - 0.7));
        if (p > 0.55) {
          drawText('EVERY KM IS', 176, 128, C.gold, 1);
          drawText('MEASURED FAIRLY', 176, 140, C.gold, 1);
        }
        // signal bars
        for (let i = 0; i < 4; i++) {
          const on = p * 5 > i;
          rect(176 + i * 7, 158 - i * 4, 5, 4 + i * 4, on ? C.emerald : '#1f4a3d');
        }
        caption('THE APP MEASURES EVERY KILOMETRE AUTOMATICALLY');
      }
    },
    /* 3 — EARNING */
    {
      key: 'Earning', dur: 5600,
      draw(p) {
        rect(0, 0, W, H, '#0e2b22');
        rect(0, 150, W, H - 150, C.road);
        rect(0, 150, W, 1, '#1f4a3d');
        // rider keeps riding, km counter climbs
        const km = Math.min(20, p * 26);
        drawBike(40 + Math.sin(p * 9) * 6, 142, p * 40);
        hudTag('KM ' + km.toFixed(1), 16, 16);
        // big equation
        drawText('20 KM = 1 BTCYC', W / 2, 40, C.white, 3, 'c');
        if (p > 0.42) {
          // coin pops and lands in wallet counter
          const cp = Math.min(1, (p - 0.42) / 0.3);
          const cx = W / 2 + 60 - cp * 130, cy = 74 + Math.sin(cp * Math.PI) * -26 + cp * 26;
          drawCoin(cx, cy, p * 30);
          rect(24, 96, 92, 18, C.panel);
          drawText('WALLET', 30, 99, C.emSoft, 1);
          drawText('+' + (cp >= 1 ? '1 BTCYC' : ''), 70, 99, C.gold, 1);
        }
        if (p > 0.62) drawText('EARN UP TO 100 KM EVERY DAY', W / 2, 118, C.emerald, 1, 'c');
        if (p > 0.78) drawText('1 BTCYC = 0.80 EUR OF REAL VALUE', W / 2, 134, C.goldLite, 1, 'c');
        caption('DISTANCE BECOMES BALANCE - AUTOMATICALLY');
      }
    },
    /* 4 — FAIR PLAY */
    {
      key: 'Fair play', dur: 4800,
      draw(p) {
        rect(0, 0, W, H, C.deep);
        // speed climbs, overshoots, gets capped
        let v = 26;
        if (p < 0.55) v = 26 + ease(p / 0.55) * 20;      // up to 46
        else if (p < 0.75) v = 46 - ease((p - 0.55) / 0.2) * 8; // settle
        else v = 38;
        const over = v > 40;
        drawSpeedo(W / 2, 96, v, 50);
        drawText(Math.round(v) + ' KM/H', W / 2, 100, over ? C.red : C.emerald, 3, 'c');
        drawText('40 KM/H SAFE LIMIT', W / 2, 132, C.gold, 1, 'c');
        if (p > 0.42 && over) {
          const blink = Math.sin(p * 60) > -0.3;
          if (blink) { rect(96, 26, 192, 16, C.red); drawText('OVER LIMIT - ZONE NOT COUNTED', W / 2, 30, C.white, 1, 'c'); }
        } else if (p > 0.78) {
          drawText('FAIR PLAY IS AUTOMATIC', W / 2, 30, C.emerald, 2, 'c');
        }
        caption('HONEST RIDES ONLY - PROTECTED BY 2FA');
      }
    },
    /* 5 — MARKET */
    {
      key: 'Market', dur: 5500,
      draw(p) {
        rect(0, 0, W, H, '#0e2b22');
        // shop front
        rect(24, 26, 336, 12, C.emDark);
        for (let i = 0; i < 12; i++) rect(24 + i * 28, 26, 14, 12, i % 2 ? C.emerald : C.white);
        rect(30, 38, 324, 84, C.panel);
        drawText('BTCYC MARKET', W / 2, 42, C.gold, 2, 'c');
        // products with price tags
        const items = [
          { x: 54, price: '14', d: drawHelmet },
          { x: 134, price: '9', d: drawJersey },
          { x: 214, price: '38', d: (x, y) => { drawPhone(x + 4, y, 0.4, ''); } },
          { x: 300, price: '480', d: (x, y) => drawBike(x + 6, y + 12, 0.5) }
        ];
        items.forEach((it, i) => {
          rect(it.x - 8, 60, 62, 54, '#0b1f16');
          it.d(it.x, 66);
          rect(it.x - 6, 100, 58, 11, C.goldDeep);
          drawText(it.price + ' BTCYC', it.x + 23, 102, C.goldLite, 1, 'c');
          if (p > 0.6 && i === 0) { // helmet gets bought
            rect(it.x - 8, 60, 62, 54, 'rgba(16,185,129,.25)');
            drawText('SOLD!', it.x + 23, 74, C.emerald, 2, 'c');
          }
        });
        // cursor picks the helmet
        if (p > 0.35 && p < 0.75) {
          const cx = Math.round(150 - ease(Math.min(1, (p - 0.35) / 0.25)) * 96);
          const cy = 74;
          rect(cx, cy, 2, 10, C.white); rect(cx + 2, cy + 8, 2, 2, C.white);
          rect(cx + 4, cy + 6, 2, 6, C.white); rect(cx + 6, cy + 4, 2, 6, C.white);
          rect(cx + 8, cy + 2, 2, 6, C.white); rect(cx + 2, cy + 10, 8, 2, C.white);
        }
        if (p > 0.78) drawText('TRADE BTCYC FOR REAL GEAR', W / 2, 128, C.white, 2, 'c');
        caption('HELMETS. JERSEYS. GPS COMPUTERS. E-BIKES.');
      }
    },
    /* 6 — TOGETHER */
    {
      key: 'Together', dur: 5600,
      draw(p) {
        rect(0, 0, W, H, C.deep);
        rect(0, 148, W, H - 148, C.road);
        rect(0, 148, W, 1, '#1f4a3d');
        // two riders side by side
        drawBike(64, 140, p * 30, { shirt: '#065f46' });
        drawBike(150, 140, p * 30 + 2, { frame: '#f59e0b', shirt: '#7c2d12', helm: '#f8fafc' });
        // coin arcs from rider A to rider B
        if (p < 0.45) {
          const cp = ease(p / 0.45);
          drawCoin(96 + cp * 74, 118 - Math.sin(cp * Math.PI) * 30, p * 40);
          if (cp < 0.1) drawText('SEND', 96, 96, C.emSoft, 1, 'c');
        }
        if (p >= 0.45 && p < 0.6) drawText('TRANSFERED!', 134, 92, C.emerald, 2, 'c');
        // QR bonus + tournament boards on the right
        if (p > 0.5) {
          rect(252, 24, 60, 60, C.white);
          drawQR(258, 30, 6);
          drawText('QR BONUS', 282, 90, C.gold, 1, 'c');
          drawText('+1 TO +5', 282, 101, C.emSoft, 1, 'c');
        }
        if (p > 0.68) {
          rect(318, 24, 58, 74, C.panel);
          drawTrophy(334, 30);
          drawText('WEEKLY', 346, 46, C.gold, 1, 'c');
          drawText('CLUB', 346, 57, C.white, 1, 'c');
          drawText('TOURNAMENT', 346, 68, C.emerald, 1, 'c');
        }
        caption('RIDE TOGETHER. EARN TOGETHER.');
      }
    },
    /* 7 — CTA */
    {
      key: 'Join', dur: 5000,
      draw(p) {
        rect(0, 0, W, H, C.deep);
        stars(41);
        drawCity(H - 30, 77, '#0a2620', '#123f34');
        rect(0, H - 30, W, 30, C.road);
        // logo bike parks centre
        drawBike(W / 2 - 40, H - 22, Math.PI / 2, { frame: C.emerald, shirt: C.emDark });
        drawText('BITCYCLING', W / 2, 30, C.emerald, 4, 'c');
        if (p > 0.25) drawText('RIDE. EARN. REPEAT.', W / 2, 74, C.gold, 2, 'c');
        if (p > 0.45) {
          // pixel button with pulsing border
          const bw = 200, bx = W / 2 - bw / 2, by = 96;
          const glow = Math.sin(p * 12) > 0;
          rect(bx, by, bw, 24, glow ? C.emerald : C.emDark);
          rect(bx + 2, by + 2, bw - 4, 20, C.deep);
          drawText('SIGN UP FREE', W / 2, by + 8, C.white, 2, 'c');
        }
        if (p > 0.68) drawText('PEDAL - EARN BTCYC - REAL PRODUCTS', W / 2, 132, C.emSoft, 1, 'c');
        if (p > 0.82) drawText('JOIN THOUSANDS OF RIDERS TODAY', W / 2, 146, C.goldLite, 1, 'c');
        caption('END OF FILM - START YOUR FIRST RIDE');
      }
    }
  ];

  /* ============================================================
     PLAYER
     ============================================================ */
  const TRANS = 360;
  let idx = 0, t = 0, playing = false, raf = 0, lastTs = 0;
  let userPaused = false, visible = false;

  const fill = document.getElementById('filmFill');
  const toggleBtn = document.getElementById('filmToggle');
  const replayBtn = document.getElementById('filmReplay');
  const chaptersEl = document.getElementById('filmChapters');

  const ICON_PLAY = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';

  /* chapters UI */
  const chapterEls = SCENES.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'film-chip';
    b.textContent = (i + 1) + '. ' + s.key;
    b.setAttribute('aria-label', 'Jump to scene ' + (i + 1) + ': ' + s.key);
    b.addEventListener('click', () => { idx = i; t = 0; userPaused = false; play(); });
    chaptersEl.appendChild(b);
    return b;
  });

  function totalDur() { return SCENES.reduce((a, s) => a + s.dur, 0); }
  function elapsed() { let e = 0; for (let i = 0; i < idx; i++) e += SCENES[i].dur; return e + t; }

  /* only touch the DOM when the value actually changed - updateUI() runs
     on every frame, so innerHTML/class writes must be guarded */
  let lastFill = null, lastChip = -1, lastPlaying = null;
  function updateUI() {
    if (fill) {
      const pct = (elapsed() / totalDur() * 100).toFixed(2) + '%';
      if (pct !== lastFill) { fill.style.width = pct; lastFill = pct; }
    }
    if (idx !== lastChip) {
      chapterEls.forEach((b, i) => b.classList.toggle('on', i === idx));
      lastChip = idx;
    }
    if (playing !== lastPlaying) {
      lastPlaying = playing;
      if (toggleBtn) {
        toggleBtn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
        toggleBtn.setAttribute('aria-label', playing ? 'Pause the film' : 'Play the film');
      }
      cv.classList.toggle('is-playing', playing);
    }
  }

  function render() {
    const sc = SCENES[idx];
    const p = Math.min(1, t / sc.dur);
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 0, W, H);
    sc.draw(p);
    scanlines();
    // dither transitions between scenes
    if (idx > 0 && t < TRANS) dither(1 - t / TRANS);
    if (idx < SCENES.length - 1 && t > sc.dur - TRANS) dither((t - (sc.dur - TRANS)) / TRANS);
    updateUI();
  }

  /* The loop only reschedules itself while there is something to animate,
     so pausing (or reaching the end) genuinely stops the rAF churn. */
  function tick(ts) {
    raf = 0;
    if (!lastTs) lastTs = ts;
    let dt = ts - lastTs;
    lastTs = ts;
    if (dt > 90) dt = 90;                 // tab-switch clamp
    if (playing) {
      t += dt;
      const sc = SCENES[idx];
      if (t >= sc.dur) {
        t -= sc.dur;
        idx++;
        if (idx >= SCENES.length) {
          idx = SCENES.length - 1;
          t = SCENES[idx].dur;
          playing = false;                // end of film: stop advancing
        }
      }
    }
    render();
    if (playing) raf = requestAnimationFrame(tick);
  }

  function play() {
    if (idx === SCENES.length - 1 && t >= SCENES[idx].dur) { idx = 0; t = 0; } // replay after end
    playing = true;
    if (!raf) { lastTs = 0; raf = requestAnimationFrame(tick); }
    updateUI();
  }
  function pause() { playing = false; userPaused = true; stopLoop(); updateUI(); }
  function toggle() { playing ? pause() : (userPaused = false, play()); }
  function stopLoop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  if (toggleBtn) toggleBtn.addEventListener('click', toggle);
  if (replayBtn) replayBtn.addEventListener('click', () => { idx = 0; t = 0; userPaused = false; play(); });
  cv.addEventListener('click', toggle);
  document.addEventListener('keydown', e => {
    if (!visible || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key !== ' ' && e.key !== 'k' && e.key !== 'K') return;
    // don't steal the key from a focused control (chips, buttons, links, fields)
    const t = e.target;
    if (t && t.closest && t.closest('button, a, input, textarea, select, [contenteditable="true"]')) return;
    e.preventDefault();
    toggle();
  });

  /* autoplay when in view, freeze when out of view; scroll back in and it
     resumes - unless the viewer pressed pause themselves */
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      entries.forEach(en => {
        visible = en.isIntersecting;
        if (en.isIntersecting) {
          if (reduce) render();          // static frame; play is a manual choice
          else if (!userPaused) play();  // first view, or resume after scrolling back
        } else {
          stopLoop();                    // keep position, stop burning frames
        }
      });
    }, { threshold: 0.45 }).observe(cv);
  } else {
    visible = true;
    if (!reduce) play();
  }

  /* static first frame for reduced-motion users (they press play) */
  render();
  updateUI();
})();
