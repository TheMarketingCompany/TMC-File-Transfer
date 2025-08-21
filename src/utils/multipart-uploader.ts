export interface ChunkedUploadOptions {
  filename: string;
  file: File;
  chunkSize?: number;
  onProgress?: ((progress: number, stage: string) => void) | undefined;
  onError?: (error: string) => void;
  uploadOptions?: {
    lifetime?: string;
    password?: string;
    maxDownloads?: number;
  };
}

export interface ChunkedUploadResult {
  success: boolean;
  fileId?: string;
  error?: string;
  expiresAt?: number;
}

interface UploadPart {
  partNumber: number;
  etag: string;
}

export class MultipartUploader {
  private static readonly DEFAULT_CHUNK_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly API_BASE = '/api/transfer/upload-multipart';

  static async upload(options: ChunkedUploadOptions): Promise<ChunkedUploadResult> {
    const {
      filename,
      file,
      chunkSize = this.DEFAULT_CHUNK_SIZE,
      onProgress,
      onError,
      uploadOptions = {}
    } = options;

    try {
      // Step 1: Initiate multipart upload
      onProgress?.(0, 'Initializing upload...');
      
      const initResponse = await fetch(`${this.API_BASE}?action=initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: filename,
          fileSize: file.size,
          contentType: file.type,
          chunkCount: Math.ceil(file.size / chunkSize),
          options: uploadOptions
        })
      });

      const initResult: any = await initResponse.json();
      
      if (!initResult.success) {
        const error = initResult.error || 'Failed to initiate upload';
        onError?.(error);
        return { success: false, error };
      }

      const { uploadId, totalChunks, expiresAt } = initResult.data;
      const parts: UploadPart[] = [];

      // Step 2: Upload chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 90); // Reserve 10% for completion
        onProgress?.(progress, `Uploading chunk ${chunkIndex + 1} of ${totalChunks}...`);

        const formData = new FormData();
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('chunk', new File([chunk], `chunk_${chunkIndex}`, { type: file.type }));

        const chunkResponse = await fetch(`${this.API_BASE}?action=upload-chunk`, {
          method: 'POST',
          body: formData
        });

        const chunkResult: any = await chunkResponse.json();

        if (!chunkResult.success) {
          const error = chunkResult.error || `Failed to upload chunk ${chunkIndex + 1}`;
          onError?.(error);
          
          // Attempt to abort the upload
          await this.abortUpload(uploadId);
          return { success: false, error };
        }

        parts.push({
          partNumber: chunkResult.data.partNumber,
          etag: chunkResult.data.etag
        });
      }

      // Step 3: Complete multipart upload
      onProgress?.(95, 'Finalizing upload...');

      const completeResponse = await fetch(`${this.API_BASE}?action=complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          parts: parts.sort((a, b) => a.partNumber - b.partNumber)
        })
      });

      const completeResult: any = await completeResponse.json();

      if (!completeResult.success) {
        const error = completeResult.error || 'Failed to complete upload';
        onError?.(error);
        await this.abortUpload(uploadId);
        return { success: false, error };
      }

      onProgress?.(100, 'Upload completed successfully!');

      return {
        success: true,
        fileId: completeResult.data.fileId,
        expiresAt
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  private static async abortUpload(uploadId: string): Promise<void> {
    try {
      await fetch(`${this.API_BASE}?action=abort`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId })
      });
    } catch (error) {
      console.error('Failed to abort upload:', error);
    }
  }

  static shouldUseChunkedUpload(fileSize: number, threshold: number = 80 * 1024 * 1024): boolean {
    // Use chunked upload for files larger than 80MB (to stay well under Workers limits)
    return fileSize > threshold;
  }
}

export default MultipartUploader;