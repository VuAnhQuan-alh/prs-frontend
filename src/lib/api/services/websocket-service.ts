"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

import { showNotification } from "@mantine/notifications";

import { NotificationType } from "../types/notifications";
import { Prompt } from "../types/prompts";

// Define WebSocket message types
export interface WebSocketMessage {
  type:
    | "PROMPT"
    | "RESPONSE"
    | "SERVICE_REQUEST"
    | "NOTIFICATION"
    | "SESSION_UPDATE"
    | "PROMPT_UPDATED"
    | "SEAT_UPDATE"
    | "RESPONSE_CREATED"
    | "SERVICE_REQUEST_CREATED"
    | "TABLE_MESSAGE"
    | "DEALER_DECLINED"
    | "DEALER_ROTATION"
    | "DEALER_ASSIGNED"
    | "ADMIN_DEALER"
    | "TABLE_RESPONSE"
    | "TABLE_ACTION";
  payload: unknown;
}

// Define prompt updated payload type
export interface PromptUpdatedPayload {
  tableId: string;
  seatId?: string;
  prompt: Prompt | null;
  message: string;
}

// Define seat update payload type
export interface SeatUpdatePayload {
  seatId: string;
  tableId: string;
  status: string;
  userId?: string | null;
  userName?: string | null;
  type: "JOINED" | "LEFT";
  message: string;
}

// Define table message payload type
export interface TableMessagePayload {
  tableId: string;
  tableName: string;
  message: string;
  timestamp: string | Date;
}

// Define dealer declined payload type
export interface DealerDeclinedPayload {
  tableId: string;
  seatId: string;
  seatNumber: number;
  playerName?: string;
  message: string;
}

// Define dealer rotation payload type
export interface DealerRotationPayload {
  tableId: string;
  remainingCandidates: number;
  message: string;
}

// Define dealer assigned payload type
export interface DealerAssignedPayload {
  tableId: string;
  seatId: string;
  seatNumber: number;
  playerName?: string;
  playerNotes?: string;
  message: string;
}

// Define admin dealer payload type
export interface AdminDealerPayload {
  tableId: string;
  message: string;
}

// Custom hook for using WebSocket
export function useWebSocket() {
  const [mainSocket, setMainSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [promptSocket, setPromptSocket] = useState<Socket | null>(null);
  const [promptSocketConnected, setPromptSocketConnected] =
    useState<boolean>(false);

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const promptSocketReconnectRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8000";

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

      // Store socket in window object so it can be accessed from other components
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).socket = socket;
      }

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
      });

      // Add handlers for seat status updates
      socket.on("playerJoined", (data) => {
        console.log("Received playerJoined event:", data);
        const message: WebSocketMessage = {
          type: "SEAT_UPDATE",
          payload: {
            type: "JOINED",
            ...data,
          },
        };
        setLastMessage(message);

        // Show notification for player joined
        showNotification({
          title: "Player Joined",
          message:
            data.message ||
            `A player has joined table ${data.tableName || data.tableId}`,
          color: "green",
        });
      });

      socket.on("playerLeft", (data) => {
        console.log("Received playerLeft event:", data);
        const message: WebSocketMessage = {
          type: "SEAT_UPDATE",
          payload: {
            type: "LEFT",
            ...data,
          },
        };
        setLastMessage(message);

        // Show notification for player left
        showNotification({
          title: "Player Left",
          message:
            data.message ||
            `A player has left table ${data.tableName || data.tableId}`,
          color: "orange",
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

      socket.on("responseCreated", (data) => {
        console.log("Received responseCreated event:", data);
        setLastMessage(data);
      });

      socket.on("serviceRequestCreated", (data) => {
        console.log("Received serviceRequestCreated event:", data);
        setLastMessage(data); // data already has correct structure with type and payload

        // Don't show notification for the player who submitted the request
        // This is intended for admin notification only
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

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8000";

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

      socket.on("tableMessage", (data) => {
        console.log("Received tableMessage event:", data);
        setLastMessage(data);
      });

      socket.on("tableResponse", (data) => {
        console.log("Received tableResponse event:", data);
        setLastMessage(data);
      });

      socket.on("tableAction", (data) => {
        console.log("Received tableAction event:", data);
        setLastMessage(data);
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
      });

      // Add event listener for dealer declined event
      socket.on(`table:${tableId}:dealer-declined`, (data) => {
        console.log("Received dealer-declined event:", data);
        const payload = data as DealerDeclinedPayload;

        // Create a WebSocketMessage to be consistent with existing structure
        const message: WebSocketMessage = {
          type: "DEALER_DECLINED",
          payload,
        };

        setLastMessage(message);
      });

      // Add event listener for dealer rotation event
      socket.on(`table:${tableId}:dealer-rotation`, (data) => {
        console.log("Received dealer-rotation event:", data);
        const payload = data as DealerRotationPayload;

        // Create a WebSocketMessage to be consistent with existing structure
        const message: WebSocketMessage = {
          type: "DEALER_ROTATION",
          payload,
        };

        setLastMessage(message);
      });

      // Add event listener for dealer assigned event
      socket.on(`table:${tableId}:dealer-assigned`, (data) => {
        console.log("Received dealer-assigned event:", data);
        const payload = data as DealerAssignedPayload;

        // Create a WebSocketMessage to be consistent with existing structure
        const message: WebSocketMessage = {
          type: "DEALER_ASSIGNED",
          payload,
        };

        setLastMessage(message);
      });

      // Add event listener for admin dealer event
      socket.on(`table:${tableId}:admin-dealer`, (data) => {
        console.log("Received admin-dealer event:", data);
        const payload = data as AdminDealerPayload;

        // Create a WebSocketMessage to be consistent with existing structure
        const message: WebSocketMessage = {
          type: "ADMIN_DEALER",
          payload,
        };

        setLastMessage(message);
      });

      socket.on("responseCreated", (data) => {
        console.log("Received responseCreated event in prompt socket:", data);
        setLastMessage(data);
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
      case NotificationType.PLAYER_DEALER_CHANGE:
        return "Player-Dealer Change";
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
