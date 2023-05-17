<template>
    <div class="gamecursor" :style="`left: ${offsetPercentage}%`"/>
  </template>
  
  <script>
  export default {
    name: 'GameCursor',
    props: {
        offsetPercentage: {
            default: 50,
        }
    }
  }
  </script>
  
  
  <style scoped lang="scss">
  .gamecursor {
    position: absolute;
    bottom: 0;
    height: 60px;
    width: 120px;
    background: $cursor-color;
  }
  </style>
  