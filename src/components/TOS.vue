<template>
  <div class="p-6 md-expressive-surface min-h-screen">
    <md-text-button @click="$router.back()" class="mb-4">
      <md-icon slot="icon">arrow_back</md-icon>
      Back
    </md-text-button>
    <div class="max-w-4xl mx-auto">
      <div class="bg-white rounded-lg shadow-sm p-8" style="background-color: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface);">
        
        <h1 class="text-4xl font-bold mb-3" style="color: var(--md-sys-color-primary);">Terms of Service</h1>
        <p class="text-sm opacity-70 mb-12">Last updated: {{ new Date().toLocaleDateString() }}</p>

        <div class="space-y-10">
          
          <section>
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-3" style="color: var(--md-sys-color-primary);">
              <span class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style="background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);">1</span>
              Acceptance of Terms
            </h2>
            <p class="text-lg leading-relaxed">
              By accessing and using this file transfer service ("Service"), you accept and agree to be bound by the terms and provision of this agreement. 
              <strong>If you do not agree to abide by the above, please do not use this service.</strong>
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-3" style="color: var(--md-sys-color-primary);">
              <span class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style="background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);">2</span>
              Description of Service
            </h2>
            <p class="text-lg leading-relaxed">
              This Service provides secure file upload, storage, and download capabilities. Files may be password-protected and have expiration dates. 
              The Service is provided on an "as-is" basis.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-3" style="color: var(--md-sys-color-primary);">
              <span class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style="background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);">3</span>
              User Conduct and Responsibilities
            </h2>
            <p class="text-lg leading-relaxed mb-4">You agree not to use the Service to:</p>
            <ul class="space-y-3 ml-6">
              <li class="flex items-start gap-3">
                <span class="text-red-500 mt-1">•</span>
                <span class="text-lg leading-relaxed">Upload, store, or share any content that is illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-red-500 mt-1">•</span>
                <span class="text-lg leading-relaxed">Violate any intellectual property rights of others</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-red-500 mt-1">•</span>
                <span class="text-lg leading-relaxed">Upload malware, viruses, or any malicious code</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-red-500 mt-1">•</span>
                <span class="text-lg leading-relaxed">Attempt to gain unauthorized access to the Service or other users' files</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-red-500 mt-1">•</span>
                <span class="text-lg leading-relaxed">Use the Service for commercial purposes without authorization</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-red-500 mt-1">•</span>
                <span class="text-lg leading-relaxed">Spam, harass, or abuse other users or the Service</span>
              </li>
            </ul>
            <p class="text-lg leading-relaxed mt-6 p-4 rounded-lg" style="background-color: var(--md-sys-color-surface-variant); color: var(--md-sys-color-on-surface-variant);">
              <strong>Important:</strong> You are solely responsible for all content you upload and share through the Service.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-3" style="color: var(--md-sys-color-primary);">
              <span class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style="background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);">4</span>
              File Storage and Retention
            </h2>
            <p class="text-lg leading-relaxed">
              Files uploaded to the Service may be automatically deleted after their expiration date or download limit is reached. 
              <strong>We do not guarantee permanent storage of any files.</strong> You should maintain backup copies of important files.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-3" style="color: var(--md-sys-color-primary);">
              <span class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style="background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);">5</span>
              Privacy and Data Protection
            </h2>
            <p class="text-lg leading-relaxed">
              We respect your privacy and handle your data in accordance with applicable data protection laws. 
              Files are stored securely and are only accessible to those with the proper download links and passwords (if set).
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-3" style="color: var(--md-sys-color-primary);">
              <span class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style="background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);">6</span>
              Prohibited Content
            </h2>
            <p class="text-lg leading-relaxed mb-4">The following types of content are strictly prohibited:</p>
            <ul class="space-y-3 ml-6">
              <li class="flex items-start gap-3">
                <span class="text-red-500 mt-1">•</span>
                <span class="text-lg leading-relaxed">Copyrighted material you do not own or have permission to share</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-red-500 mt-1">•</span>
                <span class="text-lg leading-relaxed">Personal information of others without their consent</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-red-500 mt-1">•</span>
                <span class="text-lg leading-relaxed">Illegal content or content that violates applicable laws</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="text-red-500 mt-1">•</span>
                <span class="text-lg leading-relaxed">Malicious software or executable files intended to harm</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-3" style="color: var(--md-sys-color-primary);">
              <span class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style="background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);">7</span>
              Service Availability
            </h2>
            <p class="text-lg leading-relaxed">
              We strive to maintain high availability but do not guarantee uninterrupted service. 
              The Service may be temporarily unavailable due to maintenance, updates, or technical issues.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-3" style="color: var(--md-sys-color-primary);">
              <span class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style="background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);">8</span>
              Limitation of Liability
            </h2>
            <p class="text-lg leading-relaxed">
              The Service is provided "as-is" without warranties of any kind. We shall not be liable for any direct, indirect, 
              incidental, or consequential damages resulting from your use of the Service.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-3" style="color: var(--md-sys-color-primary);">
              <span class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style="background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);">9</span>
              Termination
            </h2>
            <p class="text-lg leading-relaxed">
              We reserve the right to terminate or suspend access to the Service for violations of these terms 
              or for any other reason at our sole discretion.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-3" style="color: var(--md-sys-color-primary);">
              <span class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style="background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);">10</span>
              Changes to Terms
            </h2>
            <p class="text-lg leading-relaxed">
              These terms may be updated from time to time. Continued use of the Service after changes 
              constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-3" style="color: var(--md-sys-color-primary);">
              <span class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style="background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);">11</span>
              Contact Information
            </h2>
            <p class="text-lg leading-relaxed">
              For questions about these Terms of Service, please contact the service administrator.
            </p>
          </section>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Material 3 components are imported globally
</script>

<style scoped>

</style>