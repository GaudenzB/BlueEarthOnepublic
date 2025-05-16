import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { UserPermissions } from "./UserPermissions";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UserDetailsProps {
  userId: number;
  onBackClick: () => void;
}

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  active: boolean;
  createdAt: string;
}

export function UserDetails({ userId, onBackClick }: UserDetailsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "",
    active: true,
    password: "",
  });
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("details");

  // Load user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const userData = await apiRequest<User>(`/api/users/${userId}`);
        setUser(userData);
        setFormData({
          username: userData.username,
          email: userData.email || "",
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          role: userData.role,
          active: userData.active,
          password: "", // Password field is always empty when editing
        });
      } catch (error) {
        console.error("Error fetching user:", error);
        toast({
          title: "Error",
          description: "Failed to load user details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, active: checked }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      // Prepare submission data (omit empty values)
      const submissionData: Record<string, any> = {};
      
      Object.entries(formData).forEach(([key, value]) => {
        // Only include password if it's not empty
        if (key === "password" && !value) return;
        
        // Include other fields only if they have changed
        if (user && user[key as keyof User] !== value) {
          submissionData[key] = value;
        }
      });
      
      // If nothing has changed, don't submit
      if (Object.keys(submissionData).length === 0) {
        toast({
          title: "No changes",
          description: "No changes were made to the user",
        });
        setIsSaving(false);
        return;
      }
      
      // Update user
      const updatedUser = await apiRequest<User>(`/api/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(submissionData),
      });
      
      // Update local state
      setUser(updatedUser);
      setFormData({
        username: updatedUser.username,
        email: updatedUser.email || "",
        firstName: updatedUser.firstName || "",
        lastName: updatedUser.lastName || "",
        role: updatedUser.role,
        active: updatedUser.active,
        password: "", // Reset password field
      });
      
      // Show success message
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle user deletion
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete user ${user?.username}?`)) {
      return;
    }
    
    try {
      await apiRequest(`/api/users/${userId}`, {
        method: "DELETE",
      });
      
      // Show success message
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // Go back to user list
      onBackClick();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  // If loading, show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading user details...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // If user not found, show error
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User not found</CardTitle>
          <CardDescription>
            The requested user could not be found.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBackClick}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        
        {isSuperAdmin && (
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete User
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">User Details</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
              <CardDescription>
                View and edit user information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleSelectChange("role", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="superadmin">SuperAdmin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password (leave blank to keep current)</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="New password"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={formData.active}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <Label htmlFor="active">Active account</Label>
                </div>
                
                <div className="pt-4">
                  <Button type="submit" disabled={isSaving} className="bg-blue-800 hover:bg-blue-900">
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions">
          {user && (
            <UserPermissions 
              userId={user.id} 
              userName={`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}