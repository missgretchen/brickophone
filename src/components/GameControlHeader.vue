<template>
    <div class="game-control-header">
      <div class="title">brickophone</div>
      <div class="status">
        <span>Hits: {{ score }}</span>
        <span>Bricks: {{ lives }}</span>
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
    flex-wrap: wrap;
    gap: 8px 14px;
    min-height: 60px;
    padding: 8px 12px;
    box-sizing: border-box;
    background: $background;
    border-bottom: 1px solid rgb(255 255 255 / 20%);
  }

  .title {
    flex: 0 0 auto;
    letter-spacing: 0.06em;
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .status {
    display: flex;
    flex: 1 1 280px;
    min-width: 0;
    justify-content: center;
    gap: 10px;
    font-size: 12px;
    opacity: 0.95;
    white-space: nowrap;
  }

  .restart {
    flex: 0 0 auto;
    min-height: 36px;
    padding: 8px 14px;
    border: 1px solid rgb(255 255 255 / 40%);
    border-radius: 2px;
    background: #111;
    color: white;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    transition: background-color 120ms ease, border-color 120ms ease, transform 120ms ease;
  }

  .restart:hover {
    border-color: white;
    background: #1c1c1c;
  }

  .restart:active {
    transform: translateY(1px);
  }

  @media (max-width: 760px) {
    .status {
      order: 3;
      flex: 1 1 100%;
      justify-content: flex-start;
      overflow-x: auto;
      padding-bottom: 2px;
    }
  }
  </style>
  
