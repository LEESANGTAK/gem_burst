/**
 * Prism Cross: Gem Burst 메인 컨트롤러 (Scene & Option Manager)
 * - 앱스토어 프리미엄 감성의 통합 씬 라우팅 & 일시정지 시스템
 */

let gameEngine = null;
let currentLanguage = 'ko';
let currentScene = 'menu';

const MODE_META = {
  special: { icon: "🌟", nameKo: "특수 젬 크러시", nameEn: "Special Crush" },
  mega: { icon: "🪐", nameKo: "메가 버스트 (300타일)", nameEn: "Mega Burst (300)" },
  arcade: { icon: "⚡", nameKo: "아케이드 피버", nameEn: "Arcade Fever" },
  zen: { icon: "🧘", nameKo: "젠 힐링 모드", nameEn: "Zen Healing" },
  classic: { icon: "🎯", nameKo: "클래식 타임어택", nameEn: "Classic Attack" },
  mini: { icon: "🧩", nameKo: "미니 퀘스트", nameEn: "Mini Quest" }
};

const I18N = {
  ko: {
    menuPlay: "게임 시작 (PLAY)",
    menuPlaySub: "6가지 모드 선택 & 즉시 도전",
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
    menuPlay: "PLAY GAME",
    menuPlaySub: "Choose from 6 unique game modes",
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

  // 키보드 단축키 (ESC로 일시정지/모달닫기 토글)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-overlay.active');
      if (activeModal) {
        activeModal.classList.remove('active');
        if (gameEngine && currentScene === 'game') gameEngine.resume();
      } else if (currentScene === 'game') {
        openPauseModal();
      }
    }
  });
});

/* ================== 씬 전환 관리 ================== */

function goToLobby() {
  currentScene = 'menu';
  document.querySelectorAll('.game-view').forEach(v => v.classList.remove('active'));
  const menuView = document.getElementById('viewMenu');
  if (menuView) menuView.classList.add('active');

  // 헤더 상태 변경 (로비 전용 헤더)
  const brandLogo = document.getElementById('brandLogo');
  const btnPause = document.getElementById('btnHeaderPause');
  const modeChip = document.getElementById('headerModeChip');

  if (brandLogo) brandLogo.style.display = 'flex';
  if (btnPause) btnPause.style.display = 'none';
  if (modeChip) modeChip.style.display = 'none';

  if (gameEngine) {
    gameEngine.pause();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToGame(mode = 'special') {
  currentScene = 'game';
  document.querySelectorAll('.game-view').forEach(v => v.classList.remove('active'));
  const gameView = document.getElementById('viewGame');
  if (gameView) gameView.classList.add('active');

  // 헤더 상태 변경 (인게임 전용 헤더)
  const brandLogo = document.getElementById('brandLogo');
  const btnPause = document.getElementById('btnHeaderPause');
  const modeChip = document.getElementById('headerModeChip');

  if (brandLogo) brandLogo.style.display = 'none';
  if (btnPause) btnPause.style.display = 'inline-flex';
  if (modeChip) modeChip.style.display = 'inline-flex';

  updateHeaderModeChip(mode);

  // Zen 모드일 때만 되돌리기(Undo) 버튼 표시
  const undoBtn = document.getElementById('btnUndo');
  if (undoBtn) {
    undoBtn.style.display = mode === 'zen' ? 'inline-flex' : 'none';
  }

  if (gameEngine) {
    gameEngine.setMode(mode);
  }

  if (window.soundEngine) {
    window.soundEngine.startBGM();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchMainTab(tabName) {
  const key = tabName.toLowerCase();
  if (key === 'game') {
    goToGame(gameEngine ? gameEngine.mode : 'special');
  } else if (key === 'menu') {
    goToLobby();
  } else if (key === 'howto') {
    openHowToModal();
  } else if (key === 'legal') {
    openLegalModal();
  }
}

function updateHeaderModeChip(mode) {
  const meta = MODE_META[mode] || MODE_META.special;
  const iconEl = document.getElementById('headerModeIcon');
  const nameEl = document.getElementById('headerModeName');

  if (iconEl) iconEl.innerText = meta.icon;
  if (nameEl) nameEl.innerText = currentLanguage === 'en' ? meta.nameEn : meta.nameKo;
}

/* ================== 모달 제어 ================== */

function openPauseModal() {
  if (!gameEngine) return;
  gameEngine.pause();

  const modal = document.getElementById('pauseModal');
  const infoEl = document.getElementById('pauseModeInfo');
  if (infoEl) {
    const meta = MODE_META[gameEngine.mode] || MODE_META.special;
    const modeName = currentLanguage === 'en' ? meta.nameEn : meta.nameKo;
    infoEl.innerText = `[${meta.icon} ${modeName}]  현재 점수: ${gameEngine.score.toLocaleString()} PTS`;
  }
  if (modal) modal.classList.add('active');
}

function closePauseModal() {
  const modal = document.getElementById('pauseModal');
  if (modal) modal.classList.remove('active');
  if (gameEngine && currentScene === 'game') {
    gameEngine.resume();
  }
}

function openModeSelectModal() {
  const modal = document.getElementById('modeSelectModal');
  if (modal) modal.classList.add('active');
  if (gameEngine && currentScene === 'game') {
    gameEngine.pause();
  }
}

function closeModeSelectModal() {
  const modal = document.getElementById('modeSelectModal');
  if (modal) modal.classList.remove('active');
  if (gameEngine && currentScene === 'game') {
    gameEngine.resume();
  }
}

function selectAndStartMode(mode) {
  closeModeSelectModal();
  closePauseModal();
  goToGame(mode);
}

function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.add('active');
  if (gameEngine && currentScene === 'game') {
    gameEngine.pause();
  }
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.remove('active');
  if (gameEngine && currentScene === 'game') {
    gameEngine.resume();
  }
}

function openHowToModal() {
  const modal = document.getElementById('howToModal');
  if (modal) modal.classList.add('active');
  if (gameEngine && currentScene === 'game') {
    gameEngine.pause();
  }
}

function closeHowToModal() {
  const modal = document.getElementById('howToModal');
  if (modal) modal.classList.remove('active');
  if (gameEngine && currentScene === 'game') {
    gameEngine.resume();
  }
}

function openLegalModal() {
  const modal = document.getElementById('legalModal');
  if (modal) modal.classList.add('active');
  if (gameEngine && currentScene === 'game') {
    gameEngine.pause();
  }
}

function closeLegalModal() {
  const modal = document.getElementById('legalModal');
  if (modal) modal.classList.remove('active');
  if (gameEngine && currentScene === 'game') {
    gameEngine.resume();
  }
}

/* ================== 헤더 퀵 토글 버튼 ================== */

function toggleQuickSound() {
  if (!window.soundEngine) return;
  const isMuted = window.soundEngine.toggleMute();
  const icon = document.getElementById('quickSoundIcon');
  if (icon) {
    icon.innerText = isMuted ? '🔇' : '🔊';
  }
}

function toggleQuickLanguage() {
  const nextLang = currentLanguage === 'ko' ? 'en' : 'ko';
  setLanguage(nextLang);
}

function setLanguage(lang) {
  currentLanguage = lang;
  const quickLangText = document.getElementById('quickLangText');
  if (quickLangText) quickLangText.innerText = lang.toUpperCase();

  const btnKo = document.getElementById('btnLangKo');
  const btnEn = document.getElementById('btnLangEn');
  if (btnKo) btnKo.classList.toggle('active', lang === 'ko');
  if (btnEn) btnEn.classList.toggle('active', lang === 'en');

  const dict = I18N[lang] || I18N.ko;
  for (const key in dict) {
    const el = document.getElementById('txt' + key.charAt(0).toUpperCase() + key.slice(1));
    if (el) el.innerText = dict[key];
  }

  if (gameEngine) {
    updateHeaderModeChip(gameEngine.mode);
  }

  saveSettings();
}

/* ================== 오디오 & 옵션 설정 ================== */

function onBGMVolumeChange(val) {
  const num = parseInt(val, 10);
  const textEl = document.getElementById('bgmVolText');
  if (textEl) textEl.innerText = `${num}%`;

  if (window.soundEngine) {
    window.soundEngine.setBGMVolume(num / 100);
    if (num > 0 && !window.soundEngine.isBGMPlaying && currentScene === 'game') {
      window.soundEngine.startBGM();
    }
  }
  saveSettings();
}

function onSFXVolumeChange(val) {
  const num = parseInt(val, 10);
  const textEl = document.getElementById('sfxVolText');
  if (textEl) textEl.innerText = `${num}%`;

  if (window.soundEngine) {
    window.soundEngine.setSFXVolume(num / 100);
  }
  saveSettings();
}

function onSettingToggle(key, val) {
  if (!gameEngine) return;

  if (key === 'smartGuide') {
    gameEngine.smartGuide = val;
  } else if (key === 'hoverPreview') {
    gameEngine.hoverPreview = val;
  } else if (key === 'colorBlind') {
    gameEngine.colorBlindMode = val;
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

/* ================== 인게임 파워업 액션 독 ================== */

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
  if (gameEngine) {
    gameEngine.startNewGame();
    if (currentScene === 'game') {
      updateHeaderModeChip(gameEngine.mode);
    }
  }
}

/* ================== 결과 모달 ================== */

function showResultModal(report) {
  const modal = document.getElementById('resultModal');
  if (!modal) return;

  const titleEl = document.getElementById('modalTitle');
  const subEl = document.getElementById('modalSubtitle');
  const scoreEl = document.getElementById('modalScore');

  if (report.isVictory) {
    titleEl.innerText = "🏆 ALL CLEAR! 🏆";
    subEl.innerText = "축하합니다! 모든 보석을 완벽하게 소거했습니다!";
  } else {
    titleEl.innerText = "⏰ TIME OVER!";
    subEl.innerText = "시간이 종료되었습니다. 멋진 도전이었습니다!";
  }

  scoreEl.innerText = `${report.score.toLocaleString()} PTS`;

  document.getElementById('statTime').innerText = `${report.time}s`;
  document.getElementById('statMaxCombo').innerText = `${report.maxCombo}x`;
  document.getElementById('statAccuracy').innerText = `${report.accuracy}%`;
  document.getElementById('statAPM').innerText = `${report.apm}`;

  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('resultModal');
  if (modal) modal.classList.remove('active');
}
