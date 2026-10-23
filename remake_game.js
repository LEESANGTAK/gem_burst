/**
 * Prism Cross: Gem Burst 게임 엔진 (Ultimate Edition)
 * - 캔디크러시 스타일의 다채로운 10종 기하학 보석 실루엣 (원, 하트, 별, 다이아몬드, 꽃 등)
 * - 유리/크리스탈이 산산조각 박살나 쏟아지는 리얼 파편 물리 엔진 (Shatter Physics)
 * - 특수 기믹 보석 (폭탄 젬, 레인보우 와일드, 라이트닝, 타임 젬)
 * - 슈팅 게임처럼 쾌감 넘치는 피버 모드 & 콤보 시스템
 */

class PrismCrossEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.width = 800;
    this.height = 600;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // 모드 설정 ('arcade', 'special', 'zen', 'classic', 'mini')
    this.mode = 'special'; // 기본값을 화려한 특수 젬 모드로!

    this.modesConfig = {
      special: { cols: 23, rows: 15, numGems: 10, gemsPerType: 20, timeLimit: 120, cellSpacing: 26, hasSpecialGems: true },
      arcade: { cols: 23, rows: 15, numGems: 10, gemsPerType: 20, timeLimit: 120, cellSpacing: 26, hasSpecialGems: false },
      classic: { cols: 23, rows: 15, numGems: 10, gemsPerType: 20, timeLimit: 120, cellSpacing: 26, hasSpecialGems: false },
      zen: { cols: 23, rows: 15, numGems: 10, gemsPerType: 20, timeLimit: 0, cellSpacing: 26, hasSpecialGems: true },
      mini: { cols: 15, rows: 10, numGems: 6, gemsPerType: 15, timeLimit: 60, cellSpacing: 36, hasSpecialGems: true }
    };

    // 10종 프리즘 캔디/보석 고유 실루엣 & 컬러 스펙
    this.gemSpecs = [
      { name: "사파이어 오브", color: "#1E88E5", dark: "#0D47A1", light: "#90CAF9", shape: "circle" }, // 원형
      { name: "토파즈 다이아", color: "#FB8C00", dark: "#E65100", light: "#FFE0B2", shape: "rhombus" }, // 마름모
      { name: "루비 하트", color: "#E53935", dark: "#B71C1C", light: "#FFCDD2", shape: "heart" }, // 하트
      { name: "시트린 트라이", color: "#FDD835", dark: "#F57F17", light: "#FFF9C4", shape: "triangle" }, // 삼각형
      { name: "에메랄드 큐브", color: "#43A047", dark: "#1B5E20", light: "#C8E6C9", shape: "square" }, // 정사각형
      { name: "다이아 스타", color: "#ECEFF1", dark: "#78909C", light: "#FFFFFF", shape: "star" }, // 5각 별
      { name: "아쿠아 드롭", color: "#00ACC1", dark: "#006064", light: "#B2EBF2", shape: "drop" }, // 물방울
      { name: "아메 펜타곤", color: "#8E24AA", dark: "#4A148C", light: "#E1BEE7", shape: "pentagon" }, // 5각형
      { name: "페리 헥사곤", color: "#7CB342", dark: "#33691E", light: "#DCEDC8", shape: "hexagon" }, // 6각형
      { name: "로즈 클로버", color: "#D81B60", dark: "#880E4F", light: "#F8BBD0", shape: "flower" } // 꽃/클로버
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
    this.gemSize = this.cellSpacing - 3;
    this.timeLimit = cfg.timeLimit;
    this.timeRemain = cfg.timeLimit;

    const boardW = this.cols * this.cellSpacing;
    const boardH = this.rows * this.cellSpacing;
    this.offsetX = Math.floor((this.width - boardW) / 2);
    this.offsetY = Math.floor((this.height - boardH) / 2) + 20;

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
    // 특수 보석 타입: 'bomb'(십자폭탄), 'wild'(무지개와일드), 'lightning'(번개), 'time'(+5초)
    const pool = [];
    for (let c = 0; c < cfg.numGems; c++) {
      for (let i = 0; i < cfg.gemsPerType; i++) {
        let special = null;
        if (cfg.hasSpecialGems) {
          const rand = Math.random();
          if (rand < 0.03) special = 'bomb';
          else if (rand < 0.05) special = 'wild';
          else if (rand < 0.07) special = 'lightning';
          else if (rand < 0.09) special = 'time';
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

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const p = getPos(touch);
        this.handleMouseMove(p.x, p.y);
        this.handleClick(p.x, p.y);
      }
    }, { passive: false });
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

    // 일반 판정 (와일드 젬 포함)
    const dirs = [top, down, left, right].filter(x => x !== null);
    const matchedGems = [];

    // 와일드 젬이 포함되어 있는지 확인
    const hasWild = dirs.some(d => d.data.special === 'wild');

    if (hasWild && dirs.length >= 2) {
      // 와일드가 있으면 걸린 모든 보석이 매칭 성공!
      matchedGems.push(...dirs);
    } else {
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

      scan.matchedGems.forEach(item => {
        toRemove.add(`${item.r},${item.c}`);
        if (item.data.special === 'bomb') triggeredBomb = true;
        if (item.data.special === 'lightning') triggeredLightning = true;
        if (item.data.special === 'time') triggeredTime = true;
      });

      // 💣 십자 폭탄 젬 발동: 해당 행(row)과 열(col) 전체의 모든 보석을 소거!
      if (triggeredBomb) {
        for (let c = 0; c < this.cols; c++) {
          if (this.grid[row][c] !== null) toRemove.add(`${row},${c}`);
        }
        for (let r = 0; r < this.rows; r++) {
          if (this.grid[r][col] !== null) toRemove.add(`${r},${col}`);
        }
        if (window.soundEngine) window.soundEngine.playBombExplosion();
        this.screenShake = 18;
      }

      // ⚡ 라이트닝 젬 발동: 무작위 보석 4개 추가 저격
      if (triggeredLightning) {
        let added = 0;
        for (let r = 0; r < this.rows && added < 4; r++) {
          for (let c = 0; c < this.cols && added < 4; c++) {
            if (this.grid[r][c] !== null && !toRemove.has(`${r},${c}`)) {
              toRemove.add(`${r},${c}`);
              added++;
            }
          }
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
        this.addFloatingText(cx, cy, `💣 CROSS BOMB!! +${earnedScore}`, "#FFD700", 22);
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

      // 피버 게이지 충전
      if (!this.isFever && (this.mode === 'arcade' || this.mode === 'special')) {
        this.feverGauge = Math.min(100, this.feverGauge + count * 6 + this.combo * 2);
        if (this.feverGauge >= 100) {
          this.activateFever();
        }
      }

      // 레이저 빔 연결
      scan.matchedGems.forEach(item => {
        this.createLaserBeam(row, col, item.r, item.c, item.data.type);
      });

      // 산산조각 박살 파편(Shatter Physics) 방출 및 보드에서 소거
      toRemove.forEach(key => {
        const [rStr, cStr] = key.split(',');
        const r = parseInt(rStr, 10);
        const c = parseInt(cStr, 10);
        const gemData = this.grid[r][c];
        if (gemData) {
          this.shatterGemIntoPieces(r, c, gemData.type);
          this.grid[r][c] = null;
        }
      });

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
      width: this.isFever ? 10 : 6,
      life: 0.3
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

    // 10~14개의 다각형/삼각형 크리스탈 파편 생성
    const shardCount = 10 + Math.floor(Math.random() * 5);
    for (let i = 0; i < shardCount; i++) {
      const angle = (i / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = 100 + Math.random() * 180;
      
      this.shards.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120, // 위로 솟구쳤다가 떨어지는 초기 상승력
        rotation: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 16,
        size: 4 + Math.random() * 6,
        points: this.generateShardPoly(), // 불규칙한 다각형 파편 꼭짓점
        color: i % 3 === 0 ? spec.light : (i % 3 === 1 ? spec.color : spec.dark),
        alpha: 1.0,
        life: 1.0 + Math.random() * 0.4
      });
    }

    // 미세 크리스탈 스파크 가루
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 80;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 2,
        color: "#FFFFFF",
        rot: 0,
        vrot: 0,
        alpha: 1.0,
        life: 0.3
      });
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
      s.vy += 1200 * dt; // 강한 중력 낙하
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rotation += s.vrot * dt;
      s.alpha = Math.max(0, s.life / 1.2);
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
  }

  render() {
    const ctx = this.ctx;
    ctx.save();

    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    ctx.clearRect(0, 0, this.width, this.height);

    // 1. 다크 네온 배경
    this.renderModernBackground(ctx);

    // 2. 상단 HUD
    this.renderHUD(ctx);

    // 3. 보석 격자판 보드
    this.renderBoard(ctx);

    // 4. 스마트 레이저 조준선
    if (this.smartGuide && this.hoverCell) {
      this.renderCrosshairGuide(ctx);
    }

    // 5. 캔디크러시 스타일 다채로운 모양의 보석(Gems) 렌더링
    this.renderGems(ctx);

    // 6. 산산조각 박살 파편(Shards) 물리 렌더링
    this.renderShards(ctx);

    // 7. 레이저 빔 및 특수효과
    this.renderEffects(ctx);

    // 8. 피버 진입 초대형 배너
    if (this.feverBannerTimer > 0) {
      this.renderFeverBanner(ctx);
    }

    // 9. 하단 팁
    this.renderFooterControls(ctx);

    ctx.restore();
  }

  renderModernBackground(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, "#090D16");
    grad.addColorStop(1, "#020408");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    for (let x = 12; x < this.width; x += 32) {
      for (let y = 12; y < this.height; y += 32) {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    if (this.isFever) {
      const pulse = 0.5 + Math.sin(performance.now() * 0.008) * 0.5;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 0, 127, ${0.4 + pulse * 0.4})`;
      ctx.lineWidth = 10;
      ctx.shadowColor = "#FF007F";
      ctx.shadowBlur = 20;
      ctx.strokeRect(5, 5, this.width - 10, this.height - 10);
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
      special: "SPECIAL GEMS (BOMBS & WILDS)",
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
    if (this.mode === 'arcade' || this.mode === 'special') {
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
        fgGrad.addColorStop(1, "#EC4899");
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

    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = this.isFever ? "rgba(255, 0, 127, 0.5)" : "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = this.isFever ? 2 : 1;
    ctx.fillRect(this.offsetX, this.offsetY, boardW, boardH);
    ctx.strokeRect(this.offsetX, this.offsetY, boardW, boardH);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
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

    const boardW = this.cols * this.cellSpacing;
    const boardH = this.rows * this.cellSpacing;

    if (this.isFever) {
      ctx.save();
      ctx.strokeStyle = "#FF007F";
      ctx.shadowColor = "#FF007F";
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(this.offsetX, cy);
      ctx.lineTo(this.offsetX + boardW, cy);
      ctx.moveTo(cx, this.offsetY);
      ctx.lineTo(cx, this.offsetY + boardH);
      ctx.stroke();

      ctx.strokeStyle = "#FFE600";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#FFE600";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("🔥 FEVER BURST", cx + 14, cy - 8);

      scan.matchedGems.forEach(item => {
        const tx = this.offsetX + item.c * this.cellSpacing + this.cellSpacing / 2;
        const ty = this.offsetY + item.r * this.cellSpacing + this.cellSpacing / 2;
        ctx.strokeStyle = "#FFE600";
        ctx.shadowColor = "#FF007F";
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(tx - this.gemSize / 2 - 2, ty - this.gemSize / 2 - 2, this.gemSize + 4, this.gemSize + 4);
      });
      ctx.restore();
      return;
    }

    const lineColor = canMatch ? "rgba(52, 211, 153, 0.45)" : "rgba(255, 255, 255, 0.15)";
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(this.offsetX, cy);
    ctx.lineTo(this.offsetX + boardW, cy);
    ctx.moveTo(cx, this.offsetY);
    ctx.lineTo(cx, this.offsetY + boardH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = canMatch ? "#34D399" : "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.stroke();

    if (canMatch && this.hoverPreview) {
      scan.matchedGems.forEach(item => {
        const tx = this.offsetX + item.c * this.cellSpacing + this.cellSpacing / 2;
        const ty = this.offsetY + item.r * this.cellSpacing + this.cellSpacing / 2;
        ctx.save();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#FFFFFF";
        ctx.shadowBlur = 10;
        ctx.strokeRect(tx - this.gemSize / 2 - 2, ty - this.gemSize / 2 - 2, this.gemSize + 4, this.gemSize + 4);
        ctx.restore();
      });
    }
  }

  /**
   * 캔디크러시 스타일의 다채로운 10종 기하학 보석 렌더링
   */
  renderGems(ctx) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (cell !== null) {
          const cx = this.offsetX + c * this.cellSpacing + this.cellSpacing / 2;
          const cy = this.offsetY + r * this.cellSpacing + this.cellSpacing / 2;
          this.drawCandyGem(ctx, cx, cy, this.gemSize, cell.type, cell.special);
        }
      }
    }
  }

  drawCandyGem(ctx, cx, cy, size, gemType, special) {
    const spec = this.gemSpecs[gemType];
    const r = size / 2;

    ctx.save();

    // 1. 드롭 섀도우
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;

    // 그라데이션 베이스
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 2, cx, cy, r * 1.2);
    grad.addColorStop(0, spec.light);
    grad.addColorStop(0.5, spec.color);
    grad.addColorStop(1, spec.dark);
    ctx.fillStyle = grad;

    // 2. 고유 형태(Shape) 패스 그리기
    this.drawShapePath(ctx, cx, cy, r, spec.shape);
    ctx.fill();

    ctx.shadowColor = "transparent";

    // 3. 베벨 테두리 선
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1.5;
    this.drawShapePath(ctx, cx, cy, r, spec.shape);
    ctx.stroke();

    // 4. 상단 글라스 반사 하이라이트 글레어
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.2, cy - r * 0.35, r * 0.4, r * 0.2, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // 5. 특수 보석 아이콘 표시 (💣 폭탄, 🌈 와일드, ⚡ 번개, ⏰ 타임)
    if (special) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 6;
      ctx.font = `bold ${Math.floor(size * 0.65)}px sans-serif`;

      let icon = "";
      if (special === 'bomb') icon = "💣";
      else if (special === 'wild') icon = "🌈";
      else if (special === 'lightning') icon = "⚡";
      else if (special === 'time') icon = "⏰";

      ctx.fillText(icon, cx, cy);
    } else if (this.colorBlindMode) {
      // 접근성 모드 심볼
      this.renderRuneSymbol(ctx, gemType, cx, cy, size * 0.6);
    }

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

      case "square": // 둥근 정사각형
        const s = r * 0.8;
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
   * 산산조각 박살 파편 렌더링 (리얼 물리 파편)
   */
  renderShards(ctx) {
    for (const s of this.shards) {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);

      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 6;

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
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  }

  renderEffects(ctx) {
    for (const b of this.beams) {
      ctx.save();
      ctx.globalAlpha = b.alpha;
      ctx.strokeStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 15;
      ctx.lineWidth = b.width;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
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
      ctx.fillText("💎 팁: 💣폭탄, 🌈와일드, ⚡번개, ⏰타임 젬을 매칭하면 특수 능력이 발동됩니다!", 28, bottomY);
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
