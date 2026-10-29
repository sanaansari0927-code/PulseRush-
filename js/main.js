/**
 * REFLEX REACTOR — Main Application Bootstrap & Event Router
 * Ties together GameEngine, UIController, SoundEngine, StorageManager, and User Inputs.
 */

document.addEventListener('DOMContentLoaded', () => {
  const game = window.gameEngine;
  const ui = window.uiController;
  const sound = window.soundEngine;
  const storage = window.storageManager;

  // Initialize UI state
  ui.init();

  // Audio Context Unlock on First User Gesture
  const unlockAudio = () => {
    if (sound) sound.ensureContext();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);

  // --------------------------------------------------------------------------
  // GAME ENGINE CALLBACKS
  // --------------------------------------------------------------------------
  game.onStateChange = (state) => {
    if (state === 'PAUSED') {
      if (ui.pauseOverlay) ui.pauseOverlay.classList.add('active');
    } else {
      if (ui.pauseOverlay) ui.pauseOverlay.classList.remove('active');
    }
  };

  game.onTimerTick = (remaining, total) => {
    ui.updateTimerDisplay(remaining, total);
  };

  game.onTargetSpawn = (panelIndex, deadline) => {
    ui.activateTargetPanel(panelIndex);
  };

  game.onHitSuccess = (info) => {
    ui.showHitFeedback(info);
  };

  game.onHitMiss = (info) => {
    ui.showMissFeedback(info);
  };

  game.onTimeoutMiss = (info) => {
    ui.showTimeoutFeedback(info);
  };

  game.onMilestone = (streak, bonus) => {
    ui.showMilestone(streak, bonus);
  };

  game.onScoreUpdate = (metrics) => {
    ui.updateHUD(metrics);
  };

  let lastGameSummary = null;
  game.onGameOver = (summary) => {
    lastGameSummary = summary;
    const updates = storage.processGameResult(summary);
    ui.renderResults(summary, updates);
  };

  // --------------------------------------------------------------------------
  // HOME SCREEN CONTROLS & DIFFICULTY SELECTION
  // --------------------------------------------------------------------------
  const diffBtns = document.querySelectorAll('.diff-btn');
  const diffDetailsText = document.getElementById('diff-details-text');

  const diffDescriptions = {
    easy: 'Response deadline: ~1.2s • Slower scaling • Best for warming up',
    medium: 'Response deadline: ~0.9s • Balanced scaling • Standard tournament challenge',
    hard: 'Response deadline: ~0.7s • Rapid scaling • Extreme reflexes required'
  };

  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playClick();
      const diff = btn.dataset.diff;
      diffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      game.setDifficulty(diff);
      if (diffDetailsText && diffDescriptions[diff]) {
        diffDetailsText.textContent = diffDescriptions[diff];
      }
    });
  });

  // Start Standard Game Button
  const btnStartGame = document.getElementById('btn-start-game');
  if (btnStartGame) {
    btnStartGame.addEventListener('click', () => {
      sound.playClick();
      game.setPracticeMode(false);
      game.resetSession();
      ui.showScreen('game');
      ui.updateHUD(game.getMetrics());
      ui.startCountdown(() => {
        game.beginActivePlay();
      });
    });
  }

  // Start Practice Mode Button
  const btnStartPractice = document.getElementById('btn-start-practice');
  if (btnStartPractice) {
    btnStartPractice.addEventListener('click', () => {
      sound.playClick();
      game.setPracticeMode(true);
      game.resetSession();
      ui.showScreen('game');
      ui.updateHUD(game.getMetrics());
      if (ui.hudTimerDigits) ui.hudTimerDigits.textContent = '∞';
      ui.startCountdown(() => {
        game.beginActivePlay();
      });
    });
  }

  // --------------------------------------------------------------------------
  // 3x3 GRID PANEL INTERACTIONS (Touch & Click)
  // --------------------------------------------------------------------------
  ui.gridPanels.forEach((panel) => {
    const handleInteract = (e) => {
      e.preventDefault();
      const index = parseInt(panel.dataset.index, 10);
      game.handlePanelInteraction(index);
    };

    panel.addEventListener('mousedown', handleInteract);
    panel.addEventListener('touchstart', handleInteract, { passive: false });
  });

  // Keyboard navigation for Grid & Shortcuts
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    // Pause / Resume on Escape or P
    if (key === 'escape' || key === 'p') {
      if (game.state === 'ACTIVE') {
        game.pause();
      } else if (game.state === 'PAUSED') {
        game.resume();
      }
      return;
    }

    // Sound toggle on M
    if (key === 'm') {
      sound.toggleMute();
      ui.updateSoundIcons();
      ui.showToast(sound.isMuted ? 'Audio Muted' : 'Audio Enabled');
      return;
    }

    // Grid panels triggered by keyboard
    if (game.state === 'ACTIVE' && ui.keyMap.hasOwnProperty(key)) {
      e.preventDefault();
      const targetIndex = ui.keyMap[key];
      game.handlePanelInteraction(targetIndex);
    }
  });

  // --------------------------------------------------------------------------
  // IN-GAME CONTROLS (Pause, Resume, Quit, Sound)
  // --------------------------------------------------------------------------
  const btnPause = document.getElementById('btn-pause-game');
  if (btnPause) {
    btnPause.addEventListener('click', () => {
      sound.playClick();
      game.pause();
    });
  }

  const btnResume = document.getElementById('btn-resume-game');
  if (btnResume) {
    btnResume.addEventListener('click', () => {
      sound.playClick();
      game.resume();
    });
  }

  const btnQuitMatch = document.getElementById('btn-quit-match');
  if (btnQuitMatch) {
    btnQuitMatch.addEventListener('click', () => {
      sound.playClick();
      game.endGame();
    });
  }

  const btnAbortPause = document.getElementById('btn-abort-match');
  if (btnAbortPause) {
    btnAbortPause.addEventListener('click', () => {
      sound.playClick();
      game.clearAllTimers();
      ui.showScreen('home');
    });
  }

  // --------------------------------------------------------------------------
  // RESULTS SCREEN ACTIONS
  // --------------------------------------------------------------------------
  const btnPlayAgain = document.getElementById('btn-play-again');
  if (btnPlayAgain) {
    btnPlayAgain.addEventListener('click', () => {
      sound.playClick();
      game.resetSession();
      ui.showScreen('game');
      ui.updateHUD(game.getMetrics());
      if (game.isPractice && ui.hudTimerDigits) {
        ui.hudTimerDigits.textContent = '∞';
      }
      ui.startCountdown(() => {
        game.beginActivePlay();
      });
    });
  }

  const btnResultsHome = document.getElementById('btn-results-home');
  if (btnResultsHome) {
    btnResultsHome.addEventListener('click', () => {
      sound.playClick();
      ui.showScreen('home');
    });
  }

  const btnShare = document.getElementById('btn-share-results');
  if (btnShare) {
    btnShare.addEventListener('click', () => {
      sound.playClick();
      if (lastGameSummary) {
        ui.shareGameResults(lastGameSummary);
      }
    });
  }

  // --------------------------------------------------------------------------
  // SOUND TOGGLES
  // --------------------------------------------------------------------------
  ui.soundBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      ui.updateSoundIcons();
      ui.showToast(isMuted ? 'Sound Muted' : 'Sound Enabled');
    });
  });

  // --------------------------------------------------------------------------
  // MODALS: HOW TO PLAY & LOCAL RECORDS
  // --------------------------------------------------------------------------
  const btnHowToPlay = document.getElementById('btn-how-to-play');
  const btnCloseHowToPlay = document.getElementById('btn-close-how-to-play');
  if (btnHowToPlay) {
    btnHowToPlay.addEventListener('click', () => {
      sound.playClick();
      if (ui.modalHowToPlay) ui.modalHowToPlay.classList.add('open');
    });
  }
  if (btnCloseHowToPlay) {
    btnCloseHowToPlay.addEventListener('click', () => {
      sound.playClick();
      if (ui.modalHowToPlay) ui.modalHowToPlay.classList.remove('open');
    });
  }

  const btnOpenRecords = document.getElementById('btn-open-records');
  const btnCloseRecords = document.getElementById('btn-close-records');
  if (btnOpenRecords) {
    btnOpenRecords.addEventListener('click', () => {
      sound.playClick();
      ui.renderRecordsModal('easy');
      if (ui.modalRecords) ui.modalRecords.classList.add('open');
    });
  }
  if (btnCloseRecords) {
    btnCloseRecords.addEventListener('click', () => {
      sound.playClick();
      if (ui.modalRecords) ui.modalRecords.classList.remove('open');
    });
  }

  // Leaderboard modal difficulty tabs
  const recordTabs = document.querySelectorAll('.record-tab-btn');
  recordTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sound.playClick();
      recordTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const diff = tab.dataset.tab;
      ui.renderRecordsModal(diff);
    });
  });

  // Reset Records Button with safety confirmation
  const btnResetRecords = document.getElementById('btn-reset-records');
  if (btnResetRecords) {
    btnResetRecords.addEventListener('click', () => {
      sound.playClick();
      if (confirm('Are you sure you want to reset all your local high scores and records?')) {
        storage.resetAll();
        ui.updateHomeRecordsPreview();
        ui.renderRecordsModal('easy');
        ui.showToast('All local records have been reset.');
      }
    });
  }

  // Modals: Footer Quick Links
  const footerRecordsLink = document.getElementById('footer-records-link');
  if (footerRecordsLink) {
    footerRecordsLink.addEventListener('click', () => {
      sound.playClick();
      ui.renderRecordsModal('easy');
      if (ui.modalRecords) ui.modalRecords.classList.add('open');
    });
  }

  const footerRulesLink = document.getElementById('footer-rules-link');
  if (footerRulesLink) {
    footerRulesLink.addEventListener('click', () => {
      sound.playClick();
      if (ui.modalHowToPlay) ui.modalHowToPlay.classList.add('open');
    });
  }

  // Close modals on clicking outside modal card
  [ui.modalHowToPlay, ui.modalRecords].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
        }
      });
    }
  });

  // Brand logo click returns to home
  const brandLogo = document.getElementById('brand-badge-link');
  if (brandLogo) {
    brandLogo.addEventListener('click', () => {
      sound.playClick();
      if (game.state === 'ACTIVE' || game.state === 'PAUSED') {
        if (confirm('A game is currently in progress. Do you want to return to the home screen?')) {
          game.clearAllTimers();
          ui.showScreen('home');
        }
      } else {
        ui.showScreen('home');
      }
    });
  }
});
