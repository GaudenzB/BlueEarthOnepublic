import { 
  users, type User, type InsertUser,
  employees, type Employee, type InsertEmployee 
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Employee CRUD operations
  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  searchEmployees(search: string): Promise<Employee[]>;
  filterEmployeesByDepartment(department: string): Promise<Employee[]>;
  filterEmployeesByStatus(status: string): Promise<Employee[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private employeesMap: Map<number, Employee>;
  private userCurrentId: number;
  private employeeCurrentId: number;

  constructor() {
    this.users = new Map();
    this.employeesMap = new Map();
    this.userCurrentId = 1;
    this.employeeCurrentId = 1;
    
    // Initialize with sample employee data
    this.initializeEmployees();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Employee methods
  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employeesMap.values());
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employeesMap.get(id);
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = this.employeeCurrentId++;
    const employee: Employee = { ...insertEmployee, id };
    this.employeesMap.set(id, employee);
    return employee;
  }

  async updateEmployee(id: number, updates: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const employee = this.employeesMap.get(id);
    if (!employee) return undefined;

    const updatedEmployee = { ...employee, ...updates };
    this.employeesMap.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    return this.employeesMap.delete(id);
  }

  async searchEmployees(search: string): Promise<Employee[]> {
    const lowerSearch = search.toLowerCase();
    return Array.from(this.employeesMap.values()).filter(employee => 
      employee.name.toLowerCase().includes(lowerSearch) || 
      employee.department.toLowerCase().includes(lowerSearch) ||
      employee.position.toLowerCase().includes(lowerSearch)
    );
  }

  async filterEmployeesByDepartment(department: string): Promise<Employee[]> {
    if (!department) return this.getAllEmployees();
    
    return Array.from(this.employeesMap.values()).filter(employee => 
      employee.department.toLowerCase() === department.toLowerCase()
    );
  }

  async filterEmployeesByStatus(status: string): Promise<Employee[]> {
    if (!status) return this.getAllEmployees();
    
    return Array.from(this.employeesMap.values()).filter(employee => 
      employee.status.toLowerCase() === status.toLowerCase()
    );
  }

  // Initialize with sample employee data for demonstration
  private initializeEmployees() {
    const sampleEmployees: InsertEmployee[] = [
      {
        name: "Sarah Williams",
        position: "UX Designer",
        department: "design",
        location: "San Francisco, CA",
        email: "sarah.williams@company.com",
        phone: "555-123-4567",
        avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "active"
      },
      {
        name: "Michael Johnson",
        position: "Full Stack Developer",
        department: "engineering",
        location: "Austin, TX",
        email: "michael.johnson@company.com",
        phone: "555-234-5678",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "active"
      },
      {
        name: "Emily Chen",
        position: "Marketing Manager",
        department: "marketing",
        location: "New York, NY",
        email: "emily.chen@company.com",
        phone: "555-345-6789",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "active"
      },
      {
        name: "David Rodriguez",
        position: "Product Manager",
        department: "product",
        location: "Chicago, IL",
        email: "david.rodriguez@company.com",
        phone: "555-456-7890",
        avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "active"
      },
      {
        name: "Sandra Kim",
        position: "HR Specialist",
        department: "hr",
        location: "Seattle, WA",
        email: "sandra.kim@company.com",
        phone: "555-567-8901",
        avatarUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "on_leave"
      },
      {
        name: "Jason Taylor",
        position: "Sales Representative",
        department: "sales",
        location: "Boston, MA",
        email: "jason.taylor@company.com",
        phone: "555-678-9012",
        avatarUrl: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "active"
      },
      {
        name: "Rebecca Singh",
        position: "Data Analyst",
        department: "engineering",
        location: "Denver, CO",
        email: "rebecca.singh@company.com",
        phone: "555-789-0123",
        avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "remote"
      },
      {
        name: "Thomas Wilson",
        position: "Senior Developer",
        department: "engineering",
        location: "Portland, OR",
        email: "thomas.wilson@company.com",
        phone: "555-890-1234",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "active"
      }
    ];

    // Create all sample employees
    sampleEmployees.forEach(employee => {
      this.createEmployee(employee);
    });
  }
}

export const storage = new MemStorage();
