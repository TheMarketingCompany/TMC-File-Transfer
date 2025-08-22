/**
 * Enhanced TypeScript definitions for Cloudflare Workers and Pages
 */

// Cloudflare Runtime Types
export interface CloudflareEnv {
  // D1 Database
  DB: D1Database;
  
  // R2 Storage
  TRANSFER_BUCKET: R2Bucket;
  
  // KV Storage (optional)
  CACHE?: KVNamespace;
  
  // Analytics Engine (optional)
  ANALYTICS?: AnalyticsEngineDataset;
  
  // Environment Variables
  ENVIRONMENT: 'development' | 'staging' | 'production';
  DEBUG: 'true' | 'false';
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  MAX_FILE_SIZE: string;
  ALLOWED_ORIGINS: string;
  CLEANUP_SECRET: string;
  
  // Rate Limiting Configuration
  RATE_LIMIT_UPLOAD?: string;
  RATE_LIMIT_DOWNLOAD?: string;
  RATE_LIMIT_VALIDATE?: string;
  
  // Security Configuration
  PASSWORD_MIN_LENGTH?: string;
  PASSWORD_MAX_LENGTH?: string;
  
  // Turnstile Configuration
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  SESSION_TIMEOUT?: string;
}

// Enhanced D1 Types
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  error?: string;
  meta: {
    duration: number;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
  changes?: number;
}

// Enhanced R2 Types
export interface R2ObjectMetadata {
  httpMetadata?: {
    contentType?: string;
    contentLanguage?: string;
    contentDisposition?: string;
    contentEncoding?: string;
    cacheControl?: string;
    expires?: Date;
  };
  customMetadata?: Record<string, string>;
}

// Request Context Types
export interface RequestContext {
  request: Request;
  env: CloudflareEnv;
  ctx: ExecutionContext;
  params?: Record<string, string>;
  next?: () => Promise<Response>;
}

// Database Schema Types
export interface UploadRecord {
  file_id: string;
  file_name: string;
  original_name: string;
  file_size: number;
  content_type: string;
  expires_at: number;
  download_count: number;
  max_downloads: number;
  has_password: boolean;
  password_hash?: string;
  salt?: string;
  is_one_time: boolean;
  upload_timestamp: number;
  last_download?: string;
  client_ip?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RateLimitRecord {
  client_key: string;
  timestamp: number;
  action_type: string;
  created_at?: string;
}

export interface MetadataRecord {
  key: string;
  value: string;
  updated_at?: string;
}

// API Response Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: {
    timestamp: number;
    requestId?: string;
    rateLimit?: RateLimitInfo;
  };
}

export interface RateLimitInfo {
  allowed: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// File Operations Types
export interface FileUploadRequest {
  lifetime: '1' | '7' | '30';
  passwordEnabled: boolean;
  password?: string;
  onetimeDownload: boolean;
  maxDownloads?: number;
}

export interface FileUploadResponse {
  fileId: string;
  downloadUrl: string;
  expiresAt: number;
  fileSize: number;
}

export interface FileInfoResponse {
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

export interface FileValidationResponse extends FileInfoResponse {
  downloadUrl: string;
}

// Security Types
export interface SecurityValidation {
  valid: boolean;
  error?: string;
  code?: string;
}

export interface RateLimitCheck {
  allowed: boolean;
  remaining?: number;
  limit?: number;
  resetTime?: number;
  retryAfter?: number;
}

// Cleanup Worker Types
export interface CleanupStats {
  filesProcessed: number;
  filesDeleted: number;
  rateLimitEntriesDeleted: number;
  storageSpaceFreed: number;
  errors: number;
  executionTime: number;
}

export interface CleanupConfig {
  batchSize: number;
  maxExecutionTime: number;
  retentionPeriod: number;
  vacuumInterval: number;
}

// Middleware Types
export interface MiddlewareContext extends RequestContext {
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
}

// Utility Types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export interface RequestInfo {
  method: HttpMethod;
  url: string;
  pathname: string;
  clientIP: string;
  userAgent?: string;
  referrer?: string;
  timestamp: number;
}

// Type Guards
export const isCloudflareEnv = (env: unknown): env is CloudflareEnv => {
  return (
    typeof env === 'object' &&
    env !== null &&
    'DB' in env &&
    'TRANSFER_BUCKET' in env &&
    'ENVIRONMENT' in env
  );
};

export const isUploadRecord = (record: unknown): record is UploadRecord => {
  return (
    typeof record === 'object' &&
    record !== null &&
    'file_id' in record &&
    'file_name' in record &&
    'original_name' in record
  );
};

export const isValidFileUploadRequest = (request: unknown): request is FileUploadRequest => {
  return (
    typeof request === 'object' &&
    request !== null &&
    'lifetime' in request &&
    'passwordEnabled' in request &&
    'onetimeDownload' in request &&
    ['1', '7', '30'].includes((request as FileUploadRequest).lifetime)
  );
};

// Constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  GONE: 410,
  PAYLOAD_TOO_LARGE: 413,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ERROR_CODES = {
  // File errors
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_EXPIRED: 'FILE_EXPIRED',
  FILE_CONSUMED: 'FILE_CONSUMED',
  FILE_INVALID: 'FILE_INVALID',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_MISSING: 'FILE_MISSING',
  
  // Authentication errors
  PASSWORD_REQUIRED: 'PASSWORD_REQUIRED',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  
  // Rate limiting errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  DB_ERROR: 'DB_ERROR',
  
  // Validation errors
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_FILE_ID: 'INVALID_FILE_ID',
  INVALID_OPTIONS: 'INVALID_OPTIONS',
  OPTIONS_INVALID: 'OPTIONS_INVALID',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type HttpStatusCode = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];