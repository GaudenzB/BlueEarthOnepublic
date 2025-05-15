// Refactored DocumentDetailContent.tsx for improved layout & design

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DownloadIcon, SparklesIcon } from "lucide-react";

interface DocumentDetailContentProps {
  documentTitle: string;
  documentType: string;
  createdAt: string;
  updatedAt: string;
  onDownload: () => void;
  onAnalyze: () => void;
}

export const DocumentDetailContent = ({
  documentTitle,
  documentType,
  createdAt,
  updatedAt,
  onDownload,
  onAnalyze
}: DocumentDetailContentProps) => {
  return (
    <Card className="rounded-2xl shadow-md p-6 space-y-6">
      <CardHeader className="flex flex-col gap-2">
        <CardTitle className="text-2xl font-semibold text-primary">
          {documentTitle}
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          <span className="mr-4">Created: {createdAt}</span>
          <span>Updated: {updatedAt}</span>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {documentType}
          </Badge>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onDownload} className="gap-2">
            <DownloadIcon className="w-4 h-4" /> Download
          </Button>
          <Button variant="default" onClick={onAnalyze} className="gap-2">
            <SparklesIcon className="w-4 h-4" /> Analyze
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
