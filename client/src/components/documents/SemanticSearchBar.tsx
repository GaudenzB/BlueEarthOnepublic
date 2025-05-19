import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { semanticSearch, type SearchResult } from '@/services/documentSearchService';
import { formatDate } from '@/utils/formatting';
import { cn } from '@/lib/utils';

interface SemanticSearchBarProps {
  onResultClick?: (result: SearchResult) => void;
  className?: string;
}

const DOCUMENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'CONTRACT', label: 'Contracts' },
  { value: 'AGREEMENT', label: 'Agreements' },
  { value: 'POLICY', label: 'Policies' },
  { value: 'REPORT', label: 'Reports' },
  { value: 'PRESENTATION', label: 'Presentations' },
  { value: 'CORRESPONDENCE', label: 'Correspondence' },
  { value: 'INVOICE', label: 'Invoices' },
  { value: 'OTHER', label: 'Other' },
];

export function SemanticSearchBar({ onResultClick, className }: SemanticSearchBarProps) {
  const [query, setQuery] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  
  // Search query
  const { 
    data, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['documentSemanticSearch', query, documentType],
    queryFn: () => semanticSearch({ 
      query, 
      documentType: documentType || undefined,
      minSimilarity: 0.6
    }),
    enabled: searchActive && query.length > 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
  
  const results = data?.results || [];
  const showResults = searchActive && query.length > 2 && !isLoading && results.length > 0;
  const showNoResults = searchActive && query.length > 2 && !isLoading && results.length === 0;
  
  const handleSearch = () => {
    if (query.length > 2) {
      setSearchActive(true);
      refetch();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    }
    setSearchActive(false);
  };
  
  return (
    <div className={cn("relative w-full max-w-2xl", className)}>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search documents by content..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        
        <Select value={documentType} onValueChange={setDocumentType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="submit" 
                onClick={handleSearch}
                disabled={query.length < 3 || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="sr-only">Search</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Search documents by semantic meaning</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {showResults && (
        <Card className="absolute z-50 mt-2 w-full max-h-[500px] overflow-y-auto">
          <CardContent className="p-2">
            <div className="text-xs text-muted-foreground mb-2">
              {results.length} semantic matches found
            </div>
            
            <ul className="space-y-2">
              {results.map((result) => (
                <li 
                  key={`${result.id}-${result.chunkIndex}`}
                  className="p-2 hover:bg-accent rounded-md cursor-pointer transition-colors"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex justify-between items-start">
                    <div className="text-sm font-medium">{result.title || 'Untitled Document'}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {result.documentType}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(result.similarity * 100)}% match
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDate(new Date(result.updatedAt))}
                  </div>
                  
                  <div className="mt-2 text-sm text-foreground/70 line-clamp-3">
                    {result.textChunk}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {showNoResults && (
        <Card className="absolute z-50 mt-2 w-full">
          <CardContent className="p-4">
            <div className="text-center text-muted-foreground">
              No documents found matching your query.
            </div>
          </CardContent>
        </Card>
      )}
      
      {isError && (
        <Card className="absolute z-50 mt-2 w-full">
          <CardContent className="p-4">
            <div className="text-center text-destructive">
              Error searching documents. Please try again.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}