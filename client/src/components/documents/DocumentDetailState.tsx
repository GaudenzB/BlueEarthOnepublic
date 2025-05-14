import React from 'react';
import { Button } from 'antd';

/**
 * Props for loading, error, and not found states in document detail
 */
export interface DocumentDetailStateProps {
  onReturn: () => void;
  error?: Error;
}

/**
 * Skeleton loading state for document detail
 */
export function DocumentDetailSkeleton() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        marginBottom: 24, 
        alignItems: 'center', 
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <div style={{ width: 100, height: 32, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
        <div style={{ width: 300, height: 32, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
        <div style={{ flex: 1 }}></div>
        <div style={{ width: 100, height: 32, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
        <div style={{ width: 100, height: 32, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
      </div>
      
      <div style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 4, marginBottom: 16, width: '100%' }} />
      <div style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 4, marginBottom: 16, width: '90%' }} />
      <div style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 4, marginBottom: 16, width: '95%' }} />
      
      <div style={{ marginTop: 24 }}>
        <div style={{ height: 32, backgroundColor: '#f0f0f0', borderRadius: 4, marginBottom: 16, width: '20%' }} />
        <div style={{ height: 200, backgroundColor: '#f0f0f0', borderRadius: 4, marginBottom: 16, width: '100%' }} />
      </div>
    </div>
  );
}

/**
 * Error display for document detail
 */
export function DocumentDetailError({ error, onReturn }: DocumentDetailStateProps) {
  return (
    <div style={{ maxWidth: '800px', margin: '48px auto', padding: '0 16px', textAlign: 'center' }}>
      <h2 style={{ color: '#cf1322' }}>Error Loading Document</h2>
      <p style={{ color: '#666' }}>We encountered a problem while retrieving the document.</p>
      <div style={{ margin: '32px 0', color: '#cf1322' }}>
        {error ? error.message || 'An unexpected error occurred' : 'An unexpected error occurred'}
      </div>
      <Button 
        type="primary"
        onClick={onReturn}
      >
        Return to Documents
      </Button>
    </div>
  );
}

/**
 * Not found display for document detail
 */
export function DocumentDetailNotFound({ onReturn }: DocumentDetailStateProps) {
  return (
    <div style={{ maxWidth: '800px', margin: '48px auto', padding: '0 16px', textAlign: 'center' }}>
      <h2>Document Not Found</h2>
      <p style={{ color: '#666' }}>The document you're looking for doesn't exist or you don't have permission to view it.</p>
      <div style={{ margin: '32px 0' }}>
        <Button 
          type="primary"
          onClick={onReturn}
        >
          Return to Documents
        </Button>
      </div>
    </div>
  );
}