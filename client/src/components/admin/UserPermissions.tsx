import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, CheckSquare, Edit, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";

interface UserPermissionsProps {
  userId: number;
  userName: string;
}

export function UserPermissions({ userId, userName }: UserPermissionsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPermissionId, setSelectedPermissionId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    area: "finance",
    canView: true,
    canEdit: false,
    canDelete: false,
  });

  const { permissions, isLoading, addPermission, updatePermission, deletePermission } = usePermissions(userId);

  // Get permission by ID
  const getPermissionById = (id: number) => {
    return permissions.find(p => p.id === id);
  };

  // Handle area change
  const handleAreaChange = (value: string) => {
    setFormData(prev => ({ ...prev, area: value }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (field: 'canView' | 'canEdit' | 'canDelete', checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  // Handle add permission
  const handleAddPermission = async () => {
    try {
      await addPermission.mutateAsync({
        area: formData.area as string, // Properly typed as string instead of any
        canView: formData.canView,
        canEdit: formData.canEdit,
        canDelete: formData.canDelete,
      });
      
      toast({
        title: "Success",
        description: "Permission added successfully",
      });
      
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add permission",
        variant: "destructive",
      });
    }
  };

  // Handle edit permission
  const handleEditPermission = async () => {
    if (!selectedPermissionId) return;
    
    try {
      await updatePermission.mutateAsync({
        id: selectedPermissionId,
        data: {
          canView: formData.canView,
          canEdit: formData.canEdit,
          canDelete: formData.canDelete,
        },
      });
      
      toast({
        title: "Success",
        description: "Permission updated successfully",
      });
      
      setIsEditDialogOpen(false);
      setSelectedPermissionId(null);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update permission",
        variant: "destructive",
      });
    }
  };

  // Handle delete permission
  const handleDeletePermission = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this permission?")) return;
    
    try {
      await deletePermission.mutateAsync(id);
      
      toast({
        title: "Success",
        description: "Permission deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete permission",
        variant: "destructive",
      });
    }
  };

  // Handle edit click
  const handleEditClick = (id: number) => {
    const permission = getPermissionById(id);
    if (!permission) return;
    
    setSelectedPermissionId(id);
    setFormData({
      area: permission.area,
      canView: permission.canView,
      canEdit: permission.canEdit,
      canDelete: permission.canDelete,
    });
    
    setIsEditDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      area: "finance",
      canView: true,
      canEdit: false,
      canDelete: false,
    });
  };

  // Format area name
  const formatAreaName = (area: string) => {
    if (area === 'hr') return 'HR';
    if (area === 'it') return 'IT';
    return area.charAt(0).toUpperCase() + area.slice(1);
  };

  // Get area badge color
  const getAreaBadgeColor = (area: string): string => {
    switch (area) {
      case 'finance': return 'bg-green-100 text-green-800 border-green-300';
      case 'hr': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'it': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legal': return 'bg-red-100 text-red-800 border-red-300';
      case 'operations': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
      return undefined; // Default fallback case
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Functional Permissions</CardTitle>
        <CardDescription>
          Manage {userName}'s functional area permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-800 hover:bg-blue-900">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Permission
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Functional Permission</DialogTitle>
                  <DialogDescription>
                    Grant {userName} access to a functional area
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="area" className="text-right">
                      Functional Area
                    </Label>
                    <Select
                      value={formData.area}
                      onValueChange={handleAreaChange}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="it">IT</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">
                      Permissions
                    </Label>
                    <div className="col-span-3 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="canView" 
                          checked={formData.canView}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('canView', checked as boolean)
                          }
                        />
                        <Label htmlFor="canView">Can View</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="canEdit" 
                          checked={formData.canEdit}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('canEdit', checked as boolean)
                          }
                        />
                        <Label htmlFor="canEdit">Can Edit</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="canDelete" 
                          checked={formData.canDelete}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('canDelete', checked as boolean)
                          }
                        />
                        <Label htmlFor="canDelete">Can Delete</Label>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="submit" 
                    onClick={handleAddPermission}
                    disabled={addPermission.isPending}
                    className="bg-blue-800 hover:bg-blue-900"
                  >
                    {addPermission.isPending ? "Adding..." : "Add Permission"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {permissions.length === 0 ? (
            <div className="p-6 text-center border rounded-md bg-gray-50">
              <p className="text-gray-500">
                {isLoading 
                  ? "Loading permissions..." 
                  : "No functional permissions assigned yet"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Functional Area</TableHead>
                    <TableHead>View</TableHead>
                    <TableHead>Edit</TableHead>
                    <TableHead>Delete</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <Badge className={getAreaBadgeColor(permission.area)}>
                          {formatAreaName(permission.area)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {permission.canView ? (
                          <CheckSquare className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell>
                        {permission.canEdit ? (
                          <CheckSquare className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell>
                        {permission.canDelete ? (
                          <CheckSquare className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(permission.id)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePermission(permission.id)}
                          className="text-red-500 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        
        {/* Edit Permission Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {formatAreaName(formData.area)} Permission</DialogTitle>
              <DialogDescription>
                Modify permission settings for this functional area
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Permissions
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-canView" 
                      checked={formData.canView}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('canView', checked as boolean)
                      }
                    />
                    <Label htmlFor="edit-canView">Can View</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-canEdit" 
                      checked={formData.canEdit}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('canEdit', checked as boolean)
                      }
                    />
                    <Label htmlFor="edit-canEdit">Can Edit</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-canDelete" 
                      checked={formData.canDelete}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('canDelete', checked as boolean)
                      }
                    />
                    <Label htmlFor="edit-canDelete">Can Delete</Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleEditPermission}
                disabled={updatePermission.isPending}
                className="bg-blue-800 hover:bg-blue-900"
              >
                {updatePermission.isPending ? "Updating..." : "Update Permission"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}