/**
 * Prism Cross: Gem Burst 메인 컨트롤러
 */

let gameEngine = null;

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  if (canvas && window.PrismCrossEngine) {
    gameEngine = new window.PrismCrossEngine(canvas);
  }

  window.onGameEnd = (report) => {
    showResultModal(report);
  };
});

function switchMainTab(tabName) {
  document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.game-view').forEach(view => view.classList.remove('active'));

  if (tabName === 'game') {
    document.getElementById('tabGame').classList.add('active');
    document.getElementById('viewGame').classList.add('active');
  } else if (tabName === 'howto') {
    document.getElementById('tabHowTo').classList.add('active');
    document.getElementById('viewHowTo').classList.add('active');
  } else if (tabName === 'legal') {
    document.getElementById('tabLegal').classList.add('active');
    document.getElementById('viewLegal').classList.add('active');
  }
}

function setGameMode(mode) {
  if (!gameEngine) return;

  document.querySelectorAll('.submode-btn').forEach(btn => btn.classList.remove('active'));
  const targetBtn = document.getElementById('submode' + mode.charAt(0).toUpperCase() + mode.slice(1));
  if (targetBtn) {
    targetBtn.classList.add('active');
  }

  // Zen 모드일 때만 되돌리기(Undo) 버튼 표시
  const undoBtn = document.getElementById('btnUndo');
  if (undoBtn) {
    undoBtn.style.display = mode === 'zen' ? 'flex' : 'none';
  }

  // 특수/아케이드 모드일 때만 피버 안내 배너 표시
  const feverBanner = document.getElementById('feverGuideBanner');
  if (feverBanner) {
    feverBanner.style.display = (mode === 'arcade' || mode === 'special') ? 'flex' : 'none';
  }

  gameEngine.setMode(mode);
}

function toggleSmartGuide() {
  if (!gameEngine) return;
  gameEngine.smartGuide = !gameEngine.smartGuide;
  const btn = document.getElementById('btnSmartGuide');
  if (btn) {
    btn.classList.toggle('active', gameEngine.smartGuide);
  }
}

function toggleHoverPreview() {
  if (!gameEngine) return;
  gameEngine.hoverPreview = !gameEngine.hoverPreview;
  const btn = document.getElementById('btnHoverPreview');
  if (btn) {
    btn.classList.toggle('active', gameEngine.hoverPreview);
  }
}

function toggleColorBlind() {
  if (!gameEngine) return;
  gameEngine.colorBlindMode = !gameEngine.colorBlindMode;
  const btn = document.getElementById('btnColorBlind');
  if (btn) {
    btn.classList.toggle('active', gameEngine.colorBlindMode);
  }
}

function triggerHint() {
  if (gameEngine) {
    gameEngine.hint();
  }
}

function triggerShuffle() {
  if (gameEngine) {
    gameEngine.shuffleRemaining();
  }
}

function triggerUndo() {
  if (gameEngine) {
    gameEngine.undo();
  }
}

function restartGame() {
  if (gameEngine) {
    gameEngine.startNewGame();
  }
}

function showResultModal(report) {
  const modal = document.getElementById('resultModal');
  const header = document.getElementById('modalHeader');
  const title = document.getElementById('modalTitle');
  const subtitle = document.getElementById('modalSubtitle');
  const score = document.getElementById('modalScore');
  const statTime = document.getElementById('statTime');
  const statMaxCombo = document.getElementById('statMaxCombo');
  const statAccuracy = document.getElementById('statAccuracy');
  const statAPM = document.getElementById('statAPM');

  if (!modal) return;

  if (report.isVictory) {
    header.className = 'modal-header victory';
    title.innerText = 'PERFECT CLEAR!';
    subtitle.innerText = `모든 보석을 완벽하게 소거했습니다! (클리어율 ${report.clearRate}%)`;
  } else {
    header.className = 'modal-header timeup';
    title.innerText = 'TIME UP';
    subtitle.innerText = `제한 시간이 종료되었습니다. (${report.gemsCleared}/${report.totalGems}개 소거)`;
  }

  score.innerText = `${report.score.toLocaleString()} PTS`;
  statTime.innerText = `${report.time}s`;
  statMaxCombo.innerText = `${report.maxCombo}x`;
  statAccuracy.innerText = `${report.accuracy}%`;
  statAPM.innerText = `${report.apm}`;

  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('resultModal');
  if (modal) {
    modal.classList.remove('active');
  }
}
