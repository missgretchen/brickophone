<template>
  <GameBoard/>
</template>

<script>
import GameBoard from './components/Gameboard.vue'

export default {
  name: 'App',
  components: {
    GameBoard
  }
}
</script>

<style lang="scss">
@use "./assets/_shared.scss";
#app {
  font-family: "Press Start 2P", "Courier New", "Lucida Console", monospace;
  color: white;
  line-height: 1.3;
}
</style>
