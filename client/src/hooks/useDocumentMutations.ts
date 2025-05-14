import { useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiRequest } from "@/lib/queryClient";
import { Document, DocumentProcessingStatus } from "@/types/document";

/**
 * Custom hook for document delete mutation
 */
export function useDocumentDelete(id: string) {
  const queryClient = useQueryClient();
  
  interface DeleteMutationContext {
    previousDocuments: Document[] | undefined;
  }
  
  return useMutation<void, Error, void, DeleteMutationContext>({
    mutationFn: () => {
      return apiRequest<void>(`/api/documents/${id}`, { method: 'DELETE' });
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/documents'] });
      
      // Snapshot the previous value
      const previousDocuments = queryClient.getQueryData<Document[]>(['/api/documents']);
      
      // Optimistically update the documents list (remove this document)
      if (previousDocuments) {
        queryClient.setQueryData<Document[]>(
          ['/api/documents'], 
          previousDocuments.filter(doc => doc.id !== id)
        );
      }
      
      // Return context with the previous documents
      return { previousDocuments };
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      message.success('Document deleted successfully');
      
      // Navigate back to documents page (handle in component)
    },
    onError: (error: Error, _, context: DeleteMutationContext | undefined) => {
      // If there was an error, we need to rollback the optimistic update
      if (context?.previousDocuments) {
        queryClient.setQueryData<Document[]>(['/api/documents'], context.previousDocuments);
      }
      message.error(`Failed to delete document: ${error.message || 'Unknown error'}`);
    }
  });
}

/**
 * Custom hook for document refresh status mutation
 */
export function useDocumentRefreshStatus(id: string) {
  const queryClient = useQueryClient();

  interface RefreshMutationContext {
    previousDocument: Document | undefined;
    previousDocumentsList: Document[] | undefined;
  }

  return useMutation<void, Error, void, RefreshMutationContext>({
    mutationFn: () => {
      return apiRequest<void>(`/api/documents/${id}/refresh-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/documents', id] });
      await queryClient.cancelQueries({ queryKey: ['/api/documents'] });
      
      // Snapshot the previous values
      const previousDocument = queryClient.getQueryData<Document>(['/api/documents', id]);
      const previousDocumentsList = queryClient.getQueryData<Document[]>(['/api/documents']);
      
      // Create an optimistic update for individual document
      if (previousDocument) {
        const optimisticDocument: Document = {
          ...previousDocument,
          processingStatus: 'PROCESSING' as DocumentProcessingStatus
        };
        
        // Update the individual document
        queryClient.setQueryData<Document>(['/api/documents', id], optimisticDocument);
        
        // Also update document in the list if it exists there
        if (previousDocumentsList) {
          const updatedList = previousDocumentsList.map(doc => 
            doc.id === id ? optimisticDocument : doc
          );
          queryClient.setQueryData<Document[]>(['/api/documents'], updatedList);
        }
      }
      
      // Return context with previous states
      return { 
        previousDocument,
        previousDocumentsList 
      };
    },
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['/api/documents', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      message.success('Document status refresh initiated');
    },
    onError: (error: Error, _, context: RefreshMutationContext | undefined) => {
      // If there was an error, restore previous document states
      if (context?.previousDocument) {
        queryClient.setQueryData<Document>(['/api/documents', id], context.previousDocument);
      }
      
      if (context?.previousDocumentsList) {
        queryClient.setQueryData<Document[]>(['/api/documents'], context.previousDocumentsList);
      }
      
      message.error(`Failed to refresh document status: ${error.message || 'Unknown error'}`);
    }
  });
}

/**
 * Custom hook for toggling document favorite status
 */
export function useDocumentFavoriteToggle(id: string) {
  const queryClient = useQueryClient();

  interface FavoriteMutationContext {
    previousDocument: Document | undefined;
    previousDocumentsList: Document[] | undefined;
  }

  return useMutation<void, Error, void, FavoriteMutationContext>({
    mutationFn: () => {
      // The API endpoint would typically accept a parameter to toggle favorite status
      return apiRequest<void>(`/api/documents/${id}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/documents', id] });
      await queryClient.cancelQueries({ queryKey: ['/api/documents'] });
      
      // Snapshot the previous document states
      const previousDocument = queryClient.getQueryData<Document>(['/api/documents', id]);
      const previousDocumentsList = queryClient.getQueryData<Document[]>(['/api/documents']);
      
      // Create an optimistic update with toggled favorite status
      if (previousDocument) {
        const optimisticDocument: Document = {
          ...previousDocument,
          isFavorite: !previousDocument.isFavorite
        };
        
        // Update the individual document
        queryClient.setQueryData<Document>(['/api/documents', id], optimisticDocument);
        
        // Also update document in the list if it exists there
        if (previousDocumentsList) {
          const updatedList = previousDocumentsList.map(doc => 
            doc.id === id ? optimisticDocument : doc
          );
          queryClient.setQueryData<Document[]>(['/api/documents'], updatedList);
        }
      }
      
      // Return context with the previous document states
      return { 
        previousDocument,
        previousDocumentsList 
      };
    },
    onSuccess: (_, __, context) => {
      // Invalidate both the individual document and the documents list
      queryClient.invalidateQueries({ queryKey: ['/api/documents', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      // Show success message based on the action performed
      const wasFavorite = context?.previousDocument?.isFavorite;
      message.success(wasFavorite ? 'Removed from favorites' : 'Added to favorites');
    },
    onError: (error: Error, _, context: FavoriteMutationContext | undefined) => {
      // If there was an error, restore previous document states
      if (context?.previousDocument) {
        queryClient.setQueryData<Document>(['/api/documents', id], context.previousDocument);
      }
      
      if (context?.previousDocumentsList) {
        queryClient.setQueryData<Document[]>(['/api/documents'], context.previousDocumentsList);
      }
      
      message.error(`Failed to update favorite status: ${error.message || 'Unknown error'}`);
    }
  });
}

/**
 * Custom hook for document version restore mutation
 */
export function useDocumentVersionRestore(id: string) {
  const queryClient = useQueryClient();

  interface RestoreVersionMutationContext {
    previousDocument: Document | undefined;
    previousDocumentsList: Document[] | undefined;
  }

  return useMutation<void, Error, string, RestoreVersionMutationContext>({
    mutationFn: (versionId: string) => {
      return apiRequest<void>(`/api/documents/${id}/versions/${versionId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onMutate: async (versionId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/documents', id] });
      await queryClient.cancelQueries({ queryKey: ['/api/documents'] });
      
      // Snapshot the previous document states
      const previousDocument = queryClient.getQueryData<Document>(['/api/documents', id]);
      const previousDocumentsList = queryClient.getQueryData<Document[]>(['/api/documents']);
      
      if (previousDocument) {
        // Find the selected version
        const selectedVersion = previousDocument.versions?.find(v => v.id === versionId);
        
        if (selectedVersion) {
          // Create an optimistic update with the restored version info
          const optimisticDocument: Document = {
            ...previousDocument,
            updatedAt: new Date().toISOString(), // Update timestamp
            processingStatus: 'PROCESSING' as DocumentProcessingStatus, // Show as processing
            activeRestoreVersionId: versionId // Track which version is being restored
          };
          
          // Update the individual document
          queryClient.setQueryData<Document>(['/api/documents', id], optimisticDocument);
          
          // Also update document in the list if it exists there
          if (previousDocumentsList) {
            const updatedList = previousDocumentsList.map(doc => 
              doc.id === id ? optimisticDocument : doc
            );
            queryClient.setQueryData<Document[]>(['/api/documents'], updatedList);
          }
          
          // Show optimistic success message
          message.success(`Restoring to version ${selectedVersion.versionNumber}...`);
        }
      }
      
      // Return context with the previous document states
      return { 
        previousDocument,
        previousDocumentsList 
      };
    },
    onSuccess: () => {
      // Invalidate both the individual document and the documents list
      queryClient.invalidateQueries({ queryKey: ['/api/documents', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      message.success('Document version restored successfully');
    },
    onError: (error: Error, _, context: RestoreVersionMutationContext | undefined) => {
      // If there was an error, restore previous document states
      if (context?.previousDocument) {
        queryClient.setQueryData<Document>(['/api/documents', id], context.previousDocument);
      }
      
      if (context?.previousDocumentsList) {
        queryClient.setQueryData<Document[]>(['/api/documents'], context.previousDocumentsList);
      }
      
      message.error(`Failed to restore version: ${error.message || 'Unknown error'}`);
    }
  });
}