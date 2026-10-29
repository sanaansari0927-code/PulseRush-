/**
 * REFLEX REACTOR — Persistent Local Storage & Records Manager
 * Handles all-time personal records, per-difficulty statistics, and streak tracking.
 */

class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'reflex_reactor_data_v1';
    this.defaultData = {
      highScore: 0,
      bestReactionTime: null, // ms
      highestStreak: 0,
      totalGamesPlayed: 0,
      totalCorrectHits: 0,
      totalMisses: 0,
      difficultyScores: {
        easy: 0,
        medium: 0,
        hard: 0
      },
      difficultyBestRT: {
        easy: null,
        medium: null,
        hard: null
      }
    };
    this.data = this.loadData();
  }

  loadData() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return { ...this.defaultData };
      const parsed = JSON.parse(raw);
      return {
        ...this.defaultData,
        ...parsed,
        difficultyScores: {
          ...this.defaultData.difficultyScores,
          ...(parsed.difficultyScores || {})
        },
        difficultyBestRT: {
          ...this.defaultData.difficultyBestRT,
          ...(parsed.difficultyBestRT || {})
        }
      };
    } catch (e) {
      console.warn('LocalStorage unavailable or corrupted, using defaults.', e);
      return { ...this.defaultData };
    }
  }

  saveData() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save to localStorage.', e);
    }
  }

  getRecords() {
    return this.data;
  }

  /**
   * Process a completed game session and update records if genuinely improved.
   * @param {Object} session
   * @returns {Object} updates flags { isNewHighScore, isNewBestRT, isNewStreak, isNewDiffBest }
   */
  processGameResult(session) {
    const { score, bestRT, highestStreak, hits, misses, difficulty } = session;

    const updates = {
      isNewHighScore: false,
      isNewBestRT: false,
      isNewStreak: false,
      isNewDiffBest: false
    };

    this.data.totalGamesPlayed += 1;
    this.data.totalCorrectHits += hits;
    this.data.totalMisses += misses;

    // Check all-time high score
    if (score > this.data.highScore) {
      this.data.highScore = score;
      updates.isNewHighScore = true;
    }

    // Check per-difficulty high score
    if (difficulty && (!this.data.difficultyScores[difficulty] || score > this.data.difficultyScores[difficulty])) {
      this.data.difficultyScores[difficulty] = score;
      updates.isNewDiffBest = true;
    }

    // Check all-time best reaction time (lowest positive ms)
    if (bestRT && bestRT > 0) {
      if (!this.data.bestReactionTime || bestRT < this.data.bestReactionTime) {
        this.data.bestReactionTime = Math.round(bestRT);
        updates.isNewBestRT = true;
      }
      if (difficulty && (!this.data.difficultyBestRT[difficulty] || bestRT < this.data.difficultyBestRT[difficulty])) {
        this.data.difficultyBestRT[difficulty] = Math.round(bestRT);
      }
    }

    // Check highest streak
    if (highestStreak > this.data.highestStreak) {
      this.data.highestStreak = highestStreak;
      updates.isNewStreak = true;
    }

    this.saveData();
    return updates;
  }

  resetAll() {
    this.data = { ...this.defaultData };
    this.saveData();
  }
}

// Global storage manager instance
window.storageManager = new StorageManager();

