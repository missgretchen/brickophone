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
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: white;
}
</style>
