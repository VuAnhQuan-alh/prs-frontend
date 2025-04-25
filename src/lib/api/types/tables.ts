export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  userId?: string | null;
  promptId?: string | null;
  createdAt: string;
  updatedAt: string;
  seats?: Seat[];
}

export enum TableStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
  RESERVED = "RESERVED",
  MAINTENANCE = "MAINTENANCE",
}

export interface Seat {
  id: string;
  number: number;
  tableId: string;
  status: SeatStatus;
  userId?: string;
  user: { id: string; name: string } | null;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
  table?: Table;
}

export enum SeatStatus {
  INACTIVE = "INACTIVE",
  ACTIVE = "ACTIVE",
}

export interface CreateTableRequest {
  name: string;
  capacity: number;
  locationId?: string;
}

export interface UpdateTableRequest {
  name?: string;
  capacity?: number;
  status?: TableStatus;
  locationId?: string;
  userId?: string | null;
}

export interface CreateSeatRequest {
  number: number;
  tableId: string;
  status?: SeatStatus;
}

export interface UpdateSeatRequest {
  number?: number;
  status?: SeatStatus;
  tableId?: string;
}

export interface TableFilters {
  status?: TableStatus;
  locationId?: string;
  capacity?: number;
}

export interface SeatFilters {
  status?: SeatStatus;
  tableId?: string;
}
