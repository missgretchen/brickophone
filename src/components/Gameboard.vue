<template>
  <div class="gameboard">
    <GameControlHeader
      :score="score"
      :lives="lives"
      :status="statusText"
      @restart="restartGame"
    />
    <div ref="arena" class="arena">
      <div
        v-for="brick in bricks"
        :key="brick.id"
        class="brick"
        :style="{
          left: `${brick.x}px`,
          top: `${brick.y}px`,
          width: `${brick.width}px`,
          height: `${brick.height}px`,
          opacity: brick.alive ? 1 : 0
        }"
      />
      <div
        class="gameball"
        :style="{
          left: `${ball.x}px`,
          top: `${ball.y}px`,
          width: `${ball.size}px`,
          height: `${ball.size}px`
        }"
      />
      <div
        class="gamecursor"
        :style="{
          left: `${paddle.x}px`,
          width: `${paddle.width}px`,
          height: `${paddle.height}px`
        }"
      />
      <div v-if="overlayText" class="overlay">
        <p>{{ overlayText }}</p>
        <p class="hint">Press Space to launch the ball</p>
      </div>
    </div>
  </div>
</template>

<script>

import GameControlHeader from './GameControlHeader.vue';

export default {
  name: 'GameBoard',
  components: { GameControlHeader },
  methods: {
    syncArenaSize() {
      if (!this.$refs.arena) return;
      this.arenaWidth = this.$refs.arena.clientWidth;
      this.arenaHeight = this.$refs.arena.clientHeight;
      this.paddle.y = this.arenaHeight - this.paddle.height - 12;
      this.paddle.x = (this.arenaWidth - this.paddle.width) / 2;
      this.resetBall();
      this.createBricks();
    },
    createBricks() {
      const rows = 6;
      const cols = 10;
      const gap = 8;
      const sidePadding = 16;
      const topPadding = 24;
      const brickHeight = 22;
      const totalGap = gap * (cols - 1);
      const brickWidth = (this.arenaWidth - sidePadding * 2 - totalGap) / cols;
      const bricks = [];

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          bricks.push({
            id: `${row}-${col}`,
            x: sidePadding + col * (brickWidth + gap),
            y: topPadding + row * (brickHeight + gap),
            width: brickWidth,
            height: brickHeight,
            alive: true,
          });
        }
      }
      this.bricks = bricks;
    },
    resetBall() {
      this.ball.x = this.paddle.x + this.paddle.width / 2 - this.ball.size / 2;
      this.ball.y = this.paddle.y - this.ball.size - 10;
      this.ball.vx = 0;
      this.ball.vy = 0;
      this.waitingForLaunch = true;
    },
    launchBall() {
      if (!this.waitingForLaunch || !this.gameActive) return;
      const speed = this.ball.baseSpeed;
      this.ball.vx = speed * (Math.random() > 0.5 ? 1 : -1);
      this.ball.vy = -speed;
      this.waitingForLaunch = false;
    },
    onKeydown(event) {
      if (event.key === 'ArrowLeft' || event.key === 'a') {
        this.keys.left = true;
      }
      if (event.key === 'ArrowRight' || event.key === 'd') {
        this.keys.right = true;
      }
      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        this.launchBall();
      }
    },
    onKeyup(event) {
      if (event.key === 'ArrowLeft' || event.key === 'a') {
        this.keys.left = false;
      }
      if (event.key === 'ArrowRight' || event.key === 'd') {
        this.keys.right = false;
      }
    },
    intersects(a, b) {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    },
    loseLife() {
      this.lives -= 1;
      if (this.lives <= 0) {
        this.gameActive = false;
        this.statusText = 'Game over';
        this.overlayText = 'Game Over';
        return;
      }
      this.statusText = 'Life lost';
      this.resetBall();
    },
    restartGame() {
      this.score = 0;
      this.lives = 3;
      this.statusText = 'Press Space to start';
      this.overlayText = 'Ready';
      this.gameActive = true;
      this.waitingForLaunch = true;
      this.createBricks();
      this.resetBall();
    },
    tick(now) {
      if (!this.lastFrameTime) {
        this.lastFrameTime = now;
      }
      const dt = Math.min((now - this.lastFrameTime) / 1000, 0.033);
      this.lastFrameTime = now;
      this.updatePaddle(dt);
      this.updateBall(dt);
      this.animationFrame = window.requestAnimationFrame(this.tick);
    },
    updatePaddle(dt) {
      const speed = this.paddle.speed * dt;
      if (this.keys.left) {
        this.paddle.x -= speed;
      }
      if (this.keys.right) {
        this.paddle.x += speed;
      }
      if (this.paddle.x < 0) this.paddle.x = 0;
      const maxX = this.arenaWidth - this.paddle.width;
      if (this.paddle.x > maxX) this.paddle.x = maxX;

      if (this.waitingForLaunch) {
        this.ball.x = this.paddle.x + this.paddle.width / 2 - this.ball.size / 2;
      }
    },
    updateBall(dt) {
      if (!this.gameActive || this.waitingForLaunch) return;
      this.ball.x += this.ball.vx * dt;
      this.ball.y += this.ball.vy * dt;

      if (this.ball.x <= 0) {
        this.ball.x = 0;
        this.ball.vx *= -1;
      } else if (this.ball.x + this.ball.size >= this.arenaWidth) {
        this.ball.x = this.arenaWidth - this.ball.size;
        this.ball.vx *= -1;
      }

      if (this.ball.y <= 0) {
        this.ball.y = 0;
        this.ball.vy *= -1;
      }

      if (this.ball.y + this.ball.size >= this.arenaHeight) {
        this.loseLife();
        return;
      }

      const ballBox = {
        x: this.ball.x,
        y: this.ball.y,
        width: this.ball.size,
        height: this.ball.size,
      };
      const paddleBox = {
        x: this.paddle.x,
        y: this.paddle.y,
        width: this.paddle.width,
        height: this.paddle.height,
      };

      if (this.intersects(ballBox, paddleBox) && this.ball.vy > 0) {
        this.ball.y = this.paddle.y - this.ball.size;
        this.ball.vy = -Math.abs(this.ball.vy);
        const impact =
          (this.ball.x + this.ball.size / 2 - (this.paddle.x + this.paddle.width / 2)) /
          (this.paddle.width / 2);
        this.ball.vx = this.ball.baseSpeed * impact * 1.6;
      }

      let brokenBrick = false;
      for (const brick of this.bricks) {
        if (!brick.alive) continue;
        if (!this.intersects(ballBox, brick)) continue;

        brick.alive = false;
        this.score += 10;
        brokenBrick = true;

        const overlapLeft = ballBox.x + ballBox.width - brick.x;
        const overlapRight = brick.x + brick.width - ballBox.x;
        const overlapTop = ballBox.y + ballBox.height - brick.y;
        const overlapBottom = brick.y + brick.height - ballBox.y;

        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        if (minOverlapX < minOverlapY) {
          this.ball.vx *= -1;
        } else {
          this.ball.vy *= -1;
        }
        break;
      }

      if (brokenBrick && this.bricks.every((brick) => !brick.alive)) {
        this.gameActive = false;
        this.statusText = 'You win';
        this.overlayText = 'You cleared the board';
      } else if (!this.waitingForLaunch && this.gameActive) {
        this.statusText = 'In play';
        this.overlayText = '';
      }
    }
  },

  data() {
    return {
      arenaWidth: 0,
      arenaHeight: 0,
      animationFrame: null,
      lastFrameTime: 0,
      score: 0,
      lives: 3,
      gameActive: true,
      waitingForLaunch: true,
      statusText: 'Press Space to start',
      overlayText: 'Ready',
      keys: {
        left: false,
        right: false,
      },
      paddle: {
        x: 0,
        y: 0,
        width: 120,
        height: 18,
        speed: 540,
      },
      ball: {
        x: 0,
        y: 0,
        size: 16,
        baseSpeed: 340,
        vx: 0,
        vy: 0,
      },
      bricks: [],
    };
  },

  mounted() {
    this.syncArenaSize();
    window.addEventListener('resize', this.syncArenaSize);
    document.addEventListener('keydown', this.onKeydown);
    document.addEventListener('keyup', this.onKeyup);
    this.animationFrame = window.requestAnimationFrame(this.tick);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.syncArenaSize);
    document.removeEventListener('keydown', this.onKeydown);
    document.removeEventListener('keyup', this.onKeyup);
    if (this.animationFrame) {
      window.cancelAnimationFrame(this.animationFrame);
    }
  }
}
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
}

.gamecursor {
  position: absolute;
  bottom: 12px;
  background: $cursor-color;
}

.gameball {
  position: absolute;
  border-radius: 50%;
  background: $cursor-color;
}

.brick {
  position: absolute;
  background: #4f8fef;
  border-radius: 3px;
  transition: opacity 120ms linear;
}

.overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 8px;
  text-align: center;
  color: white;
  background: rgb(0 0 0 / 35%);
  pointer-events: none;
}

.hint {
  opacity: 0.85;
  font-size: 14px;
}
</style>
