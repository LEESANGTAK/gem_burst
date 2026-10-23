/**
 * Prism Cross: Gem Burst 메인 컨트롤러 (Scene & Option Manager)
 */

let gameEngine = null;
let currentLanguage = 'ko';

const I18N = {
  ko: {
    menuPlay: "게임 시작 (Play)",
    menuPlaySub: "6가지 다채로운 모드 선택 및 도전",
    menuOptions: "환경 설정 (Options)",
    menuOptionsSub: "언어, 사운드 BGM/SFX, 가이드 조준선",
    menuHowTo: "게임 룰 & 공략 (How to Play)",
    menuHowToSub: "십자 매칭 규칙과 콤보 비법",
    modeModalTitle: "🎮 게임 모드 선택 (Game Modes)",
    modeModalSub: "플레이하고 싶은 퍼즐 모드를 선택하세요.",
    settingsTitle: "⚙️ 환경 설정 (Options)",
    settingsSub: "언어, 사운드, 조작 가이드를 취향에 맞게 설정하세요.",
    optLanguage: "🌐 언어 설정 (Language)",
    optSound: "🔊 사운드 설정 (Sound & Music)",
    optBGM: "🎵 배경음 (BGM)",
    optSFX: "🔊 효과음 (SFX)",
    optGuides: "🎯 게임 가이드 및 연출",
    optSmartGuide: "🎯 스마트 레이저 조준선",
    optHoverPreview: "✨ 젬 매칭 프리뷰",
    optColorBlind: "👁️ 크리스탈 룬 (접근성 기호)",
    optScreenShake: "📳 화면 흔들림 효과 (Screen Shake)"
  },
  en: {
    menuPlay: "Play Game",
    menuPlaySub: "Choose from 6 unique game modes",
    menuOptions: "Settings",
    menuOptionsSub: "Language, Sound BGM/SFX, Guide Laser",
    menuHowTo: "How to Play",
    menuHowToSub: "Cross-matching rules & combo mastery",
    modeModalTitle: "🎮 Select Game Mode",
    modeModalSub: "Select the puzzle mode you want to play.",
    settingsTitle: "⚙️ Settings & Options",
    settingsSub: "Customize language, sound, and visual guides.",
    optLanguage: "🌐 Language",
    optSound: "🔊 Sound & Music",
    optBGM: "🎵 Music (BGM)",
    optSFX: "🔊 Sound FX",
    optGuides: "🎯 Guides & Visual Effects",
    optSmartGuide: "🎯 Smart Laser Crosshair",
    optHoverPreview: "✨ Gem Matching Preview",
    optColorBlind: "👁️ Crystal Runes (Accessibility)",
    optScreenShake: "📳 Screen Shake Impact"
  }
};

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  if (canvas && window.PrismCrossEngine) {
    gameEngine = new window.PrismCrossEngine(canvas);
  }

  loadSettings();

  window.onGameEnd = (report) => {
    showResultModal(report);
  };
});

function switchMainTab(tabName) {
  document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.game-view').forEach(view => view.classList.remove('active'));

  const viewIdMap = {
    menu: 'viewMenu',
    game: 'viewGame',
    howto: 'viewHowTo',
    legal: 'viewLegal'
  };
  const tabIdMap = {
    menu: 'tabMenu',
    game: 'tabGame',
    howto: 'tabHowTo',
    legal: 'tabLegal'
  };

  const key = tabName.toLowerCase();
  const targetViewId = viewIdMap[key] || ('view' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
  const targetTabId = tabIdMap[key] || ('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));

  const tabBtn = document.getElementById(targetTabId);
  if (tabBtn) {
    tabBtn.classList.add('active');
  }

  const targetView = document.getElementById(targetViewId);
  if (targetView) {
    targetView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 게임 화면 진입 시 BGM 자동 재생 (사용자 인터랙션 후)
  if (key === 'game' && window.soundEngine) {
    window.soundEngine.startBGM();
  }
}

function openModeSelectModal() {
  const modal = document.getElementById('modeSelectModal');
  if (modal) modal.classList.add('active');
}

function closeModeSelectModal() {
  const modal = document.getElementById('modeSelectModal');
  if (modal) modal.classList.remove('active');
}

function selectAndStartMode(mode) {
  closeModeSelectModal();
  switchMainTab('game');
  setGameMode(mode);
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

  // 피버 안내 배너 표시
  const feverBanner = document.getElementById('feverGuideBanner');
  if (feverBanner) {
    feverBanner.style.display = (mode === 'arcade' || mode === 'special' || mode === 'mega') ? 'flex' : 'none';
  }

  gameEngine.setMode(mode);
}

function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.add('active');
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.remove('active');
}

function setLanguage(lang) {
  currentLanguage = lang;
  document.getElementById('btnLangKo').classList.toggle('active', lang === 'ko');
  document.getElementById('btnLangEn').classList.toggle('active', lang === 'en');

  const dict = I18N[lang] || I18N.ko;
  for (const key in dict) {
    const el = document.getElementById('txt' + key.charAt(0).toUpperCase() + key.slice(1));
    if (el) el.innerText = dict[key];
  }

  saveSettings();
}

function onBGMVolumeChange(val) {
  const num = parseInt(val, 10);
  document.getElementById('bgmVolText').innerText = `${num}%`;
  if (window.soundEngine) {
    window.soundEngine.setBGMVolume(num / 100);
    if (num > 0 && !window.soundEngine.isBGMPlaying) {
      window.soundEngine.startBGM();
    }
  }
  saveSettings();
}

function onSFXVolumeChange(val) {
  const num = parseInt(val, 10);
  document.getElementById('sfxVolText').innerText = `${num}%`;
  if (window.soundEngine) {
    window.soundEngine.setSFXVolume(num / 100);
  }
  saveSettings();
}

function onSettingToggle(key, val) {
  if (!gameEngine) return;

  if (key === 'smartGuide') {
    gameEngine.smartGuide = val;
    const btn = document.getElementById('btnSmartGuide');
    if (btn) btn.classList.toggle('active', val);
  } else if (key === 'hoverPreview') {
    gameEngine.hoverPreview = val;
    const btn = document.getElementById('btnHoverPreview');
    if (btn) btn.classList.toggle('active', val);
  } else if (key === 'colorBlind') {
    gameEngine.colorBlindMode = val;
    const btn = document.getElementById('btnColorBlind');
    if (btn) btn.classList.toggle('active', val);
  } else if (key === 'screenShake') {
    gameEngine.screenShakeEnabled = val;
  }

  saveSettings();
}

function saveSettings() {
  const settings = {
    lang: currentLanguage,
    bgmVol: document.getElementById('bgmVolumeSlider') ? document.getElementById('bgmVolumeSlider').value : 50,
    sfxVol: document.getElementById('sfxVolumeSlider') ? document.getElementById('sfxVolumeSlider').value : 80,
    smartGuide: document.getElementById('chkSmartGuide') ? document.getElementById('chkSmartGuide').checked : true,
    hoverPreview: document.getElementById('chkHoverPreview') ? document.getElementById('chkHoverPreview').checked : true,
    colorBlind: document.getElementById('chkColorBlind') ? document.getElementById('chkColorBlind').checked : false,
    screenShake: document.getElementById('chkScreenShake') ? document.getElementById('chkScreenShake').checked : true
  };
  try {
    localStorage.setItem('prism_cross_settings', JSON.stringify(settings));
  } catch (e) {}
}

function loadSettings() {
  try {
    const raw = localStorage.getItem('prism_cross_settings');
    if (!raw) return;
    const s = JSON.parse(raw);

    if (s.lang) setLanguage(s.lang);
    if (s.bgmVol !== undefined) {
      const slider = document.getElementById('bgmVolumeSlider');
      if (slider) {
        slider.value = s.bgmVol;
        onBGMVolumeChange(s.bgmVol);
      }
    }
    if (s.sfxVol !== undefined) {
      const slider = document.getElementById('sfxVolumeSlider');
      if (slider) {
        slider.value = s.sfxVol;
        onSFXVolumeChange(s.sfxVol);
      }
    }
    if (s.smartGuide !== undefined) {
      const chk = document.getElementById('chkSmartGuide');
      if (chk) { chk.checked = s.smartGuide; onSettingToggle('smartGuide', s.smartGuide); }
    }
    if (s.hoverPreview !== undefined) {
      const chk = document.getElementById('chkHoverPreview');
      if (chk) { chk.checked = s.hoverPreview; onSettingToggle('hoverPreview', s.hoverPreview); }
    }
    if (s.colorBlind !== undefined) {
      const chk = document.getElementById('chkColorBlind');
      if (chk) { chk.checked = s.colorBlind; onSettingToggle('colorBlind', s.colorBlind); }
    }
    if (s.screenShake !== undefined) {
      const chk = document.getElementById('chkScreenShake');
      if (chk) { chk.checked = s.screenShake; onSettingToggle('screenShake', s.screenShake); }
    }
  } catch (e) {}
}

function toggleSmartGuide() {
  if (!gameEngine) return;
  const next = !gameEngine.smartGuide;
  onSettingToggle('smartGuide', next);
  const chk = document.getElementById('chkSmartGuide');
  if (chk) chk.checked = next;
}

function toggleHoverPreview() {
  if (!gameEngine) return;
  const next = !gameEngine.hoverPreview;
  onSettingToggle('hoverPreview', next);
  const chk = document.getElementById('chkHoverPreview');
  if (chk) chk.checked = next;
}

function toggleColorBlind() {
  if (!gameEngine) return;
  const next = !gameEngine.colorBlindMode;
  onSettingToggle('colorBlind', next);
  const chk = document.getElementById('chkColorBlind');
  if (chk) chk.checked = next;
}

function triggerHint() {
  if (gameEngine) gameEngine.hint();
}

function triggerShuffle() {
  if (gameEngine) gameEngine.shuffleRemaining();
}

function triggerUndo() {
  if (gameEngine) gameEngine.undo();
}

function restartGame() {
  if (gameEngine) gameEngine.startNewGame();
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
  if (modal) modal.classList.remove('active');
}
