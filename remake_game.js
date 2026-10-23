/**
 * Prism Cross: Gem Burst 게임 엔진 (Ultimate Edition)
 * - 캔디크러시 스타일의 다채로운 10종 기하학 보석 실루엣 (원, 하트, 별, 다이아몬드, 꽃 등)
 * - 유리/크리스탈이 산산조각 박살나 쏟아지는 리얼 파편 물리 엔진 (Shatter Physics)
 * - 특수 기믹 보석 (3x3 폭탄 젬, 체인 라이트닝, 타임 젬)
 * - 슈팅 게임처럼 쾌감 넘치는 피버 모드 & 콤보 시스템
 */

class PrismCrossEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // 2배 대형 타일 및 모바일/태블릿 적응형 캔버스 기본 해상도 (1260 x 880)
    this.width = 1260;
    this.height = 880;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // 모드 설정 ('arcade', 'special', 'zen', 'classic', 'mini')
    this.mode = 'special'; // 기본값을 화려한 특수 젬 모드로!

    // 2배 확대된 타일 규격 (기존 cellSpacing 26 -> 50으로 2배 확대, mini는 36 -> 68, mega는 300타일 28x18 대형 맵)
    this.modesConfig = {
      special: { cols: 23, rows: 15, numGems: 10, gemsPerType: 20, timeLimit: 120, cellSpacing: 50, hasSpecialGems: true },
      mega: { cols: 28, rows: 18, numGems: 10, gemsPerType: 30, timeLimit: 180, cellSpacing: 42, hasSpecialGems: true }, // 1.5배 타일 대형 맵 (300타일!)
      arcade: { cols: 23, rows: 15, numGems: 10, gemsPerType: 20, timeLimit: 120, cellSpacing: 50, hasSpecialGems: false },
      classic: { cols: 23, rows: 15, numGems: 10, gemsPerType: 20, timeLimit: 120, cellSpacing: 50, hasSpecialGems: false },
      zen: { cols: 23, rows: 15, numGems: 10, gemsPerType: 20, timeLimit: 0, cellSpacing: 50, hasSpecialGems: true },
      mini: { cols: 15, rows: 10, numGems: 6, gemsPerType: 15, timeLimit: 60, cellSpacing: 68, hasSpecialGems: true }
    };

    // 10종 프리즘 큐브 타일 컬러 스펙 (상단/좌측 하이라이트 + 중심 메인 + 우하단 쉐이딩)
    this.gemSpecs = [
      { name: "사파이어 블루", color: "#2563EB", dark: "#1D4ED8", light: "#60A5FA", shape: "square" }, // 0: 로열 블루
      { name: "토파즈 오렌지", color: "#F97316", dark: "#D94610", light: "#FBA170", shape: "square" }, // 1: 감귤 주황 (샘플 1:1 일치)
      { name: "루비 레드", color: "#DC2626", dark: "#B91C1C", light: "#F87171", shape: "square" },     // 2: 강렬한 비비드 리얼 레드
      { name: "시트린 옐로우", color: "#FACC15", dark: "#CA8A04", light: "#FDE047", shape: "square" }, // 3: 밝은 레몬 노랑
      { name: "에메랄드 그린", color: "#047857", dark: "#065F46", light: "#10B981", shape: "square" }, // 4: 짙고 묵직한 딥 에메랄드 초록
      { name: "다이아 화이트", color: "#E2E8F0", dark: "#CBD5E1", light: "#FFFFFF", shape: "square" }, // 5: 은백색 다이아몬드
      { name: "아쿠아 시안", color: "#06B6D4", dark: "#0891B2", light: "#38BDF8", shape: "square" },   // 6: 청량한 민트 시안
      { name: "아메지스트 퍼플", color: "#7C3AED", dark: "#6D28D9", light: "#A78BFA", shape: "square" }, // 7: 쿨톤 로열 바이올렛 보라
      { name: "페리도트 라임", color: "#8EE000", dark: "#65A30D", light: "#B4F82A", shape: "square" }, // 8: 눈부시게 밝은 형광 네온 라임 연두
      { name: "로즈 핑크", color: "#F68ABF", dark: "#DB2777", light: "#FBCFE8", shape: "square" }     // 9: 부드럽고 화사한 로즈 핑크
    ];

    // 게임 상태
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.comboMaxDuration = 3.5;

    this.feverGauge = 0;
    this.isFever = false;
    this.feverDuration = 0;
    this.feverBannerTimer = 0;

    this.timeLimit = 120;
    this.timeRemain = 120;
    this.timeStart = null;
    this.isPlaying = false;
    this.isGameOver = false;

    // 편의 기능 토글
    this.smartGuide = true;
    this.hoverPreview = true;
    this.colorBlindMode = false;
    this.screenShakeEnabled = true;

    // 통계 기록
    this.stats = {
      clicks: 0,
      matches: 0,
      misses: 0,
      gemsCleared: 0,
      totalGems: 0,
      startTime: 0,
      endTime: 0
    };

    this.history = [];

    // 파티클 풀: 박살난 파편(shards), 레이저 빔, 플로팅 텍스트
    this.shards = []; // 박살나서 튀어 떨어지는 파편들
    this.particles = [];
    this.beams = [];
    this.floatingTexts = [];
    this.screenShake = 0;
    this.hoverCell = null;

    // 🌌 테트리스 이펙트 & 우주 행성 비주얼 시스템 (Cosmic Environment)
    this.stars = [];
    this.nebulae = [];
    this.shootingStars = [];
    this.shootingStarTimer = 3.0;
    this.initStarfield();
    this.initNebulae();

    // 💎 [초고속 60fps 최적화] 10종 프리즘 보석 오프스크린 캔버스 캐시
    this.gemCache = [];
    this.initGemCache();

    // 🎆 불꽃놀이 & 초신성 폭발 엔진 (Firework & Supernova Engine)
    this.fireworks = []; // 불꽃놀이 스파크 & 빛 꼬리(Trail)
    this.shockwaves = []; // 팽창하는 무지개/네온 충격파 링
    this.supernovaFlashes = []; // 중심부 고휘도 초신성 코어 플래시 & 렌즈 플레어
    this.cosmicGlitters = []; // 폭발 후 나풀거리며 낙하하는 은하 글리터 가루
    this.cameraZoom = 1.0; // 타격감 극대화 카메라 줌 펄스
    this.microTwinkles = []; // 보석 표면에서 반짝이는 별빛 스파클
    this.lightningBolts = []; // ⚡ 전기 젬 체인 라이트닝 볼트

    // 성능 최적화: 파티클 최대 상한선(Cap)
    this.maxFireworks = 80;
    this.maxGlitters = 40;
    this.maxShockwaves = 10;

    this.bindEvents();

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);

    this.startNewGame(this.mode);
  }

  setMode(mode) {
    if (this.modesConfig[mode]) {
      this.mode = mode;
      this.startNewGame(mode);
    }
  }

  startNewGame(mode = this.mode) {
    this.mode = mode;
    const cfg = this.modesConfig[mode];

    this.cols = cfg.cols;
    this.rows = cfg.rows;
    this.cellSpacing = cfg.cellSpacing;
    this.gemSize = this.cellSpacing - 4; // 2배 커진 타일 크기 (cellSpacing 50 기준 46px)
    this.timeLimit = cfg.timeLimit;
    this.timeRemain = cfg.timeLimit;

    const boardW = this.cols * this.cellSpacing;
    const boardH = this.rows * this.cellSpacing;
    this.offsetX = Math.floor((this.width - boardW) / 2);
    this.offsetY = Math.floor((this.height - boardH) / 2) + 24;

    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.feverGauge = 0;
    this.isFever = false;
    this.feverDuration = 0;
    this.feverBannerTimer = 0;
    this.timeStart = null;
    this.isPlaying = true;
    this.isGameOver = false;

    this.shards = [];
    this.particles = [];
    this.beams = [];
    this.lightningBolts = [];
    this.floatingTexts = [];
    this.history = [];

    this.stats = {
      clicks: 0,
      matches: 0,
      misses: 0,
      gemsCleared: 0,
      totalGems: cfg.numGems * cfg.gemsPerType,
      startTime: 0,
      endTime: 0
    };

    // 보석 생성
    // 특수 보석 타입: 'bomb'(3x3 폭탄), 'lightning'(체인 번개), 'time'(+5초)
    const pool = [];
    for (let c = 0; c < cfg.numGems; c++) {
      for (let i = 0; i < cfg.gemsPerType; i++) {
        let special = null;
        if (cfg.hasSpecialGems) {
          const rand = Math.random();
          if (rand < 0.04) special = 'bomb';         // 4% 3x3 범위 폭발 폭탄
          else if (rand < 0.08) special = 'lightning'; // 4% 체인 라이트닝
          else if (rand < 0.11) special = 'time';      // 3% 타임 보너스 (+5s)
        }
        pool.push({ type: c, special: special });
      }
    }

    const totalCells = this.cols * this.rows;
    const empties = totalCells - pool.length;
    for (let i = 0; i < empties; i++) {
      pool.push(null);
    }

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    this.grid = [];
    let pIdx = 0;
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(pool[pIdx++]);
      }
      this.grid.push(row);
    }
  }

  /**
   * 💎 [초고속 60fps 최적화] 10종 프리즘 보석 오프스크린 캔버스 캐시
   * - 게임 시작 시 고해상도 64x64 캔버스에 각면 컷, 그라데이션, 베벨, 하이라이트를 1회 사전 렌더링
   * - 렌더 루프에서는 drawImage 텍스처 복사로 대체하여 CPU 부하를 98% 제거!
   */
  /**
   * 🔲 미니멀 3D 엠보스 타일 렌더러 (상단/좌측 하이라이트 + 중심 메인 + 우측/하단 쉐이딩)
   * - 상단 & 좌측: 부드러운 톤온톤 밝은 하이라이트 (spec.light)
   * - 중심부 본체: 순수 단색 메인 컬러 (spec.color)
   * - 우측 & 하단: 묵직한 입체 쉐이딩 (spec.dark)
   */
  drawShadedTile(ctx, cx, cy, size, spec) {
    const half = size / 2;
    const x = cx - half;
    const y = cy - half;
    const r = Math.max(2, Math.round(size * 0.08));     // 둥근 모서리 반경
    const hl = Math.max(1.5, Math.round(size * 0.11)); // 상단/좌측 하이라이트 두께 (~11%)
    const sh = Math.max(2, Math.round(size * 0.17));   // 우측/하단 쉐이딩 두께 (~17%)

    ctx.save();

    // 1. 타일 전체 둥근 사각형 클리핑 영역 설정 (모서리 넘침 방지)
    this.drawRoundedRectPath(ctx, x, y, size, size, r);
    ctx.clip();

    // 2. 중심 메인 컬러 채우기 (spec.color)
    ctx.fillStyle = spec.color;
    ctx.fillRect(x, y, size, size);

    // 3. 우측 및 하단 어두운 쉐이딩 (spec.dark)
    ctx.fillStyle = spec.dark;
    ctx.fillRect(x + size - sh, y + hl, sh, size - hl); // 우측 쉐이딩 바
    ctx.fillRect(x + hl, y + size - sh, size - hl, sh); // 하단 쉐이딩 바

    // 4. 상단 및 좌측 밝은 하이라이트 (spec.light)
    ctx.fillStyle = spec.light;
    ctx.fillRect(x, y, size, hl); // 상단 하이라이트 바
    ctx.fillRect(x, y, hl, size); // 좌측 하이라이트 바

    ctx.restore();

    // 5. 미세하고 부드러운 타일 경계선
    ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
    ctx.lineWidth = 1;
    this.drawRoundedRectPath(ctx, x, y, size, size, r);
    ctx.stroke();
  }

  /**
   * 💎 [초고속 60fps] 10종 쉐이딩 타일 고해상도 오프스크린 캔버스 캐시 (128x128 Retina)
   */
  initGemCache() {
    this.gemCache = [];
    const cacheSize = 128; // 고밀도 모바일 디스플레이 및 2배 대형 타일을 위한 128px 고화질 베이크
    const cx = cacheSize / 2;
    const cy = cacheSize / 2;
    const drawSize = 118;

    this.gemSpecs.forEach((spec) => {
      const oc = document.createElement('canvas');
      oc.width = cacheSize;
      oc.height = cacheSize;
      const octx = oc.getContext('2d');

      this.drawShadedTile(octx, cx, cy, drawSize, spec);

      this.gemCache.push(oc);
    });
  }

  /**
   * 🌌 3단 깊이감(Depth)과 반짝임을 가진 90개 우주 별무리 초기화
   */
  initStarfield() {
    this.stars = [];
    const starColors = ["#FFFFFF", "#BAE6FD", "#FDE68A", "#FBCFE8"];
    for (let i = 0; i < 90; i++) {
      const depth = 1 + Math.random() * 2.2;
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        depth: depth,
        size: (0.7 + Math.random() * 1.2) * (depth / 2),
        color: starColors[i % starColors.length],
        baseAlpha: 0.25 + Math.random() * 0.65,
        twinkleSpeed: 1.5 + Math.random() * 3.0,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  /**
   * 🌌 신비로운 유기적 우주 오로라 성운(Nebulae) 초기화
   */
  initNebulae() {
    this.nebulae = [
      { x: 180, y: 160, radius: 260, color1: "rgba(30, 58, 138, 0.32)", color2: "rgba(147, 51, 234, 0.0)", speed: 0.0004, phase: 0 },
      { x: 620, y: 440, radius: 280, color1: "rgba(131, 24, 67, 0.26)", color2: "rgba(219, 39, 119, 0.0)", speed: -0.0003, phase: 1.5 },
      { x: 400, y: 300, radius: 320, color1: "rgba(14, 116, 144, 0.22)", color2: "rgba(56, 189, 248, 0.0)", speed: 0.0002, phase: 3.0 },
      { x: 680, y: 120, radius: 220, color1: "rgba(91, 33, 182, 0.28)", color2: "rgba(192, 132, 252, 0.0)", speed: -0.0005, phase: 4.5 }
    ];
  }

  /**
   * 🌌 우주 배경 업데이트 (성운 표동, 별 반짝임, 유성우)
   */
  updateCosmicBackground(dt) {
    const time = performance.now();

    // 성운 표동
    this.nebulae.forEach(n => {
      n.phase += n.speed;
      n.curX = n.x + Math.sin(time * 0.0003 + n.phase) * 35;
      n.curY = n.y + Math.cos(time * 0.00025 + n.phase) * 25;
    });

    // 별 반짝임 & 이동
    this.stars.forEach(s => {
      s.twinklePhase += s.twinkleSpeed * dt;
      if (this.isFever) {
        // 피버 워프: 중심에서 바깥으로 초고속 이동
        const cx = this.width / 2;
        const cy = this.height / 2;
        const dx = s.x - cx;
        const dy = s.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = (240 * s.depth + dist * 2.0) * dt;
        s.x += (dx / dist) * speed;
        s.y += (dy / dist) * speed;

        if (s.x < -20 || s.x > this.width + 20 || s.y < -20 || s.y > this.height + 20) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * 40 + 10;
          s.x = cx + Math.cos(a) * r;
          s.y = cy + Math.sin(a) * r;
        }
      } else {
        s.x += Math.sin(s.twinklePhase * 0.3) * 0.15 * dt * 60;
        s.y += Math.cos(s.twinklePhase * 0.2) * 0.1 * dt * 60;
      }
    });

    // 유성우(Shooting Stars)
    this.shootingStarTimer -= dt;
    if (this.shootingStarTimer <= 0) {
      this.shootingStarTimer = 3.0 + Math.random() * 4.0;
      const startX = Math.random() * (this.width + 200) - 100;
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
      const speed = 750 + Math.random() * 400;
      this.shootingStars.push({
        x: startX,
        y: -30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: 80 + Math.random() * 70,
        life: 0.9,
        maxLife: 0.9,
        color: Math.random() > 0.4 ? "#E0F2FE" : "#FDE68A"
      });
    }

    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const ss = this.shootingStars[i];
      ss.life -= dt;
      ss.x += ss.vx * dt;
      ss.y += ss.vy * dt;
      if (ss.life <= 0) {
        this.shootingStars.splice(i, 1);
      }
    }
  }

  /**
   * 🎆 테트리스 이펙트 & 행성 폭발 불꽃놀이 파티클 엔진
   * - 가산 혼합(Additive Blending) 기반
   * - 각 파티클이 이전 4~6개의 위치를 기록해 눈부신 모션 꼬리(Trail)를 남김
   * - 팽창 충격파 링 + 초신성 코어 플래시 + 은하 글리터 가루 낙하
   */
  triggerFireworkBurst(cx, cy, gemType, isFever = false, isBomb = false, combo = 1) {
    const spec = this.gemSpecs[gemType] || this.gemSpecs[0];

    // 1. 카메라 줌 펄스 (타격감)
    this.cameraZoom = isBomb ? 1.035 : (isFever ? 1.025 : (combo > 2 ? 1.018 : 1.012));

    // 2. 초신성 코어 플래시 (Supernova Flash)
    const flashRadius = isBomb ? 48 : (isFever ? 38 : 26);
    this.supernovaFlashes.push({
      x: cx,
      y: cy,
      radius: flashRadius * 0.4,
      targetRadius: flashRadius,
      color: "#FFFFFF",
      glowColor: spec.light || "#FFFFFF",
      rays: isBomb ? 8 : (isFever ? 6 : 4),
      life: 0.14,
      maxLife: 0.14
    });

    // 3. 팽창 에너지 충격파 링 (Shockwave Ring)
    const shockMaxRadius = isBomb ? 90 : (isFever ? 70 : (combo > 1 ? 50 : 38));
    this.shockwaves.push({
      x: cx,
      y: cy,
      radius: 4,
      maxRadius: shockMaxRadius,
      speed: 280,
      color: spec.light || "#38BDF8",
      lineWidth: isBomb ? 3.5 : (isFever ? 2.5 : 2),
      alpha: 1.0
    });

    if (this.shockwaves.length > this.maxShockwaves) {
      this.shockwaves.splice(0, this.shockwaves.length - this.maxShockwaves);
    }

    // 4. 불꽃놀이 스파크 파티클 (Firework Sparks with Motion Trails) - [최적화 수량]
    const sparkCount = isBomb ? 26 : (isFever ? 20 : (10 + Math.min(6, combo)));
    const vibrantColors = [
      spec.light,
      spec.color,
      "#FFFFFF",
      "#FDE047"
    ];

    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = (isBomb ? 160 : (isFever ? 130 : 100)) + Math.random() * (isBomb ? 200 : (isFever ? 150 : 110));
      const chosenColor = vibrantColors[i % vibrantColors.length];

      this.fireworks.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (30 + Math.random() * 50),
        drag: 0.95,
        gravity: 180 + Math.random() * 100,
        history: [{ x: cx, y: cy }],
        maxHistory: 4, // 4프레임의 최적화된 꼬리
        color: chosenColor,
        size: 2.2 + Math.random() * 1.6,
        life: 0.65 + Math.random() * 0.45,
        maxLife: 1.1,
        shimmerSpeed: 18 + Math.random() * 12,
        shimmerPhase: Math.random() * Math.PI * 2,
        hasSubBurst: Math.random() < 0.15
      });
    }

    // 파티클 상한선(Cap) 초과분 제거
    if (this.fireworks.length > this.maxFireworks) {
      this.fireworks.splice(0, this.fireworks.length - this.maxFireworks);
    }

    // 5. 나풀나풀 떨어지는 은하 글리터 가루 (Falling Cosmic Glitter) - [최적화 수량]
    const glitterCount = isBomb ? 8 : (isFever ? 6 : 3);
    for (let i = 0; i < glitterCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spread = 15 + Math.random() * 40;
      this.cosmicGlitters.push({
        x: cx + Math.cos(angle) * spread * 0.3,
        y: cy + Math.sin(angle) * spread * 0.3,
        vx: (Math.random() - 0.5) * 25,
        vy: 15 + Math.random() * 25,
        size: 1.5 + Math.random() * 1.5,
        color: i % 2 === 0 ? spec.light : "#FFFFFF",
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 3,
        alpha: 1.0,
        life: 1.0 + Math.random() * 0.6,
        maxLife: 1.6,
        twinkleRate: 10 + Math.random() * 10
      });
    }

    if (this.cosmicGlitters.length > this.maxGlitters) {
      this.cosmicGlitters.splice(0, this.cosmicGlitters.length - this.maxGlitters);
    }
  }

  bindEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    // 모바일 웹 오디오 최초 터치 제스처 언락 (iOS Safari / Android Chrome)
    const unlockAudio = () => {
      if (window.soundEngine) {
        window.soundEngine.ensureContext();
      }
    };
    window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
    window.addEventListener('click', unlockAudio, { passive: true, once: true });

    this.canvas.addEventListener('mousemove', (e) => {
      const p = getPos(e);
      this.handleMouseMove(p.x, p.y);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverCell = null;
    });

    this.canvas.addEventListener('click', (e) => {
      const p = getPos(e);
      this.handleClick(p.x, p.y);
    });

    // 모바일 터치 이벤트 핸들링 (즉각 탭 반응 및 터치 스와이프 조준)
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const p = getPos(touch);
        this.handleMouseMove(p.x, p.y);
        this.handleClick(p.x, p.y);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const p = getPos(touch);
        this.handleMouseMove(p.x, p.y);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
      this.hoverCell = null;
    });
  }

  handleMouseMove(mx, my) {
    if (!this.isPlaying || this.isGameOver) {
      this.hoverCell = null;
      return;
    }

    const c = Math.floor((mx - this.offsetX) / this.cellSpacing);
    const r = Math.floor((my - this.offsetY) / this.cellSpacing);

    if (c >= 0 && c < this.cols && r >= 0 && r < this.rows && this.grid[r][c] === null) {
      const scan = this.scanDirections(r, c);
      this.hoverCell = {
        row: r,
        col: c,
        scan: scan,
        canMatch: scan.matchedGems.length > 0
      };
    } else {
      this.hoverCell = null;
    }
  }

  handleClick(mx, my) {
    if (this.isGameOver) return;

    const c = Math.floor((mx - this.offsetX) / this.cellSpacing);
    const r = Math.floor((my - this.offsetY) / this.cellSpacing);

    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return;
    if (this.grid[r][c] !== null) return;

    if (this.timeStart === null && this.mode !== 'zen') {
      this.timeStart = performance.now();
      this.stats.startTime = Date.now();
    }

    this.makeMove(r, c);
  }

  scanDirections(row, col) {
    let top = null, down = null, left = null, right = null;

    for (let r = row - 1; r >= 0; r--) {
      if (this.grid[r][col] !== null) {
        top = { r, c: col, data: this.grid[r][col], dist: row - r, dir: 'top' };
        break;
      }
    }
    for (let r = row + 1; r < this.rows; r++) {
      if (this.grid[r][col] !== null) {
        down = { r, c: col, data: this.grid[r][col], dist: r - row, dir: 'down' };
        break;
      }
    }
    for (let c = col - 1; c >= 0; c--) {
      if (this.grid[row][c] !== null) {
        left = { r: row, c, data: this.grid[row][c], dist: col - c, dir: 'left' };
        break;
      }
    }
    for (let c = col + 1; c < this.cols; c++) {
      if (this.grid[row][c] !== null) {
        right = { r: row, c, data: this.grid[row][c], dist: c - col, dir: 'right' };
        break;
      }
    }

    // 피버 모드일 때는 4방향에 걸리는 모든 보석을 쓸어담음
    if (this.isFever) {
      const allFound = [top, down, left, right].filter(x => x !== null);
      return { top, down, left, right, matchedGems: allFound, isFeverMatch: true };
    }

    // 일반 매칭 판정 (동일 색상 2개 이상)
    const dirs = [top, down, left, right].filter(x => x !== null);
    const matchedGems = [];

    const groups = {};
    dirs.forEach(d => {
      const type = d.data.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(d);
    });

    for (const t in groups) {
      if (groups[t].length >= 2) {
        matchedGems.push(...groups[t]);
      }
    }

    return { top, down, left, right, matchedGems, isFeverMatch: false };
  }

  makeMove(row, col) {
    this.stats.clicks++;
    const scan = this.scanDirections(row, col);

    if (scan.matchedGems.length > 0) {
      this.stats.matches++;
      this.saveHistory();

      this.combo++;
      this.comboTimer = this.comboMaxDuration;
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }

      // 소거할 보석 셋 (중복 제거)
      const toRemove = new Set();
      let triggeredBomb = false;
      let triggeredLightning = false;
      let triggeredTime = false;
      const bombPositions = [];
      const lightningPositions = [];

      scan.matchedGems.forEach(item => {
        toRemove.add(`${item.r},${item.c}`);
        if (item.data.special === 'bomb') {
          triggeredBomb = true;
          bombPositions.push({ r: item.r, c: item.c });
        }
        if (item.data.special === 'lightning') {
          triggeredLightning = true;
          lightningPositions.push({ r: item.r, c: item.c });
        }
        if (item.data.special === 'time') triggeredTime = true;
      });

      // 💣 폭탄 젬 발동: 폭탄이 터진 위치 주변 3x3 범위의 모든 타일을 직관적으로 소거!
      if (triggeredBomb) {
        bombPositions.forEach(bPos => {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = bPos.r + dr;
              const nc = bPos.c + dc;
              if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                if (this.grid[nr][nc] !== null) {
                  toRemove.add(`${nr},${nc}`);
                }
              }
            }
          }
        });
        if (window.soundEngine) window.soundEngine.playBombExplosion();
        this.screenShake = 16;
      }

      // ⚡ 전기(라이트닝) 젬 발동: 스케치처럼 동일한 종류의 보석들로 굵은 지그재그 체인 번개가 뻗어나가 일제 소거!
      if (triggeredLightning) {
        for (const lPos of lightningPositions) {
          const startX = this.offsetX + lPos.c * this.cellSpacing + this.cellSpacing / 2;
          const startY = this.offsetY + lPos.r * this.cellSpacing + this.cellSpacing / 2;
          const sourceGem = this.grid[lPos.r][lPos.c];
          const targetType = sourceGem ? sourceGem.type : (scan.matchedGems[0]?.data?.type ?? 0);

          // 1. 화면 전체에서 전기 타일과 같은 종류(Same Type)의 보석들을 우선 탐색!
          const sameTypeCandidates = [];
          const otherCandidates = [];

          for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
              if (this.grid[r][c] !== null && !toRemove.has(`${r},${c}`)) {
                const d = Math.hypot(r - lPos.r, c - lPos.c);
                if (this.grid[r][c].type === targetType) {
                  sameTypeCandidates.push({ r, c, dist: d, gem: this.grid[r][c] });
                } else {
                  otherCandidates.push({ r, c, dist: d, gem: this.grid[r][c] });
                }
              }
            }
          }

          // 거리순 정렬
          sameTypeCandidates.sort((a, b) => a.dist - b.dist);
          otherCandidates.sort((a, b) => a.dist - b.dist);

          // 동일 종류 보석 최대 5개 선택, 부족하면 다른 보석으로 총 4~5개 보충
          const selected = sameTypeCandidates.slice(0, 5);
          if (selected.length < 4) {
            const need = 4 - selected.length;
            selected.push(...otherCandidates.slice(0, need));
          }

          // 2. 전기 타일에서 각 타겟으로 굵직한 교대 지그재그 번개 줄기 연결
          let prevTarget = { x: startX, y: startY };
          selected.forEach((cand, idx) => {
            toRemove.add(`${cand.r},${cand.c}`);
            const targetX = this.offsetX + cand.c * this.cellSpacing + this.cellSpacing / 2;
            const targetY = this.offsetY + cand.r * this.cellSpacing + this.cellSpacing / 2;

            // 전기 젬에서 타겟으로 직접 뻗어나가는 번개
            this.createLightningBolt(startX, startY, targetX, targetY, "#00E5FF");

            // 체인(Chain) 연쇄: 중간 보석과 다음 보석 사이에도 번개 호 연결 (스케치 연출)
            if (idx > 0 && Math.hypot(targetX - prevTarget.x, targetY - prevTarget.y) < 220) {
              this.createLightningBolt(prevTarget.x, prevTarget.y, targetX, targetY, "#E0F2FE");
            }
            prevTarget = { x: targetX, y: targetY };
          });
        }

        if (window.soundEngine && window.soundEngine.playLightningSound) {
          window.soundEngine.playLightningSound();
        }
      }

      // ⏰ 타임 젬 발동: 시간 +5초 연장
      if (triggeredTime && this.mode !== 'zen') {
        this.timeRemain = Math.min(this.timeLimit, this.timeRemain + 5);
      }

      const count = toRemove.size;
      const comboMultiplier = Math.min(5, 1 + (this.combo - 1) * 0.2);
      const earnedScore = Math.round(count * 10 * comboMultiplier);
      this.score += earnedScore;
      this.stats.gemsCleared += count;

      const cx = this.offsetX + col * this.cellSpacing + this.cellSpacing / 2;
      const cy = this.offsetY + row * this.cellSpacing + this.cellSpacing / 2;

      // 플로팅 텍스트
      if (this.isFever) {
        this.addFloatingText(cx, cy, `🔥 FEVER BURST! +${earnedScore}`, "#FF007F", 20);
      } else if (triggeredBomb) {
        this.addFloatingText(cx, cy, `💣 3x3 AREA BOMB!! +${earnedScore}`, "#FFD700", 22);
      } else if (triggeredLightning) {
        this.addFloatingText(cx, cy, `⚡ CHAIN LIGHTNING!! +${earnedScore}`, "#38BDF8", 22);
      } else if (triggeredTime) {
        this.addFloatingText(cx, cy, `⏰ TIME +5s!`, "#00E5FF", 18);
      } else if (this.combo > 1) {
        this.addFloatingText(cx, cy, `${this.combo} COMBO! +${earnedScore}`, "#F59E0B", 18);
      }

      // 사운드 재생
      if (window.soundEngine) {
        if (this.isFever) {
          window.soundEngine.playFeverBurst();
        } else {
          window.soundEngine.playGemMatch(this.combo, count);
        }
      }

      // 피버 게이지 충전 (아케이드, 특수 젬, 메가 버스트 모드 지원)
      if (!this.isFever && (this.mode === 'arcade' || this.mode === 'special' || this.mode === 'mega')) {
        const feverGain = count * 1.5 + this.combo * 0.8;
        this.feverGauge = Math.min(100, this.feverGauge + feverGain);
        if (this.feverGauge >= 100) {
          this.activateFever();
        }
      }

      // 레이저 빔 연결
      scan.matchedGems.forEach(item => {
        this.createLaserBeam(row, col, item.r, item.c, item.data.type);
      });

      // 🎆 불꽃놀이 폭발(Fireworks Burst) & 산산조각 파편(Shatter Physics) 방출
      toRemove.forEach(key => {
        const [rStr, cStr] = key.split(',');
        const r = parseInt(rStr, 10);
        const c = parseInt(cStr, 10);
        const gemData = this.grid[r][c];
        if (gemData) {
          const gemCx = this.offsetX + c * this.cellSpacing + this.cellSpacing / 2;
          const gemCy = this.offsetY + r * this.cellSpacing + this.cellSpacing / 2;
          
          // 1. 눈부신 불꽃놀이 스파크 & 충격파 & 모션 꼬리 트레일 방출
          this.triggerFireworkBurst(gemCx, gemCy, gemData.type, this.isFever, triggeredBomb, this.combo);
          
          // 2. 크리스탈 산산조각 물리 파편 방출
          this.shatterGemIntoPieces(r, c, gemData.type);
          
          this.grid[r][c] = null;
        }
      });

      // 중심 클릭 지점 추가 슈퍼노바 버스트
      if (this.isFever || triggeredBomb || count >= 3) {
        this.triggerFireworkBurst(cx, cy, scan.matchedGems[0]?.data?.type || 0, this.isFever, triggeredBomb, this.combo + 1);
      }

      if (this.screenShakeEnabled) {
        this.screenShake = this.isFever ? 14 : (count >= 3 ? 8 : 4);
      }

      if (this.stats.gemsCleared >= this.stats.totalGems) {
        this.triggerVictory();
      }
    } else {
      this.stats.misses++;
      this.combo = 0;

      if (this.mode !== 'zen') {
        this.timeRemain = Math.max(0, this.timeRemain - 5);
      }

      if (window.soundEngine) {
        window.soundEngine.playMiss();
      }

      this.createMissRipple(row, col);
    }
  }

  activateFever() {
    this.isFever = true;
    this.feverDuration = 6.0;
    this.feverBannerTimer = 1.8;
    this.screenShake = 16;

    if (window.soundEngine) {
      window.soundEngine.playFeverActivate();
    }

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 120 + Math.random() * 260;
      this.particles.push({
        x: this.width / 2,
        y: this.height / 2,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 4 + Math.random() * 6,
        color: i % 2 === 0 ? "#FF007F" : "#FFD700",
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 12,
        alpha: 1.0,
        life: 0.8 + Math.random() * 0.4
      });
    }
  }

  createLaserBeam(r1, c1, r2, c2, gemType) {
    const x1 = this.offsetX + c1 * this.cellSpacing + this.cellSpacing / 2;
    const y1 = this.offsetY + r1 * this.cellSpacing + this.cellSpacing / 2;
    const x2 = this.offsetX + c2 * this.cellSpacing + this.cellSpacing / 2;
    const y2 = this.offsetY + r2 * this.cellSpacing + this.cellSpacing / 2;

    const spec = this.gemSpecs[gemType];
    this.beams.push({
      x1, y1, x2, y2,
      color: this.isFever ? "#FF007F" : spec.color,
      alpha: 1.0,
      width: this.isFever ? 16 : 10,
      life: 0.3
    });
  }

  /**
   * ⚡ 체인 라이트닝 볼트 생성 (좁고 날렵한 면도날 선 형태의 지그재그 번개 아크)
   * - 시작점(x1, y1)에서 타겟(x2, y2)까지 가느다란 전기선 형태로 연결
   */
  createLightningBolt(x1, y1, x2, y2, color = "#00E5FF") {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;

    // 거리에 비례하여 10~14px 간격으로 촘촘하고 얇은 전기선 세그먼트 생성
    const steps = Math.max(6, Math.floor(dist / 12));
    const nx = -dy / dist;
    const ny = dx / dist;

    const points = [{ x: x1, y: y1 }];
    const branches = [];

    for (let i = 1; i < steps; i++) {
      const progress = i / steps;
      // [선처럼 보이도록 좁은 진폭]: 폭을 1.5~3.0px 수준으로 최소화하여 날렵한 전기선 실루엣 형성
      const side = (i % 2 === 0) ? 1 : -1;
      const amplitude = (1.5 + Math.random() * 1.8) * Math.sin(progress * Math.PI);

      const px = x1 + dx * progress + nx * (side * amplitude);
      const py = y1 + dy * progress + ny * (side * amplitude);
      points.push({ x: px, y: py });

      // 작고 날렵한 미세 번개 잔가지
      if (Math.random() < 0.25 && branches.length < 2) {
        const branchLen = 6 + Math.random() * 6;
        const bAngle = Math.atan2(dy, dx) + side * 0.5;
        const bx2 = px + Math.cos(bAngle) * branchLen;
        const by2 = py + Math.sin(bAngle) * branchLen;
        branches.push([
          { x: px, y: py },
          { x: bx2, y: by2 }
        ]);
      }
    }
    points.push({ x: x2, y: y2 });

    // 타겟 지점에 파지지직 튀는 미세 전기 스파크 3~4개 생성
    for (let k = 0; k < 4; k++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 60;
      this.fireworks.push({
        x: x2,
        y: y2,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        drag: 0.92,
        gravity: 30,
        history: [{ x: x2, y: y2 }],
        maxHistory: 3,
        color: "#00E5FF",
        size: 1.5,
        life: 0.25 + Math.random() * 0.15,
        maxLife: 0.4,
        shimmerSpeed: 25,
        shimmerPhase: 0,
        hasSubBurst: false
      });
    }

    this.lightningBolts.push({
      x1, y1, x2, y2,
      points,
      branches,
      color: color,
      coreColor: "#FFFFFF",
      life: 0.28,
      maxLife: 0.28,
      width: 2.8 // [2배 타일에 맞춘 번개 선]
    });
  }

  /**
   * 산산조각(Shatter) 파편 물리 생성:
   * 타일 1개가 10~14개의 각진 크리스탈 파편 조각으로 산산조각 박살나 튀어 떨어지는 연출
   */
  shatterGemIntoPieces(r, c, gemType) {
    const cx = this.offsetX + c * this.cellSpacing + this.cellSpacing / 2;
    const cy = this.offsetY + r * this.cellSpacing + this.cellSpacing / 2;
    const spec = this.gemSpecs[gemType];

    // 5~7개의 다각형 크리스탈 파편 생성 (빛나는 Trail 꼬리 탑재)
    const shardCount = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < shardCount; i++) {
      const angle = (i / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = 140 + Math.random() * 200;
      
      this.shards.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120,
        rotation: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 12,
        size: 6 + Math.random() * 8, // 2배 커진 타일에 맞춘 파편 크기
        points: this.generateShardPoly(),
        color: i % 3 === 0 ? spec.light : (i % 3 === 1 ? spec.color : spec.dark),
        trailColor: spec.light || spec.color,
        history: [{ x: cx, y: cy }],
        maxHistory: 6, // 6프레임의 매끄러운 크리스탈 빛 꼬리
        alpha: 1.0,
        life: 0.85 + Math.random() * 0.35
      });
    }

    if (this.shards.length > 50) {
      this.shards.splice(0, this.shards.length - 50);
    }
  }

  generateShardPoly() {
    // 3~4각 뾰족한 파편 패스
    const pts = [];
    const count = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = 0.5 + Math.random() * 0.5;
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    return pts;
  }

  createMissRipple(r, c) {
    const cx = this.offsetX + c * this.cellSpacing + this.cellSpacing / 2;
    const cy = this.offsetY + r * this.cellSpacing + this.cellSpacing / 2;
    this.particles.push({
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      radius: 4,
      maxRadius: 28,
      isRipple: true,
      alpha: 0.8,
      life: 0.3
    });
  }

  addFloatingText(x, y, text, color, size = 16) {
    this.floatingTexts.push({
      x, y,
      text,
      color,
      size,
      alpha: 1.0,
      vy: -40,
      life: 0.8
    });
  }

  saveHistory() {
    if (this.mode !== 'zen') return;
    const copy = this.grid.map(row => row.map(cell => cell ? { ...cell } : null));
    this.history.push({
      grid: copy,
      score: this.score,
      gemsCleared: this.stats.gemsCleared
    });
    if (this.history.length > 20) {
      this.history.shift();
    }
  }

  undo() {
    if (this.mode !== 'zen' || this.history.length === 0) return;
    const prev = this.history.pop();
    this.grid = prev.grid.map(row => row.map(cell => cell ? { ...cell } : null));
    this.score = prev.score;
    this.stats.gemsCleared = prev.gemsCleared;
    if (window.soundEngine) {
      window.soundEngine.playShuffleSound();
    }
  }

  hint() {
    if (!this.isPlaying || this.isGameOver) return;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === null) {
          const scan = this.scanDirections(r, c);
          if (scan.matchedGems.length > 0) {
            const cx = this.offsetX + c * this.cellSpacing + this.cellSpacing / 2;
            const cy = this.offsetY + r * this.cellSpacing + this.cellSpacing / 2;
            this.particles.push({
              x: cx,
              y: cy,
              vx: 0,
              vy: 0,
              radius: 6,
              maxRadius: 36,
              isRipple: true,
              isHint: true,
              alpha: 1.0,
              life: 1.0
            });
            if (window.soundEngine) {
              window.soundEngine.playGemMatch(1, 2);
            }
            return { row: r, col: c };
          }
        }
      }
    }
    this.notifyNoMoves();
  }

  shuffleRemaining() {
    const activeGems = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] !== null) {
          activeGems.push(this.grid[r][c]);
        }
      }
    }

    if (activeGems.length === 0) return;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = null;
      }
    }

    const allSlots = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        allSlots.push({ r, c });
      }
    }
    for (let i = allSlots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allSlots[i], allSlots[j]] = [allSlots[j], allSlots[i]];
    }

    activeGems.forEach((gem, idx) => {
      const slot = allSlots[idx];
      this.grid[slot.r][slot.c] = gem;
    });

    if (window.soundEngine) {
      window.soundEngine.playShuffleSound();
    }
  }

  notifyNoMoves() {
    this.screenShake = 8;
  }

  triggerVictory() {
    this.isGameOver = true;
    this.stats.endTime = Date.now();
    if (window.soundEngine) {
      window.soundEngine.playVictory();
    }
    if (window.onGameEnd) {
      window.onGameEnd(this.getFinalReport(true));
    }
  }

  triggerTimeUp() {
    this.isGameOver = true;
    this.stats.endTime = Date.now();
    if (window.soundEngine) {
      window.soundEngine.playTimeUp();
    }
    if (window.onGameEnd) {
      window.onGameEnd(this.getFinalReport(false));
    }
  }

  getFinalReport(isVictory) {
    const elapsed = this.stats.startTime > 0 ? (this.stats.endTime - this.stats.startTime) / 1000 : 0;
    const accuracy = this.stats.clicks > 0 ? Math.round((this.stats.matches / this.stats.clicks) * 100) : 0;
    const apm = elapsed > 0 ? Math.round((this.stats.clicks / elapsed) * 60) : 0;
    const clearRate = Math.round((this.stats.gemsCleared / this.stats.totalGems) * 100);

    return {
      isVictory,
      mode: this.mode,
      score: this.score,
      time: elapsed.toFixed(1),
      maxCombo: this.maxCombo,
      accuracy,
      apm,
      clearRate,
      gemsCleared: this.stats.gemsCleared,
      totalGems: this.stats.totalGems
    };
  }

  loop(currentTime) {
    const dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop);
  }

  update(dt) {
    if (this.isPlaying && !this.isGameOver && this.timeStart !== null && this.mode !== 'zen') {
      this.timeRemain -= dt;
      if (this.timeRemain <= 0) {
        this.timeRemain = 0;
        this.triggerTimeUp();
      }
    }

    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    if (this.isFever) {
      this.feverDuration -= dt;
      this.feverGauge = (this.feverDuration / 6.0) * 100;
      if (this.feverDuration <= 0) {
        this.isFever = false;
        this.feverGauge = 0;
      }
    } else if (this.combo === 0 && this.feverGauge > 0) {
      // 콤보가 유지되지 않으면 피버 게이지가 초당 2.5%씩 서서히 식어감 (피버 남발 방지)
      this.feverGauge = Math.max(0, this.feverGauge - dt * 2.5);
    }

    if (this.feverBannerTimer > 0) {
      this.feverBannerTimer -= dt;
    }

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // 빔
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.life -= dt;
      b.alpha = Math.max(0, b.life / 0.3);
      if (b.life <= 0) {
        this.beams.splice(i, 1);
      }
    }

    // 박살 파편(Shards) 물리 시뮬레이션
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      s.life -= dt;

      // 꼬리 궤적(Trail) 위치 기록
      if (!s.history) s.history = [];
      s.history.unshift({ x: s.x, y: s.y });
      if (s.history.length > (s.maxHistory || 6)) {
        s.history.pop();
      }

      s.vy += 1200 * dt; // 강한 중력 낙하
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rotation += s.vrot * dt;
      s.alpha = Math.max(0, s.life / 1.0);
      if (s.life <= 0 || s.y > this.height + 80) {
        this.shards.splice(i, 1);
      }
    }

    // 일반 파티클
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.isRipple) {
        p.radius += (p.maxRadius - p.radius) * 8 * dt;
        p.alpha = Math.max(0, p.life / 0.3);
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha = Math.max(0, p.life / 0.3);
      }
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 플로팅 텍스트
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      ft.alpha = Math.max(0, ft.life / 0.8);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 🌌 우주 배경 업데이트
    this.updateCosmicBackground(dt);

    // ⚡ 카메라 줌 펄스 부드러운 복원 (타격감)
    this.cameraZoom += (1.0 - this.cameraZoom) * Math.min(1.0, 12 * dt);

    // 🎆 초신성 코어 플래시 업데이트
    for (let i = this.supernovaFlashes.length - 1; i >= 0; i--) {
      const sn = this.supernovaFlashes[i];
      sn.life -= dt;
      sn.radius += (sn.targetRadius - sn.radius) * 16 * dt;
      if (sn.life <= 0) {
        this.supernovaFlashes.splice(i, 1);
      }
    }

    // 🎆 충격파 링 업데이트
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed * dt;
      sw.alpha = Math.max(0, 1.0 - (sw.radius / sw.maxRadius));
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 🎆 불꽃놀이 스파크 & 빛 꼬리(Trail) 물리 업데이트
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const fw = this.fireworks[i];
      fw.life -= dt;

      // 꼬리 히스토리에 현재 위치 기록
      fw.history.unshift({ x: fw.x, y: fw.y });
      if (fw.history.length > fw.maxHistory) {
        fw.history.pop();
      }

      // 공기 저항 & 불꽃 중력
      const dragFactor = Math.pow(fw.drag, dt * 60);
      fw.vx *= dragFactor;
      fw.vy += fw.gravity * dt;
      fw.vy *= dragFactor;

      fw.x += fw.vx * dt;
      fw.y += fw.vy * dt;

      // 반짝임 위상
      fw.shimmerPhase += fw.shimmerSpeed * dt;

      if (fw.life <= 0) {
        // 정점 2차 마이크로 스타더스트 버스트
        if (fw.hasSubBurst) {
          for (let k = 0; k < 3; k++) {
            const subAngle = Math.random() * Math.PI * 2;
            const subSpd = 30 + Math.random() * 50;
            this.cosmicGlitters.push({
              x: fw.x,
              y: fw.y,
              vx: Math.cos(subAngle) * subSpd,
              vy: Math.sin(subAngle) * subSpd + 10,
              size: 1.5,
              color: "#FFF9C4",
              rot: 0,
              vrot: 2,
              alpha: 0.9,
              life: 0.8,
              maxLife: 0.8,
              twinkleRate: 15
            });
          }
        }
        this.fireworks.splice(i, 1);
      }
    }

    // 🎆 은하 글리터 가루 낙하 업데이트
    for (let i = this.cosmicGlitters.length - 1; i >= 0; i--) {
      const g = this.cosmicGlitters[i];
      g.life -= dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.rot += g.vrot * dt;
      g.alpha = Math.max(0, g.life / g.maxLife);
      if (g.life <= 0 || g.y > this.height + 20) {
        this.cosmicGlitters.splice(i, 1);
      }
    }

    // ⚡ 체인 라이트닝 볼트 업데이트
    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      const lb = this.lightningBolts[i];
      lb.life -= dt;
      if (lb.life <= 0) {
        this.lightningBolts.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();

    // 1. 카메라 줌 펄스 (중심 기준 확대)
    if (this.cameraZoom !== 1.0) {
      const cx = this.width / 2;
      const cy = this.height / 2;
      ctx.translate(cx, cy);
      ctx.scale(this.cameraZoom, this.cameraZoom);
      ctx.translate(-cx, -cy);
    }

    // 2. 화면 진동 (Screen Shake)
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    ctx.clearRect(0, 0, this.width, this.height);

    // 1. 테트리스 이펙트 몽환적 우주 배경 (성운, 140개 3단 별무리, 유성우)
    this.renderModernBackground(ctx);

    // 2. 상단 HUD
    this.renderHUD(ctx);

    // 3. 보석 격자판 보드 (네온 그리드)
    this.renderBoard(ctx);

    // 4. 스마트 레이저 조준선
    if (this.smartGuide && this.hoverCell) {
      this.renderCrosshairGuide(ctx);
    }

    // 5. 프리즘 크리스탈 & 행성 보석(Gems) 렌더링
    this.renderGems(ctx);

    // 6. 산산조각 박살 파편(Shards) 물리 렌더링
    this.renderShards(ctx);

    // 7. 🎆 테트리스 이펙트 & 행성 폭발 가산 혼합(Additive Blending) 불꽃놀이 렌더러
    this.renderFireworksAndCosmicEffects(ctx);

    // 8. 일반 효과 & 플로팅 텍스트
    this.renderEffects(ctx);

    // 9. 피버 진입 초대형 배너
    if (this.feverBannerTimer > 0) {
      this.renderFeverBanner(ctx);
    }

    // 10. 하단 컨트롤
    this.renderFooterControls(ctx);

    ctx.restore();
  }

  /**
   * 🌌 테트리스 이펙트 스타일의 살아 숨쉬는 우주 공간 (Living Cosmic Backdrop)
   * - 딥 스페이스 베이스 그라데이션
   * - 유기적으로 표동하는 4중 오로라 성운(Nebulae)
   * - 3단 패럴랙스 & 반짝이는 140개 별무리 (Twinkling Starfield)
   * - 우주를 가로지르는 유성우 (Shooting Stars)
   * - 피버 모드 시 초고속 하이퍼스페이스 스타 워프 (Hyperspace Star Warp)
   */
  renderModernBackground(ctx) {
    // 1. 딥 스페이스 베이스 그라데이션
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, "#060814");
    bgGrad.addColorStop(0.5, "#0A0E1F");
    bgGrad.addColorStop(1, "#030408");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();

    // 2. 유기적 오로라 성운(Nebulae) 렌더링
    this.nebulae.forEach(n => {
      const nx = n.curX || n.x;
      const ny = n.curY || n.y;
      const nGrad = ctx.createRadialGradient(nx, ny, 10, nx, ny, n.radius);
      nGrad.addColorStop(0, n.color1);
      nGrad.addColorStop(1, n.color2);
      ctx.fillStyle = nGrad;
      ctx.beginPath();
      ctx.arc(nx, ny, n.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. 별무리 (Starfield) - [초고속 60fps 배치 렌더링]
    const time = performance.now();
    if (this.isFever) {
      // 피버 모드: 광속 워프 선(Warp Lines)
      const cx = this.width / 2;
      const cy = this.height / 2;
      for (const s of this.stars) {
        const dx = s.x - cx;
        const dy = s.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const tailLen = Math.min(30, dist * 0.12 * s.depth);

        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.size * 0.8;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - (dx / dist) * tailLen, s.y - (dy / dist) * tailLen);
        ctx.stroke();
      }
    } else {
      // 일반 모드: 사각 핀포인트 별빛 (드로우 콜을 최소화하여 초고속 처리)
      for (const s of this.stars) {
        const alpha = Math.max(0.15, Math.min(0.9, s.baseAlpha + Math.sin(s.twinklePhase) * 0.35));
        ctx.fillStyle = s.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
    }

    // 4. 유성우 (Shooting Stars)
    this.shootingStars.forEach(ss => {
      const progress = ss.life / ss.maxLife;
      const alpha = Math.sin(progress * Math.PI);
      const angle = Math.atan2(ss.vy, ss.vx);

      ctx.save();
      ctx.globalAlpha = alpha;
      const cometGrad = ctx.createLinearGradient(
        ss.x, ss.y,
        ss.x - Math.cos(angle) * ss.len,
        ss.y - Math.sin(angle) * ss.len
      );
      cometGrad.addColorStop(0, "#FFFFFF");
      cometGrad.addColorStop(0.3, ss.color);
      cometGrad.addColorStop(1, "transparent");

      ctx.strokeStyle = cometGrad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ss.x - Math.cos(angle) * ss.len, ss.y - Math.sin(angle) * ss.len);
      ctx.stroke();

      // 머리 부분 눈부신 광구
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(ss.x, ss.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();

    // 5. 피버 모드 시 초신성 테두리 오로라
    if (this.isFever) {
      const pulse = 0.5 + Math.sin(time * 0.008) * 0.5;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 0, 127, ${0.45 + pulse * 0.45})`;
      ctx.lineWidth = 8;
      ctx.shadowColor = "#FF007F";
      ctx.shadowBlur = 24;
      ctx.strokeRect(4, 4, this.width - 8, this.height - 8);

      // 내부 사이안 서브 오로라
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.3 + pulse * 0.3})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = "#38BDF8";
      ctx.shadowBlur = 14;
      ctx.strokeRect(10, 10, this.width - 20, this.height - 20);
      ctx.restore();
    }
  }

  renderHUD(ctx) {
    // 점수
    ctx.fillStyle = "#F8FAFC";
    ctx.font = "900 24px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${this.score.toLocaleString()} PTS`, 28, 38);

    // 모드 뱃지
    ctx.fillStyle = "#38BDF8";
    ctx.font = "bold 12px sans-serif";
    const modeLabels = {
      special: "SPECIAL GEMS (BOMBS & LIGHTNING)",
      mega: "MEGA BURST 1.5X (300 GEMS / 28x18)",
      arcade: "ARCADE FEVER",
      zen: "ZEN HEALING (NO TIME LIMIT)",
      classic: "CLASSIC 120S",
      mini: "MINI QUEST (60S)"
    };
    ctx.fillText(modeLabels[this.mode] || this.mode.toUpperCase(), 30, 56);

    // 콤보 표시
    if (this.combo > 1) {
      ctx.save();
      ctx.textAlign = "center";
      const scale = 1.0 + Math.sin(performance.now() * 0.01) * 0.08;
      ctx.translate(this.width / 2, 32);
      ctx.scale(scale, scale);

      ctx.fillStyle = "#F59E0B";
      ctx.shadowColor = "#F59E0B";
      ctx.shadowBlur = 12;
      ctx.font = "900 22px sans-serif";
      ctx.fillText(`${this.combo} COMBO!`, 0, 0);

      const cbW = 100;
      const cbH = 4;
      const ratio = this.comboTimer / this.comboMaxDuration;
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(-cbW / 2, 6, cbW, cbH);
      ctx.fillStyle = "#F59E0B";
      ctx.fillRect(-cbW / 2, 6, cbW * ratio, cbH);
      ctx.restore();
    }

    // 타이머
    ctx.textAlign = "right";
    if (this.mode === 'zen') {
      ctx.fillStyle = "#10B981";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`CLEAR: ${this.stats.gemsCleared} / ${this.stats.totalGems}`, this.width - 28, 38);
    } else {
      const sec = Math.ceil(this.timeRemain);
      ctx.fillStyle = sec <= 15 ? "#EF4444" : "#F8FAFC";
      ctx.font = "bold 26px monospace";
      ctx.fillText(`${sec}s`, this.width - 28, 38);

      const tbW = 140;
      const tbH = 6;
      const tbX = this.width - 28 - tbW;
      const tbY = 48;
      const tRatio = Math.max(0, this.timeRemain / this.timeLimit);
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fillRect(tbX, tbY, tbW, tbH);
      ctx.fillStyle = sec <= 15 ? "#EF4444" : (sec <= 40 ? "#F59E0B" : "#10B981");
      ctx.fillRect(tbX, tbY, tbW * tRatio, tbH);
    }

    // 피버 모드 바
    if (this.mode === 'arcade' || this.mode === 'special' || this.mode === 'mega') {
      const fvW = 240;
      const fvH = 10;
      const fvX = (this.width - fvW) / 2;
      const fvY = 64;

      if (this.isFever) {
        const pulse = 1.0 + Math.sin(performance.now() * 0.012) * 0.06;
        ctx.save();
        ctx.translate(this.width / 2, fvY);
        ctx.scale(pulse, pulse);

        ctx.fillStyle = "rgba(255, 0, 127, 0.25)";
        ctx.fillRect(-fvW / 2 - 10, -18, fvW + 20, 32);

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(-fvW / 2, -2, fvW, fvH);

        ctx.fillStyle = "#FF007F";
        ctx.shadowColor = "#FF007F";
        ctx.shadowBlur = 12;
        ctx.fillRect(-fvW / 2, -2, fvW * (this.feverGauge / 100), fvH);

        ctx.fillStyle = "#FFE600";
        ctx.font = "900 13px sans-serif";
        ctx.textAlign = "center";
        const remainSec = this.feverDuration.toFixed(1);
        ctx.fillText(`🔥 FEVER ACTIVE: ${remainSec}s [전방향 폭파!]`, 0, -6);
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fillRect(fvX, fvY, fvW, fvH);

        const fgGrad = ctx.createLinearGradient(fvX, 0, fvX + fvW, 0);
        fgGrad.addColorStop(0, "#3B82F6");
        fgGrad.addColorStop(1, "#F68ABF");
        ctx.fillStyle = fgGrad;
        ctx.fillRect(fvX, fvY, fvW * (this.feverGauge / 100), fvH);

        ctx.fillStyle = "#94A3B8";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`FEVER GAUGE ${Math.floor(this.feverGauge)}% (100%시 전방향 폭파)`, this.width / 2, fvY - 4);
      }
    }
  }

  renderBoard(ctx) {
    const boardW = this.cols * this.cellSpacing;
    const boardH = this.rows * this.cellSpacing;

    // 반투명 다크 크리스탈 글래스 보드 (투명도를 2배 높여 우주 배경이 은은하게 투과)
    ctx.save();
    ctx.fillStyle = "rgba(8, 14, 28, 0.36)";
    ctx.fillRect(this.offsetX, this.offsetY, boardW, boardH);

    // 보드 외곽 네온 림
    ctx.strokeStyle = this.isFever ? "rgba(255, 0, 127, 0.7)" : "rgba(56, 189, 248, 0.25)";
    ctx.shadowColor = this.isFever ? "#FF007F" : "#38BDF8";
    ctx.shadowBlur = this.isFever ? 18 : 8;
    ctx.lineWidth = this.isFever ? 2.5 : 1.2;
    ctx.strokeRect(this.offsetX, this.offsetY, boardW, boardH);
    ctx.restore();

    // 내부 은은한 그리드 라인
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let r = 1; r < this.rows; r++) {
      const y = this.offsetY + r * this.cellSpacing;
      ctx.beginPath();
      ctx.moveTo(this.offsetX, y);
      ctx.lineTo(this.offsetX + boardW, y);
      ctx.stroke();
    }
    for (let c = 1; c < this.cols; c++) {
      const x = this.offsetX + c * this.cellSpacing;
      ctx.beginPath();
      ctx.moveTo(x, this.offsetY);
      ctx.lineTo(x, this.offsetY + boardH);
      ctx.stroke();
    }
  }

  renderCrosshairGuide(ctx) {
    const { row, col, scan, canMatch } = this.hoverCell;
    const cx = this.offsetX + col * this.cellSpacing + this.cellSpacing / 2;
    const cy = this.offsetY + row * this.cellSpacing + this.cellSpacing / 2;
    const time = performance.now();

    const boardW = this.cols * this.cellSpacing;
    const boardH = this.rows * this.cellSpacing;

    if (this.isFever) {
      ctx.save();
      ctx.strokeStyle = "#FF007F";
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(this.offsetX, cy);
      ctx.lineTo(this.offsetX + boardW, cy);
      ctx.moveTo(cx, this.offsetY);
      ctx.lineTo(cx, this.offsetY + boardH);
      ctx.stroke();

      ctx.strokeStyle = "#FFE600";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#FFE600";
      ctx.font = "900 14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("🔥 FEVER BURST", cx + 24, cy - 8);

      // 매치 대상 보석 하이라이트 (불꽃 에너지 프레임)
      scan.matchedGems.forEach(item => {
        const tx = this.offsetX + item.c * this.cellSpacing + this.cellSpacing / 2;
        const ty = this.offsetY + item.r * this.cellSpacing + this.cellSpacing / 2;
        ctx.strokeStyle = "#FFE600";
        ctx.lineWidth = 3.0;
        const pulseBox = 1.0 + Math.sin(time * 0.01) * 0.1;
        const boxSize = (this.gemSize + 6) * pulseBox;
        ctx.strokeRect(tx - boxSize / 2, ty - boxSize / 2, boxSize, boxSize);
      });
      ctx.restore();
      return;
    }

    // 일반 모드 조준선
    const lineColor = canMatch ? "rgba(52, 211, 153, 0.75)" : "rgba(255, 255, 255, 0.25)";
    ctx.save();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.4;
    ctx.setLineDash([6, 6]);

    ctx.beginPath();
    ctx.moveTo(this.offsetX, cy);
    ctx.lineTo(this.offsetX + boardW, cy);
    ctx.moveTo(cx, this.offsetY);
    ctx.lineTo(cx, this.offsetY + boardH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = canMatch ? "#34D399" : "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.stroke();

    // 매칭 가능한 보석 회전 네온 링 표시 및 특수 기믹 프리뷰
    if (canMatch && this.hoverPreview) {
      const ringRot = time * 0.004;
      let hasBombPreview = false;
      let bombLoc = null;

      scan.matchedGems.forEach(item => {
        const tx = this.offsetX + item.c * this.cellSpacing + this.cellSpacing / 2;
        const ty = this.offsetY + item.r * this.cellSpacing + this.cellSpacing / 2;
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(ringRot);

        ctx.strokeStyle = item.data.special === 'bomb' ? "#F59E0B" : (item.data.special === 'lightning' ? "#00E5FF" : "#38BDF8");
        ctx.lineWidth = 2;

        const hr = this.gemSize * 0.72;
        ctx.beginPath();
        ctx.rect(-hr / 2, -hr / 2, hr, hr);
        ctx.stroke();

        ctx.restore();

        if (item.data.special === 'bomb') {
          hasBombPreview = true;
          bombLoc = item;
        }
      });

      // 💣 폭탄 매치 시 주변 3x3 범위 시각화 안내
      if (hasBombPreview && bombLoc) {
        ctx.save();
        const pulse = 0.5 + Math.sin(time * 0.008) * 0.3;
        const bMinR = Math.max(0, bombLoc.r - 1);
        const bMaxR = Math.min(this.rows - 1, bombLoc.r + 1);
        const bMinC = Math.max(0, bombLoc.c - 1);
        const bMaxC = Math.min(this.cols - 1, bombLoc.c + 1);

        const areaX = this.offsetX + bMinC * this.cellSpacing;
        const areaY = this.offsetY + bMinR * this.cellSpacing;
        const areaW = (bMaxC - bMinC + 1) * this.cellSpacing;
        const areaH = (bMaxR - bMinR + 1) * this.cellSpacing;

        ctx.fillStyle = `rgba(245, 158, 11, ${0.12 + pulse * 0.1})`;
        ctx.fillRect(areaX, areaY, areaW, areaH);

        ctx.strokeStyle = "#F59E0B";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(areaX, areaY, areaW, areaH);
        ctx.setLineDash([]);

        ctx.fillStyle = "#F59E0B";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("💣 3x3 폭파 범위", areaX + 4, areaY - 4);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  /**
   * 💎 [초고속 60fps] 오프스크린 캔버스 캐시를 활용한 보석 렌더링
   * - 345개의 복잡한 패스 연산을 0.1ms 미만의 GPU drawImage 복사로 대체하여 극적인 렉 해소!
   */
  renderGems(ctx) {
    const halfSize = this.gemSize / 2;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (cell !== null) {
          const cx = this.offsetX + c * this.cellSpacing + this.cellSpacing / 2;
          const cy = this.offsetY + r * this.cellSpacing + this.cellSpacing / 2;

          // 1. 사전 베이크된 고화질 크리스탈 보석 복사 (CPU 부하 0)
          const img = this.gemCache[cell.type];
          if (img) {
            ctx.drawImage(img, cx - halfSize, cy - halfSize, this.gemSize, this.gemSize);
          } else {
            this.drawCandyGem(ctx, cx, cy, this.gemSize, cell.type, null);
          }

          // 2. 특수 보석 아이콘 (타일 색상 위에 묻히지 않도록 선명한 고대비 엠블럼 & 네온 림)
          if (cell.special) {
            const time = performance.now();
            const pulse = 0.85 + Math.sin(time * 0.008) * 0.15;
            this.renderSpecialBadge(ctx, cx, cy, this.gemSize, cell.special, pulse);
          } else if (this.colorBlindMode) {
            this.renderRuneSymbol(ctx, cell.type, cx, cy, this.gemSize * 0.58);
          }
        }
      }
    }
  }

  /**
   * 🌟 특수 보석 뱃지 고대비 선명 렌더링 (폭탄 💣, 번개 ⚡, 시간 ⏰)
   * 타일 색상에 묻히지 않도록 짙은 다크 실드 + 듀얼 발광 네온 링 + 대형 고선명 아이콘 적용
   */
  renderSpecialBadge(ctx, cx, cy, size, special, pulse = 1.0) {
    const conf = {
      bomb: {
        icon: "💣",
        neonColor: "#FF3344",
        glowColor: "rgba(255, 51, 68, 0.85)",
        darkBg: "rgba(14, 17, 28, 0.96)",
        ringColor: "#FFAA00"
      },
      lightning: {
        icon: "⚡",
        neonColor: "#00E5FF",
        glowColor: "rgba(0, 229, 255, 0.9)",
        darkBg: "rgba(8, 20, 36, 0.96)",
        ringColor: "#E0F7FA"
      },
      time: {
        icon: "⏰",
        neonColor: "#FFD700",
        glowColor: "rgba(255, 215, 0, 0.9)",
        darkBg: "rgba(24, 20, 8, 0.96)",
        ringColor: "#FFF9C4"
      }
    }[special];

    if (!conf) return;

    ctx.save();

    const sHalf = size * 0.44;

    // 1) 외곽 고선명 네온 테두리 (타일 경계 강조)
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = conf.neonColor;
    ctx.shadowColor = conf.glowColor;
    ctx.shadowBlur = 8 * pulse;
    this.drawRoundedRectPath(ctx, cx - sHalf, cy - sHalf, sHalf * 2, sHalf * 2, 4);
    ctx.stroke();

    // 2) 중심 고대비 다크 엠블럼 실드 (타일 색상 완벽 차단하여 가독성 100% 확보)
    const badgeR = size * 0.35;
    ctx.shadowBlur = 0;
    ctx.fillStyle = conf.darkBg;
    ctx.beginPath();
    ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
    ctx.fill();

    // 3) 뱃지 외곽 발광 네온 링
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = conf.neonColor;
    ctx.shadowColor = conf.glowColor;
    ctx.shadowBlur = 7 * pulse;
    ctx.beginPath();
    ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
    ctx.stroke();

    // 4) 뱃지 내부 메탈릭 보조 링
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = conf.ringColor;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1, badgeR - 2.5), 0, Math.PI * 2);
    ctx.stroke();

    // 5) 대형 아이콘 텍스트 렌더링 (또렷하고 큼직하게 중앙 배치)
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.round(size * 0.54)}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`;
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.fillText(conf.icon, cx, cy + 1);

    ctx.restore();
  }

  drawCandyGem(ctx, cx, cy, size, gemType, special) {
    const spec = this.gemSpecs[gemType];
    ctx.save();

    // 1. 미니멀 3D 쉐이딩 타일 렌더링
    this.drawShadedTile(ctx, cx, cy, size, spec);

    // 2. 특수 보석 아이콘 표시 (단독 렌더링 시)
    if (special) {
      this.renderSpecialBadge(ctx, cx, cy, size, special, 1.0);
    } else if (this.colorBlindMode) {
      this.renderRuneSymbol(ctx, gemType, cx, cy, size * 0.58);
    }

    ctx.restore();
  }

  /**
   * 💎 각 형태별 크리스탈 각면 컷(Prismatic Facet Cut) 기하학 라인 렌더링
   */
  drawFacetLines(ctx, cx, cy, r, shape) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = 1.0;
    ctx.beginPath();

    switch (shape) {
      case "circle": // 원형 볼 - 돔 패싯
        ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          ctx.moveTo(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5);
          ctx.lineTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9);
        }
        break;

      case "rhombus": // 마름모 - 크로스 패싯
        ctx.moveTo(cx, cy - r * 0.95);
        ctx.lineTo(cx, cy + r * 0.95);
        ctx.moveTo(cx - r * 0.95, cy);
        ctx.lineTo(cx + r * 0.95, cy);
        ctx.rect(cx - r * 0.35, cy - r * 0.35, r * 0.7, r * 0.7);
        break;

      case "heart": // 루비 하트 - 방사형 릿지
        ctx.moveTo(cx, cy - r * 0.15);
        ctx.lineTo(cx, cy + r * 0.75);
        ctx.moveTo(cx, cy - r * 0.15);
        ctx.lineTo(cx - r * 0.6, cy - r * 0.3);
        ctx.moveTo(cx, cy - r * 0.15);
        ctx.lineTo(cx + r * 0.6, cy - r * 0.3);
        break;

      case "triangle": // 삼각형 - 중심 릿지
        ctx.moveTo(cx, cy - r * 0.9);
        ctx.lineTo(cx, cy + r * 0.2);
        ctx.moveTo(cx + r * 0.9, cy + r * 0.85);
        ctx.lineTo(cx, cy + r * 0.2);
        ctx.moveTo(cx - r * 0.9, cy + r * 0.85);
        ctx.lineTo(cx, cy + r * 0.2);
        break;

      case "square": // 입체 크리스탈 큐브 타일 베벨 컷
        const inS = r * 0.58;
        const outS = r * 0.88;
        ctx.strokeRect(cx - inS, cy - inS, inS * 2, inS * 2);
        ctx.moveTo(cx - outS, cy - outS);
        ctx.lineTo(cx - inS, cy - inS);
        ctx.moveTo(cx + outS, cy - outS);
        ctx.lineTo(cx + inS, cy - inS);
        ctx.moveTo(cx - outS, cy + outS);
        ctx.lineTo(cx - inS, cy + inS);
        ctx.moveTo(cx + outS, cy + outS);
        ctx.lineTo(cx + inS, cy + inS);
        break;

      case "star": // 5각 별 - 중심 릿지
        for (let i = 0; i < 5; i++) {
          const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * r * 0.95, cy + Math.sin(a) * r * 0.95);
        }
        break;

      case "hexagon": // 6각형 - 중심 방사선
        for (let i = 0; i < 6; i++) {
          const a = (i * 2 * Math.PI) / 6;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9);
        }
        break;

      case "drop": // 물방울 - 중심 척추선
        ctx.moveTo(cx, cy - r * 0.95);
        ctx.lineTo(cx, cy + r * 0.6);
        break;

      default:
        ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
        break;
    }

    ctx.stroke();
    ctx.restore();
  }

  drawShapePath(ctx, cx, cy, r, shape) {
    ctx.beginPath();
    switch (shape) {
      case "circle": // 원형 볼
        ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
        break;

      case "rhombus": // 마름모 다이아몬드
        ctx.moveTo(cx, cy - r * 0.95);
        ctx.lineTo(cx + r * 0.95, cy);
        ctx.lineTo(cx, cy + r * 0.95);
        ctx.lineTo(cx - r * 0.95, cy);
        ctx.closePath();
        break;

      case "heart": // 루비 하트
        const d = r * 0.75;
        ctx.moveTo(cx, cy + d);
        ctx.bezierCurveTo(cx - d, cy + d * 0.4, cx - d * 1.1, cy - d * 0.7, cx, cy - d * 0.2);
        ctx.bezierCurveTo(cx + d * 1.1, cy - d * 0.7, cx + d, cy + d * 0.4, cx, cy + d);
        ctx.closePath();
        break;

      case "triangle": // 정삼각형
        ctx.moveTo(cx, cy - r * 0.9);
        ctx.lineTo(cx + r * 0.9, cy + r * 0.85);
        ctx.lineTo(cx - r * 0.9, cy + r * 0.85);
        ctx.closePath();
        break;

      case "square": // 둥근 정사각형 타일 (원작 사각형 타일)
        const s = r * 0.88;
        this.drawRoundedRectPath(ctx, cx - s, cy - s, s * 2, s * 2, 4);
        break;

      case "star": // 5각 별
        for (let i = 0; i < 5; i++) {
          const a1 = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const a2 = a1 + Math.PI / 5;
          const x1 = cx + Math.cos(a1) * r * 0.95;
          const y1 = cy + Math.sin(a1) * r * 0.95;
          const x2 = cx + Math.cos(a2) * r * 0.45;
          const y2 = cy + Math.sin(a2) * r * 0.45;
          if (i === 0) ctx.moveTo(x1, y1);
          else ctx.lineTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        break;

      case "drop": // 물방울
        ctx.moveTo(cx, cy - r * 0.95);
        ctx.bezierCurveTo(cx + r * 1.1, cy, cx + r * 0.9, cy + r * 0.9, cx, cy + r * 0.9);
        ctx.bezierCurveTo(cx - r * 0.9, cy + r * 0.9, cx - r * 1.1, cy, cx, cy - r * 0.95);
        ctx.closePath();
        break;

      case "pentagon": // 5각형
        for (let i = 0; i < 5; i++) {
          const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const x = cx + Math.cos(a) * r * 0.9;
          const y = cy + Math.sin(a) * r * 0.9;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;

      case "hexagon": // 6각형
        for (let i = 0; i < 6; i++) {
          const a = (i * 2 * Math.PI) / 6;
          const x = cx + Math.cos(a) * r * 0.9;
          const y = cy + Math.sin(a) * r * 0.9;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;

      case "flower": // 꽃/클로버
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          const px = cx + Math.cos(a) * r * 0.45;
          const py = cy + Math.sin(a) * r * 0.45;
          ctx.arc(px, py, r * 0.45, 0, Math.PI * 2);
        }
        break;
    }
  }

  /**
   * 산산조각 박살 파편 렌더링 (리얼 물리 파편 + 빛나는 Motion Trail) - [초고속 60fps]
   */
  renderShards(ctx) {
    // 1. 파편들이 날아가며 남기는 눈부신 빛의 궤적 (Motion Trail)
    for (const s of this.shards) {
      if (s.history && s.history.length > 1) {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // 외곽 크리스탈 네온 꼬리
        ctx.strokeStyle = s.trailColor || s.color;
        ctx.lineWidth = Math.max(1.8, s.size * 0.85);
        ctx.globalAlpha = s.alpha * 0.55;
        ctx.beginPath();
        ctx.moveTo(s.history[0].x, s.history[0].y);
        for (let j = 1; j < s.history.length; j++) {
          ctx.lineTo(s.history[j].x, s.history[j].y);
        }
        ctx.stroke();

        // 중심 순백 굴절 하이라이트 심선 (유리 단면 섬광 궤적)
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = Math.max(1, s.size * 0.35);
        ctx.globalAlpha = s.alpha * 0.8;
        ctx.beginPath();
        ctx.moveTo(s.history[0].x, s.history[0].y);
        for (let j = 1; j < s.history.length; j++) {
          ctx.lineTo(s.history[j].x, s.history[j].y);
        }
        ctx.stroke();

        ctx.restore();
      }
    }

    // 2. 파편 본체 다각형 (회전하는 크리스탈 조각)
    for (const s of this.shards) {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);

      ctx.fillStyle = s.color;
      ctx.beginPath();
      s.points.forEach((p, idx) => {
        const px = p.x * s.size;
        const py = p.y * s.size;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();

      // 파편 유리 테두리 반짝임
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();
    }
  }

  /**
   * 🎆 테트리스 이펙트 & 행성 폭발 가산 혼합(Additive Blending) 불꽃놀이 렌더러
   * - [초고속 60fps 최적화]: CPU 가우시안 블러(shadowBlur)를 전면 제거하고 GPU 가산 혼합만으로 눈부신 블룸 구현!
   */
  renderFireworksAndCosmicEffects(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // 1. 초신성 코어 플래시 & 십자 광선
    for (const sn of this.supernovaFlashes) {
      const alpha = Math.max(0, sn.life / sn.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;

      const g = ctx.createRadialGradient(sn.x, sn.y, 0, sn.x, sn.y, sn.radius);
      g.addColorStop(0, "#FFFFFF");
      g.addColorStop(0.35, sn.glowColor || "#FFE082");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sn.x, sn.y, sn.radius, 0, Math.PI * 2);
      ctx.fill();

      // 눈부신 십자/방사형 광선(Star Rays)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 1.8;
      const rayLen = sn.radius * 2.5;
      for (let i = 0; i < sn.rays; i++) {
        const a = (i * Math.PI) / (sn.rays / 2);
        ctx.beginPath();
        ctx.moveTo(sn.x - Math.cos(a) * rayLen, sn.y - Math.sin(a) * rayLen);
        ctx.lineTo(sn.x + Math.cos(a) * rayLen, sn.y + Math.sin(a) * rayLen);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. 팽창 충격파 링 (Shockwave Rings)
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.globalAlpha = sw.alpha * 0.85;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = Math.max(1, sw.lineWidth * sw.alpha);
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();

      // 내부 얇은 순백 링
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. 🎆 불꽃놀이 스파크 & 궤적 꼬리 (Firework Sparks with Motion Trails) - [단일 패스 60fps]
    for (const fw of this.fireworks) {
      const alpha = Math.max(0, fw.life / fw.maxLife);
      const shimmer = 0.75 + Math.sin(fw.shimmerPhase) * 0.25;

      ctx.save();

      // [초고속 60fps] 꼬리(Trail) 단일 연결 패스 렌더링
      if (fw.history.length > 1) {
        ctx.lineCap = "round";
        ctx.strokeStyle = fw.color;
        ctx.lineWidth = fw.size * 1.1;
        ctx.globalAlpha = alpha * shimmer * 0.65;

        ctx.beginPath();
        ctx.moveTo(fw.history[0].x, fw.history[0].y);
        for (let j = 1; j < fw.history.length; j++) {
          ctx.lineTo(fw.history[j].x, fw.history[j].y);
        }
        ctx.stroke();
      }

      // 스파크 헤드(불꽃 핵) - 백색 중심 + 네온 외곽 (GPU 가산 혼합)
      ctx.globalAlpha = alpha * shimmer;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(fw.x, fw.y, fw.size * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // 외곽 네온 글로우 헤일로
      ctx.fillStyle = fw.color;
      ctx.beginPath();
      ctx.arc(fw.x, fw.y, fw.size * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 4. 나풀나풀 떨어지는 은하 글리터 가루 (Cosmic Glitter) - [초고속 60fps]
    for (const g of this.cosmicGlitters) {
      const twinkle = 0.6 + Math.sin(performance.now() * 0.012 + g.twinkleRate) * 0.4;
      ctx.save();
      ctx.globalAlpha = g.alpha * twinkle;
      ctx.translate(g.x, g.y);
      ctx.rotate(g.rot);

      ctx.fillStyle = g.color;

      // 4각 십자 다이아몬드 별
      const s = g.size;
      ctx.beginPath();
      ctx.moveTo(0, -s * 2.2);
      ctx.lineTo(s * 0.6, -s * 0.6);
      ctx.lineTo(s * 2.2, 0);
      ctx.lineTo(s * 0.6, s * 0.6);
      ctx.lineTo(0, s * 2.2);
      ctx.lineTo(-s * 0.6, s * 0.6);
      ctx.lineTo(-s * 2.2, 0);
      ctx.lineTo(-s * 0.6, -s * 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // 5. ⚡ 체인 라이트닝 볼트 (Lightning Arcs) - [좁고 날렵한 면도날 선 형태의 전기선]
    for (const lb of this.lightningBolts) {
      const alpha = Math.max(0, lb.life / lb.maxLife);
      const flicker = 0.88 + Math.random() * 0.12;
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // 1) 외곽 일렉트릭 네온 블루 아우라 (두께 약 2.5~3px의 슬림한 네온 선)
      ctx.strokeStyle = lb.color || "#00E5FF";
      ctx.lineWidth = Math.max(1.8, (lb.width || 1.8) * alpha * 1.4);
      ctx.globalAlpha = alpha * flicker * 0.7;
      ctx.beginPath();
      ctx.moveTo(lb.points[0].x, lb.points[0].y);
      for (let j = 1; j < lb.points.length; j++) {
        ctx.lineTo(lb.points[j].x, lb.points[j].y);
      }
      ctx.stroke();

      // 번개 곁가지 외곽 아우라 (초미세 선)
      if (lb.branches && lb.branches.length > 0) {
        ctx.lineWidth = Math.max(1.0, (lb.width || 1.8) * alpha * 0.8);
        for (const br of lb.branches) {
          ctx.beginPath();
          ctx.moveTo(br[0].x, br[0].y);
          for (let k = 1; k < br.length; k++) {
            ctx.lineTo(br[k].x, br[k].y);
          }
          ctx.stroke();
        }
      }

      // 2) 중심 고휘도 순백 전기선 코어 (두께 약 1.0~1.2px의 날카로운 선)
      ctx.strokeStyle = lb.coreColor || "#FFFFFF";
      ctx.lineWidth = Math.max(1.0, (lb.width || 1.8) * alpha * 0.65);
      ctx.globalAlpha = alpha * flicker;
      ctx.beginPath();
      ctx.moveTo(lb.points[0].x, lb.points[0].y);
      for (let j = 1; j < lb.points.length; j++) {
        ctx.lineTo(lb.points[j].x, lb.points[j].y);
      }
      ctx.stroke();

      // 번개 곁가지 순백 코어
      if (lb.branches && lb.branches.length > 0) {
        ctx.lineWidth = 0.8;
        for (const br of lb.branches) {
          ctx.beginPath();
          ctx.moveTo(br[0].x, br[0].y);
          for (let k = 1; k < br.length; k++) {
            ctx.lineTo(br[k].x, br[k].y);
          }
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    ctx.restore();
  }

  renderEffects(ctx) {
    for (const b of this.beams) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = b.alpha;

      // 외곽 네온 레이저 빔 (GPU 가산 혼합)
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.width * 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      // 중심 고휘도 백색 레이저 코어
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = Math.max(1.5, b.width * 0.45);
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      ctx.restore();
    }

    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      if (p.isRipple) {
        ctx.strokeStyle = p.isHint ? "#38BDF8" : "#EF4444";
        ctx.lineWidth = p.isHint ? 3 : 2;
        if (p.isHint) {
          ctx.shadowColor = "#38BDF8";
          ctx.shadowBlur = 12;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.restore();
    }

    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = `900 ${ft.size}px 'Inter', sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.textAlign = "center";
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  renderFeverBanner(ctx) {
    ctx.save();
    const progress = 1.0 - (this.feverBannerTimer / 1.8);
    const scale = Math.max(1.0, 1.8 - progress * 1.5);
    const alpha = this.feverBannerTimer < 0.4 ? (this.feverBannerTimer / 0.4) : 1.0;

    ctx.globalAlpha = alpha;
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(scale, scale);

    ctx.fillStyle = "rgba(9, 13, 22, 0.95)";
    ctx.strokeStyle = "#FF007F";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#FF007F";
    ctx.shadowBlur = 25;

    const bw = 460;
    const bh = 110;
    this.drawRoundedRectPath(ctx, -bw / 2, -bh / 2, bw, bh, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFD700";
    ctx.font = "900 32px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "#FF007F";
    ctx.shadowBlur = 15;
    ctx.fillText("🔥 FEVER TIME! 🔥", 0, -10);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 15px sans-serif";
    ctx.shadowBlur = 0;
    ctx.fillText("십자 방향의 모든 보석 전방향 슈퍼 폭파!", 0, 24);

    ctx.restore();
  }

  renderFooterControls(ctx) {
    const bottomY = this.height - 35;
    ctx.fillStyle = this.isFever ? "#FF80AB" : "#64748B";
    ctx.font = this.isFever ? "bold 13px 'Inter', sans-serif" : "13px 'Inter', sans-serif";
    ctx.textAlign = "left";

    if (this.isFever) {
      ctx.fillText("🔥 [FEVER BURST 발동 중] 십자 방향에 걸리는 모든 보석을 쓸어 담습니다!", 28, bottomY);
    } else {
      ctx.fillText("💎 팁: 💣폭탄(3x3 폭발), ⚡번개(체인 감전), ⏰타임(+5초) 젬을 매칭하면 강력한 특수 효과가 발동됩니다!", 28, bottomY);
    }
  }

  drawRoundedRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  renderRuneSymbol(ctx, gemIdx, cx, cy, size) {
    ctx.save();
    ctx.strokeStyle = "#FFFFFF";
    ctx.fillStyle = "#FFFFFF";
    ctx.lineWidth = 2.2;
    const r = size / 2;

    switch (gemIdx) {
      case 0:
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2); ctx.stroke(); break;
      case 1:
        ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.8); ctx.lineTo(cx + r * 0.8, cy); ctx.lineTo(cx, cy + r * 0.8); ctx.lineTo(cx - r * 0.8, cy); ctx.closePath(); ctx.stroke(); break;
      case 2:
        const d = r * 0.6;
        ctx.beginPath(); ctx.moveTo(cx, cy + d); ctx.bezierCurveTo(cx - d, cy, cx - d, cy - d, cx, cy - d * 0.5); ctx.bezierCurveTo(cx + d, cy - d, cx + d, cy, cx, cy + d); ctx.stroke(); break;
      case 3:
        ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.8); ctx.lineTo(cx + r * 0.8, cy + r * 0.75); ctx.lineTo(cx - r * 0.8, cy + r * 0.75); ctx.closePath(); ctx.stroke(); break;
      case 4:
        ctx.strokeRect(cx - r * 0.6, cy - r * 0.6, r * 1.2, r * 1.2); break;
      case 5:
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const px = cx + Math.cos(a) * r * 0.8; const py = cy + Math.sin(a) * r * 0.8;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.stroke(); break;
      case 6:
        ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.7); ctx.lineTo(cx + r * 0.7, cy); ctx.lineTo(cx, cy + r * 0.7); ctx.stroke(); break;
      case 7:
        ctx.beginPath(); ctx.moveTo(cx - r * 0.6, cy - r * 0.6); ctx.lineTo(cx + r * 0.6, cy + r * 0.6); ctx.moveTo(cx + r * 0.6, cy - r * 0.6); ctx.lineTo(cx - r * 0.6, cy + r * 0.6); ctx.stroke(); break;
      case 8:
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2); ctx.fill(); break;
      case 9:
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2); ctx.stroke(); break;
    }
    ctx.restore();
  }
}

window.PrismCrossEngine = PrismCrossEngine;
