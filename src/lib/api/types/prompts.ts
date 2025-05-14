export interface Prompt {
  title: string;
  id: string;
  content: string;
  question: string;
  status: PromptStatusEnum;
  createdAt: string;
  updatedAt: string;
}

export enum PromptType {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TEXT = "TEXT",
  RATING = "RATING",
  BINARY = "BINARY",
  SURVEY = "SURVEY",
}

export enum PromptStatusEnum {
  PENDING = "PENDING",
  PROCESSED = "PROCESSED",
  FAILED = "FAILED",
}

export interface PromptResponseOption {
  id: string;
  promptId: string;
  value: string;
  label: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptRequest {
  title: string;
  content: string;
  question: string;
  tableId: string | null; // Added tableId field
  status: PromptStatusEnum;
  isAllTables?: boolean;
}

export interface CreatePromptResponseOptionRequest {
  value: string;
  label: string;
  order: number;
}

export interface UpdatePromptRequest {
  title?: string;
  content?: string;
  question?: string;
  tableId?: string | null; // Added tableId field
  status?: PromptStatusEnum;
  isAllTables?: boolean;
  seatId?: string;
}

export interface UpdatePromptResponseOptionRequest {
  id: string;
  value?: string;
  label?: string;
  order?: number;
}

export interface PromptFilters {
  status?: PromptStatusEnum;
  tableId?: string; // Added tableId field
  content?: string;
}
