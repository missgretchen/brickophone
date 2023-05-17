<template>
    <div class="gameball" :style="`top: ${y}%; left: ${x}%`"/>
  </template>
  
  <script>

import GameBall from '../models/GameBall';

  export default {
    name: 'GameBall',
    methods: {
      async startBall() {
        while(this.gameActive) {
          this.x = this.gameball.nextX;
          this.y = this.gameball.nextY;
          await new Promise(resolve => setTimeout(resolve, 50))

        }
      }
    },
    data() {
        return {
            gameActive: true,
            gameball: new GameBall(),
            x: null,
            y: null,
        }
    },
    async mounted() {
      await this.startBall();
    }
  }
  </script>
  
  
  <style scoped lang="scss">
  .gameball {
    position: absolute;
    height: 60px;
    width: 60px;
    border-radius: 50%;
    background: $cursor-color;
  }
  </style>
  