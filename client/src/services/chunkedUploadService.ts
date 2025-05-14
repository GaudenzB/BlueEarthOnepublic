/**
 * Chunked Upload Service
 * 
 * This service provides functionality for chunked file uploads, allowing large files
 * to be split into smaller pieces for more reliable uploads with progress tracking
 * and resume capability.
 */

import { apiRequest } from "@/lib/queryClient";

// Default chunk size: 5MB
const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;

export interface ChunkUploadOptions {
  chunkSize?: number;
  onProgress?: (progress: number) => void;
  onChunkComplete?: (chunkIndex: number, chunksTotal: number) => void;
  onError?: (error: Error, chunkIndex?: number) => void;
  abortSignal?: AbortSignal;
}

export interface UploadResult {
  documentId: string;
  url?: string;
  filename: string;
  success: boolean;
}

/**
 * Upload a file in chunks using pre-signed URLs
 * 
 * @param file The file to upload
 * @param metadata Additional metadata for the document
 * @param options Upload options including chunk size and callbacks
 * @returns Promise resolving to the upload result
 */
export async function uploadFileInChunks(
  file: File,
  metadata: {
    title: string;
    documentType?: string;
    description?: string;
    tags?: string[];
    isConfidential?: boolean;
  },
  options: ChunkUploadOptions = {}
): Promise<UploadResult> {
  const {
    chunkSize = DEFAULT_CHUNK_SIZE,
    onProgress = () => {},
    onChunkComplete = () => {},
    onError = () => {},
    abortSignal
  } = options;

  // Store state related to the upload
  const uploadState: {
    uploadedChunks: number;
    totalChunks: number;
    aborted: boolean;
    uploadId?: string;
    documentKey?: string;
    parts: { partNumber: number; etag: string }[];
  } = {
    uploadedChunks: 0,
    totalChunks: Math.ceil(file.size / chunkSize),
    aborted: false,
    parts: []
  };

  // Check if aborted
  if (abortSignal?.aborted) {
    uploadState.aborted = true;
    throw new Error("Upload aborted before starting");
  }

  // Register abort handler
  abortSignal?.addEventListener("abort", () => {
    uploadState.aborted = true;
  });

  try {
    // Step 1: Initialize multipart upload
    const initUrl = `/api/chunked-uploads/initiate?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}&documentType=${encodeURIComponent(metadata.documentType || "OTHER")}`;
    const initResponse = await apiRequest(initUrl, {
      method: "GET"
    });

    if (!initResponse.success || !initResponse.data) {
      throw new Error("Failed to initialize upload: " + (initResponse.message || "Unknown error"));
    }

    // Save the upload ID and document key
    const { documentKey, uploadId } = initResponse.data;
    uploadState.uploadId = uploadId;
    uploadState.documentKey = documentKey;

    if (!uploadId || !documentKey) {
      throw new Error("Missing upload ID or document key in initialization response");
    }

    // Step 2: Upload each chunk
    for (let i = 0; i < uploadState.totalChunks; i++) {
      // Check if aborted
      if (uploadState.aborted) {
        throw new Error("Upload aborted during chunked upload");
      }

      // Prepare chunk
      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const chunk = file.slice(start, end);
      const partNumber = i + 1; // Part numbers start at 1

      try {
        // Get pre-signed URL for this chunk
        const partUrl = `/api/chunked-uploads/part-url?uploadId=${encodeURIComponent(uploadId)}&documentKey=${encodeURIComponent(documentKey)}&partNumber=${partNumber}&contentType=${encodeURIComponent(file.type)}`;
        const chunkUrlResponse = await apiRequest(partUrl, {
          method: "GET"
        });

        if (!chunkUrlResponse.success || !chunkUrlResponse.data || !chunkUrlResponse.data.url) {
          throw new Error("Failed to get pre-signed URL for chunk " + partNumber);
        }

        // Upload the chunk directly to the pre-signed URL
        const uploadChunkResponse = await fetch(chunkUrlResponse.data.url, {
          method: "PUT",
          body: chunk,
          headers: {
            "Content-Type": file.type,
          },
          signal: abortSignal || null
        });

        if (!uploadChunkResponse.ok) {
          throw new Error(`Chunk ${partNumber} upload failed: ${uploadChunkResponse.statusText}`);
        }

        // Get ETag from response headers
        const etag = uploadChunkResponse.headers.get("ETag");
        if (!etag) {
          throw new Error(`Missing ETag for chunk ${partNumber}`);
        }

        // Store part information for completion
        uploadState.parts.push({
          partNumber,
          etag: etag.replace(/"/g, "") // Remove quotes from ETag
        });

        // Update progress
        uploadState.uploadedChunks++;
        const progress = (uploadState.uploadedChunks / uploadState.totalChunks) * 100;
        onProgress(progress);
        onChunkComplete(i, uploadState.totalChunks);

      } catch (error: any) {
        // Handle chunk upload error
        onError(new Error(`Error uploading chunk ${partNumber}: ${error.message}`), i);
        throw error;
      }
    }

    // Step 3: Complete the chunked upload
    const completeBody = {
      uploadId,
      documentKey,
      parts: uploadState.parts,
      metadata: {
        ...metadata,
        originalFilename: file.name,
        fileSize: file.size,
        mimeType: file.type
      }
    };
    
    const completeResponse = await apiRequest("/api/chunked-uploads/complete", {
      method: "POST",
      body: JSON.stringify(completeBody),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!completeResponse.success || !completeResponse.data) {
      throw new Error("Failed to complete upload: " + (completeResponse.message || "Unknown error"));
    }

    // Return the final result
    return {
      documentId: completeResponse.data.documentId,
      url: completeResponse.data.url,
      filename: file.name,
      success: true
    };

  } catch (error: any) {
    // If upload was aborted, don't throw an error
    if (uploadState.aborted) {
      return {
        documentId: "",
        filename: file.name,
        success: false
      };
    }

    // For all other errors, propagate to caller
    onError(error);
    throw error;
  }
}

/**
 * Abort an ongoing chunked upload
 * 
 * @param uploadId The ID of the upload to abort
 * @param documentKey The storage key of the document being uploaded
 */
export async function abortChunkedUpload(uploadId: string, documentKey: string): Promise<boolean> {
  try {
    const abortBody = { uploadId, documentKey };
    const response = await apiRequest("/api/chunked-uploads/abort", {
      method: "POST",
      body: JSON.stringify(abortBody),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.success || false;
  } catch (error) {
    console.error("Failed to abort chunked upload:", error);
    return false;
  }
}

/**
 * Calculate the optimal chunk size based on file size
 * 
 * @param fileSize Size of the file in bytes
 * @returns Optimal chunk size in bytes
 */
export function calculateOptimalChunkSize(fileSize: number): number {
  // For very small files (< 10MB), use a 1MB chunk size
  if (fileSize < 10 * 1024 * 1024) {
    return 1 * 1024 * 1024;
  }
  
  // For medium files (10MB-100MB), use a 5MB chunk size
  if (fileSize < 100 * 1024 * 1024) {
    return 5 * 1024 * 1024;
  }
  
  // For large files (100MB-1GB), use a 10MB chunk size
  if (fileSize < 1024 * 1024 * 1024) {
    return 10 * 1024 * 1024;
  }
  
  // For very large files (>1GB), use a 20MB chunk size
  return 20 * 1024 * 1024;
}