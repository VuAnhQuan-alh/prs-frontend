import { ISession } from "./sessions";
import { Seat, Table } from "./tables";

/**
 * Dealer model representing a player-dealer in the system
 */
export interface Dealer {
  id: string;
  tableId: string;
  seatId: string;
  sessionId: string;
  roundsPlayed: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  table?: Table;
  seat?: Seat;
  session?: ISession;
}

/**
 * Request to create a new dealer
 */
export interface CreateDealerRequest {
  tableId: string;
  seatId: string;
  sessionId: string;
}

/**
 * Request to update an existing dealer
 */
export interface UpdateDealerRequest {
  roundsPlayed?: number;
  isActive?: boolean;
}

/**
 * Filters for dealer queries
 */
export interface DealerFilters {
  tableId?: string;
  isActive?: boolean;
}
