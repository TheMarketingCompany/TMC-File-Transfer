import type { ApiResponse } from '@/types';

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
      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: response.status.toString(),
            message: errorData.message || `HTTP ${response.status}`,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
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

  static async uploadFile(file: File, options: any): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));

    return this.makeRequest('/transfer/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Don't set Content-Type for FormData
    });
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