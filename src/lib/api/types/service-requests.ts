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
  ASSISTANCE = "ASSISTANCE",
  COMPLAINT = "COMPLAINT",
  QUESTION = "QUESTION",
  TECHNICAL_ISSUE = "TECHNICAL_ISSUE",
  OTHER = "OTHER",
}

export enum ServiceRequestStatus {
  OPEN = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "COMPLETED",
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
  priority?: ServiceRequestPriority;
  seatId: string;
  sessionId: string;
}

export interface UpdateServiceRequestRequest {
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
}
