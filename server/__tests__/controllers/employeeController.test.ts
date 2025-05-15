import { Request, Response } from 'express';
import { 
  getEmployees, 
  getEmployeeById, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee, 
  searchEmployees 
} from '../../controllers/employeeController';
import { storage } from '../../storage';
import { mockRequest, mockResponse, mockNext } from '../utils/expressUtils';

// Mock dependencies
jest.mock('../../storage');

describe('Employee Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEmployees', () => {
    it('should return all employees', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      
      const mockEmployees = [
        {
          id: 1,
          name: 'John Doe',
          position: 'Software Engineer',
          department: 'engineering',
          location: 'New York',
          email: 'john.doe@example.com',
          status: 'active'
        },
        {
          id: 2,
          name: 'Jane Smith',
          position: 'Product Manager',
          department: 'product',
          location: 'San Francisco',
          email: 'jane.smith@example.com',
          status: 'active'
        }
      ];
      
      // Mock the storage
      (storage.getAllEmployees as jest.Mock).mockResolvedValue(mockEmployees);
      
      // Act
      await getEmployees(req as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockEmployees
      }));
    });
    
    it('should handle errors appropriately', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      
      // Mock the storage to throw error
      (storage.getAllEmployees as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Act
      await getEmployees(req as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('error')
      }));
    });
  });
  
  describe('getEmployeeById', () => {
    it('should return 404 for non-existent employee', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: '999' }
      });
      const res = mockResponse();
      
      // Mock the storage
      (storage.getEmployee as jest.Mock).mockResolvedValue(undefined);
      
      // Act
      await getEmployeeById(req as unknown as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('not found')
      }));
    });
    
    it('should return employee data for valid ID', async () => {
      // Arrange
      const req = mockRequest({
        params: { id: '1' }
      });
      const res = mockResponse();
      
      const mockEmployee = {
        id: 1,
        name: 'John Doe',
        position: 'Software Engineer',
        department: 'engineering',
        location: 'New York',
        email: 'john.doe@example.com',
        status: 'active'
      };
      
      // Mock the storage
      (storage.getEmployee as jest.Mock).mockResolvedValue(mockEmployee);
      
      // Act
      await getEmployeeById(req as unknown as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockEmployee
      }));
    });
  });
  
  describe('createEmployee', () => {
    it('should create and return a new employee', async () => {
      // Arrange
      const newEmployeeData = {
        name: 'New Employee',
        position: 'Designer',
        department: 'design',
        location: 'Remote',
        email: 'new.employee@example.com',
        status: 'active'
      };
      
      const req = mockRequest({
        body: newEmployeeData
      });
      const res = mockResponse();
      
      const createdEmployee = {
        id: 3,
        ...newEmployeeData
      };
      
      // Mock the storage
      (storage.createEmployee as jest.Mock).mockResolvedValue(createdEmployee);
      
      // Act
      await createEmployee(req as Request, res as Response);
      
      // Assert
      expect(storage.createEmployee).toHaveBeenCalledWith(expect.objectContaining(newEmployeeData));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: createdEmployee
      }));
    });
    
    it('should handle validation errors', async () => {
      // Arrange
      const invalidEmployeeData = {
        // Missing required fields
        name: 'New Employee',
        email: 'invalid-email' // Invalid email format
      };
      
      const req = mockRequest({
        body: invalidEmployeeData
      });
      const res = mockResponse();
      
      // Mock validation error
      const validationError = new Error('Validation error');
      validationError.name = 'ValidationError';
      (storage.createEmployee as jest.Mock).mockRejectedValue(validationError);
      
      // Act
      await createEmployee(req as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('validation')
      }));
    });
  });
  
  describe('updateEmployee', () => {
    it('should update and return an employee', async () => {
      // Arrange
      const employeeId = '1';
      const updateData = {
        position: 'Senior Software Engineer',
        location: 'Berlin'
      };
      
      const req = mockRequest({
        params: { id: employeeId },
        body: updateData
      });
      const res = mockResponse();
      
      const updatedEmployee = {
        id: 1,
        name: 'John Doe',
        position: 'Senior Software Engineer',
        department: 'engineering',
        location: 'Berlin',
        email: 'john.doe@example.com',
        status: 'active'
      };
      
      // Mock the storage
      (storage.updateEmployee as jest.Mock).mockResolvedValue(updatedEmployee);
      
      // Act
      await updateEmployee(req as unknown as Request, res as Response);
      
      // Assert
      expect(storage.updateEmployee).toHaveBeenCalledWith(
        parseInt(employeeId),
        expect.objectContaining(updateData)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: updatedEmployee
      }));
    });
    
    it('should return 404 for non-existent employee', async () => {
      // Arrange
      const employeeId = '999';
      const updateData = {
        position: 'New Position'
      };
      
      const req = mockRequest({
        params: { id: employeeId },
        body: updateData
      });
      const res = mockResponse();
      
      // Mock the storage
      (storage.updateEmployee as jest.Mock).mockResolvedValue(undefined);
      
      // Act
      await updateEmployee(req as unknown as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('not found')
      }));
    });
  });
  
  describe('deleteEmployee', () => {
    it('should delete and confirm success', async () => {
      // Arrange
      const employeeId = '1';
      
      const req = mockRequest({
        params: { id: employeeId }
      });
      const res = mockResponse();
      
      // Mock the storage
      (storage.deleteEmployee as jest.Mock).mockResolvedValue(true);
      
      // Act
      await deleteEmployee(req as unknown as Request, res as Response);
      
      // Assert
      expect(storage.deleteEmployee).toHaveBeenCalledWith(parseInt(employeeId));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('deleted')
      }));
    });
    
    it('should return 404 for non-existent employee', async () => {
      // Arrange
      const employeeId = '999';
      
      const req = mockRequest({
        params: { id: employeeId }
      });
      const res = mockResponse();
      
      // Mock the storage
      (storage.deleteEmployee as jest.Mock).mockResolvedValue(false);
      
      // Act
      await deleteEmployee(req as unknown as Request, res as Response);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('not found')
      }));
    });
  });
  
  describe('searchEmployees', () => {
    it('should search and return matching employees', async () => {
      // Arrange
      const searchQuery = 'engineer';
      
      const req = mockRequest({
        query: { q: searchQuery }
      });
      const res = mockResponse();
      
      const matchingEmployees = [
        {
          id: 1,
          name: 'John Doe',
          position: 'Software Engineer',
          department: 'engineering',
          location: 'New York',
          email: 'john.doe@example.com',
          status: 'active'
        }
      ];
      
      // Mock the storage
      (storage.searchEmployees as jest.Mock).mockResolvedValue(matchingEmployees);
      
      // Act
      await searchEmployees(req as unknown as Request, res as Response);
      
      // Assert
      expect(storage.searchEmployees).toHaveBeenCalledWith(searchQuery);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: matchingEmployees
      }));
    });
    
    it('should handle empty search query', async () => {
      // Arrange
      const req = mockRequest({
        query: { q: '' }
      });
      const res = mockResponse();
      
      const allEmployees = [
        {
          id: 1,
          name: 'John Doe',
          position: 'Software Engineer',
          department: 'engineering',
          location: 'New York',
          email: 'john.doe@example.com',
          status: 'active'
        },
        {
          id: 2,
          name: 'Jane Smith',
          position: 'Product Manager',
          department: 'product',
          location: 'San Francisco',
          email: 'jane.smith@example.com',
          status: 'active'
        }
      ];
      
      // Mock the storage
      (storage.getAllEmployees as jest.Mock).mockResolvedValue(allEmployees);
      
      // Act
      await searchEmployees(req as unknown as Request, res as Response);
      
      // Assert
      expect(storage.getAllEmployees).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: allEmployees
      }));
    });
  });
});