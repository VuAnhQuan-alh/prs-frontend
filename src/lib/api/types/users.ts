import { Role } from "./auth";

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: Role;
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
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role?: Role;
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
