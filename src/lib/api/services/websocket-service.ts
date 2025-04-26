"use client";

import { NotificationType } from "../types/notifications";
import { showNotification } from "@mantine/notifications";
import { useEffect, useRef, useState } from "react";

// Define WebSocket message types
export interface WebSocketMessage {
  type:
    | "PROMPT"
    | "RESPONSE"
    | "SERVICE_REQUEST"
    | "NOTIFICATION"
    | "SESSION_UPDATE";
  payload: unknown;
}

// Custom hook for using WebSocket
export function useWebSocket() {
  const socket = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000";

    // Close existing socket if any
    if (socket.current) {
      socket.current.close();
    }

    // Create new socket connection
    const ws = new WebSocket(`${wsUrl}/ws?token=${token}`);

    ws.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connection established");

      // Clear any reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        setLastMessage(message);

        // Handle notifications
        if (message.type === "NOTIFICATION") {
          const {
            priority,
            message: notificationMessage,
            type,
          } = message.payload as {
            priority: "HIGH" | "MEDIUM" | "LOW";
            message: string;
            type: NotificationType;
          };

          let color = "blue";
          if (priority === "HIGH") color = "red";
          else if (priority === "MEDIUM") color = "orange";

          showNotification({
            title: getNotificationTitle(type),
            message: notificationMessage,
            color,
            autoClose: priority === "HIGH" ? false : 5000,
          });
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      console.log("WebSocket connection closed", event.code, event.reason);

      // Attempt to reconnect after delay if not closed cleanly
      if (!event.wasClean) {
        console.log("Attempting to reconnect in 5 seconds...");
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);

      // Close socket on error to trigger reconnection
      ws.close();
    };

    socket.current = ws;
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (socket.current && isConnected) {
      socket.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };

  const disconnect = () => {
    if (socket.current) {
      socket.current.close(1000, "User disconnected");
      socket.current = null;
      setIsConnected(false);
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  // Helper function to get friendly notification titles
  const getNotificationTitle = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.SERVICE_REQUEST:
        return "Service Request";
      case NotificationType.PROMPT:
        return "New Prompt";
      case NotificationType.RESPONSE:
        return "Response Received";
      case NotificationType.SESSION:
        return "Session Update";
      case NotificationType.SYSTEM:
      default:
        return "System Notification";
    }
  };

  // Connect to WebSocket when the hook is used
  useEffect(() => {
    // Only connect in browser environment
    if (typeof window !== "undefined") {
      connectWebSocket();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect: connectWebSocket,
    disconnect,
  };
}
