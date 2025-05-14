import { ISession as Session } from "./sessions";
import { Seat } from "./tables";
import { AuthUser } from "./auth";

export interface ServiceRequest {
  id: string;
  type: ServiceRequestType;
  description: string;
  status: ServiceRequestStatus;
  priority: ServiceRequestPriority;
  seatId: string;
  sessionId: string;
  assignId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  seat?: Seat;
  session?: Session;
  assigned?: AuthUser;
}

export enum ServiceRequestType {
  PLAYER_DEALER = "PLAYER_DEALER",
  TABLE_ADMIN = "TABLE_ADMIN",
}

export enum ServiceRequestStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum ServiceRequestPriority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  URGENT = "URGENT",
}

export interface CreateServiceRequestRequest {
  type: ServiceRequestType;
  description: string;
  seatId: string;
  sessionId: string;
}

export interface UpdateServiceRequestRequest {
  id?: string;
  status?: ServiceRequestStatus | null;
  priority?: ServiceRequestPriority;
  description?: string;
  assignId?: string | null;
  notes?: string | null;
  resolvedAt?: string;
}

export interface ServiceRequestFilters {
  type?: ServiceRequestType;
  status?: ServiceRequestStatus;
  priority?: ServiceRequestPriority;
  seatId?: string;
  sessionId?: string;
  assignId?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  page?: number;
  limit?: number;
}
