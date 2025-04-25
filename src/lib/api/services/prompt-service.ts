import { apiClient } from "../api-client";
import {
  CreatePromptRequest,
  Prompt,
  PromptFilters,
  PromptResponseOption,
  UpdatePromptRequest,
  UpdatePromptResponseOptionRequest,
} from "../types/prompts";

class PromptService {
  private BASE_URL = "/prompts";

  async getAll(filters?: PromptFilters): Promise<Prompt[]> {
    return await apiClient.get<Prompt[]>(this.BASE_URL, { params: filters });
  }

  async getById(id: string): Promise<Prompt> {
    return await apiClient.get<Prompt>(`${this.BASE_URL}/${id}`);
  }

  async create(data: CreatePromptRequest): Promise<Prompt> {
    return await apiClient.post<Prompt>(this.BASE_URL, data);
  }

  async update(id: string, data: UpdatePromptRequest): Promise<Prompt> {
    return await apiClient.put<Prompt>(`${this.BASE_URL}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_URL}/${id}`);
  }

  // Response option management
  async getResponseOptions(promptId: string): Promise<PromptResponseOption[]> {
    return await apiClient.get<PromptResponseOption[]>(
      `${this.BASE_URL}/${promptId}/response-options`
    );
  }

  async addResponseOption(
    promptId: string,
    data: Omit<UpdatePromptResponseOptionRequest, "id">
  ): Promise<PromptResponseOption> {
    return await apiClient.post<PromptResponseOption>(
      `${this.BASE_URL}/${promptId}/response-options`,
      data
    );
  }

  async updateResponseOption(
    promptId: string,
    optionId: string,
    data: Omit<UpdatePromptResponseOptionRequest, "id">
  ): Promise<PromptResponseOption> {
    return await apiClient.patch<PromptResponseOption>(
      `${this.BASE_URL}/${promptId}/response-options/${optionId}`,
      data
    );
  }

  async deleteResponseOption(
    promptId: string,
    optionId: string
  ): Promise<void> {
    await apiClient.delete<void>(
      `${this.BASE_URL}/${promptId}/response-options/${optionId}`
    );
  }
}

export const promptService = new PromptService();
