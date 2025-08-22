<template>
  <div class="min-h-screen md-expressive-surface flex items-center justify-center p-4">
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-8 md-expressive-fade-in">
        <h1 class="md-expressive-headline mb-4">File Transfer</h1>
        <p class="md-expressive-body">Share files quickly and securely</p>
      </div>

      <!-- Upload Form -->
      <div class="md-expressive-card md-expressive-slide-up">
        <div v-if="!uploading && !uploadResult" class="space-y-6">
          <!-- File Drop Zone -->
          <div 
            @drop.prevent="handleDrop"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @dragenter.prevent
            :class="[
              'relative rounded-3xl p-12 text-center transition-all duration-300 border-2 border-dashed',
              'min-h-[240px] flex flex-col items-center justify-center',
              dragOver 
                ? 'border-primary bg-primary/5 scale-105 shadow-lg' 
                : 'border-outline-variant hover:border-primary hover:bg-surface-container-high'
            ]"
            style="background-color: var(--md-sys-color-surface-container-low); border-color: var(--md-sys-color-outline-variant);"
          >
            <input 
              ref="fileInput"
              type="file" 
              @change="handleFileSelect" 
              class="hidden"
              :accept="allowedTypes"
            />
            
            <div v-if="!selectedFile" class="md-expressive-scale-in">
              <md-icon class="text-6xl mb-6" style="color: var(--md-sys-color-primary); font-size: 4rem;">cloud_upload</md-icon>
              <h3 class="text-xl font-medium mb-2" style="color: var(--md-sys-color-on-surface);">Drop your file here</h3>
              <p class="mb-6" style="color: var(--md-sys-color-on-surface-variant);">or browse to choose a file</p>
              <md-filled-button 
                @click="$refs.fileInput.click()" 
                class="md-expressive-button mb-4"
              >
                <md-icon slot="icon">folder_open</md-icon>
                Browse Files
              </md-filled-button>
              <p class="text-sm" style="color: var(--md-sys-color-on-surface-variant);">
                Supports files up to 5GB • Large files use optimized chunked upload
              </p>
            </div>
            
            <div v-else class="md-expressive-scale-in space-y-4">
              <md-icon class="text-6xl mb-4 text-success" style="color: var(--md-sys-color-success); font-size: 4rem;">check_circle</md-icon>
              <div class="text-center">
                <h3 class="text-xl font-medium mb-2" style="color: var(--md-sys-color-on-surface);">{{ selectedFile.name }}</h3>
                <p class="text-lg" style="color: var(--md-sys-color-on-surface-variant);">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
              <md-text-button 
                @click="clearFile" 
                class="mt-4"
                style="--md-text-button-label-text-color: var(--md-sys-color-error);"
              >
                <md-icon slot="icon">delete</md-icon>
                Remove File
              </md-text-button>
            </div>
          </div>

          <!-- Upload Options -->
          <div class="grid md:grid-cols-2 gap-6">
            <!-- Expiration -->
            <div>
              <h4 class="text-lg font-medium mb-3" style="color: var(--md-sys-color-on-surface);">
                <md-icon class="mr-2 align-middle">schedule</md-icon>
                File Expiration
              </h4>
              <md-outlined-select 
                :value="options.lifetime"
                @change="options.lifetime = $event.target.value"
                class="w-full md-expressive-field"
                required
              >
                <md-select-option value="1">
                  <div slot="headline">1 Day</div>
                </md-select-option>
                <md-select-option value="7" selected>
                  <div slot="headline">1 Week</div>
                </md-select-option>
                <md-select-option value="30">
                  <div slot="headline">1 Month</div>
                </md-select-option>
              </md-outlined-select>
            </div>

            <!-- Max Downloads -->
            <div>
              <h4 class="text-lg font-medium mb-3" style="color: var(--md-sys-color-on-surface);">
                <md-icon class="mr-2 align-middle">download</md-icon>
                Download Limit
              </h4>
              <md-outlined-select 
                :value="options.maxDownloads"
                @change="options.maxDownloads = parseInt($event.target.value)"
                class="w-full md-expressive-field"
                required
              >
                <md-select-option :value="1">
                  <div slot="headline">1 Download (One-time)</div>
                </md-select-option>
                <md-select-option :value="5">
                  <div slot="headline">5 Downloads</div>
                </md-select-option>
                <md-select-option :value="10" selected>
                  <div slot="headline">10 Downloads</div>
                </md-select-option>
                <md-select-option :value="25">
                  <div slot="headline">25 Downloads</div>
                </md-select-option>
                <md-select-option :value="999999">
                  <div slot="headline">Unlimited</div>
                </md-select-option>
              </md-outlined-select>
            </div>
          </div>

          <!-- Password Protection -->
          <div class="md-expressive-surface-container rounded-2xl p-6">
            <label class="flex items-center space-x-4 cursor-pointer">
              <md-checkbox 
                :checked="options.passwordEnabled"
                @change="options.passwordEnabled = $event.target.checked"
                class="md-expressive-checkbox"
              ></md-checkbox>
              <div class="flex-1">
                <h4 class="text-lg font-medium" style="color: var(--md-sys-color-on-surface);">
                  <md-icon class="mr-2 align-middle">lock</md-icon>
                  Password Protection
                </h4>
                <p class="text-sm mt-1" style="color: var(--md-sys-color-on-surface-variant);">
                  Secure your file with a password
                </p>
              </div>
            </label>
            
            <div v-if="options.passwordEnabled" class="mt-4 md-expressive-scale-in">
              <md-outlined-text-field 
                :value="options.password"
                @input="options.password = $event.target.value"
                type="password"
                label="Enter password"
                placeholder="Minimum 8 characters"
                class="w-full md-expressive-field"
                :class="{ 'border-error': passwordError }"
                supporting-text="Password must be at least 8 characters"
                maxlength="128"
                required
              >
                <md-icon slot="leading-icon">key</md-icon>
              </md-outlined-text-field>
              <div v-if="passwordError" class="mt-2 text-sm" style="color: var(--md-sys-color-error);">
                <md-icon class="mr-1 align-middle text-sm">error</md-icon>
                {{ passwordError }}
              </div>
            </div>
          </div>

          <!-- Turnstile Challenge -->
          <div class="flex justify-center p-4 rounded-2xl" style="background-color: var(--md-sys-color-surface-container-low);">
            <div ref="turnstileWidget"></div>
          </div>

          <!-- Upload Button -->
          <div class="text-center">
            <md-filled-button 
              @click="uploadFile" 
              :disabled="!canUpload"
              class="md-expressive-button w-full h-14 text-lg"
              :style="!canUpload ? 'opacity: 0.5; cursor: not-allowed;' : ''"
            >
              <md-icon slot="icon">cloud_upload</md-icon>
              Upload File Securely
            </md-filled-button>
          </div>
        </div>

        <!-- Upload Progress -->
        <div v-else-if="uploading && !uploadResult" class="text-center space-y-6 py-8">
          <div class="flex justify-center">
            <md-circular-progress 
              indeterminate
              class="scale-150"
              style="--md-circular-progress-color: var(--md-sys-color-primary);"
            ></md-circular-progress>
          </div>
          
          <div>
            <h3 class="text-xl font-medium mb-2" style="color: var(--md-sys-color-on-surface);">
              {{ uploadStage || 'Uploading your file...' }}
            </h3>
            <p class="text-sm" style="color: var(--md-sys-color-on-surface-variant);">
              Please wait while we securely process your file
            </p>
          </div>
          
          <div class="w-full max-w-md mx-auto">
            <div class="md-expressive-progress h-3 mb-2">
              <div 
                class="md-expressive-progress-bar h-3"
                :style="{ width: `${uploadProgress}%` }"
              ></div>
            </div>
            <div class="flex justify-between text-sm" style="color: var(--md-sys-color-on-surface-variant);">
              <span>{{ uploadProgress }}% complete</span>
              <span v-if="selectedFile">{{ formatFileSize(selectedFile.size) }}</span>
            </div>
          </div>
          
          <div v-if="selectedFile && selectedFile.size > 80 * 1024 * 1024" 
               class="inline-flex items-center px-4 py-2 rounded-full text-sm"
               style="background-color: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container);">
            <md-icon class="mr-2">speed</md-icon>
            Large file detected - using optimized chunked upload
          </div>
        </div>

        <!-- Success State -->
        <div v-if="uploadResult && !uploading" class="text-center space-y-6 py-8 md-expressive-fade-in">
          <div class="flex justify-center">
            <md-icon class="text-8xl" style="color: var(--md-sys-color-success); font-size: 5rem;">check_circle</md-icon>
          </div>
          
          <div>
            <h3 class="text-2xl font-semibold mb-2" style="color: var(--md-sys-color-on-surface);">Upload Successful!</h3>
            <p style="color: var(--md-sys-color-on-surface-variant);">Your file has been securely uploaded and is ready to share</p>
          </div>
          
          <div class="max-w-md mx-auto p-6 rounded-2xl" style="background-color: var(--md-sys-color-surface-container-high);">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-sm font-medium" style="color: var(--md-sys-color-on-surface);">
                <md-icon class="mr-2 align-middle">link</md-icon>
                Download Link
              </h4>
              <md-text-button 
                @click="copyToClipboard(shareUrl)" 
                class="md-expressive-button"
              >
                <md-icon slot="icon">{{ copied ? 'check' : 'content_copy' }}</md-icon>
                {{ copied ? 'Copied!' : 'Copy' }}
              </md-text-button>
            </div>
            
            <md-outlined-text-field 
              :value="shareUrl" 
              readonly 
              class="w-full mb-4"
              label="Share URL"
            >
              <md-icon slot="leading-icon">link</md-icon>
            </md-outlined-text-field>
            
            <div class="flex items-center justify-between text-sm" style="color: var(--md-sys-color-on-surface-variant);">
              <div class="flex items-center">
                <md-icon class="mr-1 text-sm">schedule</md-icon>
                Expires: {{ formatDate(uploadResult.expiresAt * 1000) }}
              </div>
              <div class="flex items-center">
                <md-icon class="mr-1 text-sm">file_download</md-icon>
                {{ uploadResult.fileSize ? formatFileSize(uploadResult.fileSize) : 'File ready' }}
              </div>
            </div>
          </div>

          <md-outlined-button 
            @click="resetForm" 
            class="md-expressive-button"
          >
            <md-icon slot="icon">add</md-icon>
            Upload Another File
          </md-outlined-button>
        </div>

        <!-- Error State -->
        <div v-if="error" class="rounded-2xl p-6 md-expressive-scale-in" style="background-color: var(--md-sys-color-error-container);">
          <div class="flex items-start space-x-4">
            <md-icon class="text-2xl mt-1" style="color: var(--md-sys-color-error);">error</md-icon>
            <div class="flex-1">
              <h3 class="text-lg font-medium mb-2" style="color: var(--md-sys-color-on-error-container);">Upload Error</h3>
              <p style="color: var(--md-sys-color-on-error-container);">{{ error }}</p>
              <md-text-button 
                @click="error = ''" 
                class="mt-3"
                style="--md-text-button-label-text-color: var(--md-sys-color-error);"
              >
                <md-icon slot="icon">close</md-icon>
                Dismiss
              </md-text-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8 space-y-2">
        <p class="text-sm" style="color: var(--md-sys-color-on-surface-variant);">
          <md-icon class="mr-1 align-middle text-sm">security</md-icon>
          Files are automatically deleted after expiration
        </p>
        <p class="text-sm" style="color: var(--md-sys-color-on-surface-variant);">
          By using this service, you agree to our 
          <router-link to="/tos" class="underline hover:no-underline" style="color: var(--md-sys-color-primary);">Terms of Service</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, nextTick } from 'vue';
import { SecurityUtils } from '../utils/security';
import { ApiClient } from '../utils/api';
import type { UploadOptions } from '../types';

// Declare Turnstile type
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

// Reactive state
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadStage = ref<string>('');
const uploadResult = ref<any>(null);
const error = ref<string>('');
const copied = ref(false);
const dragOver = ref(false);
const fileInput = ref<HTMLInputElement>();
const turnstileWidget = ref<HTMLElement>();
const turnstileToken = ref<string>('');
const turnstileWidgetId = ref<string>('');
const turnstileSiteKey = ref<string>('1x00000000000000000000AA'); // Default test key

// Options
const options = reactive<UploadOptions>({
  lifetime: '7',
  passwordEnabled: false,
  password: '',
  onetimeDownload: false,
  maxDownloads: 10
});

// Computed
const allowedTypes = computed(() => {
  return [
    'image/*',
    'application/pdf',
    'text/*',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.*',
    'application/zip',
    'audio/*',
    'video/*'
  ].join(',');
});

const canUpload = computed(() => {
  if (!selectedFile.value) return false;
  if (options.passwordEnabled && (!options.password || options.password.length < 8)) return false;
  if (!turnstileToken.value) return false; // Require Turnstile completion
  return !uploading.value;
});

const passwordError = computed(() => {
  if (!options.passwordEnabled || !options.password) return '';
  if (options.password.length < 8) return 'Password must be at least 8 characters';
  if (options.password.length > 128) return 'Password too long';
  return '';
});

const shareUrl = computed(() => {
  if (!uploadResult.value) return '';
  return `${window.location.origin}/dl/${uploadResult.value.fileId}`;
});

// Methods
function handleDrop(e: DragEvent) {
  dragOver.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    handleFile(files[0]!);
  }
}

function handleFileSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    handleFile(files[0]!);
  }
}

function handleFile(file: File) {
  const validation = SecurityUtils.validateFile(file);
  if (!validation.valid) {
    error.value = validation.error!;
    return;
  }
  
  selectedFile.value = file;
  error.value = '';
}

function clearFile() {
  selectedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

async function uploadFile() {
  if (!selectedFile.value || uploading.value) return;
  
  try {
    uploading.value = true;
    uploadProgress.value = 0;
    error.value = '';
    
    const result = await ApiClient.uploadFile(selectedFile.value, { ...options, turnstileToken: turnstileToken.value }, (progress, stage) => {
      uploadProgress.value = Math.min(progress, 100);
      uploadStage.value = stage;
    });
    
    if (result.success) {
      uploadResult.value = result.data;
    } else {
      error.value = result.error?.message || 'Upload failed';
    }
    
  } catch (err) {
    error.value = 'Network error occurred';
    console.error('Upload error:', err);
  } finally {
    uploading.value = false;
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => copied.value = false, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

function resetForm() {
  selectedFile.value = null;
  uploadResult.value = null;
  uploadProgress.value = 0;
  uploadStage.value = '';
  error.value = '';
  copied.value = false;
  options.password = '';
  options.passwordEnabled = false;
  
  // Reset Turnstile
  if (window.turnstile && turnstileWidgetId.value) {
    window.turnstile.reset(turnstileWidgetId.value);
  }
  turnstileToken.value = '';
  
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

// Turnstile functions
function initTurnstile() {
  if (!window.turnstile || !turnstileWidget.value) return;
  
  turnstileWidgetId.value = window.turnstile.render(turnstileWidget.value, {
    sitekey: turnstileSiteKey.value,
    callback: (token: string) => {
      turnstileToken.value = token;
    },
    'error-callback': () => {
      turnstileToken.value = '';
      error.value = 'Verification failed. Please try again.';
    },
    'expired-callback': () => {
      turnstileToken.value = '';
    }
  });
}

function waitForTurnstile() {
  if (window.turnstile) {
    nextTick(initTurnstile);
  } else {
    // Wait for Turnstile script to load
    setTimeout(waitForTurnstile, 100);
  }
}

async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    const result = await response.json();
    
    if (result.success && result.data) {
      turnstileSiteKey.value = result.data.turnstileSiteKey;
    }
  } catch (error) {
    console.error('Failed to load config:', error);
    // Keep default test key
  }
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

// Initialize config and Turnstile when component mounts
onMounted(async () => {
  await loadConfig();
  waitForTurnstile();
});

// Event listeners
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  dragOver.value = true;
});

document.addEventListener('dragleave', (e) => {
  if (!e.relatedTarget) {
    dragOver.value = false;
  }
});
</script>