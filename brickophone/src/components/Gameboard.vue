<template>
  <div class="gameboard">
    <GameControlHeader />
  </div>
</template>

<script>
import GameControlHeader from './GameControlHeader.vue';
export default {
  name: 'GameBoard',
  components: { GameControlHeader },
}
</script>


<style scoped lang="scss">
.gameboard {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: $background;
}
</style>
