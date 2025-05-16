"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";

import {
  dealerService,
  promptService,
  responseService,
  seatService,
  tableService,
} from "@/lib/api/services";
import { useWebSocket } from "@/lib/api/services/websocket-service";
import { Dealer } from "@/lib/api/types/dealers";
import { Prompt, PromptStatusEnum } from "@/lib/api/types/prompts";
import { Seat, SeatStatus, Table, TableStatus } from "@/lib/api/types/tables";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  LoadingOverlay,
  Select,
  Table as MantineTable,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconLogout2,
  IconMessage,
  IconMouseOff,
  IconRefresh,
  IconUser,
  IconUserHexagon,
  IconUserX,
} from "@tabler/icons-react";

// Define an interface for player responses
interface PlayerResponse {
  seatId: string;
  tableId: string;
  promptId: string;
  responseId: string;
  activity: string;
  content: string;
  timestamp: Date;
  userName: string;
}

export default function RetablePage() {
  const [loading, setLoading] = useState(false);
  // const [opened, { open, close }] = useDisclosure(false);

  const [tables, setTables] = useState<Table[]>([]);
  const [tableSeats, setTableSeats] = useState<Seat[]>([]);
  const [tablePrompts, setTablePrompts] = useState<Prompt[]>([]);
  const [tableDealers, setTableDealers] = useState<Dealer[]>([]);
  const [tableTriggered, setTableTriggered] = useState(false);
  // const [seatStart, setSeatStart] = useState<string | null>(null);
  const [seatInter, setSeatInter] = useState<string | null>(null);

  // Track player responses
  const [playerResponses, setPlayerResponses] = useState<
    Record<string, PlayerResponse>
  >({});
  // Track dealer responses
  const [dealerResponses, setDealerResponses] = useState<
    Record<string, PlayerResponse>
  >({});

  const [waitDealer, setWaitDealer] = useState<{
    check: boolean;
    id: string;
  } | null>(null);
  const [currentDealer, setCurrentDealer] = useState<Dealer | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tableMessage, setTableMessage] = useState("");
  const [tablePrompt, setTablePrompt] = useState<string | null>(null);

  // WebSocket hook
  const { lastMessage, isConnected } = useWebSocket();

  useEffect(() => {
    if (lastMessage?.type === "SEAT_UPDATE") {
      const payload = lastMessage.payload as {
        seatId: string;
        tableId: string;
        userName: string;
        type: "JOINED" | "LEFT";
      };

      // If the update is for the currently selected table, refresh the seat data
      if (selectedTable && selectedTable.id === payload.tableId) {
        // fetchTableDetails(selectedTable.id);
        fetchSeats(selectedTable.id);
      }
    } else if (lastMessage?.type === "RESPONSE_CREATED") {
      // Handle new response notification
      const payload = lastMessage.payload as {
        responseId: string;
        tableId: string;
        seatId: string;
        promptId: string;
        userName: string;
        content: string;
      };
      tableService.sendResponse(payload.tableId, {
        seatId: payload.seatId,
        responseId: payload.responseId,
      });

      const currentPrompt = tablePrompts.find(
        (prompt) => prompt.id === payload.promptId
      );

      const tableSeatActive = tableSeats.filter(
        (seat) => seat.number !== 0 && seat.user && seat.status === "ACTIVE"
      );

      // Check response information
      responseService.getById(payload.responseId).then((response) => {
        console.log("Response data:", response);

        // Update the player responses state
        setPlayerResponses((prev) => ({
          ...prev,
          [payload.seatId]: {
            seatId: payload.seatId,
            tableId: payload.tableId,
            promptId: payload.promptId,
            responseId: payload.responseId,
            activity: payload.content.includes("RESPONSE")
              ? "Responded"
              : "Service Requested",
            content: payload.content.includes("RESPONSE")
              ? payload.content.includes("NO")
                ? "No"
                : "Yes"
              : "",
            timestamp: new Date(),
            userName: payload.userName,
          },
        }));

        // Update the dealer responses state
        if (
          currentPrompt &&
          (currentPrompt.title.toLowerCase().includes("player-dealer") ||
            currentPrompt.content.toLowerCase().includes("player-dealer"))
        ) {
          setDealerResponses((prev) => ({
            ...prev,
            [payload.seatId]: {
              seatId: payload.seatId,
              tableId: payload.tableId,
              promptId: payload.promptId,
              responseId: payload.responseId,
              activity: payload.content.includes("RESPONSE")
                ? "Responded"
                : "Service Requested",
              content: payload.content.includes("RESPONSE")
                ? payload.content.includes("NO")
                  ? "No"
                  : "Yes"
                : "",
              timestamp: new Date(),
              userName: payload.userName,
            },
          }));
          setWaitDealer(null);

          // Check if the response no dealer
          if (payload.content.includes("NO")) {
            const seatIndex = tableSeatActive.findIndex(
              (seat) => seat.id === payload.seatId
            );
            if (seatIndex !== -1 && seatIndex < tableSeatActive.length - 1) {
              let nextSeatId = tableSeatActive[seatIndex + 1].id;
              if (nextSeatId === seatInter) {
                nextSeatId =
                  tableSeatActive[
                    seatIndex + 1 < tableSeatActive.length - 1
                      ? seatIndex + 2
                      : 0
                  ].id;

                setSeatInter(null);
              }
              // Start dealer rotation with the next seat
              startDealerRotation(payload.tableId, nextSeatId);
            } else {
              // If no more candidates, show notification
              notifications.show({
                title: "No More Candidates",
                message: "No more candidates for dealer rotation.",
                color: "red",
                icon: <IconUserX size="1.1rem" />,
                autoClose: 5000,
              });
            }
          } else if (payload.content.includes("YES")) {
            setWaitDealer(null);
            setCurrentDealer({
              id: payload.responseId,
              tableId: payload.tableId,
              seatId: payload.seatId,
              sessionId: response.sessionId,
              roundsPlayed: 0,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            fetchDealerHistory(payload.tableId);
          }
        }
      });

      // Show notification to admin
      notifications.show({
        title: "New Response",
        message: `${
          payload.userName || "A player"
        } has submitted a response at table ${
          tables.find((t) => t.id === payload.tableId)?.name || payload.tableId
        }`,
        color: "blue",
        icon: <IconMessage size="1.1rem" />,
        autoClose: 5000,
      });
    } else if (lastMessage?.type === "DEALER_DECLINED") {
      // Handle dealer declined notification
      const payload = lastMessage.payload as {
        tableId: string;
        seatId: string;
        seatNumber: number;
        playerName?: string;
        message: string;
      };

      // Show notification to admin
      notifications.show({
        title: "Dealer Declined",
        message: payload.message,
        color: "orange",
        icon: <IconUserX size="1.1rem" />,
        autoClose: 8000,
      });

      // If this is for the currently selected table, refresh dealer information
      if (selectedTable && selectedTable.id === payload.tableId) {
        // fetchCurrentDealer(payload.tableId);
      }
    } else if (lastMessage?.type === "DEALER_ROTATION") {
      // Handle dealer rotation notification
      const payload = lastMessage.payload as {
        tableId: string;
        remainingCandidates: number;
        message: string;
      };

      // Show notification to admin
      notifications.show({
        title: "Dealer Rotation",
        message: payload.message,
        color: "blue",
        icon: <IconRefresh size="1.1rem" />,
        autoClose: 5000,
      });

      // If this is for the currently selected table, refresh dealer information
      if (selectedTable && selectedTable.id === payload.tableId) {
        // fetchCurrentDealer(payload.tableId);
      }
    } else if (lastMessage?.type === "ADMIN_DEALER") {
      // Handle admin dealer notification
      const payload = lastMessage.payload as {
        tableId: string;
        message: string;
      };

      // Show notification to admin
      notifications.show({
        title: "Admin Dealer",
        message: payload.message,
        color: "red",
        icon: <IconUser size="1.1rem" />,
        autoClose: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);

  // Subscribe to staff WebSocket channel when component mounts
  useEffect(() => {
    if (isConnected) {
      // Subscribe to all session updates as a staff member
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const socket = (window as any).socket;
      if (socket) {
        socket.emit("subscribeToAllSessions");
        console.log("Subscribed to all sessions as staff");
      }
    }
  }, [isConnected]);

  useEffect(() => {
    // Fetch tables and prompts when the component mounts
    fetchTables();
    fetchPrompts();
  }, []);

  useEffect(() => {
    // Fetch seats when a table is selected
    if (selectedTable) {
      fetchSeats(selectedTable.id);
      setTablePrompt(selectedTable.promptId || null);
      fetchDealerHistory(selectedTable.id);
    } else {
      setTableSeats([]);
      setTablePrompt(null);
      setTableDealers([]);
    }
  }, [selectedTable]);

  // Function to fetch tables from API
  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await tableService.getAll({
        page: 1,
        limit: 100,
      });

      setTables(response.docs);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load tables";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch prompts from API
  const fetchPrompts = async () => {
    try {
      const prompts = await promptService.getAll();
      setTablePrompts(prompts);
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load prompts";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    }
  };

  // Function to fetch seats for the selected table
  const fetchSeats = async (tableId: string) => {
    try {
      setLoading(true);
      const response = await seatService.getByTable(tableId);
      setTableSeats(response);
    } catch (error) {
      console.error("Failed to fetch seats:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load seats";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to send prompt from API
  const fetchSendPrompt = async (promptId: string, tableId: string) => {
    try {
      await promptService.update(promptId, {
        tableId,
        status: PromptStatusEnum.PROCESSED,
      });
      setSelectedTable((table) => (table ? { ...table, promptId } : null));
    } catch (error) {
      console.error("Failed to send prompt:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send prompt";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    }
  };

  // Function to fetch dealer history for a table
  const fetchDealerHistory = async (tableId: string) => {
    try {
      const dealers = await dealerService.getTableDealers(tableId);
      setTableDealers(dealers);
    } catch (error) {
      console.error("Failed to fetch dealer history:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load dealer history",
        color: "red",
      });
    }
  };

  // Function to start dealer rotation
  const startDealerRotation = async (tableId: string, initSeatId?: string) => {
    try {
      setWaitDealer(() => ({ check: true, id: "" }));
      setTableTriggered(true);

      const tableSeatActive = tableSeats.filter(
        (seat) =>
          seat.number !== 0 && seat.user && seat.status === SeatStatus.ACTIVE
      );

      // Find or create the player-dealer prompt if it doesn't exist
      let dealerPrompt = tablePrompts.find(
        (prompt) =>
          prompt.title?.toLowerCase().includes("player-dealer") ||
          prompt.content
            .toLowerCase()
            .includes("would you like to be the player-dealer")
      );

      if (!dealerPrompt) {
        // Create a new dealer prompt if one doesn't exist
        dealerPrompt = await promptService.create({
          tableId: null,
          title: "Would you like to be Player-Dealer?",
          content: "Would you like to be the player-dealer for the next round?",
          question: "Would you like to be the player-dealer?",
          status: PromptStatusEnum.PROCESSED,
        });

        // Add the new prompt to our local state
        setTablePrompts([...tablePrompts, dealerPrompt]);
      }
      setTablePrompt(dealerPrompt.id);

      let seatId: string | undefined = initSeatId;
      // get seatId by next current dealer, next current dealer is the one who is
      // currently dealer
      if (currentDealer && !initSeatId) {
        const seatIndex = tableSeatActive.findIndex(
          (seat) => seat.id === currentDealer.seatId
        );
        if (
          tableDealers.length == 2 &&
          tableDealers[1].seatId === tableDealers[0].seatId
        ) {
          // if only one dealer, get the next seat
          if (seatIndex !== -1 && seatIndex < tableSeatActive.length - 1) {
            seatId = tableSeatActive[seatIndex + 1].id;
          } else {
            seatId = tableSeatActive[0].id; // Default to the first seat if no next dealer found
          }
        } else {
          seatId = tableDealers[0].seatId;
        }
      } else if (!initSeatId) {
        seatId = tableSeatActive[0].id; // Default to the first seat if no next dealer found
      }

      if (seatId) setWaitDealer({ check: true, id: seatId });

      // if (seatId && !initSeatId) setSeatStart(seatId);

      // Send the dealer prompt to the table
      await promptService.update(dealerPrompt.id, {
        seatId,
        tableId,
        status: PromptStatusEnum.PROCESSED,
      });

      // Start the dealer rotation
      const result = await dealerService.handleDealerRotation(tableId, seatId);

      // reset current prompt
      setSelectedTable((table) =>
        table ? { ...table, promptId: dealerPrompt.id } : null
      );
      setCurrentDealer(() => null);

      notifications.show({
        title: "Success",
        message: result.message || "Dealer rotation started successfully",
        color: "green",
      });
    } catch (error) {
      console.error("Failed to start dealer rotation:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to start dealer rotation";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    }
  };

  // New function to toggle seat status when clicked
  const toggleSeatStatus = async (seat: Seat, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the fetchSeatDetails from triggering

    // if seat already session endTime is null
    if (seat.user) return;

    try {
      // Toggle the status between ACTIVE and INACTIVE
      const newStatus =
        seat.status === SeatStatus.ACTIVE
          ? SeatStatus.INACTIVE
          : SeatStatus.ACTIVE;

      // Call API to update the seat status
      await seatService.update(seat.id, {
        status: newStatus,
      });

      // Update the seat in local state
      const updatedSeats = tableSeats.map((s) =>
        s.id === seat.id ? { ...s, status: newStatus } : s
      );

      setTableSeats(updatedSeats);

      // Show success notification
      notifications.show({
        title: "Change Seat Status",
        message: `Seat ${seat.number} is now ${
          newStatus === SeatStatus.ACTIVE ? "active" : "inactive"
        }`,
        color: newStatus === SeatStatus.ACTIVE ? "blue" : "gray",
      });
    } catch (error) {
      console.error("Failed to update seat status:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update seat status";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    }
  };

  // Function to handle sending a message to a table
  const handleSendTableMessage = async () => {
    if (!selectedTable || !tableMessage.trim()) {
      notifications.show({
        title: "Warning",
        message: "Please select a table and enter a message",
        color: "yellow",
      });
      return;
    }

    try {
      const response = await tableService.sendNoteFSR(
        selectedTable.id,
        tableMessage
      );

      notifications.show({
        title: "Success",
        message: response.message || "Message sent successfully",
        color: "green",
      });

      setTableMessage("");
    } catch (error) {
      console.error("Failed to send table message:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send message";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    }
  };

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>Tables Management</Title>
      </Group>

      <Grid gutter="md" columns={12}>
        <Grid.Col span={12}>
          <Card>
            <Group align="flex-end" mb="xs">
              <Select
                flex={1}
                label="Select table"
                placeholder="Select table"
                data={tables.map((table) => ({
                  value: table.id,
                  label: `Table ${table.name}`,
                }))}
                value={selectedTable?.id || ""}
                searchable
                clearable
                onChange={(value) =>
                  setSelectedTable(
                    tables.find((table) => table.id === value) || null
                  )
                }
              />
              <Button
                color="blue"
                variant="light"
                disabled={
                  !selectedTable ||
                  selectedTable.status !== TableStatus.INACTIVE
                }
                onClick={() => {
                  if (selectedTable) {
                    tableService
                      .sendAction(selectedTable.id, {
                        action: "ACTIVATE",
                      })
                      .then(() => {
                        setSelectedTable((table) =>
                          table
                            ? { ...table, status: TableStatus.ACTIVE }
                            : null
                        );
                        setTables((prev) =>
                          prev.map((table) =>
                            table.id === selectedTable.id
                              ? { ...table, status: TableStatus.ACTIVE }
                              : table
                          )
                        );
                        notifications.show({
                          title: "Success",
                          message: `Session for table ${selectedTable.name} activated`,
                          color: "blue",
                        });
                      });
                  }
                }}
              >
                Activate
              </Button>
              <Button
                color="orange"
                variant="light"
                disabled={
                  !selectedTable ||
                  selectedTable.status === TableStatus.INACTIVE
                }
                onClick={() => {
                  if (
                    selectedTable &&
                    selectedTable.status === TableStatus.ACTIVE
                  ) {
                    tableService
                      .sendAction(selectedTable.id, {
                        action: "PAUSE",
                      })
                      .then(() => {
                        setSelectedTable((table) =>
                          table
                            ? { ...table, status: TableStatus.MAINTENANCE }
                            : null
                        );
                        setTables((prev) =>
                          prev.map((table) =>
                            table.id === selectedTable.id
                              ? { ...table, status: TableStatus.MAINTENANCE }
                              : table
                          )
                        );
                        notifications.show({
                          title: "Success",
                          message: `Session for table ${selectedTable.name} paused`,
                          color: "orange",
                        });

                        setWaitDealer(null);
                        setPlayerResponses({});
                        setDealerResponses({});
                      });
                  }
                  if (
                    selectedTable &&
                    selectedTable.status === TableStatus.MAINTENANCE
                  ) {
                    tableService
                      .sendAction(selectedTable.id, {
                        action: "ACTIVATE",
                      })
                      .then(() => {
                        setSelectedTable((table) =>
                          table
                            ? { ...table, status: TableStatus.ACTIVE }
                            : null
                        );
                        setTables((prev) =>
                          prev.map((table) =>
                            table.id === selectedTable.id
                              ? { ...table, status: TableStatus.ACTIVE }
                              : table
                          )
                        );
                        notifications.show({
                          title: "Success",
                          message: `Session for table ${selectedTable.name} resumed`,
                          color: "orange",
                        });
                      });
                  }
                }}
              >
                {selectedTable?.status === TableStatus.MAINTENANCE
                  ? "Resume Session"
                  : "Pause Session"}
              </Button>
              <Button
                color="red"
                variant="light"
                disabled={
                  !selectedTable ||
                  selectedTable.status === TableStatus.INACTIVE
                }
                onClick={() => {
                  if (selectedTable) {
                    tableService
                      .sendAction(selectedTable.id, {
                        action: "TERMINATE",
                      })
                      .then(() => {
                        setSelectedTable((table) =>
                          table
                            ? { ...table, status: TableStatus.INACTIVE }
                            : null
                        );
                        setTables((prev) =>
                          prev.map((table) =>
                            table.id === selectedTable.id
                              ? { ...table, status: TableStatus.INACTIVE }
                              : table
                          )
                        );
                        notifications.show({
                          title: "Success",
                          message: `Session for table ${selectedTable.name} terminated`,
                          color: "red",
                        });

                        setWaitDealer(null);
                        setTablePrompt(null);
                        setPlayerResponses({});
                        setDealerResponses({});
                      });
                  }
                }}
              >
                Terminate
              </Button>
            </Group>

            <Group align="center">
              <Title order={3}>
                {selectedTable
                  ? "Table: " + selectedTable.name
                  : "Please select table"}
              </Title>
              {selectedTable && (
                <Badge
                  color={
                    selectedTable.status === TableStatus.ACTIVE
                      ? "green"
                      : selectedTable.status === TableStatus.MAINTENANCE
                      ? "yellow"
                      : "red"
                  }
                >
                  {selectedTable.status === TableStatus.ACTIVE
                    ? "Active"
                    : selectedTable.status === TableStatus.INACTIVE
                    ? "Inactive"
                    : "Session Paused"}
                </Badge>
              )}
            </Group>
          </Card>
        </Grid.Col>

        {/* Left column - Table seat management */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card shadow="sm" padding="md" radius="md" mb="md">
            <Group align="flex-end" mb="xs">
              <TextInput
                flex={1}
                label="Notes to FSR"
                placeholder="Enter notes"
                value={tableMessage}
                onChange={(e) => setTableMessage(e.target.value)}
                maxLength={500}
              />
              <Button
                color="green"
                variant="light"
                w="30%"
                disabled={
                  !selectedTable || selectedTable.status !== TableStatus.ACTIVE
                }
                onClick={() => handleSendTableMessage()}
              >
                Request FSR
              </Button>
            </Group>

            <Group align="flex-end">
              <Select
                flex={1}
                label="Send prompt to table"
                placeholder="Select prompt"
                data={tablePrompts
                  .filter(
                    (prompt) =>
                      !prompt.title.toLowerCase().includes("player-dealer") &&
                      !prompt.content.toLowerCase().includes("player-dealer")
                  )
                  .map((prompt) => ({
                    value: prompt.id,
                    label: prompt.title,
                  }))}
                value={tablePrompt || ""}
                searchable
                clearable
                onChange={(value) => setTablePrompt(value)}
              />
              <Button
                color="blue"
                variant="light"
                w="30%"
                disabled={
                  !selectedTable ||
                  selectedTable.status !== "ACTIVE" ||
                  tableSeats.filter((seat) => seat.user).length < 2
                }
                onClick={() => {
                  if (selectedTable && tablePrompt) {
                    setTableTriggered(true);
                    setPlayerResponses({});
                    fetchSendPrompt(tablePrompt, selectedTable.id);
                  }
                }}
              >
                Start
              </Button>
            </Group>
          </Card>

          <Card shadow="sm" padding="md" radius="md">
            <Group>
              <Title order={3}>Seat Management</Title>
              <Button
                color="blue"
                variant="light"
                disabled={
                  !selectedTable ||
                  selectedTable.status !== "ACTIVE" ||
                  tableSeats.filter((seat) => seat.user).length < 2
                }
                onClick={() => {
                  if (selectedTable) {
                    setPlayerResponses({});
                    setDealerResponses({});
                    startDealerRotation(selectedTable.id);
                  }
                }}
              >
                Player-Dealer
              </Button>
            </Group>

            <MantineTable striped highlightOnHover>
              <MantineTable.Thead>
                <MantineTable.Tr>
                  <MantineTable.Th></MantineTable.Th>
                  <MantineTable.Th>Seat</MantineTable.Th>
                  <MantineTable.Th ta="center">Status</MantineTable.Th>
                  <MantineTable.Th>Activity</MantineTable.Th>
                  <MantineTable.Th>Response</MantineTable.Th>
                  <MantineTable.Th>Timestamp</MantineTable.Th>
                  <MantineTable.Th ta="center">Action</MantineTable.Th>
                </MantineTable.Tr>
              </MantineTable.Thead>
              <MantineTable.Tbody>
                {tableSeats
                  .filter((seat) => seat.number !== 0)
                  .map((seat) => {
                    const response = dealerResponses[seat.id];
                    return (
                      <MantineTable.Tr key={seat.id}>
                        <MantineTable.Td>
                          {currentDealer &&
                            currentDealer.seatId === seat.id && (
                              <ActionIcon variant="light" color="blue">
                                <IconUserHexagon size="1rem" />
                              </ActionIcon>
                            )}
                        </MantineTable.Td>
                        <MantineTable.Td>
                          Seat {seat ? seat.number : "?"}
                        </MantineTable.Td>
                        <MantineTable.Td>
                          <Group justify="center">
                            {seat.status === SeatStatus.ACTIVE && (
                              <Badge color={seat.user ? "green" : "gray"}>
                                {seat.user ? "Active" : "Inactive"}
                              </Badge>
                            )}
                          </Group>
                        </MantineTable.Td>
                        <MantineTable.Td>
                          {waitDealer &&
                          waitDealer.check &&
                          waitDealer.id === seat.id
                            ? "Waiting"
                            : response
                            ? response.activity
                            : ""}
                        </MantineTable.Td>
                        <MantineTable.Td>
                          {response ? response.content : ""}
                        </MantineTable.Td>
                        <MantineTable.Td>
                          {response && response.timestamp
                            ? format(
                                new Date(response.timestamp),
                                "MM/dd hh:mm a"
                              )
                            : ""}
                        </MantineTable.Td>
                        <MantineTable.Td>
                          <Group gap="xs" justify="center">
                            {seat.status === SeatStatus.ACTIVE ? (
                              <>
                                {seat.user ? (
                                  <ActionIcon
                                    variant="light"
                                    color="orange"
                                    onClick={() => {
                                      if (selectedTable) {
                                        tableService.sendAction(
                                          selectedTable.id,
                                          {
                                            action: "TERMINATE",
                                            seatId: seat.id,
                                          }
                                        );
                                      }
                                    }}
                                  >
                                    <IconLogout2 size="1rem" />
                                  </ActionIcon>
                                ) : (
                                  <ActionIcon
                                    variant="light"
                                    color="red"
                                    onClick={(e) => toggleSeatStatus(seat, e)}
                                  >
                                    <IconMouseOff size="1rem" />
                                  </ActionIcon>
                                )}

                                <ActionIcon
                                  variant="light"
                                  color="blue"
                                  onClick={() => {
                                    if (selectedTable) {
                                      startDealerRotation(
                                        selectedTable.id,
                                        seat.id
                                      );
                                      setSeatInter(seat.id);
                                    }
                                  }}
                                >
                                  <IconRefresh size="1rem" />
                                </ActionIcon>
                              </>
                            ) : (
                              <ActionIcon
                                onClick={(e) => toggleSeatStatus(seat, e)}
                                variant="light"
                                color="green"
                              >
                                <IconCheck size="1rem" />
                              </ActionIcon>
                            )}
                          </Group>
                        </MantineTable.Td>
                      </MantineTable.Tr>
                    );
                  })}
              </MantineTable.Tbody>
            </MantineTable>
          </Card>
        </Grid.Col>

        {/* Right column - Session list */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card shadow="sm" padding="md" radius="md" mb="md">
            <Title order={3}>Active Session</Title>
            <Title
              order={4}
              c={tablePrompt && tableTriggered ? "blue" : "dimmed"}
            >
              Current Prompt:{" "}
              {tablePrompt && tableTriggered
                ? tablePrompts.find((prompt) => prompt.id === tablePrompt)
                    ?.title
                : "No prompt selected"}
            </Title>
            <MantineTable striped highlightOnHover>
              <MantineTable.Thead>
                <MantineTable.Tr>
                  <MantineTable.Th>Session</MantineTable.Th>
                  <MantineTable.Th>Activity</MantineTable.Th>
                  <MantineTable.Th>Response</MantineTable.Th>
                  <MantineTable.Th>Timestamp</MantineTable.Th>
                </MantineTable.Tr>
              </MantineTable.Thead>
              <MantineTable.Tbody>
                {tableSeats
                  .filter((seat) => seat.number !== 0 && seat.user)
                  .map((seat) => {
                    const response = playerResponses[seat.id];
                    return (
                      <MantineTable.Tr key={seat.id}>
                        <MantineTable.Td>
                          Seat {seat ? seat.number : "?"}
                        </MantineTable.Td>
                        <MantineTable.Td>
                          {!tablePrompt || !tableTriggered
                            ? null
                            : response
                            ? response.activity
                            : "waiting"}
                        </MantineTable.Td>
                        <MantineTable.Td>
                          {response ? response.content : ""}
                        </MantineTable.Td>
                        <MantineTable.Td>
                          {response
                            ? format(new Date(response.timestamp), "hh:mm:ss a")
                            : null}
                        </MantineTable.Td>
                      </MantineTable.Tr>
                    );
                  })}
              </MantineTable.Tbody>
            </MantineTable>
          </Card>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
