"use client";

import { NotificationType } from "../types/notifications";
import { showNotification } from "@mantine/notifications";
import { useEffect, useRef, useState } from "react";
import { Prompt } from "../types/prompts";
import { io, Socket } from "socket.io-client";

// Define WebSocket message types
export interface WebSocketMessage {
  type:
    | "PROMPT"
    | "RESPONSE"
    | "SERVICE_REQUEST"
    | "NOTIFICATION"
    | "SESSION_UPDATE"
    | "PROMPT_UPDATED";
  payload: unknown;
}

// Define prompt updated payload type
export interface PromptUpdatedPayload {
  tableId: string;
  prompt: Prompt | null;
  message: string;
}

// Custom hook for using WebSocket
export function useWebSocket() {
  const [mainSocket, setMainSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [promptSocket, setPromptSocket] = useState<Socket | null>(null);
  const [promptSocketConnected, setPromptSocketConnected] =
    useState<boolean>(false);
  const promptSocketReconnectRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000";

    // Close existing socket if any
    if (mainSocket) {
      mainSocket.disconnect();
    }

    try {
      // Create new Socket.IO connection for main connections
      const socket = io(`${wsUrl}/sessions`, {
        auth: token ? { token } : undefined,
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        setIsConnected(true);
        console.log("Main Socket.IO connection established");

        // Clear any reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      });

      socket.on("sessionCreated", (data) => {
        console.log("Received sessionCreated event:", data);
        const message: WebSocketMessage = {
          type: "SESSION_UPDATE",
          payload: {
            type: "SESSION_CREATED",
            ...data,
          },
        };
        setLastMessage(message);
      });

      socket.on("sessionEnded", (data) => {
        console.log("Received sessionEnded event:", data);
        const message: WebSocketMessage = {
          type: "SESSION_UPDATE",
          payload: {
            type: "SESSION_ENDED",
            ...data,
          },
        };
        setLastMessage(message);

        // Show notification for session ended
        showNotification({
          title: "Session Ended",
          message: data.message || "Your session has ended",
          color: "blue",
        });
      });

      socket.on("notification", (data) => {
        console.log("Received notification event:", data);
        const message: WebSocketMessage = {
          type: "NOTIFICATION",
          payload: data,
        };
        setLastMessage(message);

        // Handle notifications
        const { priority, message: notificationMessage, type } = data;
        let color = "blue";
        if (priority === "HIGH") color = "red";
        else if (priority === "MEDIUM") color = "orange";

        showNotification({
          title: getNotificationTitle(type),
          message: notificationMessage,
          color,
          autoClose: priority === "HIGH" ? false : 5000,
        });
      });

      socket.on("connect_error", (error) => {
        console.error("Main Socket.IO connection error:", error);
        setIsConnected(false);
      });

      socket.on("disconnect", (reason) => {
        console.log("Main Socket.IO connection disconnected:", reason);
        setIsConnected(false);
      });

      setMainSocket(socket);
    } catch (error) {
      console.error("Failed to create main Socket.IO connection:", error);
      setIsConnected(false);

      // Attempt to reconnect after delay
      console.log("Attempting to reconnect in 5 seconds...");
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
    }
  };

  const connectPromptWebSocket = (tableId?: string) => {
    if (!tableId) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000";

    // Close existing socket if any
    if (promptSocket) {
      promptSocket.disconnect();
    }

    try {
      // Create new Socket.IO connection for prompt updates with namespace 'prompts'
      // Remove token requirement for player access
      const socket = io(`${wsUrl}/prompts`, {
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        setPromptSocketConnected(true);
        console.log("Socket.IO Prompt connection established");

        // Subscribe to table prompt updates
        socket.emit("subscribeToTablePrompts", tableId);

        // Clear any reconnect timeout
        if (promptSocketReconnectRef.current) {
          clearTimeout(promptSocketReconnectRef.current);
          promptSocketReconnectRef.current = null;
        }
      });

      socket.on("promptUpdated", (data) => {
        console.log("Received promptUpdated event:", data);
        const payload = data as PromptUpdatedPayload;

        // Create a WebSocketMessage to be consistent with existing structure
        const message: WebSocketMessage = {
          type: "PROMPT_UPDATED",
          payload,
        };

        setLastMessage(message);

        // Show notification
        showNotification({
          title: "Prompt Updated",
          message:
            payload.message || "A prompt has been updated for your table",
          color: "blue",
          autoClose: 5000,
        });
      });

      socket.on("connect_error", (error) => {
        console.error("Socket.IO Prompt connection error:", error);
        setPromptSocketConnected(false);
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket.IO Prompt connection disconnected:", reason);
        setPromptSocketConnected(false);

        // Don't try to reconnect here, Socket.IO will handle reconnection automatically
        // with the options we provided
      });

      setPromptSocket(socket);
    } catch (error) {
      console.error("Failed to create Socket.IO connection:", error);
      setPromptSocketConnected(false);
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (mainSocket && isConnected) {
      // Format the message for Socket.IO
      const { type, payload } = message;
      mainSocket.emit(type.toLowerCase(), payload);
      return true;
    }
    return false;
  };

  const disconnect = () => {
    if (mainSocket) {
      mainSocket.disconnect();
      setMainSocket(null);
      setIsConnected(false);
    }

    if (promptSocket) {
      promptSocket.disconnect();
      setPromptSocket(null);
      setPromptSocketConnected(false);
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (promptSocketReconnectRef.current) {
      clearTimeout(promptSocketReconnectRef.current);
      promptSocketReconnectRef.current = null;
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
    connectPromptSocket: connectPromptWebSocket,
    promptSocketConnected,
  };
}
