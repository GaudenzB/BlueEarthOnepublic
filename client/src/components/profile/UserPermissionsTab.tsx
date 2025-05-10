import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPermissions } from "@/components/admin/UserPermissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SquareUserRound, ShieldCheck, Star, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface UserPermissionsTabProps {
  userId: number;
  userName: string;
  userRole: string;
}

export function UserPermissionsTab({ userId, userName, userRole }: UserPermissionsTabProps) {
  const [activeTab, setActiveTab] = useState("role");
  const { isSuperAdmin } = useAuth();

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'superadmin': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'manager': return 'bg-green-100 text-green-800 border-green-300';
      case 'user': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return <Star className="h-5 w-5 text-purple-600" />;
      case 'admin': return <ShieldCheck className="h-5 w-5 text-blue-600" />;
      case 'manager': return <Shield className="h-5 w-5 text-green-600" />;
      case 'user': return <SquareUserRound className="h-5 w-5 text-gray-600" />;
      default: return <SquareUserRound className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access & Permissions</CardTitle>
        <CardDescription>
          Manage user roles and functional area permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="role" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="role">Role-Based Access</TabsTrigger>
            <TabsTrigger value="functional">Functional Permissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="role">
            <Card>
              <CardHeader>
                <CardTitle>Hierarchical Role</CardTitle>
                <CardDescription>
                  System-wide access level determining baseline permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 p-4 border rounded-md bg-gray-50">
                  <div className="p-3 rounded-full bg-white border">
                    {getRoleIcon(userRole)}
                  </div>
                  <div>
                    <h3 className="font-medium">Current Role</h3>
                    <Badge className={getRoleBadgeColor(userRole)}>
                      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </Badge>
                    
                    <div className="mt-2 text-sm text-gray-500">
                      {userRole === 'superadmin' && "Full system access with all permissions"}
                      {userRole === 'admin' && "Administrative access to most system features"}
                      {userRole === 'manager' && "Can access and manage team resources"}
                      {userRole === 'user' && "Standard access to application features"}
                    </div>
                  </div>
                </div>
                
                {!isSuperAdmin && (
                  <Alert className="mt-4 bg-blue-50 border-blue-200">
                    <AlertTitle>Role changes restricted</AlertTitle>
                    <AlertDescription>
                      Only SuperAdmins can modify user roles. Contact a SuperAdmin if you need
                      this user's role to be changed.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="functional">
            {isSuperAdmin ? (
              <UserPermissions userId={userId} userName={userName} />
            ) : (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertTitle>Permission management restricted</AlertTitle>
                <AlertDescription>
                  Only SuperAdmins can view and modify functional area permissions.
                  Contact a SuperAdmin if you need changes to this user's permissions.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}