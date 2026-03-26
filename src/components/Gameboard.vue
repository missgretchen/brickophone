<template>
  <div class="gameboard">
    <GameControlHeader
      :score="score"
      :lives="activeBrickCount"
      :status="statusText"
      @restart="restartGame"
    />

    <div ref="arena" class="arena">
      <div class="ground-line" :style="{ top: `${groundY}px` }" />

      <div
        v-for="brick in bricks"
        :key="brick.id"
        class="brick"
        :class="{ inactive: brick.manualMuted, ghost: !brick.active && !brick.manualMuted, flash: brick.flash }"
        :style="{
          left: `${brick.x}px`,
          top: `${brick.y}px`,
          width: `${brick.width}px`,
          height: `${brick.height}px`,
          background: brick.color
        }"
        @click="toggleBrick(brick.id)"
      />

      <div
        v-for="ball in balls"
        :key="ball.id"
        class="gameball"
        :class="{ draggable: !started || paused }"
        :style="{
          left: `${ball.x}px`,
          top: `${ball.y}px`,
          width: `${ball.size}px`,
          height: `${ball.size}px`
        }"
        @pointerdown="onBallPointerDown($event, ball.id)"
      />

      <aside class="controls">
        <h3>Instrument Dashboard</h3>
        <WaveformVisualizer :synth="synth" :active="started && !paused" class="visualizer" />

        <section class="control-panel">
          <h4>Pitch</h4>
          <label>
            Key
            <select v-model="keyRoot">
              <option v-for="note in NOTE_NAMES" :key="note" :value="note">{{ note }}</option>
            </select>
          </label>
          <label>
            Scale
            <select v-model="scaleName">
              <option v-for="name in Object.keys(SCALES)" :key="name" :value="name">{{ name }}</option>
            </select>
          </label>
          <label>
            Wave
            <select v-model="waveform">
              <option value="square">square</option>
              <option value="sawtooth">saw</option>
              <option value="triangle">triangle</option>
              <option value="sine">sine</option>
            </select>
          </label>
        </section>

        <section class="control-panel">
          <h4>Tone</h4>
          <label>
            Filter
            <input v-model.number="cutoff" type="range" min="300" max="6000" step="20" @input="applyFilter" />
          </label>
          <label>
            Resonance
            <input v-model.number="resonance" type="range" min="0.2" max="12" step="0.1" @input="applyFilter" />
          </label>
        </section>

        <section class="control-panel">
          <h4>Pattern</h4>
          <label>
            Density
            <input v-model.number="density" type="range" min="10" max="100" step="5" />
          </label>
          <label>
            Respawn Base
            <input v-model.number="respawnMs" type="range" min="80" max="900" step="20" />
          </label>
          <label>
            Respawn Jitter
            <input v-model.number="respawnJitterMs" type="range" min="0" max="700" step="10" />
          </label>
        </section>

        <section class="control-panel">
          <h4>Actions</h4>
          <div class="control-buttons">
            <button :disabled="started && !paused" @click="addBall">Add Ball</button>
            <button @click="randomizeLayout">Randomize</button>
            <button @click="fillLayout">Fill</button>
            <button @click="clearLayout">Clear</button>
          </div>
        </section>

        <p class="hint">Drag ball before start or while paused. Space toggles autoplay pause/resume. Click bricks to mute/unmute notes and shape loops.</p>
      </aside>
    </div>
  </div>
</template>

<script>
import GameControlHeader from "./GameControlHeader.vue";
import SynthEngine from "../audio/SynthEngine";
import WaveformVisualizer from "./WaveformVisualizer.vue";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const SCALES = {
  minorPentatonic: [0, 3, 5, 7, 10],
  majorPentatonic: [0, 2, 4, 7, 9],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
};

export default {
  name: "GameBoard",
  components: { GameControlHeader, WaveformVisualizer },
  data() {
    return {
      NOTE_NAMES,
      SCALES,
      arenaWidth: 0,
      arenaHeight: 0,
      animationFrame: null,
      lastFrameTime: 0,
      score: 0,
      statusText: "SPACE TO START AUTOPLAY",
      started: false,
      paused: false,
      rows: 6,
      cols: 10,
      density: 80,
      keyRoot: "C",
      scaleName: "minorPentatonic",
      waveform: "square",
      cutoff: 2200,
      resonance: 0.8,
      respawnMs: 180,
      respawnJitterMs: 220,
      synth: new SynthEngine(),
      draggingBallId: null,
      nextBallId: 2,
      balls: [],
      bricks: [],
    };
  },
  computed: {
    activeBrickCount() {
      return this.bricks.filter((brick) => brick.active).length;
    },
    groundY() {
      if (!this.bricks.length) return Math.max(0, this.arenaHeight - 40);
      const bottomBrick = this.bricks.reduce(
        (max, brick) => Math.max(max, brick.y + brick.height),
        0
      );
      return Math.min(this.arenaHeight - 20, bottomBrick + 12);
    },
  },
  methods: {
    syncArenaSize() {
      if (!this.$refs.arena) return;
      this.arenaWidth = this.$refs.arena.clientWidth;
      this.arenaHeight = this.$refs.arena.clientHeight;
      this.createBricks();
      this.resetBalls();
    },
    createBricks() {
      const gap = 8;
      const sidePadding = 16;
      const topPadding = 20;
      const brickHeight = 22;
      const totalGap = gap * (this.cols - 1);
      const brickWidth = (this.arenaWidth - sidePadding * 2 - totalGap) / this.cols;
      const palette = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#32ade6", "#af52de"];
      const next = [];

      for (let row = 0; row < this.rows; row += 1) {
        for (let col = 0; col < this.cols; col += 1) {
          next.push({
            id: `${row}-${col}`,
            row,
            col,
            x: sidePadding + col * (brickWidth + gap),
            y: topPadding + row * (brickHeight + gap),
            width: brickWidth,
            height: brickHeight,
            color: palette[row % palette.length],
            active: true,
            manualMuted: false,
            flash: false,
          });
        }
      }
      this.bricks = next;
    },
    createBall({ x, y, vx = 0, vy = 0 } = {}) {
      const size = 16;
      const speed = 300;
      const centerX = this.arenaWidth / 2 - size / 2;
      const startX = x ?? centerX;
      const startY = y ?? this.groundY - size;
      return {
        id: this.nextBallId++,
        x: Math.max(0, startX),
        y: Math.max(0, startY),
        size,
        speed,
        vx,
        vy,
      };
    },
    resetBalls() {
      const centerX = this.arenaWidth / 2 - 8;
      const ball = this.createBall({
        x: centerX,
        y: this.groundY - 16,
        vx: 0,
        vy: 0,
      });
      ball.id = 1;
      this.nextBallId = 2;
      this.balls = [ball];
      this.started = false;
      this.paused = false;
    },
    randomVelocity(speed = 300) {
      const angle = (Math.random() * 0.8 + 0.2) * (Math.random() > 0.5 ? 1 : -1);
      return {
        vx: speed * angle,
        vy: -speed,
      };
    },
    addBall() {
      if (this.started && !this.paused) return;
      const offset = (this.balls.length % 5) * 14 - 28;
      const x = this.arenaWidth / 2 - 8 + offset;
      const y = this.groundY - 16;
      const ball = this.createBall({ x, y });
      this.balls = [...this.balls, ball];
    },
    async startAutoplay() {
      await this.synth.resume();
      this.applyFilter();
      if (this.started) {
        this.paused = false;
        this.statusText = "AUTOPLAY ACTIVE";
        this.balls = this.balls.map((ball) => {
          if (Math.hypot(ball.vx, ball.vy) > 0.5) return ball;
          const velocity = this.randomVelocity(ball.speed);
          return {
            ...ball,
            vx: velocity.vx,
            vy: velocity.vy,
          };
        });
        return;
      }
      this.started = true;
      this.paused = false;
      this.statusText = "AUTOPLAY ACTIVE";
      this.balls = this.balls.map((ball) => {
        if (Math.hypot(ball.vx, ball.vy) > 0) return ball;
        const velocity = this.randomVelocity(ball.speed);
        return {
          ...ball,
          vx: velocity.vx,
          vy: velocity.vy,
        };
      });
    },
    pauseAutoplay() {
      if (!this.started) return;
      this.paused = true;
      this.statusText = "PAUSED - SPACE TO RESUME";
    },
    toggleAutoplay() {
      if (!this.started || this.paused) {
        this.startAutoplay();
      } else {
        this.pauseAutoplay();
      }
    },
    restartGame() {
      this.score = 0;
      this.statusText = "SPACE TO START AUTOPLAY";
      this.createBricks();
      this.resetBalls();
    },
    clearLayout() {
      this.bricks = this.bricks.map((brick) => ({ ...brick, active: false, manualMuted: true }));
    },
    fillLayout() {
      this.bricks = this.bricks.map((brick) => ({ ...brick, active: true, manualMuted: false }));
    },
    randomizeLayout() {
      const threshold = this.density / 100;
      this.bricks = this.bricks.map((brick) => {
        const active = Math.random() < threshold;
        return {
          ...brick,
          active,
          manualMuted: !active,
        };
      });
    },
    toggleBrick(id) {
      this.bricks = this.bricks.map((brick) =>
        brick.id === id
          ? {
              ...brick,
              manualMuted: !brick.manualMuted,
              active: brick.manualMuted ? true : false,
            }
          : brick
      );
    },
    applyFilter() {
      this.synth.setFilter(this.cutoff, this.resonance);
    },
    onKeydown(event) {
      if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        this.toggleAutoplay();
      }
      if (event.key === "r" || event.key === "R") {
        this.restartGame();
      }
    },
    clampBallToArena(x, y, size = 16) {
      const maxX = Math.max(0, this.arenaWidth - size);
      const maxY = Math.max(0, this.groundY - size);
      return {
        x: Math.min(Math.max(0, x), maxX),
        y: Math.min(Math.max(0, y), maxY),
      };
    },
    onBallPointerDown(event, ballId) {
      if (this.started && !this.paused) return;
      this.draggingBallId = ballId;
      event.preventDefault();
    },
    onPointerMove(event) {
      if (!this.draggingBallId || !this.$refs.arena) return;
      const rect = this.$refs.arena.getBoundingClientRect();
      this.balls = this.balls.map((ball) => {
        if (ball.id !== this.draggingBallId) return ball;
        const x = event.clientX - rect.left - ball.size / 2;
        const y = event.clientY - rect.top - ball.size / 2;
        const clamped = this.clampBallToArena(x, y, ball.size);
        return {
          ...ball,
          x: clamped.x,
          y: clamped.y,
          vx: 0,
          vy: 0,
        };
      });
    },
    onPointerUp() {
      this.draggingBallId = null;
    },
    intersects(a, b) {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    },
    flashBrick(id) {
      this.bricks = this.bricks.map((brick) => (brick.id === id ? { ...brick, flash: true } : brick));
      window.setTimeout(() => {
        this.bricks = this.bricks.map((brick) => (brick.id === id ? { ...brick, flash: false } : brick));
      }, 80);
    },
    triggerBrickSound(brick) {
      if (!brick.active || brick.manualMuted) return;
      const rowFromBottom = this.rows - 1 - brick.row;
      const octave = 3 + Math.floor(rowFromBottom / 2);
      const degree = brick.col + rowFromBottom;
      this.synth.triggerNote({
        key: this.keyRoot,
        octave,
        degree,
        scale: this.SCALES[this.scaleName],
        waveform: this.waveform,
        velocity: 0.26 + rowFromBottom * 0.05,
        duration: 0.12 + (brick.col % 4) * 0.03,
      });
      this.score += 1;
      this.flashBrick(brick.id);
      this.bricks = this.bricks.map((item) =>
        item.id === brick.id ? { ...item, active: false } : item
      );
      const jitter = (Math.random() * 2 - 1) * this.respawnJitterMs;
      const respawnDelay = Math.max(40, this.respawnMs + jitter);
      window.setTimeout(() => {
        this.bricks = this.bricks.map((item) => {
          if (item.id !== brick.id || item.manualMuted) return item;
          return { ...item, active: true };
        });
      }, respawnDelay);
    },
    tick(now) {
      if (!this.lastFrameTime) this.lastFrameTime = now;
      const dt = Math.min((now - this.lastFrameTime) / 1000, 0.033);
      this.lastFrameTime = now;
      this.updateBalls(dt);
      this.animationFrame = window.requestAnimationFrame(this.tick);
    },
    updateBalls(dt) {
      if (!this.started || this.paused) return;
      this.balls = this.balls.map((ball) => {
        let next = { ...ball };
        next.x += next.vx * dt;
        next.y += next.vy * dt;

        if (next.x <= 0) {
          next.x = 0;
          next.vx = Math.abs(next.vx);
        } else if (next.x + next.size >= this.arenaWidth) {
          next.x = this.arenaWidth - next.size;
          next.vx = -Math.abs(next.vx);
        }

        if (next.y <= 0) {
          next.y = 0;
          next.vy = Math.abs(next.vy);
        } else if (next.y + next.size >= this.groundY) {
          next.y = this.groundY - next.size;
          next.vy = -Math.abs(next.vy);
          const offset = (next.x + next.size / 2) / Math.max(this.arenaWidth, 1) - 0.5;
          next.vx += offset * 140;
        }

        const speed = Math.hypot(next.vx, next.vy);
        const normalize = next.speed / Math.max(speed, 1);
        next.vx *= normalize;
        next.vy *= normalize;

        const ballBox = {
          x: next.x,
          y: next.y,
          width: next.size,
          height: next.size,
        };

        for (const brick of this.bricks) {
          if (!brick.active) continue;
          if (!this.intersects(ballBox, brick)) continue;

          const overlapLeft = ballBox.x + ballBox.width - brick.x;
          const overlapRight = brick.x + brick.width - ballBox.x;
          const overlapTop = ballBox.y + ballBox.height - brick.y;
          const overlapBottom = brick.y + brick.height - ballBox.y;

          const minOverlapX = Math.min(overlapLeft, overlapRight);
          const minOverlapY = Math.min(overlapTop, overlapBottom);

          if (minOverlapX < minOverlapY) {
            next.vx *= -1;
          } else {
            next.vy *= -1;
          }

          this.triggerBrickSound(brick);
          break;
        }
        return next;
      });
    },
  },
  mounted() {
    this.syncArenaSize();
    window.addEventListener("resize", this.syncArenaSize);
    document.addEventListener("keydown", this.onKeydown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    this.animationFrame = window.requestAnimationFrame(this.tick);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.syncArenaSize);
    document.removeEventListener("keydown", this.onKeydown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    if (this.animationFrame) {
      window.cancelAnimationFrame(this.animationFrame);
    }
  },
};
</script>

<style scoped lang="scss">
.gameboard {
  display: grid;
  grid-template-rows: 60px 1fr;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: $background;
}

.arena {
  position: relative;
  overflow: hidden;
  background: #050505;
  background-image:
    linear-gradient(to right, rgb(255 255 255 / 5%) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(255 255 255 / 5%) 1px, transparent 1px);
  background-size: 20px 20px;
}

.ground-line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 3px;
  background: #ffffff;
  opacity: 0.7;
  z-index: 1;
}

.gameball {
  position: absolute;
  border-radius: 50%;
  border: 2px solid #101010;
  background: #ffffff;
  z-index: 2;
  touch-action: none;
}

.gameball.draggable {
  cursor: grab;
}

.gameball.draggable:active {
  cursor: grabbing;
}

.brick {
  position: absolute;
  border-radius: 2px;
  border: 2px solid #101010;
  transition: opacity 80ms linear, transform 80ms linear;
  cursor: pointer;
}

.brick.inactive {
  opacity: 0.15;
  filter: grayscale(0.8);
}

.brick.ghost {
  opacity: 0.28;
}

.brick.flash {
  transform: scale(1.03);
}

.controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  align-items: end;
  padding: 12px;
  border-top: 2px solid rgb(255 255 255 / 22%);
  background: rgb(0 0 0 / 88%);
  z-index: 3;
}

.controls h3 {
  margin: 0;
  font-size: 11px;
  text-transform: uppercase;
  grid-column: 1 / -1;
}

.visualizer {
  grid-column: 1 / -1;
}

.control-panel {
  display: grid;
  gap: 8px;
  align-content: start;
  padding: 8px;
  border: 1px solid rgb(255 255 255 / 18%);
  background: rgb(255 255 255 / 2%);
}

.control-panel h4 {
  margin: 0;
  font-size: 10px;
  text-transform: uppercase;
  opacity: 0.92;
}

.controls label {
  display: grid;
  gap: 4px;
  font-size: 10px;
  text-transform: uppercase;
}

.controls select,
.controls input,
.controls button {
  font: inherit;
}

.controls select,
.controls input[type="range"] {
  width: 100%;
}

.control-buttons {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.control-buttons button {
  padding: 6px 4px;
  border: 1px solid rgb(255 255 255 / 40%);
  background: #111;
  color: white;
  cursor: pointer;
}

.control-buttons button:hover {
  border-color: white;
}

.control-buttons button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  border-color: rgb(255 255 255 / 22%);
}

.hint {
  margin: 0;
  font-size: 10px;
  line-height: 1.4;
  opacity: 0.85;
  grid-column: 1 / -1;
}

@media (max-width: 900px) {
  .controls {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
