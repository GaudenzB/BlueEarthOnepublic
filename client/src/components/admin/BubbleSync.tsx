import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { colors } from "@/lib/colors";

interface SyncStats {
  totalEmployees: number;
  created: number;
  updated: number;
  unchanged: number;
  errors: number;
}

interface SyncResponse {
  success: boolean;
  message: string;
  stats: SyncStats;
}

interface SyncStatusResponse {
  success: boolean;
  message: string;
  config: {
    bubbleApiUrl: string;
    syncInterval: string;
  };
}

export function BubbleSync() {
  const { toast } = useToast();
  const [lastSyncStats, setLastSyncStats] = useState<SyncStats | null>(null);

  // Query to get Bubble.io sync status
  const { data: syncStatus, isLoading: isStatusLoading } = useQuery<SyncStatusResponse>({
    queryKey: ['/api/bubble/sync-status'],
    refetchOnWindowFocus: false,
  });

  // Mutation to trigger a sync
  const syncMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<SyncResponse>('/api/bubble/sync-employees', {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Sync Completed',
        description: `Successfully synced ${data.stats.totalEmployees} employees from Bubble.io`,
      });
      setLastSyncStats(data.stats);
      // Refresh employee data
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Sync Failed',
        description: error?.message || 'Failed to sync employees. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSync = () => {
    syncMutation.mutate();
  };

  const isBubbleConfigured = syncStatus?.config?.bubbleApiUrl === 'Configured';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Bubble.io Integration</CardTitle>
            <CardDescription>Sync employee data from Bubble.io</CardDescription>
          </div>
          {!isStatusLoading && (
            <Badge 
              variant={isBubbleConfigured ? "default" : "destructive"}
              className="ml-2"
            >
              {isBubbleConfigured ? "Connected" : "Not Configured"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-500">
          <p>Automatically syncs employee data from Bubble.io every hour. You can also manually trigger a sync.</p>
          <p className="mt-2">Last sync interval: {syncStatus?.config?.syncInterval || 'Not set'}</p>
        </div>

        {lastSyncStats && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">Last Sync Results:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Total Employees: <span className="font-medium">{lastSyncStats.totalEmployees}</span></div>
              <div>Created: <span className="font-medium text-green-600">{lastSyncStats.created}</span></div>
              <div>Updated: <span className="font-medium text-blue-600">{lastSyncStats.updated}</span></div>
              <div>Unchanged: <span className="font-medium text-gray-600">{lastSyncStats.unchanged}</span></div>
              {lastSyncStats.errors > 0 && (
                <div>Errors: <span className="font-medium text-red-600">{lastSyncStats.errors}</span></div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSync} 
          disabled={syncMutation.isPending || !isBubbleConfigured}
          style={{
            backgroundColor: colors.primary.base,
          }}
          className="w-full"
        >
          {syncMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Now
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}