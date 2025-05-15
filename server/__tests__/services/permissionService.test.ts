import { checkUserPermission, getEffectivePermissions } from '../../services/permissionService';
import { storage } from '../../storage';

// Mock dependencies
jest.mock('../../storage');

describe('Permission Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('checkUserPermission', () => {
    it('should always allow access for superadmin users', async () => {
      // Mock the storage response for a superadmin user
      const mockSuperadmin = {
        id: 1,
        username: 'superadmin',
        email: 'superadmin@example.com',
        role: 'superadmin'
      };
      
      (storage.getUser as jest.Mock).mockResolvedValue(mockSuperadmin);
      (storage.hasPermission as jest.Mock).mockResolvedValue(false); // Should be ignored for superadmin
      
      // Test various permission checks for superadmin
      const result1 = await checkUserPermission(1, 'documents', 'view');
      const result2 = await checkUserPermission(1, 'finance', 'edit');
      const result3 = await checkUserPermission(1, 'hr', 'delete');
      
      // Superadmin should have access to everything
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
      
      // Verify storage.hasPermission was not called for superadmin
      expect(storage.hasPermission).not.toHaveBeenCalled();
    });
    
    it('should allow admins view access to all areas', async () => {
      // Mock the storage response for an admin user
      const mockAdmin = {
        id: 2,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      };
      
      (storage.getUser as jest.Mock).mockResolvedValue(mockAdmin);
      (storage.hasPermission as jest.Mock).mockResolvedValue(false); // Should be ignored for view permissions
      
      // Test view permission check for admin across different areas
      const result1 = await checkUserPermission(2, 'documents', 'view');
      const result2 = await checkUserPermission(2, 'finance', 'view');
      const result3 = await checkUserPermission(2, 'hr', 'view');
      
      // Admin should have view access to all areas
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
      
      // Verify storage.hasPermission was not called for admin view permissions
      expect(storage.hasPermission).not.toHaveBeenCalled();
    });
    
    it('should allow admins all permissions to documents area', async () => {
      // Mock the storage response for an admin user
      const mockAdmin = {
        id: 2,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      };
      
      (storage.getUser as jest.Mock).mockResolvedValue(mockAdmin);
      (storage.hasPermission as jest.Mock).mockResolvedValue(false); // Should be ignored for documents area
      
      // Test all permission types for admin in documents area
      const result1 = await checkUserPermission(2, 'documents', 'view');
      const result2 = await checkUserPermission(2, 'documents', 'edit');
      const result3 = await checkUserPermission(2, 'documents', 'delete');
      
      // Admin should have all permissions to documents area
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
      
      // Verify storage.hasPermission was not called for admin document permissions
      expect(storage.hasPermission).not.toHaveBeenCalled();
    });
    
    it('should check specific permissions for non-admin users', async () => {
      // Mock the storage response for a regular user
      const mockUser = {
        id: 3,
        username: 'user',
        email: 'user@example.com',
        role: 'user'
      };
      
      (storage.getUser as jest.Mock).mockResolvedValue(mockUser);
      
      // Set up different permission responses
      (storage.hasPermission as jest.Mock).mockImplementation((userId, area, permission) => {
        // Only allow this user to view/edit HR, but not delete
        if (userId === 3 && area === 'hr') {
          return permission === 'view' || permission === 'edit';
        }
        return false;
      });
      
      // Test various permission checks
      const result1 = await checkUserPermission(3, 'hr', 'view');
      const result2 = await checkUserPermission(3, 'hr', 'edit');
      const result3 = await checkUserPermission(3, 'hr', 'delete');
      const result4 = await checkUserPermission(3, 'finance', 'view');
      
      // Regular user should only have specific permissions
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(false);
      expect(result4).toBe(false);
      
      // Verify storage.hasPermission was called appropriately
      expect(storage.hasPermission).toHaveBeenCalledTimes(4);
      expect(storage.hasPermission).toHaveBeenCalledWith(3, 'hr', 'view');
      expect(storage.hasPermission).toHaveBeenCalledWith(3, 'hr', 'edit');
      expect(storage.hasPermission).toHaveBeenCalledWith(3, 'hr', 'delete');
      expect(storage.hasPermission).toHaveBeenCalledWith(3, 'finance', 'view');
    });
    
    it('should handle user not found', async () => {
      // Mock the storage to return undefined (user not found)
      (storage.getUser as jest.Mock).mockResolvedValue(undefined);
      
      // Test permission check for non-existent user
      const result = await checkUserPermission(999, 'documents', 'view');
      
      // Should deny permission for non-existent user
      expect(result).toBe(false);
      
      // Verify storage.hasPermission was not called
      expect(storage.hasPermission).not.toHaveBeenCalled();
    });
  });
  
  describe('getEffectivePermissions', () => {
    it('should return all permissions enabled for superadmin', async () => {
      // Mock the storage response for a superadmin user
      const mockSuperadmin = {
        id: 1,
        username: 'superadmin',
        email: 'superadmin@example.com',
        role: 'superadmin'
      };
      
      (storage.getUser as jest.Mock).mockResolvedValue(mockSuperadmin);
      (storage.getUserPermissions as jest.Mock).mockResolvedValue([]); // No specific permissions needed
      
      // Get effective permissions for superadmin
      const permissions = await getEffectivePermissions(1);
      
      // Superadmin should have all permissions
      expect(permissions).toContainEqual(expect.objectContaining({
        area: 'documents',
        canView: true,
        canEdit: true,
        canDelete: true
      }));
      
      expect(permissions).toContainEqual(expect.objectContaining({
        area: 'finance',
        canView: true,
        canEdit: true,
        canDelete: true
      }));
      
      expect(permissions).toContainEqual(expect.objectContaining({
        area: 'hr',
        canView: true,
        canEdit: true,
        canDelete: true
      }));
    });
    
    it('should add view permissions for admin', async () => {
      // Mock the storage response for an admin user
      const mockAdmin = {
        id: 2,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      };
      
      // Admin has specific permissions in the database
      const mockAdminPermissions = [
        {
          id: 1,
          userId: 2,
          area: 'finance',
          canView: false, // This should be overridden to true for admin
          canEdit: true,
          canDelete: false
        }
      ];
      
      (storage.getUser as jest.Mock).mockResolvedValue(mockAdmin);
      (storage.getUserPermissions as jest.Mock).mockResolvedValue(mockAdminPermissions);
      
      // Get effective permissions for admin
      const permissions = await getEffectivePermissions(2);
      
      // Admin should have view access to everything
      const financePermission = permissions.find(p => p.area === 'finance');
      expect(financePermission).toBeDefined();
      expect(financePermission?.canView).toBe(true);
      expect(financePermission?.canEdit).toBe(true);
      expect(financePermission?.canDelete).toBe(false);
      
      // All other areas should have view permission
      const otherAreas = permissions.filter(p => p.area !== 'finance');
      otherAreas.forEach(area => {
        expect(area.canView).toBe(true);
      });
    });
    
    it('should give admins full document permissions', async () => {
      // Mock the storage response for an admin user
      const mockAdmin = {
        id: 2,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      };
      
      // Admin has specific permissions in the database (even if restricted)
      const mockAdminPermissions = [
        {
          id: 1,
          userId: 2,
          area: 'documents',
          canView: false, // Should be overridden to true
          canEdit: false, // Should be overridden to true
          canDelete: false // Should be overridden to true
        }
      ];
      
      (storage.getUser as jest.Mock).mockResolvedValue(mockAdmin);
      (storage.getUserPermissions as jest.Mock).mockResolvedValue(mockAdminPermissions);
      
      // Get effective permissions for admin
      const permissions = await getEffectivePermissions(2);
      
      // Admin should have full access to documents
      const documentsPermission = permissions.find(p => p.area === 'documents');
      expect(documentsPermission).toBeDefined();
      expect(documentsPermission?.canView).toBe(true);
      expect(documentsPermission?.canEdit).toBe(true);
      expect(documentsPermission?.canDelete).toBe(true);
    });
    
    it('should return only granted permissions for regular users', async () => {
      // Mock the storage response for a regular user
      const mockUser = {
        id: 3,
        username: 'user',
        email: 'user@example.com',
        role: 'user'
      };
      
      // User has specific permissions in the database
      const mockUserPermissions = [
        {
          id: 1,
          userId: 3,
          area: 'hr',
          canView: true,
          canEdit: true,
          canDelete: false
        },
        {
          id: 2,
          userId: 3,
          area: 'documents',
          canView: true,
          canEdit: false,
          canDelete: false
        }
      ];
      
      (storage.getUser as jest.Mock).mockResolvedValue(mockUser);
      (storage.getUserPermissions as jest.Mock).mockResolvedValue(mockUserPermissions);
      
      // Get effective permissions for user
      const permissions = await getEffectivePermissions(3);
      
      // User should have only the specific permissions granted
      expect(permissions).toHaveLength(2);
      
      const hrPermission = permissions.find(p => p.area === 'hr');
      expect(hrPermission).toBeDefined();
      expect(hrPermission?.canView).toBe(true);
      expect(hrPermission?.canEdit).toBe(true);
      expect(hrPermission?.canDelete).toBe(false);
      
      const documentsPermission = permissions.find(p => p.area === 'documents');
      expect(documentsPermission).toBeDefined();
      expect(documentsPermission?.canView).toBe(true);
      expect(documentsPermission?.canEdit).toBe(false);
      expect(documentsPermission?.canDelete).toBe(false);
    });
    
    it('should handle user not found', async () => {
      // Mock the storage to return undefined (user not found)
      (storage.getUser as jest.Mock).mockResolvedValue(undefined);
      
      // Test get effective permissions for non-existent user
      const permissions = await getEffectivePermissions(999);
      
      // Should return empty array for non-existent user
      expect(permissions).toEqual([]);
    });
  });
});