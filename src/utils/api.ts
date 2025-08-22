import type { ApiResponse } from '@/types';
import { MultipartUploader } from './multipart-uploader';

export class ApiClient {
  private static readonly BASE_URL = '/api';
  private static readonly TIMEOUT = 30000; // 30 seconds

  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

    try {
      const defaultHeaders = options.body instanceof FormData 
        ? {} // Don't set Content-Type for FormData - let browser set it
        : { 'Content-Type': 'application/json' };

      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          success: false,
          error: {
            code: response.status.toString(),
            message: errorData.message || `HTTP ${response.status}`,
          },
        };
      }

      const result = await response.json() as any;
      // If the response has its own success/data structure, unwrap it
      if (result.success && result.data !== undefined) {
        return { success: true, data: result.data as T };
      }
      return { success: true, data: result as T };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: { code: 'TIMEOUT', message: 'Request timeout' },
          };
        }
        return {
          success: false,
          error: { code: 'NETWORK_ERROR', message: error.message },
        };
      }
      
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' },
      };
    }
  }

  static async uploadFile(
    file: File, 
    options: any, 
    onProgress?: (progress: number, stage: string) => void
  ): Promise<ApiResponse> {
    // Use chunked upload for large files (>80MB)
    const shouldUseChunked = MultipartUploader.shouldUseChunkedUpload(file.size);
    
    if (shouldUseChunked) {
      try {
        const result = await MultipartUploader.upload({
          filename: file.name,
          file,
          uploadOptions: options,
          onProgress: onProgress || undefined,
          onError: (error) => console.error('Chunked upload error:', error)
        });

        if (result.success) {
          return {
            success: true,
            data: {
              fileId: result.fileId,
              expiresAt: result.expiresAt,
              message: 'File uploaded successfully using chunked upload'
            }
          };
        } else {
          return {
            success: false,
            error: {
              code: 'UPLOAD_ERROR',
              message: result.error || 'Chunked upload failed'
            }
          };
        }
      } catch (error) {
        console.error('Chunked upload failed, falling back to regular upload:', error);
        // Fall back to regular upload for smaller files or if chunked fails
      }
    }

    // Regular upload for smaller files or fallback
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));

    onProgress?.(50, 'Uploading file...');

    const result = await this.makeRequest('/transfer/upload', {
      method: 'POST',
      body: formData,
    });

    if (result.success) {
      onProgress?.(100, 'Upload completed!');
    }

    return result;
  }

  static async getFileInfo(fileId: string): Promise<ApiResponse> {
    return this.makeRequest(`/transfer/info/${fileId}`, {
      method: 'GET',
    });
  }

  static async validateAccess(fileId: string, password?: string): Promise<ApiResponse> {
    return this.makeRequest(`/transfer/validate/${fileId}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  static async downloadFile(fileId: string, password?: string): Promise<ApiResponse> {
    return this.makeRequest(`/transfer/download/${fileId}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }
}