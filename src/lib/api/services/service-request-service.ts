import { apiClient } from "../api-client";
import {
  CreateServiceRequestRequest,
  ServiceRequest,
  ServiceRequestFilters,
  UpdateServiceRequestRequest,
} from "../types/service-requests";

class ServiceRequestService {
  private BASE_URL = "/service-requests";

  async getAll(filters?: ServiceRequestFilters): Promise<ServiceRequest[]> {
    return await apiClient.get<ServiceRequest[]>(this.BASE_URL, {
      params: filters,
    });
  }

  async getById(id: string): Promise<ServiceRequest> {
    return await apiClient.get<ServiceRequest>(`${this.BASE_URL}/${id}`);
  }

  async create(data: CreateServiceRequestRequest): Promise<ServiceRequest> {
    return await apiClient.post<ServiceRequest>(this.BASE_URL, data);
  }

  async update(
    id: string,
    data: UpdateServiceRequestRequest
  ): Promise<ServiceRequest> {
    return await apiClient.patch<ServiceRequest>(
      `${this.BASE_URL}/${id}`,
      data
    );
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_URL}/${id}`);
  }

  async getBySession(sessionId: string): Promise<ServiceRequest[]> {
    return await apiClient.get<ServiceRequest[]>(
      `${this.BASE_URL}/by-session/${sessionId}`
    );
  }

  async getBySeat(seatId: string): Promise<ServiceRequest[]> {
    return await apiClient.get<ServiceRequest[]>(
      `${this.BASE_URL}/by-seat/${seatId}`
    );
  }

  async assignToUser(id: string, userId: string): Promise<ServiceRequest> {
    return await apiClient.patch<ServiceRequest>(
      `${this.BASE_URL}/${id}/assign`,
      { userId }
    );
  }

  async resolveRequest(id: string): Promise<ServiceRequest> {
    return await apiClient.patch<ServiceRequest>(
      `${this.BASE_URL}/${id}/resolve`,
      {}
    );
  }
}

export const serviceRequestService = new ServiceRequestService();
