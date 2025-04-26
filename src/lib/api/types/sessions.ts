import { Seat } from "./tables";
import { AuthUser } from "./auth";

export interface ISession {
  id: string;
  name: string | null;
  startTime: string;
  endTime?: string;
  status: SessionStatus;
  userId?: string;
  seatId: string;
  createdAt: string;
  updatedAt: string;
  user?: AuthUser;
  seats?: Seat[];
}

export enum SessionStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  PAUSED = "PAUSED",
  CANCELLED = "CANCELLED",
}

export interface CreateSessionRequest {
  name?: string;
  seatId: string;
  userId?: string;
}

export interface UpdateSessionRequest {
  status?: SessionStatus;
  endTime?: string;
}

export interface SessionFilters {
  status?: SessionStatus;
  userId?: string;
  seatId?: string;
  startTimeFrom?: string;
  startTimeTo?: string;
}
