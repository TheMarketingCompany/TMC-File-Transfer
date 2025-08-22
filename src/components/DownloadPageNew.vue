<template>
  <div class="min-h-screen md-expressive-surface flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8 md-expressive-fade-in">
        <h1 class="md-expressive-headline mb-4">Download File</h1>
        <p class="md-expressive-body">Enter file ID or use shared link to access your file</p>
      </div>

      <!-- File ID Input -->
      <div v-if="!fileId" class="md-expressive-card md-expressive-slide-up mb-6">
        <div class="space-y-6">
          <div class="text-center mb-4">
            <md-icon class="text-4xl mb-2" style="color: var(--md-sys-color-primary); font-size: 3rem;">download</md-icon>
            <h3 class="text-lg font-medium" style="color: var(--md-sys-color-on-surface);">Access File</h3>
          </div>
          <div>
            <md-outlined-text-field 
              v-model="inputFileId"
              type="text" 
              label="File ID"
              placeholder="Enter your file ID here"
              class="w-full md-expressive-field"
              @keyup.enter="loadFile"
              supporting-text="File ID is provided when you upload a file"
            >
              <md-icon slot="leading-icon">fingerprint</md-icon>
            </md-outlined-text-field>
          </div>
          <md-filled-button 
            @click="loadFile"
            :disabled="!inputFileId.trim()"
            class="w-full h-12 md-expressive-button"
            :style="!inputFileId.trim() ? 'opacity: 0.5; cursor: not-allowed;' : ''"
          >
            <md-icon slot="icon">search</md-icon>
            Load File Information
          </md-filled-button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="md-expressive-card text-center py-8 md-expressive-scale-in">
        <md-circular-progress indeterminate class="mb-4 scale-125" style="--md-circular-progress-color: var(--md-sys-color-primary);"></md-circular-progress>
        <h3 class="text-lg font-medium" style="color: var(--md-sys-color-on-surface);">Loading file information...</h3>
        <p class="text-sm mt-2" style="color: var(--md-sys-color-on-surface-variant);">Please wait while we fetch your file details</p>
      </div>

      <!-- Password Required -->
      <div v-if="showPasswordForm && !loading" class="md-expressive-card md-expressive-scale-in">
        <div class="text-center mb-6">
          <md-icon class="text-6xl mb-4" style="color: var(--md-sys-color-primary); font-size: 4rem;">lock</md-icon>
          <h3 class="text-xl font-semibold mb-2" style="color: var(--md-sys-color-on-surface);">Password Protected</h3>
          <p class="text-sm" style="color: var(--md-sys-color-on-surface-variant);">This file requires a password to access</p>
        </div>

        <div class="space-y-6">
          <div>
            <md-outlined-text-field 
              v-model="password"
              type="password" 
              label="Password"
              placeholder="Enter the file password"
              class="w-full md-expressive-field"
              :class="{ 'border-error': passwordError }"
              @keyup.enter="validateAccess"
              supporting-text="Enter the password provided by the file owner"
            >
              <md-icon slot="leading-icon">key</md-icon>
            </md-outlined-text-field>
            <div v-if="passwordError" class="mt-2 text-sm" style="color: var(--md-sys-color-error);">
              <md-icon class="mr-1 align-middle text-sm">error</md-icon>
              {{ passwordError }}
            </div>
          </div>
          
          <md-filled-button 
            @click="validateAccess"
            :disabled="!password.trim() || validating"
            class="w-full h-12 md-expressive-button"
            :style="!password.trim() || validating ? 'opacity: 0.5; cursor: not-allowed;' : ''"
          >
            <md-icon slot="icon">{{ validating ? 'hourglass_empty' : 'lock_open' }}</md-icon>
            {{ validating ? 'Validating...' : 'Access File' }}
          </md-filled-button>
        </div>
      </div>

      <!-- File Information & Download -->
      <div v-if="fileInfo && !showPasswordForm && !loading" class="md-expressive-card md-expressive-fade-in">
        <div class="text-center mb-6">
          <md-icon class="text-6xl mb-4" style="color: var(--md-sys-color-success); font-size: 4rem;">description</md-icon>
          <h3 class="text-xl font-semibold mb-2" style="color: var(--md-sys-color-on-surface);">{{ fileInfo.filename }}</h3>
          <p class="text-lg" style="color: var(--md-sys-color-on-surface-variant);">{{ formatFileSize(fileInfo.fileSize) }}</p>
        </div>

        <!-- File Details Grid -->
        <div class="grid grid-cols-1 gap-4 mb-6 p-4 rounded-2xl" style="background-color: var(--md-sys-color-surface-container-low);">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <md-icon class="mr-3" style="color: var(--md-sys-color-primary);">download</md-icon>
              <span class="font-medium" style="color: var(--md-sys-color-on-surface);">Downloads</span>
            </div>
            <span class="font-medium" style="color: var(--md-sys-color-on-surface);">
              {{ fileInfo.downloadCount }} / {{ fileInfo.maxDownloads === 999999 ? '∞' : fileInfo.maxDownloads }}
            </span>
          </div>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <md-icon class="mr-3" style="color: var(--md-sys-color-primary);">schedule</md-icon>
              <span class="font-medium" style="color: var(--md-sys-color-on-surface);">Expires</span>
            </div>
            <span class="text-sm" style="color: var(--md-sys-color-on-surface-variant);">
              {{ formatDate(fileInfo.expiresAt * 1000) }}
            </span>
          </div>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <md-icon class="mr-3" style="color: var(--md-sys-color-primary);">timer</md-icon>
              <span class="font-medium" style="color: var(--md-sys-color-on-surface);">Time Remaining</span>
            </div>
            <span class="text-sm" style="color: var(--md-sys-color-on-surface-variant);">
              {{ formatTimeRemaining(fileInfo.timeRemaining) }}
            </span>
          </div>
          
          <div v-if="fileInfo.isOneTime" class="flex items-center justify-center space-x-2 p-3 rounded-xl mt-2"
               style="background-color: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container);">
            <md-icon>warning</md-icon>
            <span class="font-medium">One-time download only</span>
          </div>
        </div>

        <md-filled-button 
          @click="downloadFile"
          :disabled="downloading"
          class="w-full h-14 text-lg md-expressive-button"
          :style="downloading ? 'opacity: 0.5; cursor: not-allowed;' : ''"
        >
          <md-icon slot="icon">{{ downloading ? 'hourglass_empty' : 'file_download' }}</md-icon>
          {{ downloading ? 'Downloading...' : 'Download File' }}
        </md-filled-button>
      </div>

      <!-- Error State -->
      <div v-if="error" class="rounded-2xl p-6 mb-6 md-expressive-scale-in" style="background-color: var(--md-sys-color-error-container);">
        <div class="flex items-start space-x-4">
          <md-icon class="text-2xl mt-1" style="color: var(--md-sys-color-error);">error</md-icon>
          <div class="flex-1">
            <h3 class="text-lg font-medium mb-2" style="color: var(--md-sys-color-on-error-container);">Error</h3>
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

      <!-- Actions -->
      <div class="text-center space-y-4">
        <md-outlined-button 
          @click="$router.push('/upload')"
          class="md-expressive-button"
        >
          <md-icon slot="icon">cloud_upload</md-icon>
          Upload New File
        </md-outlined-button>
        
        <div v-if="fileId" class="text-center">
          <md-text-button 
            @click="resetForm"
            style="--md-text-button-label-text-color: var(--md-sys-color-primary);"
          >
            <md-icon slot="icon">refresh</md-icon>
            Load Different File
          </md-text-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ApiClient } from '../utils/api';
import type { FileInfo } from '../types';

// Props
interface Props {
  fileId?: string;
}
const props = defineProps<Props>();
const route = useRoute();

// Reactive state
const inputFileId = ref('');
const password = ref('');
const loading = ref(false);
const validating = ref(false);
const downloading = ref(false);
const fileInfo = ref<FileInfo | null>(null);
const showPasswordForm = ref(false);
const error = ref('');
const passwordError = ref('');

// Computed
const fileId = computed(() => props.fileId || (route.params.fileId as string) || '');

// Methods
async function loadFile() {
  const id = inputFileId.value.trim() || fileId.value;
  if (!id) return;
  
  try {
    loading.value = true;
    error.value = '';
    showPasswordForm.value = false;
    
    const result = await ApiClient.getFileInfo(id);
    
    if (result.success) {
      fileInfo.value = result.data;
      if (result.data.hasPassword) {
        showPasswordForm.value = true;
      }
    } else {
      error.value = result.error?.message || 'Failed to load file information';
    }
    
  } catch (err) {
    error.value = 'Network error occurred';
    console.error('Load file error:', err);
  } finally {
    loading.value = false;
  }
}

async function validateAccess() {
  if (!password.value.trim() || validating.value) return;
  
  try {
    validating.value = true;
    passwordError.value = '';
    error.value = '';
    
    const id = inputFileId.value.trim() || fileId.value;
    const result = await ApiClient.validateAccess(id, password.value);
    
    if (result.success) {
      fileInfo.value = result.data;
      showPasswordForm.value = false;
    } else {
      if (result.error?.code === 'INVALID_PASSWORD') {
        passwordError.value = 'Invalid password';
      } else {
        error.value = result.error?.message || 'Access validation failed';
      }
    }
    
  } catch (err) {
    error.value = 'Network error occurred';
    console.error('Validate access error:', err);
  } finally {
    validating.value = false;
  }
}

async function downloadFile() {
  if (downloading.value || !fileInfo.value) return;
  
  try {
    downloading.value = true;
    error.value = '';
    
    const id = inputFileId.value.trim() || fileId.value;
    
    // Create download request
    const response = await fetch(`/api/transfer/download/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: password.value || undefined }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any;
      error.value = errorData.error?.message || `Download failed (${response.status})`;
      return;
    }
    
    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileInfo.value.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // Update download count locally
    if (fileInfo.value) {
      fileInfo.value.downloadCount++;
      
      // Check if file should be hidden after download
      if (fileInfo.value.isOneTime || fileInfo.value.downloadCount >= fileInfo.value.maxDownloads) {
        setTimeout(() => {
          error.value = 'File has been consumed and is no longer available';
          fileInfo.value = null;
          showPasswordForm.value = false;
        }, 2000);
      }
    }
    
  } catch (err) {
    error.value = 'Download failed';
    console.error('Download error:', err);
  } finally {
    downloading.value = false;
  }
}

function resetForm() {
  inputFileId.value = '';
  password.value = '';
  passwordError.value = '';
  error.value = '';
  fileInfo.value = null;
  showPasswordForm.value = false;
  loading.value = false;
  validating.value = false;
  downloading.value = false;
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

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Lifecycle
onMounted(() => {
  if (fileId.value) {
    loadFile();
  }
});
</script>