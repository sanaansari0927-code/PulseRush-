/**
 * REFLEX REACTOR — Core Game Engine
 * Precision reaction timing with performance.now(), fair target progression, and state management.
 */

class GameEngine {
  constructor() {
    this.state = 'IDLE'; // IDLE | COUNTDOWN | ACTIVE | PAUSED | GAME_OVER
    this.difficulty = 'medium'; // easy | medium | hard
    this.isPractice = false;

    // Difficulty Presets
    this.diffConfig = {
      easy: {
        initialDeadline: 1250,
        deadlineFloor: 650,
        decreasePerHit: 20,
        scoreMultiplier: 1.0,
        missPenalty: 25,
        name: 'EASY'
      },
      medium: {
        initialDeadline: 950,
        deadlineFloor: 450,
        decreasePerHit: 25,
        scoreMultiplier: 1.3,
        missPenalty: 35,
        name: 'MEDIUM'
      },
      hard: {
        initialDeadline: 700,
        deadlineFloor: 280,
        decreasePerHit: 30,
        scoreMultiplier: 1.7,
        missPenalty: 45,
        name: 'HARD'
      }
    };

    // Live Session Metrics
    this.score = 0;
    this.correctHits = 0;
    this.totalMisses = 0;
    this.currentStreak = 0;
    this.highestStreak = 0;
    this.reactionHistory = []; // array of ms numbers for hits
    this.bestReactionTime = null;
    this.averageReactionTime = 0;
    this.lastReactionTime = 0;

    // Clock & Target State
    this.totalDuration = 60; // seconds
    this.timeRemaining = 60; // seconds
    this.gameTimerInterval = null;
    this.activePanelIndex = -1;
    this.targetStartTime = 0;
    this.currentDeadline = 950;
    this.targetTimeoutId = null;
    this.nextTargetTimeoutId = null;
    this.targetResolved = true;
    this.hasMissedThisTarget = false;
    this.targetId = 0;

    // Pause Tracking
    this.pausedTimeRemainingTarget = 0;
    this.gameStartTime = 0;
    this.pauseStartTime = 0;

    // Event Callbacks (wired to UI)
    this.onStateChange = null;
    this.onScoreUpdate = null;
    this.onTimerTick = null;
    this.onTargetSpawn = null;
    this.onHitSuccess = null;
    this.onHitMiss = null;
    this.onTimeoutMiss = null;
    this.onMilestone = null;
    this.onGameOver = null;
  }

  setDifficulty(diff) {
    if (this.diffConfig[diff]) {
      this.difficulty = diff;
    }
  }

  setPracticeMode(isPractice) {
    this.isPractice = !!isPractice;
  }

  /**
   * Reset all session statistics
   */
  resetSession() {
    this.clearAllTimers();
    this.score = 0;
    this.correctHits = 0;
    this.totalMisses = 0;
    this.currentStreak = 0;
    this.highestStreak = 0;
    this.reactionHistory = [];
    this.bestReactionTime = null;
    this.averageReactionTime = 0;
    this.lastReactionTime = 0;
    this.activePanelIndex = -1;
    this.targetResolved = true;
    this.hasMissedThisTarget = false;
    this.targetId = 0;
    this.timeRemaining = this.totalDuration;

    const conf = this.diffConfig[this.difficulty];
    this.currentDeadline = conf.initialDeadline;
  }

  clearAllTimers() {
    if (this.gameTimerInterval) {
      clearInterval(this.gameTimerInterval);
      this.gameTimerInterval = null;
    }
    if (this.targetTimeoutId) {
      clearTimeout(this.targetTimeoutId);
      this.targetTimeoutId = null;
    }
    if (this.nextTargetTimeoutId) {
      clearTimeout(this.nextTargetTimeoutId);
      this.nextTargetTimeoutId = null;
    }
  }

  /**
   * Start a new match with countdown
   */
  startNewGame() {
    this.resetSession();
    this.state = 'COUNTDOWN';
    if (this.onStateChange) this.onStateChange(this.state);
  }

  /**
   * Called once countdown finishes (3, 2, 1, GO)
   */
  beginActivePlay() {
    this.state = 'ACTIVE';
    this.gameStartTime = performance.now();
    if (this.onStateChange) this.onStateChange(this.state);

    // Start overall 60-second timer if not practice mode
    if (!this.isPractice) {
      this.timeRemaining = this.totalDuration;
      if (this.onTimerTick) this.onTimerTick(this.timeRemaining, this.totalDuration);

      let lastTick = performance.now();
      this.gameTimerInterval = setInterval(() => {
        if (this.state !== 'ACTIVE') return;

        const now = performance.now();
        const delta = (now - lastTick) / 1000;
        lastTick = now;

        this.timeRemaining -= delta;
        if (this.timeRemaining <= 0) {
          this.timeRemaining = 0;
          if (this.onTimerTick) this.onTimerTick(0, this.totalDuration);
          this.endGame();
        } else {
          if (this.onTimerTick) this.onTimerTick(Math.ceil(this.timeRemaining), this.totalDuration);
        }
      }, 100);
    }

    // Spawn first target
    this.spawnNextTarget();
  }

  /**
   * Spawns a randomized target panel (0 to 8)
   */
  spawnNextTarget() {
    if (this.state !== 'ACTIVE') return;

    // Pick random panel different from previous
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * 9);
    } while (nextIndex === this.activePanelIndex && Math.random() > 0.1);

    this.activePanelIndex = nextIndex;
    this.targetResolved = false;
    this.hasMissedThisTarget = false;
    this.targetId += 1;
    const currentId = this.targetId;

    this.targetStartTime = performance.now();

    if (this.onTargetSpawn) {
      this.onTargetSpawn(this.activePanelIndex, this.currentDeadline);
    }

    // Response deadline timer
    this.targetTimeoutId = setTimeout(() => {
      if (this.state === 'ACTIVE' && currentId === this.targetId && !this.targetResolved) {
        this.handleTimeout();
      }
    }, this.currentDeadline);
  }

  /**
   * Handles user click / key tap on panel (0 to 8)
   */
  handlePanelInteraction(index) {
    if (this.state !== 'ACTIVE') return;

    // 1. Correct Hit!
    if (index === this.activePanelIndex && !this.targetResolved) {
      this.targetResolved = true;
      if (this.targetTimeoutId) {
        clearTimeout(this.targetTimeoutId);
        this.targetTimeoutId = null;
      }

      const now = performance.now();
      const reactionTime = Math.max(1, Math.round(now - this.targetStartTime));
      this.lastReactionTime = reactionTime;
      this.reactionHistory.push(reactionTime);

      // Best reaction time
      if (!this.bestReactionTime || reactionTime < this.bestReactionTime) {
        this.bestReactionTime = reactionTime;
      }

      // Average reaction time
      const sum = this.reactionHistory.reduce((a, b) => a + b, 0);
      this.averageReactionTime = Math.round(sum / this.reactionHistory.length);

      // Streaks
      this.correctHits += 1;
      this.currentStreak += 1;
      if (this.currentStreak > this.highestStreak) {
        this.highestStreak = this.currentStreak;
      }

      // Calculate score
      const conf = this.diffConfig[this.difficulty];
      const basePoints = 100;
      // Generous speed bonus: faster clicks earn more points
      const speedBonus = Math.max(0, Math.round((this.currentDeadline - reactionTime) / 3.5));
      const comboMult = this.getComboMultiplier();
      const earned = Math.round((basePoints + speedBonus) * comboMult * conf.scoreMultiplier);
      this.score += earned;

      // Progressive difficulty update
      this.currentDeadline = Math.max(
        conf.deadlineFloor,
        conf.initialDeadline - (this.correctHits * conf.decreasePerHit)
      );

      // Callback to UI
      if (this.onHitSuccess) {
        this.onHitSuccess({
          index,
          reactionTime,
          earnedPoints: earned,
          speedBonus,
          streak: this.currentStreak,
          comboMult
        });
      }

      // Streak milestones check
      if (this.currentStreak > 0 && this.currentStreak % 5 === 0) {
        const milestoneBonus = this.currentStreak * 25;
        this.score += milestoneBonus;
        if (this.onMilestone) {
          this.onMilestone(this.currentStreak, milestoneBonus);
        }
      }

      if (this.onScoreUpdate) {
        this.onScoreUpdate(this.getMetrics());
      }

      // Spawn next target after brief 120ms rhythm pause
      this.nextTargetTimeoutId = setTimeout(() => {
        this.spawnNextTarget();
      }, 120);

      return;
    }

    // 2. Inactive Click (Miss)
    if (!this.targetResolved) {
      // Respect rule: Never count a single target as more than one miss!
      if (!this.hasMissedThisTarget) {
        this.hasMissedThisTarget = true;
        this.totalMisses += 1;
        this.currentStreak = 0;

        const conf = this.diffConfig[this.difficulty];
        const penalty = conf.missPenalty;
        this.score = Math.max(0, this.score - penalty);

        if (this.onHitMiss) {
          this.onHitMiss({
            clickedIndex: index,
            activeTargetIndex: this.activePanelIndex,
            penalty
          });
        }

        if (this.onScoreUpdate) {
          this.onScoreUpdate(this.getMetrics());
        }
      }
    }
  }

  /**
   * Target timed out without being hit
   */
  handleTimeout() {
    this.targetResolved = true;

    // If already counted miss on inactive click during this target, do not double-count miss!
    if (!this.hasMissedThisTarget) {
      this.hasMissedThisTarget = true;
      this.totalMisses += 1;
      this.currentStreak = 0;

      const conf = this.diffConfig[this.difficulty];
      const penalty = Math.round(conf.missPenalty * 0.7);
      this.score = Math.max(0, this.score - penalty);

      if (this.onTimeoutMiss) {
        this.onTimeoutMiss({
          index: this.activePanelIndex,
          penalty
        });
      }

      if (this.onScoreUpdate) {
        this.onScoreUpdate(this.getMetrics());
      }
    }

    // Spawn next target after quick 150ms cool-off
    this.nextTargetTimeoutId = setTimeout(() => {
      this.spawnNextTarget();
    }, 150);
  }

  getComboMultiplier() {
    if (this.currentStreak >= 20) return 3.0;
    if (this.currentStreak >= 15) return 2.5;
    if (this.currentStreak >= 10) return 2.0;
    if (this.currentStreak >= 6) return 1.5;
    if (this.currentStreak >= 3) return 1.25;
    return 1.0;
  }

  /**
   * Pause the game cleanly freezing all timers
   */
  pause() {
    if (this.state !== 'ACTIVE') return;
    this.state = 'PAUSED';
    this.pauseStartTime = performance.now();

    // Freeze active target timer
    if (!this.targetResolved && this.targetTimeoutId) {
      clearTimeout(this.targetTimeoutId);
      this.targetTimeoutId = null;
      const elapsed = this.pauseStartTime - this.targetStartTime;
      this.pausedTimeRemainingTarget = Math.max(50, this.currentDeadline - elapsed);
    }

    if (this.nextTargetTimeoutId) {
      clearTimeout(this.nextTargetTimeoutId);
      this.nextTargetTimeoutId = null;
    }

    if (this.onStateChange) this.onStateChange(this.state);
  }

  /**
   * Resume the game accurately restoring deadlines
   */
  resume() {
    if (this.state !== 'PAUSED') return;
    this.state = 'ACTIVE';

    // Resume target deadline
    if (!this.targetResolved && this.pausedTimeRemainingTarget > 0) {
      this.targetStartTime = performance.now() - (this.currentDeadline - this.pausedTimeRemainingTarget);
      const currentId = this.targetId;
      this.targetTimeoutId = setTimeout(() => {
        if (this.state === 'ACTIVE' && currentId === this.targetId && !this.targetResolved) {
          this.handleTimeout();
        }
      }, this.pausedTimeRemainingTarget);
    } else if (this.targetResolved) {
      this.spawnNextTarget();
    }

    if (this.onStateChange) this.onStateChange(this.state);
  }

  /**
   * Concludes the match and compiles complete session report
   */
  endGame() {
    this.state = 'GAME_OVER';
    this.clearAllTimers();

    const summary = this.getSummary();
    if (this.onGameOver) {
      this.onGameOver(summary);
    }
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  getMetrics() {
    return {
      score: this.score,
      hits: this.correctHits,
      misses: this.totalMisses,
      streak: this.currentStreak,
      highestStreak: this.highestStreak,
      comboMult: this.getComboMultiplier(),
      lastRT: this.lastReactionTime,
      avgRT: this.averageReactionTime,
      bestRT: this.bestReactionTime,
      deadline: this.currentDeadline
    };
  }

  getSummary() {
    const totalResolved = this.correctHits + this.totalMisses;
    const accuracy = totalResolved > 0
      ? Math.round((this.correctHits / totalResolved) * 100)
      : 0;

    return {
      score: this.score,
      hits: this.correctHits,
      misses: this.totalMisses,
      totalResolved,
      accuracy,
      avgRT: this.averageReactionTime,
      bestRT: this.bestReactionTime,
      highestStreak: this.highestStreak,
      difficulty: this.difficulty,
      isPractice: this.isPractice,
      reactionHistory: [...this.reactionHistory]
    };
  }
}

// Global game engine instance
window.gameEngine = new GameEngine();

