"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import {
  responseService,
  serviceRequestService,
  sessionService,
  tableService,
  dealerService,
  seatService,
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
  Timeline,
  ScrollArea,
  Grid,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBell, IconRefresh, IconMessage } from "@tabler/icons-react";
import { IconLogout } from "@/components/icons";
import { ResponseType } from "@/lib/api/types/responses";

type ResponseOption = ResponseType;

type ISessionPlayer = ISession & {
  seat: Seat & { table: Table };
};

// Interface for table messages
interface TableMessage {
  tableId: string;
  tableName: string;
  message: string;
  timestamp: Date;
}

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
  const [tableMessages, setTableMessages] = useState<TableMessage[]>([]);
  const [showMessageHistory, setShowMessageHistory] = useState(false);
  const [isDealerPrompt, setIsDealerPrompt] = useState(false);
  const [tableSeats, setTableSeats] = useState<Seat[]>([]);
  const [seatResponses, setSeatResponses] = useState<
    Record<string, ResponseType | null>
  >({});
  const [tableActions, setTableActions] = useState<{
    [key: string]: string;
  } | null>(null);

  const {
    isConnected,
    lastMessage,
    connectPromptSocket,
    promptSocketConnected,
  } = useWebSocket();

  useEffect(() => {
    fetchSessionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (!sessions?.seat?.table?.id) return;
    console.log("Listening for message updates...");

    if (lastMessage) {
      console.log("Received message:", lastMessage);
      if (lastMessage.type === "PROMPT_UPDATED") {
        const payload = lastMessage.payload as {
          seatId?: string;
          tableId: string;
          prompt: Prompt | null;
        };

        if (payload.seatId && payload.seatId !== sessions.seatId) return;

        if (sessions.seat.table.id === payload.tableId) {
          setSelectedResponse(null);
          setHasResponded(false);

          // Reset seat responses when a new prompt is received
          setSeatResponses({});

          if (payload.prompt) {
            setCurrentPrompt(payload.prompt);

            const isDealer =
              payload.prompt.title?.toLowerCase().includes("player-dealer") ||
              payload.prompt.content
                .toLowerCase()
                .includes("would you like to be the player-dealer");

            setIsDealerPrompt(isDealer);

            notifications.show({
              title: isDealer
                ? "Player-Dealer Rotation"
                : "New Prompt Available",
              message: isDealer
                ? "Would you like to be the player-dealer for the next round?"
                : "A new prompt has been assigned to your table. Please respond to it.",
              color: isDealer ? "yellow" : "blue",
            });
          } else {
            setCurrentPrompt(null);
            setIsDealerPrompt(false);
            notifications.show({
              title: "Prompt Removed",
              message: "The current prompt has been removed.",
              color: "blue",
            });
          }
        }
      } else if (lastMessage.type === "TABLE_MESSAGE") {
        console.log("Received table message:", lastMessage);
        const payload = lastMessage.payload as TableMessage;

        if (sessions.seat.table.id === payload.tableId) {
          setTableMessages((prevMessages) => [
            {
              tableId: payload.tableId,
              tableName: payload.tableName,
              message: payload.message,
              timestamp: new Date(payload.timestamp),
            },
            ...prevMessages,
          ]);

          notifications.show({
            title: `Message from Table ${payload.tableName}`,
            message: payload.message,
            color: "blue",
            icon: <IconMessage size="1.1rem" />,
            autoClose: 10000,
          });
        }
      } else if (lastMessage.type === "TABLE_RESPONSE") {
        // Handle new table response notification
        const payload = lastMessage.payload as {
          tableId: string;
          seatId: string;
          responseType: ResponseType;
        };
        console.log("Table response received:", payload, sessions);

        if (sessions.seat.table.id === payload.tableId) {
          // Update the seatResponses state
          setSeatResponses((prev) => ({
            ...prev,
            [payload.seatId]: payload.responseType,
          }));
        }
      } else if (lastMessage.type === "TABLE_ACTION") {
        // Handle table action notifications
        const payload = lastMessage.payload as {
          tableId: string;
          action: string;
          seat?: string;
        };
        console.log("Table action received:", payload);

        if (sessions.seat.table.id === payload.tableId) {
          if (payload.action === "PAUSE") {
            notifications.show({
              title: "Table Paused",
              message: "The table has been paused.",
              color: "yellow",
            });
            setTableActions({
              action: payload.action,
              seat: payload?.seat || "",
            });

            // setCurrentPrompt(null);
            setSeatResponses({});
          }

          if (payload.action === "TERMINATE") {
            if (payload.seat === sessions.seatId) {
              notifications.show({
                title: "Table Terminated",
                message: "The table has been terminated.",
                color: "red",
              });

              setTableActions(null);
              setCurrentPrompt(null);
              setSeatResponses({});

              // Redirect to the player interface
              setTimeout(() => {
                handleLogout();
              }, 1400);

              return;
            }

            notifications.show({
              title: "Table Terminated",
              message: "The table has been terminated.",
              color: "red",
            });

            setTableActions(null);
            setCurrentPrompt(null);
            setSeatResponses({});

            // Redirect to the player interface
            setTimeout(() => {
              handleLogout();
            }, 1400);
          }

          if (payload.action === "ACTIVATE") {
            notifications.show({
              title: "Table Activated",
              message: "The table has been activated.",
              color: "green",
            });

            setTableActions(null);
          }
        }
      }
    }

    if (isConnected && promptSocketConnected) {
      setRealtimeStatus("connected");
    } else if (!isConnected || !promptSocketConnected) {
      setRealtimeStatus("connecting");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    lastMessage,
    isConnected,
    promptSocketConnected,
    sessions?.seat?.table?.id,
  ]);

  useEffect(() => {
    if (sessions?.seat?.table?.id) {
      connectPromptSocket(sessions.seat.table.id);
      // Fetch all seats for the table
      fetchTableSeats(sessions.seat.table.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions?.seat?.table?.id]);

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

  // New function to fetch all seats for the table
  const fetchTableSeats = async (tableId: string) => {
    try {
      const seats = await seatService.getByTable(tableId);
      // Sort seats by number
      seats.sort((a, b) => a.number - b.number);
      setTableSeats(seats);
    } catch (error) {
      console.error("Failed to fetch table seats:", error);
    }
  };

  const fetchCurrentPrompt = async () => {
    try {
      if (!sessions?.seat?.table.id) return;
      setLoading(true);
      const table = await tableService.getById(sessions.seat.table.id);

      if (table.prompt) {
        setCurrentPrompt(table.prompt);

        const isDealer =
          table.prompt.title?.toLowerCase().includes("player-dealer") ||
          table.prompt.content
            .toLowerCase()
            .includes("would you like to be the player-dealer");

        setIsDealerPrompt(isDealer);

        setSelectedResponse(null);
        setHasResponded(false);

        // Fetch current responses for this prompt
        if (table.prompt.id) {
          fetchPromptResponses(table.prompt.id);
        }
      } else {
        setCurrentPrompt(null);
        setIsDealerPrompt(false);
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

  // New function to fetch responses for the current prompt
  const fetchPromptResponses = async (promptId: string) => {
    try {
      const responses = await responseService.getByPrompt(promptId);

      // Create a mapping of seatId to response type
      const responseMap: Record<string, ResponseType> = {};
      responses.forEach((response) => {
        responseMap[response.seatId] = response.type as ResponseType;
      });

      setSeatResponses(responseMap);

      // Check if current user has already responded
      const userResponse = responses.find((r) => r.seatId === sessions?.seatId);
      if (userResponse) {
        setSelectedResponse(userResponse.type as ResponseType);
        setHasResponded(true);
      }
    } catch (error) {
      console.error("Failed to fetch prompt responses:", error);
    }
  };

  useEffect(() => {
    if (sessions) {
      fetchCurrentPrompt();

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

        if (isDealerPrompt) {
          // Gọi dealerService.handleDealerResponse khi người chơi phản hồi dealer prompt
          const dealerResponse =
            response === ResponseType.YES ? "ACCEPT" : "DECLINE";

          // Call API dealers/response
          await dealerService.handleDealerResponse(
            sessions.seat.table.id,
            sessions.seatId,
            sessions.id,
            dealerResponse,
            sessions.name || sessions.user?.name
          );

          // if (response === ResponseType.YES) {
          //   notifications.show({
          //     title: "Dealer Status",
          //     message: "You will be the dealer for the next round.",
          //     color: "green",
          //     autoClose: false,
          //   });
          // } else {
          //   notifications.show({
          //     title: "Dealer Status",
          //     message:
          //       "You declined to be the dealer. The rotation will continue.",
          //     color: "blue",
          //   });
          // }
        }
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

  console.log({ currentPrompt, hasResponded, tableActions });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8FBFC" }}>
      <header
        style={{
          padding: "1.5rem",
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

      <Container size="md" py="xl">
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

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            {/* information seat */}
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
                    {String.fromCharCode(
                      64 + Number(sessions?.seat?.number || 0)
                    )}
                  </Text>
                </Box>
              </Group>
            </Card>

            {/* Table seats */}
            <Card p="lg" radius="xl" bg="white" mt="md">
              <Title order={3} mb="md">
                Table Seats
              </Title>
              {tableSeats.length === 0 ? (
                <Text c="dimmed" ta="center">
                  No seats available for this table
                </Text>
              ) : (
                <Flex direction="column" gap="sm">
                  {tableSeats
                    .filter((seat) => seat.number !== 0)
                    .map((seat) => (
                      <Paper
                        key={seat.id}
                        p="md"
                        withBorder
                        style={{
                          borderLeft: `4px solid ${
                            seatResponses[seat.id] === ResponseType.YES
                              ? "green"
                              : seatResponses[seat.id] === ResponseType.NO
                              ? "red"
                              : seatResponses[seat.id] ===
                                ResponseType.SERVICE_REQUEST
                              ? "yellow"
                              : "gray"
                          }`,
                        }}
                      >
                        <Group justify="space-between">
                          <Text fw={500}>
                            Seat {String.fromCharCode(64 + seat.number)}
                          </Text>
                          <Text c="dimmed">
                            {seatResponses[seat.id]
                              ? seatResponses[seat.id] === ResponseType.YES
                                ? "Yes"
                                : seatResponses[seat.id] === ResponseType.NO
                                ? "No"
                                : "Service Request"
                              : "No response"}
                          </Text>
                        </Group>
                      </Paper>
                    ))}
                </Flex>
              )}
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            {/* Current prompt and response */}
            <Card p="lg" radius="xl" bg="white">
              <Title order={3} mb="xs">
                {isDealerPrompt ? "Player-Dealer Prompt" : "Current Prompt"}
              </Title>
              <Text size="sm" c="#596063" mb="md">
                {isDealerPrompt
                  ? "Would you like to be the player-dealer for the next round?"
                  : "Please respond using the buttons below"}
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
                  background:
                    currentPrompt && tableActions === null
                      ? isDealerPrompt
                        ? "#FFF9C41A"
                        : "#228ED01A"
                      : "#F8FBFC",
                  border: currentPrompt
                    ? isDealerPrompt
                      ? "2px solid #FFF9C41A"
                      : "2px solid #228ED01A"
                    : "none",
                  borderRadius: "10px",
                }}
              >
                {currentPrompt ? (
                  <Title order={4} c="#262F33">
                    {currentPrompt.title || currentPrompt.content}
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
                  disabled={
                    !currentPrompt || hasResponded || tableActions !== null
                  }
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
                  disabled={
                    !currentPrompt || hasResponded || tableActions !== null
                  }
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
                  disabled={
                    !currentPrompt || hasResponded || tableActions !== null
                  }
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
                  Thank you for your response!{" "}
                  {isDealerPrompt
                    ? selectedResponse === ResponseType.YES
                      ? "You will be notified when your dealer session begins."
                      : "A new dealer will be selected."
                    : "Please wait for the next prompt."}
                </Text>
              )}
            </Card>

            {/* Table messages */}
            <Card p="lg" radius="xl" bg="white" mt="md">
              <Group justify="space-between" mb="md">
                <Title order={3}>Table Messages</Title>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => setShowMessageHistory(!showMessageHistory)}
                >
                  {showMessageHistory ? "Hide History" : "Show History"}
                </Button>
              </Group>

              {tableMessages.length === 0 ? (
                <Text c="dimmed" ta="center">
                  No messages from table administrator yet
                </Text>
              ) : (
                <>
                  <Paper
                    p="md"
                    withBorder
                    style={{ borderLeft: "4px solid #228ED0" }}
                  >
                    <Text size="sm" fw={500} mb={5}>
                      {new Date(tableMessages[0].timestamp).toLocaleString()}
                    </Text>
                    <Text>{tableMessages[0].message}</Text>
                  </Paper>

                  {showMessageHistory && tableMessages.length > 1 && (
                    <ScrollArea mt="lg" h={300} offsetScrollbars>
                      <Timeline
                        active={tableMessages.length - 1}
                        bulletSize={24}
                        lineWidth={2}
                      >
                        {tableMessages.slice(1).map((msg, index) => (
                          <Timeline.Item
                            key={index}
                            title={new Date(msg.timestamp).toLocaleString()}
                            bullet={<IconMessage size={12} />}
                          >
                            <Text size="sm">{msg.message}</Text>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    </ScrollArea>
                  )}
                </>
              )}
            </Card>
          </Grid.Col>
        </Grid>
      </Container>
    </div>
  );
}
