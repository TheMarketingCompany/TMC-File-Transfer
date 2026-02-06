export interface UploadOptions {
  lifetime: '1' | '7' | '30';
  passwordEnabled: boolean;
  password?: string;
  onetimeDownload: boolean;
  maxDownloads?: number;
}

export interface FileUpload {
  fileId: string;
  filename: string;
  fileSize: number;
  contentType: string;
  uploadUrl: string;
  downloadUrl: string;
  expiresAt: number;
}

export interface FileInfo {
  fileId: string;
  filename: string;
  fileSize: number;
  contentType: string;
  downloadCount: number;
  maxDownloads: number;
  expiresAt: number;
  hasPassword: boolean;
  isOneTime: boolean;
  uploadedAt: number;
  timeRemaining: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface RateLimitInfo {
  allowed: number;
  remaining: number;
  resetTime: number;
}