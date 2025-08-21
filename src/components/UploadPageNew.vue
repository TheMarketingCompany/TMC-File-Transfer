<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">Secure File Transfer</h1>
        <p class="text-gray-600">Share files securely with expiration and password protection</p>
      </div>

      <!-- Upload Form -->
      <div class="bg-white rounded-xl shadow-lg p-8">
        <div v-if="!uploading" class="space-y-6">
          <!-- File Drop Zone -->
          <div 
            @drop.prevent="handleDrop"
            @dragover.prevent
            @dragenter.prevent
            :class="[
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            ]"
          >
            <input 
              ref="fileInput"
              type="file" 
              @change="handleFileSelect" 
              class="hidden"
              :accept="allowedTypes"
            />
            
            <div v-if="!selectedFile">
              <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <p class="text-lg text-gray-600 mb-2">Drop your file here or</p>
              <button 
                @click="$refs.fileInput.click()" 
                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Browse Files
              </button>
              <p class="text-sm text-gray-500 mt-2">Supports files up to 5GB - large files use optimized chunked upload</p>
            </div>
            
            <div v-else class="space-y-3">
              <svg class="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p class="text-lg font-medium text-gray-900">{{ selectedFile.name }}</p>
                <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
              <button 
                @click="clearFile" 
                class="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Remove File
              </button>
            </div>
          </div>

          <!-- Upload Options -->
          <div class="grid md:grid-cols-2 gap-6">
            <!-- Expiration -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                File Expiration
              </label>
              <select 
                v-model="options.lifetime" 
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1">1 Day</option>
                <option value="7">1 Week</option>
                <option value="30">1 Month</option>
              </select>
            </div>

            <!-- Max Downloads -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Download Limit
              </label>
              <select 
                v-model="options.maxDownloads" 
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option :value="1">1 Download (One-time)</option>
                <option :value="5">5 Downloads</option>
                <option :value="10">10 Downloads</option>
                <option :value="25">25 Downloads</option>
                <option :value="999999">Unlimited</option>
              </select>
            </div>
          </div>

          <!-- Password Protection -->
          <div>
            <label class="flex items-center space-x-3">
              <input 
                v-model="options.passwordEnabled" 
                type="checkbox" 
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span class="text-sm font-medium text-gray-700">Password Protection</span>
            </label>
            
            <div v-if="options.passwordEnabled" class="mt-3">
              <input 
                v-model="options.password" 
                type="password" 
                placeholder="Enter password (min 8 characters)"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :class="{ 'border-red-500': passwordError }"
              />
              <p v-if="passwordError" class="text-red-500 text-xs mt-1">{{ passwordError }}</p>
            </div>
          </div>

          <!-- Upload Button -->
          <button 
            @click="uploadFile" 
            :disabled="!canUpload"
            :class="[
              'w-full py-3 px-4 rounded-lg font-medium text-white transition-colors',
              canUpload 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'
            ]"
          >
            Upload File
          </button>
        </div>

        <!-- Upload Progress -->
        <div v-else class="text-center space-y-4">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-lg font-medium text-gray-900">{{ uploadStage || 'Uploading your file...' }}</p>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
          <p class="text-sm text-gray-600">{{ uploadProgress }}% complete</p>
          <p v-if="selectedFile && selectedFile.size > 80 * 1024 * 1024" class="text-xs text-blue-600">
            Large file detected - using optimized chunked upload
          </p>
        </div>

        <!-- Success State -->
        <div v-if="uploadResult && !uploading" class="text-center space-y-4">
          <svg class="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h3 class="text-xl font-semibold text-gray-900">Upload Successful!</h3>
          
          <div class="bg-gray-50 rounded-lg p-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Download Link:</span>
              <button 
                @click="copyToClipboard(shareUrl)" 
                class="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {{ copied ? 'Copied!' : 'Copy' }}
              </button>
            </div>
            <input 
              :value="shareUrl" 
              readonly 
              class="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <p class="text-xs text-gray-500">
              Expires: {{ formatDate(uploadResult.expiresAt * 1000) }}
            </p>
          </div>

          <button 
            @click="resetForm" 
            class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Upload Another File
          </button>
        </div>

        <!-- Error State -->
        <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex">
            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Upload Error</h3>
              <p class="text-sm text-red-700 mt-1">{{ error }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8 text-sm text-gray-500">
        <p>Files are automatically deleted after expiration. By using this service, you agree to our 
          <router-link to="/tos" class="text-blue-600 hover:text-blue-700">Terms of Service</router-link>.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { SecurityUtils } from '../utils/security';
import { ApiClient } from '../utils/api';
import type { UploadOptions } from '../types';

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
    
    const result = await ApiClient.uploadFile(selectedFile.value, options, (progress, stage) => {
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
  
  if (fileInput.value) {
    fileInput.value.value = '';
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