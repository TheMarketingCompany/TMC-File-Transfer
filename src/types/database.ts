/**
 * Database result type helpers for safe type casting
 */

export interface DatabaseUploadRecord {
  file_id: string;
  file_name: string;
  original_name: string;
  file_size: number;
  content_type: string;
  expires_at: number;
  download_count: number;
  max_downloads: number;
  has_password: boolean;
  password_hash: string | null;
  salt: string | null;
  is_one_time: boolean;
  upload_timestamp: number;
  last_download: string | null;
  client_ip: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface LegacyUploadRecord {
  fileId: string;
  filename: string;
  timeout: number;
  downloadCount: number;
  options: string;
  uploadTimestamp: number;
}

// Type guard functions
export function isDatabaseUploadRecord(record: unknown): record is DatabaseUploadRecord {
  return (
    typeof record === 'object' &&
    record !== null &&
    'file_id' in record &&
    'file_name' in record &&
    'original_name' in record &&
    typeof (record as any).file_id === 'string'
  );
}

export function isLegacyUploadRecord(record: unknown): record is LegacyUploadRecord {
  return (
    typeof record === 'object' &&
    record !== null &&
    'fileId' in record &&
    'filename' in record &&
    'timeout' in record &&
    typeof (record as any).fileId === 'string'
  );
}

// Safe casting functions
export function safeCastToDatabaseRecord(record: unknown): DatabaseUploadRecord | null {
  if (isDatabaseUploadRecord(record)) {
    return record;
  }
  return null;
}

export function safeCastToLegacyRecord(record: unknown): LegacyUploadRecord | null {
  if (isLegacyUploadRecord(record)) {
    return record;
  }
  return null;
}