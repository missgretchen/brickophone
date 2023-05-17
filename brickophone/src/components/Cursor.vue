<template>
    <div class="cursor" :style="`left: ${offsetPercentage}%`"/>
  </template>
  
  <script>
  export default {
    name: 'GameControlHeader',
    props: {
        offsetPercentage: {
            default: 50,
        }
    }
  }
  </script>
  
  
  <style scoped lang="scss">
  .cursor {
    position: absolute;
    bottom: 0;
    height: 60px;
    width: 120px;
    background: $cursor-color;
  }
  </style>
  