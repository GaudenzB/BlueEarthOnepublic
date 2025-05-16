import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UserRoleDebug() {
  const { user } = useAuth();
  
  if (!user) {
    return <div>Not logged in</div>;
  }
  
  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle className="text-lg">User Role Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div><strong>Username:</strong> {user.username}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>User ID:</strong> {user.id}</div>
          <div>
            <strong>Role:</strong> 
            <Badge className="ml-2" variant={user.role === 'superadmin' ? 'destructive' : 'secondary'}>
              {user.role}
            </Badge>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <pre className="bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}