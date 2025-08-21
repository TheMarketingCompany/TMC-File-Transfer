<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Download File</h1>
        <p class="text-gray-600">Enter file ID or use shared link</p>
      </div>

      <!-- File ID Input -->
      <div v-if="!fileId" class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              File ID
            </label>
            <input 
              v-model="inputFileId"
              type="text" 
              placeholder="Enter file ID"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @keyup.enter="loadFile"
            />
          </div>
          <button 
            @click="loadFile"
            :disabled="!inputFileId.trim()"
            :class="[
              'w-full py-2 px-4 rounded-lg font-medium text-white transition-colors',
              inputFileId.trim() 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'
            ]"
          >
            Load File
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-xl shadow-lg p-6 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading file information...</p>
      </div>

      <!-- Password Required -->
      <div v-if="showPasswordForm && !loading" class="bg-white rounded-xl shadow-lg p-6">
        <div class="text-center mb-6">
          <svg class="mx-auto h-12 w-12 text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <h3 class="text-lg font-semibold text-gray-900">Password Protected</h3>
          <p class="text-gray-600 text-sm mt-1">This file requires a password to access</p>
        </div>

        <div class="space-y-4">
          <div>
            <input 
              v-model="password"
              type="password" 
              placeholder="Enter password"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :class="{ 'border-red-500': passwordError }"
              @keyup.enter="validateAccess"
            />
            <p v-if="passwordError" class="text-red-500 text-xs mt-1">{{ passwordError }}</p>
          </div>
          
          <button 
            @click="validateAccess"
            :disabled="!password.trim() || validating"
            :class="[
              'w-full py-2 px-4 rounded-lg font-medium text-white transition-colors',
              password.trim() && !validating
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'
            ]"
          >
            {{ validating ? 'Validating...' : 'Access File' }}
          </button>
        </div>
      </div>

      <!-- File Information & Download -->
      <div v-if="fileInfo && !showPasswordForm && !loading" class="bg-white rounded-xl shadow-lg p-6">
        <div class="text-center mb-6">
          <svg class="mx-auto h-12 w-12 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <h3 class="text-lg font-semibold text-gray-900">{{ fileInfo.filename }}</h3>
          <p class="text-gray-600 text-sm">{{ formatFileSize(fileInfo.fileSize) }}</p>
        </div>

        <div class="space-y-3 mb-6">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Downloads:</span>
            <span class="text-gray-900">{{ fileInfo.downloadCount }} / {{ fileInfo.maxDownloads === 999999 ? '∞' : fileInfo.maxDownloads }}</span>
          </div>
          
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Expires:</span>
            <span class="text-gray-900">{{ formatDate(fileInfo.expiresAt * 1000) }}</span>
          </div>
          
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Time Remaining:</span>
            <span class="text-gray-900">{{ formatTimeRemaining(fileInfo.timeRemaining) }}</span>
          </div>
          
          <div v-if="fileInfo.isOneTime" class="flex items-center justify-center space-x-2 text-orange-600 text-sm">
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <span>One-time download only</span>
          </div>
        </div>

        <button 
          @click="downloadFile"
          :disabled="downloading"
          :class="[
            'w-full py-3 px-4 rounded-lg font-medium text-white transition-colors',
            downloading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          ]"
        >
          {{ downloading ? 'Downloading...' : 'Download File' }}
        </button>
      </div>

      <!-- Error State -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex">
          <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="text-center space-y-3">
        <router-link 
          to="/upload" 
          class="inline-block bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Upload New File
        </router-link>
        
        <div v-if="fileId" class="text-sm text-gray-500">
          <button @click="resetForm" class="text-blue-600 hover:text-blue-700">
            Load Different File
          </button>
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