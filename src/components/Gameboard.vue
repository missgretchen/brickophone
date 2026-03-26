<template>
  <div class="gameboard">
    <GameControlHeader />
    <GameBall />
    <GameCursor :offsetPercentage="offsetPercentage"/>
  </div>
</template>

<script>

import GameControlHeader from './GameControlHeader.vue';
import GameCursor from './GameCursor.vue';
import GameBall from './GameBall.vue';

export default {
  name: 'GameBoard',
  components: { GameControlHeader, GameCursor, GameBall },
  methods: {
    onKeydown( event ) {
      if (event.key === "ArrowLeft" ) {
        this.offsetPercentage -= 2;
        if (this.offsetPercentage <= 0) {
          this.offsetPercentage = 100;
        }
      }
      if (event.key === "ArrowRight" ) {
        this.offsetPercentage += 2;
        if (this.offsetPercentage >= 98) {
          this.offsetPercentage = 0;
        }
      }
    }
  },

  data() {
    return {
        offsetPercentage: 50,
    };
  },

  mounted() {
    document.addEventListener( "keydown", this.onKeydown );
  },
}
</script>


<style scoped lang="scss">
.gameboard {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: $background;
}
</style>
