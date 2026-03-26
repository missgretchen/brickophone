<template>
  <div class="visualizer-wrap">
    <canvas ref="canvas" class="visualizer-canvas" />
  </div>
</template>

<script>
export default {
  name: "WaveformVisualizer",
  props: {
    synth: {
      type: Object,
      required: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      rafId: null,
    };
  },
  methods: {
    draw() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const data = this.synth?.getWaveformData?.();
      if (data && this.active) {
        ctx.strokeStyle = "#32ade6";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < data.length; i += 1) {
          const x = (i / (data.length - 1)) * width;
          const y = (data[i] / 255) * height;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = '11px "Press Start 2P", "Courier New", monospace';
        ctx.fillText("NO SIGNAL", 12, height / 2 + 14);
      }

      this.rafId = window.requestAnimationFrame(this.draw);
    },
  },
  mounted() {
    this.rafId = window.requestAnimationFrame(this.draw);
  },
  beforeUnmount() {
    if (this.rafId) window.cancelAnimationFrame(this.rafId);
  },
};
</script>

<style scoped lang="scss">
.visualizer-wrap {
  width: 100%;
  height: 92px;
  border: 1px solid rgb(255 255 255 / 28%);
  background: #050505;
}

.visualizer-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
