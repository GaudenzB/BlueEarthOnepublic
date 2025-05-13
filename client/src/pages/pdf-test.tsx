import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { PageLayout } from '@/components/layout/PageLayout';

export default function PdfTest() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a PDF file');
      return;
    }
    
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/test-pdf', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to process PDF');
      }
      
      setResult(data);
    } catch (err) {
      console.error('PDF Test Error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">PDF Processing Test Tool</h1>
        <p className="mb-8 text-gray-600">
          This tool helps diagnose PDF processing issues by testing the PDF extraction functionality directly.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
              <CardDescription>Select a PDF file to test text extraction</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2" htmlFor="pdf-file">
                    PDF File
                  </label>
                  <input
                    id="pdf-file"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary file:text-white
                      hover:file:bg-primary/90
                      cursor-pointer"
                  />
                </div>
                
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" disabled={!file || isUploading} className="w-full">
                  {isUploading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" /> Processing...
                    </>
                  ) : 'Test PDF Processing'}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>PDF processing results will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              {isUploading ? (
                <div className="text-center py-12">
                  <Spinner className="mx-auto h-8 w-8 mb-4" />
                  <p>Processing PDF...</p>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium mb-2">Status: {result.success ? 'Success' : 'Failed'}</h3>
                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                    
                    {result.success && result.data && (
                      <div className="space-y-2 mt-4">
                        <div>
                          <span className="font-semibold">Pages:</span> {result.data.pageCount}
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-1">Text Preview:</h4>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60 whitespace-pre-wrap">
                            {result.data.textPreview}
                          </pre>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-1">Metadata:</h4>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(result.data.metadata || {}, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {!result.success && result.error && (
                      <div className="bg-red-50 border border-red-100 p-3 rounded mt-4">
                        <h4 className="font-semibold text-red-700 mb-1">Error Details:</h4>
                        <pre className="text-xs overflow-auto max-h-40 text-red-700 whitespace-pre-wrap">
                          {result.error.message}
                          {result.error.stack && `\n\n${result.error.stack}`}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No results yet. Upload and process a PDF to see results.
                </div>
              )}
            </CardContent>
            {result && (
              <CardFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setResult(null)}
                  className="ml-auto"
                >
                  Clear Results
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}