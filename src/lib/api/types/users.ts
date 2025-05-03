import { Role } from "./auth";

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  password: string;
  role?: Role;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role?: Role;
  isActive?: boolean;
}

export interface UserFilters {
  isActive?: boolean;
  role?: Role;
  email?: string;
  name?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
