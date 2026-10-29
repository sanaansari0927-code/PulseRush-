/**
 * REFLEX REACTOR — Particle & Visual FX System
 * High-performance 60FPS Canvas FX: Ambient Cyber Dust, Spark Bursts, and Victory Confetti.
 */

class ParticleEngine {
  constructor() {
    this.canvas = document.getElementById('particle-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.ambientParticles = [];
    this.sparkParticles = [];
    this.confettiParticles = [];
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.isRunning = true;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.resize();
    this.initAmbient();
    window.addEventListener('resize', () => this.resize());
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    if (!this.canvas) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  initAmbient() {
    if (this.reducedMotion) return;
    this.ambientParticles = [];
    const count = Math.min(40, Math.floor((this.width * this.height) / 25000));
    for (let i = 0; i < count; i++) {
      this.ambientParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        colorRgb: Math.random() > 0.5 ? '0, 243, 255' : '181, 55, 242',
        alpha: Math.random() * 0.4 + 0.1,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  }

  /**
   * Explode radiant neon sparks when a target panel is struck
   */
  spawnHitSparks(x, y, color = 'cyan') {
    if (this.reducedMotion) return;
    const count = 22;
    const colors = color === 'green'
      ? ['#00ff88', '#ffffff', '#22c55e']
      : ['#00f3ff', '#b537f2', '#ffffff'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.sparkParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.03 + 0.025,
        drag: 0.94
      });
    }
  }

  /**
   * Confetti celebration for new high scores or victories
   */
  spawnConfetti() {
    if (this.reducedMotion) return;
    const confettiColors = ['#00f3ff', '#b537f2', '#00ff88', '#ffaa00', '#ff2a5f', '#ffffff'];
    for (let i = 0; i < 90; i++) {
      this.confettiParticles.push({
        x: this.width * 0.5 + (Math.random() - 0.5) * 300,
        y: this.height * 0.35 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 12 - 5,
        gravity: 0.25,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 3,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        alpha: 1,
        decay: Math.random() * 0.012 + 0.008
      });
    }
  }

  loop() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Render ambient motes
    if (!this.reducedMotion && this.ambientParticles.length > 0) {
      for (const p of this.ambientParticles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulsePhase += p.pulseSpeed;

        if (p.x < 0) p.x = this.width;
        if (p.x > this.width) p.x = 0;
        if (p.y < 0) p.y = this.height;
        if (p.y > this.height) p.y = 0;

        const currentAlpha = p.alpha + Math.sin(p.pulsePhase) * 0.15;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${p.colorRgb}, ${Math.max(0.05, currentAlpha)})`;
        this.ctx.fill();
      }
    }

    // 2. Render hit sparks
    for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
      const sp = this.sparkParticles[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vx *= sp.drag;
      sp.vy *= sp.drag;
      sp.alpha -= sp.decay;

      if (sp.alpha <= 0) {
        this.sparkParticles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, sp.alpha);
      this.ctx.fillStyle = sp.color;
      this.ctx.shadowColor = sp.color;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 3. Render celebratory confetti
    for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
      const cp = this.confettiParticles[i];
      cp.x += cp.vx;
      cp.vy += cp.gravity;
      cp.y += cp.vy;
      cp.rotation += cp.rotSpeed;
      cp.alpha -= cp.decay;

      if (cp.alpha <= 0 || cp.y > this.height + 20) {
        this.confettiParticles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, cp.alpha);
      this.ctx.translate(cp.x, cp.y);
      this.ctx.rotate((cp.rotation * Math.PI) / 180);
      this.ctx.fillStyle = cp.color;
      this.ctx.fillRect(-cp.w / 2, -cp.h / 2, cp.w, cp.h);
      this.ctx.restore();
    }

    requestAnimationFrame(this.loop);
  }
}

// Instantiate particle engine when DOM loads
window.addEventListener('DOMContentLoaded', () => {
  window.particleEngine = new ParticleEngine();
});
