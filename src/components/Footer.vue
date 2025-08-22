<template>
  <footer class="sticky bottom-0 w-full p-6" style="background-color: var(--md-sys-color-surface-container-high);">
    <div class="flex flex-col md:flex-row justify-between items-center gap-4" style="color: var(--md-sys-color-on-surface);">
      <div class="text-center md:text-left">
        <p class="font-medium mb-1">{{ companyName }}</p>
        <p class="text-sm opacity-80">{{ companyAddress1 }}, {{ companyAddress2 }}</p>
        <p class="text-sm opacity-80">{{ companyPhone }}</p>
      </div>
      <div class="text-center md:text-right">
        <nav class="flex flex-wrap gap-4 justify-center md:justify-end">
          <a v-if="imprintUrl" class="text-sm hover:underline" style="color: var(--md-sys-color-primary);" target="_blank" :href="imprintUrl">Imprint</a>
          <a v-if="privacyUrl" class="text-sm hover:underline" style="color: var(--md-sys-color-primary);" target="_blank" :href="privacyUrl">Privacy</a>
          <a class="text-sm hover:underline cursor-pointer" style="color: var(--md-sys-color-primary);" @click="router.push('/tos')">Terms</a>
        </nav>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const companyName = import.meta.env.VITE_COMPANY_NAME || "TMC The Marketing Company GmbH & Co. KG";
const companyAddress1 = import.meta.env.VITE_COMPANY_ADDRESS_LINE1 || "Münchener Straße 41";
const companyAddress2 = import.meta.env.VITE_COMPANY_ADDRESS_LINE2 || "60329 Frankfurt am Main";
const companyPhone = import.meta.env.VITE_COMPANY_PHONE || "T +49 (0) 69 4 27 27 99 0";
const imprintUrl = import.meta.env.VITE_IMPRINT_URL || "";
const privacyUrl = import.meta.env.VITE_PRIVACY_URL || "";
</script>

<style scoped>
</style>