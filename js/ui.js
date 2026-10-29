/**
 * REFLEX REACTOR — UI & Presentation Controller
 * Handles HUD animations, 3x3 grid rendering, sound synchronization, canvas reaction graphs, and modal dialogs.
 */

class UIController {
  constructor() {
    // Screens
    this.screenHome = document.getElementById('screen-home');
    this.screenGame = document.getElementById('screen-game');
    this.screenResults = document.getElementById('screen-results');

    // Modals & Overlays
    this.modalHowToPlay = document.getElementById('modal-how-to-play');
    this.modalRecords = document.getElementById('modal-records');
    this.countdownOverlay = document.getElementById('countdown-overlay');
    this.countdownNumber = document.getElementById('countdown-number');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.milestoneBanner = document.getElementById('milestone-banner');
    this.milestoneText = document.getElementById('milestone-text');

    // HUD Elements
    this.hudScore = document.getElementById('hud-score');
    this.hudTimerDigits = document.getElementById('hud-timer-digits');
    this.hudTimerCircle = document.getElementById('hud-timer-progress');
    this.hudTimerBox = document.getElementById('hud-timer-box');
    this.hudLastRT = document.getElementById('hud-last-rt');
    this.hudAvgRT = document.getElementById('hud-avg-rt');
    this.hudBestRT = document.getElementById('hud-best-rt');
    this.hudHits = document.getElementById('hud-hits');
    this.hudMisses = document.getElementById('hud-misses');
    this.hudStreak = document.getElementById('hud-streak');
    this.hudHighestStreak = document.getElementById('hud-highest-streak');
    this.comboBar = document.getElementById('combo-bar-fill');
    this.comboText = document.getElementById('combo-multiplier-text');

    // Grid panels
    this.gridArena = document.getElementById('reactor-arena');
    this.gridPanels = document.querySelectorAll('.reactor-panel');

    // Results screen elements
    this.resScore = document.getElementById('res-score');
    this.resHits = document.getElementById('res-hits');
    this.resMisses = document.getElementById('res-misses');
    this.resAccuracy = document.getElementById('res-accuracy');
    this.resAvgRT = document.getElementById('res-avg-rt');
    this.resBestRT = document.getElementById('res-best-rt');
    this.resStreak = document.getElementById('res-streak');
    this.resDifficulty = document.getElementById('res-difficulty');
    this.resRankTitle = document.getElementById('res-rank-title');
    this.resRankDesc = document.getElementById('res-rank-desc');
    this.resMotivation = document.getElementById('res-motivation');
    this.newBestBanner = document.getElementById('new-best-banner');
    this.rtChartCanvas = document.getElementById('rt-chart-canvas');

    // Sound toggle buttons
    this.soundBtns = document.querySelectorAll('.sound-toggle');

    // Toast Container
    this.toastContainer = document.getElementById('toast-container');

    // Keyboard Keymap for 3x3 Grid
    // [Q, W, E]
    // [A, S, D]
    // [Z, X, C]
    // Also supports Numpad [7,8,9 / 4,5,6 / 1,2,3] and digits [1-9]
    this.keyMap = {
      'q': 0, 'w': 1, 'e': 2,
      'a': 3, 's': 4, 'd': 5,
      'z': 6, 'x': 7, 'c': 8,
      '7': 0, '8': 1, '9': 2,
      '4': 3, '5': 4, '6': 5,
      '1': 6, '2': 7, '3': 8
    };

    this.countdownTimer = null;
    this.currentDisplayedScore = 0;
  }

  init() {
    this.updateSoundIcons();
    this.updateHomeRecordsPreview();
    this.renderHomeMiniGridAnimation();
  }

  showScreen(screenName) {
    [this.screenHome, this.screenGame, this.screenResults].forEach(s => {
      if (s) s.classList.remove('active');
    });

    if (screenName === 'home' && this.screenHome) {
      this.screenHome.classList.add('active');
      this.updateHomeRecordsPreview();
    } else if (screenName === 'game' && this.screenGame) {
      this.screenGame.classList.add('active');
    } else if (screenName === 'results' && this.screenResults) {
      this.screenResults.classList.add('active');
    }
  }

  updateSoundIcons() {
    const isMuted = window.soundEngine ? window.soundEngine.isMuted : true;
    this.soundBtns.forEach(btn => {
      if (isMuted) {
        btn.classList.add('muted');
        btn.setAttribute('aria-label', 'Sound is muted. Click to unmute.');
        btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;
      } else {
        btn.classList.remove('muted');
        btn.setAttribute('aria-label', 'Sound is enabled. Click to mute.');
        btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
      }
    });
  }

  showToast(message) {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = message;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3200);
  }

  updateHomeRecordsPreview() {
    if (!window.storageManager) return;
    const records = window.storageManager.getRecords();
    const bestScoreEl = document.getElementById('home-best-score');
    const bestRtEl = document.getElementById('home-best-rt');
    const bestStreakEl = document.getElementById('home-best-streak');

    if (bestScoreEl) bestScoreEl.textContent = records.highScore.toLocaleString();
    if (bestRtEl) bestRtEl.textContent = records.bestReactionTime ? `${records.bestReactionTime}ms` : '--';
    if (bestStreakEl) bestStreakEl.textContent = records.highestStreak;
  }

  renderHomeMiniGridAnimation() {
    const miniCells = document.querySelectorAll('.mini-grid-preview .mini-cell');
    if (!miniCells.length) return;
    let currentIdx = 0;
    setInterval(() => {
      miniCells.forEach(c => c.classList.remove('demo-glow'));
      currentIdx = (currentIdx + 1) % miniCells.length;
      miniCells[currentIdx].classList.add('demo-glow');
    }, 900);
  }

  /**
   * Run 3, 2, 1, GO countdown
   */
  startCountdown(callback) {
    if (!this.countdownOverlay || !this.countdownNumber) {
      if (callback) callback();
      return;
    }

    this.countdownOverlay.classList.remove('hidden');
    let count = 3;
    this.countdownNumber.textContent = count;
    if (window.soundEngine) window.soundEngine.playCountdown(count);

    if (this.countdownTimer) clearInterval(this.countdownTimer);

    this.countdownTimer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        this.countdownNumber.textContent = count;
        if (window.soundEngine) window.soundEngine.playCountdown(count);
      } else if (count === 0) {
        this.countdownNumber.textContent = 'GO!';
        if (window.soundEngine) window.soundEngine.playCountdown('GO');
      } else {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.countdownOverlay.classList.add('hidden');
        if (callback) callback();
      }
    }, 850);
  }

  /**
   * Reset panels to base state
   */
  clearGrid() {
    this.gridPanels.forEach(p => {
      p.className = 'reactor-panel';
    });
  }

  /**
   * Light up active target panel
   */
  activateTargetPanel(index) {
    this.clearGrid();
    if (index >= 0 && index < this.gridPanels.length) {
      const panel = this.gridPanels[index];
      panel.classList.add('active-target');
      if (window.soundEngine) window.soundEngine.playSpawn();
    }
  }

  /**
   * Visual and audio feedback for correct hit
   */
  showHitFeedback(info) {
    const { index, reactionTime, earnedPoints, streak, comboMult } = info;
    const panel = this.gridPanels[index];
    if (panel) {
      panel.classList.remove('active-target');
      panel.classList.add('hit-success');
      setTimeout(() => {
        panel.classList.remove('hit-success');
      }, 200);

      // Particle sparks
      const rect = panel.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      if (window.particleEngine) {
        window.particleEngine.spawnHitSparks(cx, cy, reactionTime < 300 ? 'cyan' : 'green');
      }

      // Floating feedback message
      let feedbackText = `+${earnedPoints}`;
      let feedbackClass = 'feedback-fast';
      if (reactionTime <= 230) {
        feedbackText = `PERFECT! ${reactionTime}ms`;
        feedbackClass = 'feedback-perfect';
      } else if (reactionTime <= 380) {
        feedbackText = `FAST! ${reactionTime}ms`;
        feedbackClass = 'feedback-fast';
      } else {
        feedbackText = `GOOD! ${reactionTime}ms`;
        feedbackClass = 'feedback-slow';
      }

      this.spawnFloatingFeedback(cx, cy, feedbackText, feedbackClass);
    }

    if (window.soundEngine) {
      window.soundEngine.playHit(streak);
    }
  }

  /**
   * Visual and audio feedback for miss (inactive click)
   */
  showMissFeedback(info) {
    const { clickedIndex, penalty } = info;
    const panel = this.gridPanels[clickedIndex];
    if (panel) {
      panel.classList.add('hit-miss');
      setTimeout(() => panel.classList.remove('hit-miss'), 300);

      const rect = panel.getBoundingClientRect();
      this.spawnFloatingFeedback(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        `MISS! -${penalty}`,
        'feedback-miss'
      );
    }

    document.body.classList.add('screen-shake-anim');
    setTimeout(() => document.body.classList.remove('screen-shake-anim'), 300);

    if (window.soundEngine) {
      window.soundEngine.playMiss();
    }
  }

  /**
   * Visual and audio feedback for timeout
   */
  showTimeoutFeedback(info) {
    const { index, penalty } = info;
    const panel = this.gridPanels[index];
    if (panel) {
      panel.classList.remove('active-target');
      panel.classList.add('hit-miss');
      setTimeout(() => panel.classList.remove('hit-miss'), 300);

      const rect = panel.getBoundingClientRect();
      this.spawnFloatingFeedback(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        `TOO SLOW! -${penalty}`,
        'feedback-miss'
      );
    }

    if (window.soundEngine) {
      window.soundEngine.playTimeout();
    }
  }

  spawnFloatingFeedback(x, y, text, extraClass = 'feedback-fast') {
    const el = document.createElement('div');
    el.className = `floating-feedback ${extraClass}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 900);
  }

  showMilestone(streak, bonus) {
    if (!this.milestoneBanner || !this.milestoneText) return;
    const phrases = [
      `${streak} HIT STREAK! +${bonus}`,
      `NICE REFLEXES! ${streak}X!`,
      `LIGHTNING FAST! ${streak} STREAK!`,
      `UNSTOPPABLE! ${streak}X COMBO!`
    ];
    this.milestoneText.textContent = phrases[Math.floor(Math.random() * phrases.length)];
    this.milestoneBanner.classList.add('show');
    if (window.soundEngine) window.soundEngine.playMilestone();

    setTimeout(() => {
      this.milestoneBanner.classList.remove('show');
    }, 1800);
  }

  /**
   * Update HUD with new metrics
   */
  updateHUD(metrics) {
    if (this.hudScore) {
      this.animateScoreRoll(metrics.score);
    }
    if (this.hudLastRT) {
      this.hudLastRT.textContent = metrics.lastRT > 0 ? `${metrics.lastRT}ms` : '--';
    }
    if (this.hudAvgRT) {
      this.hudAvgRT.textContent = metrics.avgRT > 0 ? `${metrics.avgRT}ms` : '--';
    }
    if (this.hudBestRT) {
      this.hudBestRT.textContent = metrics.bestRT > 0 ? `${metrics.bestRT}ms` : '--';
    }
    if (this.hudHits) {
      this.hudHits.textContent = metrics.hits;
    }
    if (this.hudMisses) {
      this.hudMisses.textContent = metrics.misses;
    }
    if (this.hudStreak) {
      this.hudStreak.textContent = metrics.streak;
    }
    if (this.hudHighestStreak) {
      this.hudHighestStreak.textContent = metrics.highestStreak;
    }

    // Combo meter progress
    if (this.comboBar && this.comboText) {
      const percentage = Math.min(100, (metrics.streak / 20) * 100);
      this.comboBar.style.width = `${percentage}%`;
      this.comboText.textContent = `${metrics.comboMult.toFixed(1)}x COMBO`;
    }
  }

  animateScoreRoll(targetScore) {
    const start = this.currentDisplayedScore;
    const diff = targetScore - start;
    if (diff === 0) return;

    const duration = 250;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const val = Math.round(start + diff * progress);
      this.hudScore.textContent = val.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.currentDisplayedScore = targetScore;
      }
    };
    requestAnimationFrame(step);
  }

  updateTimerDisplay(remaining, total) {
    if (!this.hudTimerDigits) return;
    this.hudTimerDigits.textContent = Math.ceil(remaining);

    if (this.hudTimerBox) {
      if (remaining <= 10 && remaining > 0) {
        this.hudTimerBox.classList.add('urgent');
      } else {
        this.hudTimerBox.classList.remove('urgent');
      }
    }

    if (this.hudTimerCircle) {
      const circumference = 2 * Math.PI * 13; // r=13
      const offset = circumference - (remaining / total) * circumference;
      this.hudTimerCircle.style.strokeDasharray = `${circumference} ${circumference}`;
      this.hudTimerCircle.style.strokeDashoffset = offset;
    }
  }

  /**
   * Render results screen with rank, stats, personal best indicator, and canvas graph
   */
  renderResults(summary, updates) {
    this.clearGrid();
    this.showScreen('results');

    if (this.resScore) this.resScore.textContent = summary.score.toLocaleString();
    if (this.resHits) this.resHits.textContent = summary.hits;
    if (this.resMisses) this.resMisses.textContent = summary.misses;
    if (this.resAccuracy) this.resAccuracy.textContent = `${summary.accuracy}%`;
    if (this.resAvgRT) this.resAvgRT.textContent = summary.avgRT > 0 ? `${summary.avgRT}ms` : '--';
    if (this.resBestRT) this.resBestRT.textContent = summary.bestRT > 0 ? `${summary.bestRT}ms` : '--';
    if (this.resStreak) this.resStreak.textContent = summary.highestStreak;
    if (this.resDifficulty) this.resDifficulty.textContent = summary.difficulty.toUpperCase();

    // Personal best banner & confetti
    const isNewPB = updates && (updates.isNewHighScore || updates.isNewDiffBest);
    if (this.newBestBanner) {
      if (isNewPB) {
        this.newBestBanner.classList.add('active');
        if (window.particleEngine) window.particleEngine.spawnConfetti();
      } else {
        this.newBestBanner.classList.remove('active');
      }
    }

    if (window.soundEngine) {
      window.soundEngine.playGameOver(isNewPB);
    }

    // Rank assessment
    const rankInfo = this.calculateRank(summary);
    if (this.resRankTitle) this.resRankTitle.textContent = rankInfo.title;
    if (this.resRankDesc) this.resRankDesc.textContent = rankInfo.desc;
    if (this.resMotivation) this.resMotivation.textContent = rankInfo.motivation;

    // Draw Reaction Time History Graph on HTML5 Canvas
    this.renderReactionGraph(summary.reactionHistory, summary.avgRT);
  }

  calculateRank(summary) {
    const { score, avgRT, accuracy, hits } = summary;

    if (score >= 4500 && avgRT > 0 && avgRT < 320 && accuracy >= 90) {
      return {
        title: 'REFLEX LEGEND',
        desc: 'Godlike neural pathways. Instant synaptic response.',
        motivation: 'Incredible! You possess peak tournament-level reflexes!'
      };
    }
    if (score >= 3200 && avgRT > 0 && avgRT < 380 && accuracy >= 85) {
      return {
        title: 'CYBER PHANTOM',
        desc: 'Blazing speed with lethal tactical precision.',
        motivation: 'Brilliant performance! You are outpacing 98% of contenders!'
      };
    }
    if (score >= 2000 && avgRT > 0 && avgRT < 460 && accuracy >= 80) {
      return {
        title: 'REFLEX PRO',
        desc: 'Sharpened focus and strong reaction momentum.',
        motivation: 'Great game! Consistent timing and high streak control.'
      };
    }
    if (score >= 1200 || (hits >= 12 && accuracy >= 70)) {
      return {
        title: 'QUICK THINKER',
        desc: 'Solid tempo and disciplined target reaction.',
        motivation: 'Well done! A few more rounds will push you to Pro level!'
      };
    }
    if (score >= 500) {
      return {
        title: 'NEON STRIKER',
        desc: 'Warming up the reactor core circuits.',
        motivation: 'Keep practicing! Focus on target center and anticipation.'
      };
    }
    return {
      title: 'REFLEX ROOKIE',
      desc: 'Calibration underway. Systems warming up.',
      motivation: 'Stay sharp and try again — speed grows with repetition!'
    };
  }

  /**
   * Draw interactive canvas graph of reaction times
   */
  renderReactionGraph(history, avgRT) {
    if (!this.rtChartCanvas) return;
    const canvas = this.rtChartCanvas;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement ? canvas.parentElement.clientWidth : 500;
    const height = 150;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    if (!history || history.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Not enough reaction samples for chart', width / 2, height / 2);
      return;
    }

    const padding = { top: 20, bottom: 25, left: 35, right: 20 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const minRT = Math.min(...history);
    const maxRT = Math.max(...history);
    const yMin = Math.max(0, minRT - 50);
    const yMax = maxRT + 60;

    const getX = (idx) => padding.left + (idx / (history.length - 1)) * chartW;
    const getY = (val) => padding.top + chartH - ((val - yMin) / (yMax - yMin)) * chartH;

    // Draw average dashed line
    if (avgRT > 0) {
      const avgY = getY(avgRT);
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(181, 55, 242, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.moveTo(padding.left, avgY);
      ctx.lineTo(padding.left + chartW, avgY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#b537f2';
      ctx.font = '10px Rajdhani, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`AVG ${avgRT}ms`, padding.left + chartW, avgY - 5);
    }

    // Draw area gradient under curve
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    gradient.addColorStop(0, 'rgba(0, 243, 255, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 243, 255, 0.0)');

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(history[0]));
    for (let i = 1; i < history.length; i++) {
      ctx.lineTo(getX(i), getY(history[i]));
    }
    ctx.lineTo(getX(history.length - 1), padding.top + chartH);
    ctx.lineTo(getX(0), padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(history[0]));
    for (let i = 1; i < history.length; i++) {
      ctx.lineTo(getX(i), getY(history[i]));
    }
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw data points
    for (let i = 0; i < history.length; i++) {
      const px = getX(i);
      const py = getY(history[i]);
      const rt = history[i];

      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = rt < 300 ? '#00ff88' : (rt < 450 ? '#00f3ff' : '#ffaa00');
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Y Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Rajdhani, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${yMax}ms`, padding.left - 5, padding.top + 10);
    ctx.fillText(`${yMin}ms`, padding.left - 5, padding.top + chartH);
  }

  /**
   * Share game results
   */
  shareGameResults(summary) {
    const text = `⚡ REFLEX REACTOR — Reflex Benchmark ⚡\nScore: ${summary.score.toLocaleString()} pts\nAccuracy: ${summary.accuracy}%\nAvg Reaction: ${summary.avgRT}ms (Best: ${summary.bestRT}ms)\nDifficulty: ${summary.difficulty.toUpperCase()} | Streak: ${summary.highestStreak}\nCan you beat my reflexes?`;

    if (navigator.share) {
      navigator.share({
        title: 'Reflex Reactor Score',
        text: text,
        url: window.location.href
      }).catch(err => {
        this.copyToClipboard(text);
      });
    } else {
      this.copyToClipboard(text);
    }
  }

  copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('Results copied to clipboard!');
      }).catch(() => {
        this.showToast('Unable to copy results.');
      });
    } else {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.showToast('Results copied to clipboard!');
    }
  }

  /**
   * Populate Local Records Modal
   */
  renderRecordsModal(tab = 'easy') {
    if (!window.storageManager) return;
    const records = window.storageManager.getRecords();
    const container = document.getElementById('records-stat-list');
    if (!container) return;

    const diffScore = records.difficultyScores[tab] || 0;
    const diffRT = records.difficultyBestRT[tab] ? `${records.difficultyBestRT[tab]}ms` : '--';

    container.innerHTML = `
      <div class="record-row-item">
        <span class="record-row-title">${tab.toUpperCase()} Best Score</span>
        <span class="record-row-num val-cyan">${diffScore.toLocaleString()} pts</span>
      </div>
      <div class="record-row-item">
        <span class="record-row-title">${tab.toUpperCase()} Best Reaction</span>
        <span class="record-row-num val-green">${diffRT}</span>
      </div>
      <div class="record-row-item">
        <span class="record-row-title">All-Time Highest Streak</span>
        <span class="record-row-num val-purple">${records.highestStreak} hits</span>
      </div>
      <div class="record-row-item">
        <span class="record-row-title">Total Games Played</span>
        <span class="record-row-num">${records.totalGamesPlayed}</span>
      </div>
      <div class="record-row-item">
        <span class="record-row-title">Total Targets Cleared</span>
        <span class="record-row-num val-cyan">${records.totalCorrectHits}</span>
      </div>
    `;
  }
}

// Global UI controller instance
window.uiController = new UIController();

