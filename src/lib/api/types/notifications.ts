export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  targetUsers: string[];
  priority: NotificationPriority;
  relatedEntityId?: string;
  relatedEntityType?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum NotificationType {
  SERVICE_REQUEST = "SERVICE_REQUEST",
  PROMPT = "PROMPT",
  RESPONSE = "RESPONSE",
  SYSTEM = "SYSTEM",
  SESSION = "SESSION",
}

export enum NotificationPriority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export interface CreateNotificationRequest {
  type: NotificationType;
  message: string;
  targetUsers: string[];
  priority: NotificationPriority;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface UpdateNotificationRequest {
  read?: boolean;
}

export interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  read?: boolean;
  userId?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
}
