<template>
  <footer class="sticky-bottom bottom-0 w-full bg-gray-800 p-6">
    <CRow class="justify-between items-center text-white">
      <CCol sm="5">
        <p>TMC The Marketing Company GmbH & Co. KG</p>
        <p>Münchener Straße 41</p>
        <p>60329 Frankfurt am Main</p>
        <p>T +49 (0) 69 4 27 27 99 0</p>
      </CCol>
      <CCol sm="5">
        <nav class="space-x-4">
          <a class="text-white" target="_blank" href="https://tmc.one/impressum">Imprint</a>
          <a class="text-white" target="_blank" href="https://tmc.one/datenschutz">Privacy</a>
          <a class="text-white cursor-pointer" @click="router.push('/tos')">TOS</a>
        </nav>
      </CCol>
    </CRow>


  </footer>
</template>

<script setup lang="ts">
import { CCol, CRow } from '@coreui/vue';
import {useRouter} from "vue-router";

const router = useRouter();
</script>

<style scoped>
</style>