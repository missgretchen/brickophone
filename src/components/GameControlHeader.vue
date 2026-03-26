<template>
    <div class="game-control-header">
      <div class="title">brickophone</div>
      <div class="status">
        <span>Score: {{ score }}</span>
        <span>Lives: {{ lives }}</span>
        <span>{{ status }}</span>
      </div>
      <button class="restart" @click="$emit('restart')">Restart</button>
    </div>
  </template>
  
  <script>
  export default {
    name: 'GameControlHeader',
    emits: ['restart'],
    props: {
      score: {
        type: Number,
        default: 0,
      },
      lives: {
        type: Number,
        default: 3,
      },
      status: {
        type: String,
        default: 'Press Space to start',
      },
    },
  }
  </script>
  
  
  <style scoped lang="scss">
  .game-control-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    height: 60px;
    padding: 0 10px;
    width: 100%;
    background: $background;
    border-bottom: 1px solid white;
  }

  .title {
    font-weight: 700;
    text-transform: lowercase;
  }

  .status {
    display: flex;
    gap: 20px;
    font-size: 14px;
  }

  .restart {
    padding: 8px 12px;
    border: 1px solid white;
    background: transparent;
    color: white;
    cursor: pointer;
  }
  </style>
  
