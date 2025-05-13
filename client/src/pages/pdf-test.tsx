import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function PdfTest() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setError(null);

    try {
      // Get the stored token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      // Make the API request to test PDF processing
      const response = await fetch('/api/test-pdf/test-pdf', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An error occurred during PDF testing');
      }

      console.log('PDF test response:', data);
      setResult(data.data);
    } catch (error) {
      console.error('PDF test error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">PDF Text Extraction Test</h1>
      <p className="mb-4 text-gray-600">
        This tool helps diagnose PDF processing issues by testing text extraction in isolation, 
        separate from the document analysis workflow.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
            <CardDescription>Select a PDF file to test extraction functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <Input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileChange}
                  className="mb-4"
                />
                {file && (
                  <div className="text-sm text-gray-600 mt-2">
                    Selected file: {file.name} ({Math.round(file.size / 1024)} KB)
                  </div>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isUploading || !file}
              >
                {isUploading ? (
                  <>
                    <Spinner className="mr-2" />
                    Processing...
                  </>
                ) : 'Extract Text'}
              </Button>
            </form>
            {error && (
              <div className="mt-4 p-2 bg-red-100 border border-red-300 text-red-700 rounded">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Extracted text and metadata</CardDescription>
          </CardHeader>
          <CardContent>
            {isUploading ? (
              <div className="flex items-center justify-center p-10">
                <Spinner className="mr-2" />
                <span>Processing PDF...</span>
              </div>
            ) : result ? (
              <div>
                <div className="mb-4">
                  <h3 className="font-semibold text-md">Metadata</h3>
                  <div className="text-sm">
                    <p><strong>Filename:</strong> {result.filename}</p>
                    <p><strong>Size:</strong> {Math.round(result.size / 1024)} KB</p>
                    <p><strong>MIME Type:</strong> {result.mimeType}</p>
                    <p><strong>Extracted Text Length:</strong> {result.textLength} characters</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-md mb-2">Extracted Text (First 500 chars)</h3>
                  <div className="bg-gray-100 p-3 rounded max-h-32 overflow-y-auto mb-2">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {result.extractedText?.substring(0, 500)}
                      {result.extractedText?.length > 500 ? '...' : ''}
                    </pre>
                  </div>
                  
                  <h3 className="font-semibold text-md mb-2">Full Extracted Text</h3>
                  <div className="bg-gray-100 p-3 rounded max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {result.extractedText}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-10 text-gray-500">
                Upload a PDF to see extraction results here
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}