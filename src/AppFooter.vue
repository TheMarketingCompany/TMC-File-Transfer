<template>
  <div class="layout-footer" >
    <div class="grid">
      <div class="col-12 md:col-6  lg:col-3">
        <p>TMC The Marketing Company GmbH & Co. KG</p>
        <p>Münchener Straße 41</p>
        <p>60329 Frankfurt am Main</p>
        <p>T +49 (0) 69 4 27 27 99 0</p>
      </div>
      <div class="col-12 md:col-6 lg:col-3">
        <p>
          <a href="https://tmc.jetzt/impressum" target="_blank" rel="noopener noreferrer">Imprint</a>
        </p>
        <p>
          <a href="https://tmc.jetzt/datenschutz" target="_blank" rel="noopener noreferrer">Privacy</a>
        </p>
          <p @click="$router.push('tos')" >TOS</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AppFooter"
}
</script>

<style scoped>

</style>
