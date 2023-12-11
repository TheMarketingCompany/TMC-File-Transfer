<template>
  <div class="flex flex-col justify-center items-center min-h-screen">
    <main class="flex-grow">
      <router-view/>
    </main>

    <Footer/>
  </div>
</template>

<script setup lang="ts">
import Footer from "./components/Footer.vue";
</script>

<style>
</style>
