import { apiClient } from "../api-client";
import {
  CreateResponseRequest,
  Response,
  ResponseFilters,
  ResponseStats,
  UpdateResponseRequest,
} from "../types/responses";

class ResponseService {
  private BASE_URL = "/responses";

  async getAll(filters?: ResponseFilters): Promise<Response[]> {
    return await apiClient.get<Response[]>(this.BASE_URL, { params: filters });
  }

  async getById(id: string): Promise<Response> {
    return await apiClient.get<Response>(`${this.BASE_URL}/${id}`);
  }

  async create(data: CreateResponseRequest): Promise<Response> {
    return await apiClient.post<Response>(this.BASE_URL, data);
  }

  async update(id: string, data: UpdateResponseRequest): Promise<Response> {
    return await apiClient.patch<Response>(`${this.BASE_URL}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_URL}/${id}`);
  }

  async getBySession(sessionId: string): Promise<Response[]> {
    return await apiClient.get<Response[]>(
      `${this.BASE_URL}/session/${sessionId}`
    );
  }

  async getBySeat(seatId: string): Promise<Response[]> {
    return await apiClient.get<Response[]>(`${this.BASE_URL}/seat/${seatId}`);
  }

  async getByPrompt(promptId: string): Promise<Response[]> {
    return await apiClient.get<Response[]>(
      `${this.BASE_URL}/prompt/${promptId}`
    );
  }

  async getStats(filters?: ResponseFilters): Promise<ResponseStats> {
    return await apiClient.get<ResponseStats>(`${this.BASE_URL}/stats`, {
      params: filters,
    });
  }
}

export const responseService = new ResponseService();
