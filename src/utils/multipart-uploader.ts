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
    turnstileToken?: string;
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
  private static readonly DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
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
      console.log('Initiate response:', initResult);
      
      if (!initResult.success) {
        const error = initResult.error || 'Failed to initiate upload';
        onError?.(error);
        return { success: false, error };
      }

      const { uploadId, totalChunks, expiresAt } = initResult.data;
      console.log(`Starting upload: uploadId=${uploadId}, totalChunks=${totalChunks}`);
      const parts: UploadPart[] = [];

      // Step 2: Upload chunks with retry logic
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        let chunkUploaded = false;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!chunkUploaded && retryCount <= maxRetries) {
          const progress = Math.round(((chunkIndex + 1) / totalChunks) * 90); // Reserve 10% for completion
          const retryText = retryCount > 0 ? ` (retry ${retryCount}/${maxRetries})` : '';
          onProgress?.(progress, `Uploading chunk ${chunkIndex + 1} of ${totalChunks}${retryText}...`);

          const formData = new FormData();
          formData.append('uploadId', uploadId);
          formData.append('chunkIndex', chunkIndex.toString());
          formData.append('chunk', new File([chunk], `chunk_${chunkIndex}`, { type: file.type }));

          console.log(`Uploading chunk ${chunkIndex + 1} of ${totalChunks}, size: ${chunk.size} bytes${retryText}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            console.error(`Chunk ${chunkIndex + 1} timed out after 120 seconds`);
            controller.abort();
          }, 120000); // 120 second timeout for better network reliability
          
          try {
            const chunkResponse = await fetch(`${this.API_BASE}?action=upload-chunk`, {
              method: 'POST',
              body: formData,
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            console.log(`Chunk ${chunkIndex + 1} response status:`, chunkResponse.status);
            
            if (!chunkResponse.ok) {
              const errorText = await chunkResponse.text();
              console.error(`Chunk ${chunkIndex + 1} failed with status ${chunkResponse.status}:`, errorText);
              throw new Error(`HTTP ${chunkResponse.status}: ${errorText}`);
            }

            const chunkResult: any = await chunkResponse.json();
            console.log(`Chunk ${chunkIndex + 1} result:`, chunkResult);

            if (!chunkResult.success) {
              const error = chunkResult.error || `Failed to upload chunk ${chunkIndex + 1}`;
              throw new Error(error);
            }

            parts.push({
              partNumber: chunkResult.data.partNumber,
              etag: chunkResult.data.etag
            });
            
            chunkUploaded = true;
            console.log(`Chunk ${chunkIndex + 1} uploaded successfully`);
            
          } catch (fetchError) {
            clearTimeout(timeoutId);
            retryCount++;
            
            const errorMessage = fetchError instanceof Error ? fetchError.message : 'Network error';
            console.error(`Chunk ${chunkIndex + 1} attempt ${retryCount} failed:`, errorMessage);
            
            if (retryCount > maxRetries) {
              onError?.(errorMessage);
              await this.abortUpload(uploadId);
              return { success: false, error: `Chunk upload failed after ${maxRetries} retries: ${errorMessage}` };
            }
            
            // Wait before retry with exponential backoff
            const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 5000); // 1s, 2s, 4s, max 5s
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
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

  static shouldUseChunkedUpload(fileSize: number, threshold: number = 50 * 1024 * 1024): boolean {
    // Use chunked upload for files larger than 50MB (with 5MB chunks for maximum reliability)
    return fileSize > threshold;
  }
}

export default MultipartUploader;