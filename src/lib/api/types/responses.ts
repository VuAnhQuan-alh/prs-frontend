import { Prompt, PromptResponseOption } from "./prompts";
import { ISession as Session } from "./sessions";
import { Seat } from "./tables";

export interface Response {
  id: string;
  type: ResponseType;
  seatId: string;
  promptId: string;
  sessionId: string;
  responseOptionId?: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  prompt?: Prompt;
  responseOption?: PromptResponseOption;
  session?: Session;
  seat?: Seat;
}

export interface CreateResponseRequest {
  content: string;
  promptId: string;
  seatId: string;
  sessionId: string;
}

export interface UpdateResponseRequest {
  value?: string;
  responseOptionId?: string;
}

export interface ResponseFilters {
  seatId?: string;
  promptId?: string;
  sessionId?: string;
  timestampFrom?: string;
  timestampTo?: string;
}

export interface ResponseStats {
  totalResponses: number;
  responsesByPrompt: {
    promptId: string;
    promptTitle: string;
    count: number;
  }[];
  responsesBySession: {
    sessionId: string;
    count: number;
  }[];
  averageResponseTime: number;
}

export enum ResponseType {
  YES = "YES_RESPONSE",
  NO = "NO_RESPONSE",
  SERVICE_REQUEST = "SERVICE_REQUEST",
}
