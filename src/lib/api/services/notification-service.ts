import { apiClient } from "../api-client";
import {
  CreateNotificationRequest,
  Notification,
  NotificationFilters,
  UpdateNotificationRequest,
} from "../types/notifications";

class NotificationService {
  private BASE_URL = "/notifications";

  async getAll(filters?: NotificationFilters): Promise<Notification[]> {
    return await apiClient.get<Notification[]>(this.BASE_URL, {
      params: filters,
    });
  }

  async getById(id: string): Promise<Notification> {
    return await apiClient.get<Notification>(`${this.BASE_URL}/${id}`);
  }

  async create(data: CreateNotificationRequest): Promise<Notification> {
    return await apiClient.post<Notification>(this.BASE_URL, data);
  }

  async update(
    id: string,
    data: UpdateNotificationRequest
  ): Promise<Notification> {
    return await apiClient.patch<Notification>(`${this.BASE_URL}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_URL}/${id}`);
  }

  async markAsRead(id: string): Promise<Notification> {
    return await apiClient.patch<Notification>(
      `${this.BASE_URL}/${id}/read`,
      {}
    );
  }

  async markAllAsRead(): Promise<void> {
    await apiClient.post<void>(`${this.BASE_URL}/read-all`, {});
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>(
      `${this.BASE_URL}/unread-count`
    );
    return response.count;
  }
}

export const notificationService = new NotificationService();
