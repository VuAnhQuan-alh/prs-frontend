"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import {
  responseService,
  serviceRequestService,
  sessionService,
  tableService,
} from "@/lib/api/services";
import { useWebSocket } from "@/lib/api/services/websocket-service";
import { Prompt } from "@/lib/api/types/prompts";
import { ServiceRequestType } from "@/lib/api/types/service-requests";
import { ISession } from "@/lib/api/types/sessions";
import { Seat, Table } from "@/lib/api/types/tables";
import {
  Avatar,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Group,
  Paper,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBell, IconRefresh } from "@tabler/icons-react";
import { IconLogout } from "@/components/icons";
import { ResponseType } from "@/lib/api/types/responses";

type ResponseOption = ResponseType;

type ISessionPlayer = ISession & {
  seat: Seat & { table: Table };
};

export default function UserPlayerPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const sessionId = use(params).sessionId;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ISessionPlayer | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [selectedResponse, setSelectedResponse] =
    useState<ResponseOption | null>(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("connecting");

  // WebSocket hook
  const {
    isConnected,
    lastMessage,
    // connect: connectWebSocket,
    connectPromptSocket,
    promptSocketConnected,
  } = useWebSocket();

  // Fetch session data when component mounts
  useEffect(() => {
    fetchSessionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Listen for prompt updates from WebSocket
  useEffect(() => {
    if (!sessions?.seat?.table?.id) return;
    console.log("Listening for prompt updates...");

    if (lastMessage && lastMessage.type === "PROMPT_UPDATED") {
      // Handle prompt update
      const payload = lastMessage.payload as {
        tableId: string;
        prompt: Prompt | null;
      };

      // Only update if this update is for our table
      if (sessions.seat.table.id === payload.tableId) {
        // Reset player response state
        setSelectedResponse(null);
        setHasResponded(false);

        // Update current prompt
        if (payload.prompt) {
          setCurrentPrompt(payload.prompt);

          // Show notification to player about new prompt
          notifications.show({
            title: "New Prompt Available",
            message:
              "A new prompt has been assigned to your table. Please respond to it.",
            color: "blue",
          });
        } else {
          // Handle case where prompt was deleted/removed
          setCurrentPrompt(null);
          notifications.show({
            title: "Prompt Removed",
            message: "The current prompt has been removed.",
            color: "blue",
          });
        }
      }
    }

    // Update connection status based on WebSocket state
    if (isConnected && promptSocketConnected) {
      setRealtimeStatus("connected");
    } else if (!isConnected || !promptSocketConnected) {
      setRealtimeStatus("connecting");
    }
  }, [
    lastMessage,
    isConnected,
    promptSocketConnected,
    sessions?.seat?.table?.id,
  ]);

  // Connect to prompt WebSocket for the table when session data is loaded
  useEffect(() => {
    if (sessions?.seat?.table?.id) {
      connectPromptSocket(sessions.seat.table.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions?.seat?.table?.id]);

  // Function to fetch session data
  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const data = await sessionService.getById(sessionId);
      if (data.endTime) {
        notifications.show({
          title: "Session Ended",
          message: "This session has already ended.",
          color: "red",
        });
        router.push("/auth/player");
        return;
      }
      setSessions(data as ISessionPlayer);

      // console.log("Fetched session data:", data);
    } catch (error) {
      console.error("Failed to fetch session:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load sessions. Please try again.",
        color: "red",
      });
      router.push("/auth/player");
      return;
    } finally {
      setLoading(false);
    }
  };

  // Fetch the latest prompt for this player
  const fetchCurrentPrompt = async () => {
    try {
      if (!sessions?.seat?.table.id) return;
      setLoading(true);
      const table = await tableService.getById(sessions.seat.table.id);

      if (table.prompt) {
        setCurrentPrompt(table.prompt);
        setSelectedResponse(null);
        setHasResponded(false);
      } else {
        // If no prompt is set for the table, use a mock or placeholder
        setCurrentPrompt(null);
      }
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load prompts. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessions) {
      fetchCurrentPrompt();

      // In a real app, we would set up real-time connections here
      const timer = setTimeout(() => setRealtimeStatus("connected"), 1500);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  const handleResponse = async (response: ResponseOption) => {
    if (!currentPrompt || !sessions) return;

    try {
      setSelectedResponse(response);

      if (response === ResponseType.SERVICE_REQUEST) {
        // Create a service request - in real implementation, call the API
        // For now, just simulate success
        await serviceRequestService.create({
          description:
            "Service request from seat " +
            (sessions.name || sessions.user?.name),
          type: ServiceRequestType.ASSISTANCE,
          seatId: sessions.seatId,
          sessionId: sessions.id,
        });

        responseService.create({
          promptId: currentPrompt.id,
          seatId: sessions.seatId,
          type: response,
          sessionId: sessions.id,
        });

        notifications.show({
          title: "Service Request Submitted",
          message: "Your service request has been sent to staff.",
          color: "blue",
        });
      } else {
        // Record the yes/no response - in real implementation, call the API
        // For now, just simulate success
        await responseService.create({
          promptId: currentPrompt.id,
          seatId: sessions.seatId,
          type: response,
          sessionId: sessions.id,
        });

        setHasResponded(true);

        notifications.show({
          title: "Response Recorded",
          message: "Thank you for your response.",
          color: "green",
        });
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      notifications.show({
        title: "Error",
        message: "Failed to submit response. Please try again.",
        color: "red",
      });
    }
  };

  const handleManualRefresh = async () => {
    notifications.show({
      title: "Refreshing...",
      message: "Fetching the latest data from the server.",
    });
    await fetchCurrentPrompt();
  };

  const handleLogout = async () => {
    await sessionService.end(sessionId);
    notifications.show({
      title: "Logging out",
      message: "You have been signed out.",
    });
    router.push("/auth/player");
  };

  if (loading) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Text>Loading...</Text>
      </Flex>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8FBFC" }}>
      <header
        style={{
          padding: "1.5rem",
          // boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          backgroundColor: "#fff",
        }}
      >
        <Container size="xl">
          <Flex justify="space-between" align="center">
            <div>
              <Title order={4}>PRS Player Interface</Title>
              <Text size="sm" c="dimmed">
                Table {sessions?.seat.table?.name}, Seat{" "}
                {String.fromCharCode(64 + Number(sessions?.seat?.number || 0))}
              </Text>
            </div>
            <Group>
              <Button
                variant="subtle"
                size="sm"
                leftSection={<IconRefresh size={16} />}
                onClick={handleManualRefresh}
                title="Refresh data"
              >
                Refresh
              </Button>
              <Button
                variant="light"
                size="sm"
                leftSection={<IconLogout />}
                onClick={handleLogout}
              >
                Exit
              </Button>
            </Group>
          </Flex>
        </Container>
      </header>

      <Container size="sm" py="xl">
        {realtimeStatus !== "connected" && (
          <Paper
            mb="md"
            p="md"
            withBorder
            style={{
              borderLeft: `4px solid ${
                realtimeStatus === "connecting" ? "orange" : "red"
              }`,
            }}
          >
            <Group>
              <IconBell
                size={20}
                color={realtimeStatus === "connecting" ? "orange" : "red"}
              />
              <div>
                <Text fw={500}>
                  {realtimeStatus === "connecting"
                    ? "Connecting to server..."
                    : "Disconnected"}
                </Text>
                <Text size="sm" c="dimmed">
                  {realtimeStatus === "connecting"
                    ? "Awaiting connection to the real-time server."
                    : "Lost connection to real-time server. Trying to reconnect..."}
                </Text>
              </div>
            </Group>
          </Paper>
        )}

        <Card p="lg" radius="xl" mb="md" bg="white">
          <Group justify="apart">
            <Avatar>PG</Avatar>
            <Box>
              <Group justify="apart" mb="xs">
                <Title order={4}>
                  {sessions?.user?.name || sessions?.name}
                </Title>
                <Text size="sm" c="dimmed">
                  Session #{sessionId.substring(0, 8)}
                </Text>
              </Group>

              <Text size="sm" c="#596063">
                You are seated at Table {sessions?.seat.table?.name}, Seat{" "}
                {String.fromCharCode(64 + Number(sessions?.seat?.number || 0))}
              </Text>
            </Box>
          </Group>
        </Card>

        <Card p="lg" radius="xl" bg="white">
          <Title order={3} mb="xs">
            Current Prompt
          </Title>
          <Text size="sm" c="#596063" mb="md">
            Please respond using the buttons below
          </Text>

          <div
            style={{
              padding: "1.5rem",
              minHeight: "100px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontSize: "1.25rem",
              background: currentPrompt ? "#228ED01A" : "#F8FBFC",
              border: currentPrompt ? "2px solid #228ED01A" : "none",
              borderRadius: "10px",
            }}
          >
            {currentPrompt ? (
              <Title order={4} c="#262F33">
                {currentPrompt.title}
              </Title>
            ) : (
              <Text fs="italic" c="dimmed">
                Waiting for prompt...
              </Text>
            )}
          </div>

          <Flex gap="md" justify="center" my="md">
            <Button
              size="xl"
              radius="xl"
              color="green"
              variant={
                selectedResponse === ResponseType.YES ? "filled" : "light"
              }
              onClick={() => handleResponse(ResponseType.YES)}
              disabled={!currentPrompt || hasResponded}
              style={{
                width: "105px",
                height: "105px",
                borderRadius: "50%",
                fontSize: "1.2rem",
              }}
            >
              YES
            </Button>

            <Button
              size="xl"
              radius="xl"
              color="red"
              variant={
                selectedResponse === ResponseType.NO ? "filled" : "light"
              }
              onClick={() => handleResponse(ResponseType.NO)}
              disabled={!currentPrompt || hasResponded}
              style={{
                width: "105px",
                height: "105px",
                borderRadius: "50%",
                fontSize: "1.2rem",
              }}
            >
              NO
            </Button>

            <Button
              size="xl"
              radius="xl"
              color="yellow"
              variant={
                selectedResponse === ResponseType.SERVICE_REQUEST
                  ? "filled"
                  : "light"
              }
              onClick={() => handleResponse(ResponseType.SERVICE_REQUEST)}
              disabled={!currentPrompt}
              style={{
                width: "105px",
                height: "105px",
                borderRadius: "50%",
                fontSize: "1.2rem",
              }}
            >
              SER
            </Button>
          </Flex>

          {hasResponded && (
            <Text
              ta="center"
              fs="italic"
              c="dimmed"
              mt="md"
              style={{ opacity: 0.7 }}
            >
              Thank you for your response! Please wait for the next prompt.
            </Text>
          )}
        </Card>
      </Container>
    </div>
  );
}
