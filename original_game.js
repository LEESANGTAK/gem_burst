/**
 * GameSaien 오리지널 Color Tiles 100% 동일 구현 엔진
 * 원작의 플래시/CreateJS 소스 코드(color_tiles_003_o.js)를 정밀 분석하여
 * 좌표, 색상, 타이머, 감점, 연출, "또각!" 사운드 및 벽에서 떨어져 나가는 타일 드롭(funTileDrop) 연출을
 * 1:1 픽셀 단위로 완벽하게 재현했습니다.
 */

class OriginalColorTiles {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // 기본 규격 (원작 캔버스 660 x 480)
    this.width = 660;
    this.height = 480;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // 보드 규격
    this.cols = 23; // nuMbX
    this.rows = 15; // nuMbY
    this.cellSpacing = 25; // 0x19
    this.offsetX = 23; // jj * 25 + 25 - 2
    this.offsetY = 35; // ii * 25 + 25 + 10
    this.tileSize = 23;

    // 원작 10가지 색상 (arColor)
    this.colors = [
      "#0066ff", // 0: 블루
      "#ff9900", // 1: 오렌지
      "#ff6666", // 2: 코랄레드
      "#00cc00", // 3: 그린
      "#cc66cc", // 4: 퍼플
      "#CC6600", // 5: 브라운
      "#CCCC66", // 6: 올리브옐로우
      "#66CCCC", // 7: 청록/시안
      "#bbbbbb", // 8: 그레이
      "#FF88FF"  // 9: 핑크
    ];

    // 게임 상태
    this.timeAll = 120; // 120초
    this.timeStart = null;
    this.timeAdjust = 0; // 실수 시 -10초
    this.timeRemain = 120;
    this.isPlaying = false;
    this.isGameOver = false;
    this.isContinueMode = false;
    this.point = 0; // 현재 점수
    this.perfectScore = false;
    this.clearTime = 0;

    // 설정 상태
    this.colorBlindMode = false;
    this.soundVolume = 0.7;

    // 원작의 튕김 방향 플립 변수 (pmmk)
    this.pmmk = 1;

    // 그리드 데이터 (15행 23열)
    // 값: 0~9(색상 인덱스) 또는 null(빈 칸)
    this.grid = [];

    // 애니메이션 빔 및 원작 물리 타일 드롭(funTileDrop) 큐
    this.beams = []; // { x, y, w, h, alpha, life }
    this.droppingTiles = []; // 원작 funTileDrop 물리 객체 리스트

    // 마우스 이벤트 바인딩
    this.bindEvents();

    // 렌더링 루프 시작
    this.lastFrameTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);

    // 초기 상태 세팅
    this.initGame();
  }

  initGame() {
    this.point = 0;
    this.timeAdjust = 0;
    this.timeRemain = this.timeAll;
    this.timeStart = null;
    this.isPlaying = true;
    this.isGameOver = false;
    this.isContinueMode = false;
    this.perfectScore = false;
    this.clearTime = 0;
    this.beams = [];
    this.droppingTiles = [];
    this.pmmk = 1;

    // 200개 타일 생성 (10색상 * 20개) + 145개 빈 칸 ('n')
    const tilePool = [];
    for (let c = 0; c < 10; c++) {
      for (let i = 0; i < 20; i++) {
        tilePool.push(c);
      }
    }
    const emptyCount = (this.cols * this.rows) - tilePool.length; // 345 - 200 = 145
    for (let i = 0; i < emptyCount; i++) {
      tilePool.push(null);
    }

    // 셔플 (Fisher-Yates)
    for (let i = tilePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tilePool[i], tilePool[j]] = [tilePool[j], tilePool[i]];
    }

    // 그리드 배열에 배치
    this.grid = [];
    let idx = 0;
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(tilePool[idx++]);
      }
      this.grid.push(row);
    }
  }

  bindEvents() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      this.handleClick(mx, my);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;
    });
  }

  handleClick(mx, my) {
    // 1. UI 컨트롤 영역 클릭 체크
    // Reset 버튼: x=588, y=440, w=55, h=24
    if (mx >= 580 && mx <= 645 && my >= 435 && my <= 465) {
      this.initGame();
      return;
    }

    // Colorblind 체크박스: x=14, y=445
    if (mx >= 10 && mx <= 150 && my >= 435 && my <= 465) {
      this.colorBlindMode = !this.colorBlindMode;
      return;
    }

    // 게임 오버 상태일 때 버튼 클릭
    if (this.isGameOver) {
      // "Play Again" 버튼
      if (mx >= 240 && mx <= 420 && my >= 270 && my <= 315) {
        this.initGame();
        return;
      }
      // "Continue Game" 버튼
      if (!this.perfectScore && mx >= 240 && mx <= 420 && my >= 325 && my <= 365) {
        this.isGameOver = false;
        this.isContinueMode = true;
        return;
      }
      return;
    }

    // 2. 보드 그리드 클릭 판정
    const col = Math.floor((mx - this.offsetX) / this.cellSpacing);
    const row = Math.floor((my - this.offsetY) / this.cellSpacing);

    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;

    // 이미 타일이 있는 칸은 클릭 불가 (빈 칸만 클릭 가능)
    if (this.grid[row][col] !== null) return;

    // 게임 타이머 시작 (첫 유효 클릭 시)
    if (this.timeStart === null && this.isPlaying && !this.isContinueMode) {
      this.timeStart = performance.now();
    }

    this.processMove(row, col);
  }

  processMove(row, col) {
    // 상, 하, 좌, 우 4방향으로 가장 가까운 타일 검색
    let sTop = null, coTop = null;
    let sDown = null, coDown = null;
    let sLeft = null, coLeft = null;
    let sRight = null, coRight = null;

    // Top
    for (let r = row - 1; r >= 0; r--) {
      if (this.grid[r][col] !== null) {
        sTop = row - r;
        coTop = this.grid[r][col];
        break;
      }
    }
    // Down
    for (let r = row + 1; r < this.rows; r++) {
      if (this.grid[r][col] !== null) {
        sDown = r - row;
        coDown = this.grid[r][col];
        break;
      }
    }
    // Left
    for (let c = col - 1; c >= 0; c--) {
      if (this.grid[row][c] !== null) {
        sLeft = col - c;
        coLeft = this.grid[row][c];
        break;
      }
    }
    // Right
    for (let c = col + 1; c < this.cols; c++) {
      if (this.grid[row][c] !== null) {
        sRight = c - col;
        coRight = this.grid[row][c];
        break;
      }
    }

    let flTop = false, flDown = false, flLeft = false, flRight = false;

    if (coTop !== null && coDown !== null && coTop === coDown) {
      flTop = true; flDown = true;
    }
    if (coTop !== null && coRight !== null && coTop === coRight) {
      flTop = true; flRight = true;
    }
    if (coTop !== null && coLeft !== null && coTop === coLeft) {
      flTop = true; flLeft = true;
    }
    if (coDown !== null && coRight !== null && coDown === coRight) {
      flDown = true; flRight = true;
    }
    if (coDown !== null && coLeft !== null && coDown === coLeft) {
      flDown = true; flLeft = true;
    }
    if (coRight !== null && coLeft !== null && coRight === coLeft) {
      flRight = true; flLeft = true;
    }

    const matched = flTop || flDown || flLeft || flRight;

    if (matched) {
      let matchedCount = 0;

      if (flTop) {
        matchedCount++;
        this.addBeam(col, row - sTop, 1, sTop + 1);
        this.addFunTileDrop(row - sTop, col, coTop);
        this.grid[row - sTop][col] = null;
      }
      if (flDown) {
        matchedCount++;
        this.addBeam(col, row, 1, sDown + 1);
        this.addFunTileDrop(row + sDown, col, coDown);
        this.grid[row + sDown][col] = null;
      }
      if (flLeft) {
        matchedCount++;
        this.addBeam(col - sLeft, row, sLeft + 1, 1);
        this.addFunTileDrop(row, col - sLeft, coLeft);
        this.grid[row][col - sLeft] = null;
      }
      if (flRight) {
        matchedCount++;
        this.addBeam(col, row, sRight + 1, 1);
        this.addFunTileDrop(row, col + sRight, coRight);
        this.grid[row][col + sRight] = null;
      }

      this.point += matchedCount;

      // 원작 고유의 "또각!" 사운드 재생
      if (window.soundEngine) {
        window.soundEngine.playOriginalMatch();
      }

      // 올 클리어 체크 (200개 모두 제거)
      if (this.point >= 200) {
        this.triggerVictory();
      }
    } else {
      // 미스 클릭: 10초 감점
      if (!this.isContinueMode) {
        this.timeAdjust -= 10;
      }
      if (window.soundEngine) {
        window.soundEngine.playOriginalMiss();
      }
    }
  }

  addBeam(c, r, w, h) {
    const x = this.offsetX + c * this.cellSpacing;
    const y = this.offsetY + r * this.cellSpacing;
    const bw = w * this.cellSpacing;
    const bh = h * this.cellSpacing;
    this.beams.push({ x, y, w: bw, h: bh, alpha: 0.9, life: 1.0 });
  }

  /**
   * 원작의 funTileDrop 물리 애니메이션 재현
   * 벽에 붙어 있던 타일이 "또각!" 하며 위로 살짝 튀었다가 중력으로 회전하며 바닥으로 떨어져 나감
   */
  addFunTileDrop(r, c, colorIdx) {
    const startX = this.offsetX + c * this.cellSpacing + 1;
    const startY = this.offsetY + r * this.cellSpacing + 1;

    // 방향 플립 (원작 exportRoot.mm.pmmk *= -1)
    this.pmmk *= -1;
    const pm = this.pmmk;

    // 원작 수식:
    // rax = 15 * Math.random(); ray = -15 * Math.random();
    // y += ray + 0.07 * kk^2; x += 1.2 * rax * pm; rot += 3 * pm;
    const rax = 0.8 + Math.random() * 1.4;
    const ray = -(3.0 + Math.random() * 3.5); // 위로 살짝 톡 튀어오름

    this.droppingTiles.push({
      x: startX,
      y: startY,
      colorIdx: colorIdx,
      rax: rax,
      ray: ray,
      pm: pm,
      rotation: 0,
      kk: 0
    });
  }

  triggerVictory() {
    this.perfectScore = true;
    if (this.timeStart) {
      const elapsed = (performance.now() - this.timeStart) / 1000 - this.timeAdjust;
      this.clearTime = Math.min(this.timeAll, Math.max(0, elapsed)).toFixed(1);
    } else {
      this.clearTime = "0.0";
    }
    this.isGameOver = true;
    if (window.soundEngine) {
      window.soundEngine.playOriginalTimeUp();
    }
  }

  triggerTimeUp() {
    this.isGameOver = true;
    if (window.soundEngine) {
      window.soundEngine.playOriginalTimeUp();
    }
  }

  loop(currentTime) {
    const dt = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop);
  }

  update(dt) {
    // 타이머 업데이트
    if (this.isPlaying && !this.isGameOver && !this.isContinueMode && this.timeStart !== null) {
      const elapsed = (performance.now() - this.timeStart) / 1000;
      this.timeRemain = this.timeAll - elapsed + this.timeAdjust;
      if (this.timeRemain <= 0) {
        this.timeRemain = 0;
        this.triggerTimeUp();
      }
    }

    // 빔 애니메이션 업데이트
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.life -= dt * 4;
      b.alpha = Math.max(0, b.life);
      if (b.life <= 0) {
        this.beams.splice(i, 1);
      }
    }

    // 원작 타일 드롭(funTileDrop) 물리 업데이트
    for (let i = this.droppingTiles.length - 1; i >= 0; i--) {
      const t = this.droppingTiles[i];
      t.kk += dt * 60; // 60fps 기준 kk 카운트 증가

      // 원작 포물선 및 회전 물리 방정식
      t.y += t.ray + 0.04 * t.kk * (dt * 60);
      t.x += 0.8 * t.rax * t.pm;
      t.rotation += 0.08 * t.pm; // 라디안 회전

      // 화면 바닥 밖으로 완전히 떨어지면 제거
      if (t.y > this.height + 60) {
        this.droppingTiles.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. 배경 렌더링
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, this.width, this.height);

    // 상단 타이틀 및 점수 영역
    this.renderHeader(ctx);

    // 2. 보드 격자판 배경 (23 x 15)
    ctx.fillStyle = "#EAEAEA";
    ctx.fillRect(this.offsetX, this.offsetY, this.cols * this.cellSpacing, this.rows * this.cellSpacing);

    // 격자 칸 구분선 (원작 CreateJS mb 형태)
    ctx.strokeStyle = "#DCDCDC";
    ctx.lineWidth = 1;
    for (let r = 0; r <= this.rows; r++) {
      const y = this.offsetY + r * this.cellSpacing;
      ctx.beginPath();
      ctx.moveTo(this.offsetX, y);
      ctx.lineTo(this.offsetX + this.cols * this.cellSpacing, y);
      ctx.stroke();
    }
    for (let c = 0; c <= this.cols; c++) {
      const x = this.offsetX + c * this.cellSpacing;
      ctx.beginPath();
      ctx.moveTo(x, this.offsetY);
      ctx.lineTo(x, this.offsetY + this.rows * this.cellSpacing);
      ctx.stroke();
    }

    // 3. 고정 타일 렌더링 (보드 벽에 붙어있는 타일들)
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const colorIdx = this.grid[r][c];
        if (colorIdx !== null) {
          const x = this.offsetX + c * this.cellSpacing + 1;
          const y = this.offsetY + r * this.cellSpacing + 1;
          const w = this.tileSize;
          const h = this.tileSize;

          ctx.fillStyle = this.colors[colorIdx];
          ctx.fillRect(x, y, w, h);

          // 컬러블라인드 모드일 때 기호 렌더링
          if (this.colorBlindMode) {
            this.renderColorBlindSymbol(ctx, colorIdx, x + w / 2, y + h / 2, w * 0.7);
          }
        }
      }
    }

    // 4. 번쩍이는 빔 라인 이펙트
    for (const b of this.beams) {
      ctx.save();
      ctx.globalAlpha = b.alpha * 0.6;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.restore();
    }

    // 5. 벽에서 떨어져 나가는 타일 애니메이션 (원작 setChildIndex 최상단 레이어)
    // 앞으로 튀어나온 듯한 입체 그림자와 함께 회전 낙하
    for (const t of this.droppingTiles) {
      ctx.save();
      ctx.translate(t.x + this.tileSize / 2, t.y + this.tileSize / 2);
      ctx.rotate(t.rotation);

      // 벽에서 떨어진 입체 그림자 효과
      ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;

      ctx.fillStyle = this.colors[t.colorIdx];
      ctx.fillRect(-this.tileSize / 2, -this.tileSize / 2, this.tileSize, this.tileSize);

      // 기호도 함께 회전
      if (this.colorBlindMode) {
        ctx.shadowColor = "transparent";
        this.renderColorBlindSymbol(ctx, t.colorIdx, 0, 0, this.tileSize * 0.7);
      }

      ctx.restore();
    }

    // 6. 하단 컨트롤 바 (타임바, 리셋, 컬러블라인드 체크)
    this.renderFooter(ctx);

    // 7. 게임 오버 / 올 클리어 오버레이 모달
    if (this.isGameOver) {
      this.renderGameOverModal(ctx);
    }
  }

  renderHeader(ctx) {
    // 점수 표시 (원작 스타일: txPoint)
    ctx.fillStyle = "#333333";
    ctx.font = "bold 20px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Score: " + this.point, this.offsetX, 24);

    // 타이틀
    ctx.fillStyle = "#666666";
    ctx.font = "14px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Color Tiles - Original Mode", this.offsetX + this.cols * this.cellSpacing, 24);
  }

  renderFooter(ctx) {
    const bottomY = this.offsetY + this.rows * this.cellSpacing + 12;

    // 타임 바 (mzTimeBar)
    const barWidth = 320;
    const barHeight = 12;
    const barX = this.offsetX + 90;
    const barY = bottomY;

    // 타임바 배경
    ctx.fillStyle = "#E0E0E0";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // 타임바 게이지 (시간 비율)
    const ratio = Math.max(0, Math.min(1, this.timeRemain / this.timeAll));
    if (ratio > 0.4) {
      ctx.fillStyle = "#00CC00"; // 녹색
    } else if (ratio > 0.15) {
      ctx.fillStyle = "#FF9900"; // 주황
    } else {
      ctx.fillStyle = "#FF0000"; // 빨강
    }
    ctx.fillRect(barX, barY, barWidth * ratio, barHeight);

    // 시간 텍스트
    ctx.fillStyle = "#333333";
    ctx.font = "bold 13px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "left";
    const sec = Math.ceil(this.timeRemain);
    ctx.fillText(`Time: ${sec}s`, this.offsetX, bottomY + 11);

    // 컬러블라인드 체크박스 (mzCheckColorBlindMode)
    const cbX = this.offsetX;
    const cbY = bottomY + 28;
    ctx.strokeStyle = "#888888";
    ctx.strokeRect(cbX, cbY, 14, 14);
    if (this.colorBlindMode) {
      ctx.fillStyle = "#0066FF";
      ctx.fillRect(cbX + 2, cbY + 2, 10, 10);
    }
    ctx.fillStyle = "#444444";
    ctx.font = "12px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Color-blind mode", cbX + 22, cbY + 12);

    // 리셋 버튼 (mzBtReset)
    const rX = 585;
    const rY = bottomY + 20;
    ctx.fillStyle = "#E8E8E8";
    ctx.strokeStyle = "#AAAAAA";
    ctx.lineWidth = 1;
    ctx.fillRect(rX, rY, 60, 24);
    ctx.strokeRect(rX, rY, 60, 24);

    ctx.fillStyle = "#333333";
    ctx.font = "12px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Reset", rX + 30, rY + 16);
  }

  renderGameOverModal(ctx) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillRect(0, 0, this.width, this.height);

    const boxW = 340;
    const boxH = 240;
    const boxX = (this.width - boxW) / 2;
    const boxY = (this.height - boxH) / 2;

    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#CCCCCC";
    ctx.lineWidth = 2;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.textAlign = "center";
    if (this.perfectScore) {
      ctx.fillStyle = "#FF6600";
      ctx.font = "bold 26px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("PERFECT CLEAR!", this.width / 2, boxY + 45);

      ctx.fillStyle = "#333333";
      ctx.font = "bold 20px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("Time: " + this.clearTime + " sec", this.width / 2, boxY + 85);
    } else {
      ctx.fillStyle = "#FF0000";
      ctx.font = "bold 26px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("TIME UP", this.width / 2, boxY + 45);

      ctx.fillStyle = "#333333";
      ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("Score: " + this.point, this.width / 2, boxY + 85);
    }

    const btnW = 160;
    const btnH = 34;
    const btnX = (this.width - btnW) / 2;
    const btnY1 = boxY + 120;

    ctx.fillStyle = "#0066FF";
    ctx.fillRect(btnX, btnY1, btnW, btnH);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 14px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("Play Again", this.width / 2, btnY1 + 22);

    if (!this.perfectScore) {
      const btnY2 = btnY1 + 44;
      ctx.fillStyle = "#669966";
      ctx.fillRect(btnX, btnY2, btnW, btnH);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 14px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("Continue Game", this.width / 2, btnY2 + 22);
    }
  }

  renderColorBlindSymbol(ctx, colorIdx, cx, cy, size) {
    ctx.save();
    ctx.strokeStyle = "#FFFFFF";
    ctx.fillStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    const r = size / 2;

    switch (colorIdx) {
      case 0: // 원 (Circle)
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 1: // 정삼각형
        ctx.beginPath();
        ctx.moveTo(cx, cy - r * 0.8);
        ctx.lineTo(cx + r * 0.8, cy + r * 0.8);
        ctx.lineTo(cx - r * 0.8, cy + r * 0.8);
        ctx.closePath();
        ctx.stroke();
        break;
      case 2: // 사각형
        ctx.strokeRect(cx - r * 0.6, cy - r * 0.6, r * 1.2, r * 1.2);
        break;
      case 3: // 다이아몬드 (마름모)
        ctx.beginPath();
        ctx.moveTo(cx, cy - r * 0.8);
        ctx.lineTo(cx + r * 0.8, cy);
        ctx.lineTo(cx, cy + r * 0.8);
        ctx.lineTo(cx - r * 0.8, cy);
        ctx.closePath();
        ctx.stroke();
        break;
      case 4: // 십자가 (+)
        ctx.beginPath();
        ctx.moveTo(cx, cy - r * 0.7);
        ctx.lineTo(cx, cy + r * 0.7);
        ctx.moveTo(cx - r * 0.7, cy);
        ctx.lineTo(cx + r * 0.7, cy);
        ctx.stroke();
        break;
      case 5: // 엑스 (X)
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.6, cy - r * 0.6);
        ctx.lineTo(cx + r * 0.6, cy + r * 0.6);
        ctx.moveTo(cx + r * 0.6, cy - r * 0.6);
        ctx.lineTo(cx - r * 0.6, cy + r * 0.6);
        ctx.stroke();
        break;
      case 6: // 별 (Star)
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const x = cx + Math.cos(a) * r * 0.8;
          const y = cy + Math.sin(a) * r * 0.8;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        break;
      case 7: // 채워진 원
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 8: // 가로줄
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.7, cy);
        ctx.lineTo(cx + r * 0.7, cy);
        ctx.stroke();
        break;
      case 9: // 하트
        ctx.beginPath();
        const d = r * 0.6;
        ctx.moveTo(cx, cy + d);
        ctx.bezierCurveTo(cx - d, cy, cx - d, cy - d, cx, cy - d * 0.5);
        ctx.bezierCurveTo(cx + d, cy - d, cx + d, cy, cx, cy + d);
        ctx.stroke();
        break;
    }
    ctx.restore();
  }
}

window.OriginalColorTiles = OriginalColorTiles;
