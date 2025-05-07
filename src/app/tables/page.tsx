"use client";

import { useState, useEffect, useMemo } from "react";
import {
  tableService,
  seatService,
  promptService,
  sessionService,
  dealerService, // Add dealer service import
} from "@/lib/api/services";
import {
  Table,
  TableStatus,
  CreateTableRequest,
  Seat,
  SeatStatus,
} from "@/lib/api/types/tables";
import { Prompt, PromptStatusEnum } from "@/lib/api/types/prompts";
// import {
//   ServiceRequest,
//   ServiceRequestStatus,
// } from "@/lib/api/types/service-requests";
import { Response } from "@/lib/api/types/responses";
// Add Dealer type import
import { Dealer } from "@/lib/api/types/dealers";
import {
  Title,
  Button,
  Badge,
  Table as MantineTable,
  Group,
  ActionIcon,
  TextInput,
  NumberInput,
  Select,
  Modal,
  Stack,
  Card,
  Tabs,
  Text,
  Divider,
  Grid,
  Box,
  Tooltip,
  Checkbox,
  Avatar,
  LoadingOverlay,
  Pagination,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconChartBar,
  IconUser,
  // IconAlertCircle,
  IconRefresh,
  IconDetails,
  IconBell,
  IconMessage,
  // IconClipboardList,
  IconUserCheck,
  IconUserX,
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { userService } from "@/lib/api/services/user-service";
import { Role } from "@/lib/api/types/auth";
import { useWebSocket } from "@/lib/api/services/websocket-service";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { format } from "date-fns";

interface Manager {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [activeTab, setActiveTab] = useState<string | null>("tables");
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalTables, setTotalTables] = useState(0);

  // New state for table details
  const [tablePrompt, setTablePrompt] = useState<string | null>(null);
  const [tableSeats, setTableSeats] = useState<Seat[]>([]);
  const [tablePrompts, setTablePrompts] = useState<Prompt[]>([]);
  // const [tableServiceRequests, setTableServiceRequests] = useState<
  //   ServiceRequest[]
  // >([]);
  const [tableResponses, setTableResponses] = useState<Response[]>([]);
  // const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

  // New state for dealer management
  const [currentDealer, setCurrentDealer] = useState<Dealer | null>(null);
  const [tableDealers, setTableDealers] = useState<Dealer[]>([]);
  const [loadingDealer, setLoadingDealer] = useState(false);
  const [dealerHistoryOpen, setDealerHistoryOpen] = useState(false);

  const [tableMessageOpen, setTableMessageOpen] = useState(false);
  const [tableMessage, setTableMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const { currentUser } = useAccessControl();

  const form = useForm<
    CreateTableRequest & {
      status?: TableStatus;
      userId?: string;
      isVip?: boolean;
      adminNotes?: string;
    }
  >({
    initialValues: {
      name: "",
      capacity: 4,
      status: TableStatus.ACTIVE,
      userId: "",
      isVip: false,
      adminNotes: "",
    },
    validate: {
      name: (value) =>
        !value.trim()
          ? "Table name is required"
          : value.trim().length < 2
          ? "Name must be at least 2 characters"
          : null,
      capacity: (value) =>
        !value || value <= 0 ? "Capacity must be greater than 0" : null,
    },
  });
  const watchUserId = form.getInputProps("userId").value;

  // update stable status active when userId is assigned
  useEffect(() => {
    if (!selectedTable) return;

    if (watchUserId) {
      form.setFieldValue("status", TableStatus.ACTIVE);
    } else {
      form.setFieldValue("status", TableStatus.INACTIVE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchUserId, selectedTable]);

  // WebSocket hook
  const { lastMessage, isConnected } = useWebSocket();

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

  // Listen for WebSocket seat status updates
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
        fetchTableDetails(selectedTable.id);
      }

      // Refresh the tables list to update the status indicators
      fetchTables();
    } else if (lastMessage?.type === "RESPONSE_CREATED") {
      // Handle new response notification
      const payload = lastMessage.payload as {
        responseId: string;
        tableId: string;
        seatId: string;
        promptId: string;
        userName: string;
      };

      // Check if the response is for the currently prompt player-dealer
      const prompt = tablePrompts.find((p) => p.id === payload.promptId);
      if (prompt && prompt.title?.toLowerCase().includes("player-dealer")) {
        // reload current dealer and check if don't have dealer, next send prompt player-dealer for any seat
        fetchCurrentDealer(payload.tableId).then((currDealer) => {
          // await a 1seconds to check if dealer is null

          if (!currDealer && tableSeats.length > 0) {
            // Find the next seat for dealer rotation
            const seatIndex = tableSeats.findIndex(
              (seat) => seat.id === payload.seatId
            );
            const nextSeatIndex =
              seatIndex < tableSeats.length - 1 ? seatIndex + 1 : 0;

            if (nextSeatIndex === seatIndex) {
              notifications.show({
                title: "Error",
                message: "No available seats for dealer rotation",
                color: "red",
              });
              return;
            }

            // if nextSeatIndex is 0, set admin is dealer
            if (nextSeatIndex === 0) {
              // set table admin as dealer
              dealerService
                .setTableAdminAsDealer(payload.tableId)
                .then(() => {
                  notifications.show({
                    title: "Success",
                    message: "Table admin is now the dealer",
                    color: "green",
                  });
                  fetchCurrentDealer(payload.tableId);
                })
                .catch((error) => {
                  console.error("Failed to set table admin as dealer:", error);
                  notifications.show({
                    title: "Error",
                    message: "Failed to set table admin as dealer",
                    color: "red",
                  });
                });

              return;
            }

            const seatId = tableSeats[nextSeatIndex].id;

            // Send the dealer prompt to the table
            promptService.update(payload.promptId, {
              seatId,
              tableId: payload.tableId,
              status: PromptStatusEnum.PROCESSED,
            });

            // Start the dealer rotation
            dealerService.startDealerRotation(payload.tableId, seatId);
          }
        });
      }

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

      // If this is for the currently selected table, refresh its data
      if (selectedTable && selectedTable.id === payload.tableId) {
        fetchTableActivities(payload.tableId);
      }
    } else if (lastMessage?.type === "SERVICE_REQUEST_CREATED") {
      // Handle new service request notification
      const payload = lastMessage.payload as {
        serviceRequestId: string;
        tableId: string;
        seatId: string;
        type: string;
        userName: string;
      };

      // Show notification to admin with higher priority
      notifications.show({
        title: `New ${payload.type} Request`,
        message: `${payload.userName || "A player"} needs assistance at table ${
          tables.find((t) => t.id === payload.tableId)?.name || payload.tableId
        }`,
        color: "red",
        icon: <IconBell size="1.1rem" />,
        autoClose: false,
      });

      // If this is for the currently selected table, refresh its data
      if (selectedTable && selectedTable.id === payload.tableId) {
        fetchTableActivities(payload.tableId);
      }
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
        fetchCurrentDealer(payload.tableId);
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
        fetchCurrentDealer(payload.tableId);
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

      // If this is for the currently selected table, refresh dealer information
      if (selectedTable && selectedTable.id === payload.tableId) {
        fetchCurrentDealer(payload.tableId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);

  // current prompt selected
  const currentPrompt = useMemo(() => {
    if (selectedTable && tablePrompts.length) {
      return tablePrompts.find(
        (prompt) => prompt.id === selectedTable.promptId
      );
    }
    return null;
  }, [tablePrompts, selectedTable]);

  useEffect(() => {
    fetchManagers();
  }, []);

  // Fetch tables on component mount or when pagination changes
  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  // Fetch prompts on detail
  useEffect(() => {
    if (selectedTable) {
      fetchPrompts();
      fetchTableActivities(selectedTable.id);
    }
  }, [selectedTable]);

  // Function to fetch tables from API
  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await tableService.getAll({
        page: currentPage,
        limit: pageSize,
      });

      // Set total tables count for pagination (assuming the API returns total count)
      setTotalTables(response.meta.totalItems);

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

  // Function to fetch managers from API
  const fetchManagers = async () => {
    try {
      setLoadingManagers(true);
      // Get users with manager role using the userService
      const managers = await userService.getAll({ role: Role.TABLE });
      setManagers(managers);
    } catch (error) {
      console.error("Failed to fetch managers:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load managers";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoadingManagers(false);
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

  // New function to fetch table details when a table is selected
  const fetchTableDetails = async (tableId: string) => {
    // setLoadingDetails(true);
    setSelectedTable(tables.find((table) => table.id === tableId) || null);
    setSelectedSeat(null);

    try {
      // Fetch seats for the table
      const seats = await seatService.getByTable(tableId);
      setTableSeats(seats || []);

      // Fetch current dealer for the table
      fetchCurrentDealer(tableId);

      // Initialize other data arrays
      // setTableServiceRequests([]);
      setTableResponses([]);

      // Reset active tab to details
      setActiveTab("details");
    } catch (error) {
      console.error("Failed to fetch table details:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load table details",
        color: "red",
      });
    } finally {
      // setLoadingDetails(false);
    }
  };

  // Function to fetch service requests and response for table
  const fetchTableActivities = async (tableId: string) => {
    try {
      // setLoadingDetails(true);
      const activities = await tableService.getActivities(tableId);
      // setTableServiceRequests(activities.serviceRequests || []);
      setTableResponses(activities.responses || []);
    } catch (error) {
      console.error("Failed to fetch table activities:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load table activities",
        color: "red",
      });
    } finally {
      // setLoadingDetails(false);
    }
  };

  // New function to toggle seat status when clicked
  const toggleSeatStatus = async (seat: Seat, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the fetchSeatDetails from triggering

    // if seat already session endTime is null
    if (seat.user) {
      notifications.show({
        title: "Error",
        message: "Cannot change status of an active seat",
        color: "orange",
      });
      return;
    }

    try {
      // setLoadingDetails(true);

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
        title: "Seat updated",
        message: `Seat ${String.fromCharCode(64 + seat.number)} is now ${
          newStatus === SeatStatus.ACTIVE ? "active" : "inactive"
        }`,
        color: newStatus === SeatStatus.ACTIVE ? "blue" : "gray",
      });

      // Update the selected seat if it's the one we just toggled
      if (selectedSeat && selectedSeat.id === seat.id) {
        setSelectedSeat({ ...selectedSeat, status: newStatus });
      }
    } catch (error) {
      console.error("Failed to update seat status:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update seat status";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      // setLoadingDetails(false);
    }
  };

  // Function to handle sending a message to a table
  const handleSendTableMessage = async () => {
    if (!selectedTable || !tableMessage.trim()) {
      return;
    }

    try {
      setSendingMessage(true);

      const response = await tableService.sendMessage(
        selectedTable.id,
        tableMessage
      );

      notifications.show({
        title: "Success",
        message: response.message || "Message sent successfully",
        color: "green",
      });

      // Close the modal and reset the message
      setTableMessageOpen(false);
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
    } finally {
      setSendingMessage(false);
    }
  };

  // Function to open the table message modal
  const openTableMessageModal = () => {
    if (!selectedTable) {
      notifications.show({
        title: "Error",
        message: "Please select a table first",
        color: "red",
      });
      return;
    }

    setTableMessage("");
    setTableMessageOpen(true);
  };

  // Function to render table status badge
  const renderStatusBadge = (status: TableStatus) => {
    const colorMap: Record<TableStatus, string> = {
      [TableStatus.ACTIVE]: "green",
      [TableStatus.INACTIVE]: "gray",
      [TableStatus.MAINTENANCE]: "orange",
    };

    return (
      <Badge color={colorMap[status]} variant="filled">
        {status}
      </Badge>
    );
  };

  // Function to fetch current dealer for a table return current dealer or null
  const fetchCurrentDealer = async (tableId: string) => {
    try {
      setLoadingDealer(true);
      const dealer = await dealerService.getCurrentDealer(tableId);
      setCurrentDealer(dealer);

      if (dealer) {
        // Find the seat that corresponds to the dealer
        const tableSeat = tableSeats.find((seat) => seat.id === dealer.seatId);
        if (tableSeat) {
          setSelectedSeat(tableSeat);
        }

        if (dealer.roundsPlayed >= 2) {
          setTimeout(async () => {
            setCurrentDealer(null);
            notifications.show({
              title: "Success",
              message:
                "Dealer session ended successfully, starting rotation...",
              color: "green",
              autoClose: 5000,
            });

            // if dealer played 2 rounds, set dealer to null and end dealer session, start dealer rotation
            await dealerService.endDealerSession(tableId);

            const seatId =
              tableSeats.length > 1 && dealer.seatId === tableSeats[0].id
                ? tableSeats[1].id
                : undefined;

            await startDealerRotation(tableId, seatId);
          }, 2000);
        }
      }
      setLoadingDealer(false);
      return dealer;
    } catch (error) {
      console.error("Failed to fetch current dealer:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load dealer information",
        color: "red",
      });
      return null;
    }
  };

  // Function to fetch dealer history for a table
  const fetchDealerHistory = async (tableId: string) => {
    try {
      setLoadingDealer(true);
      const dealers = await dealerService.getTableDealers(tableId);
      setTableDealers(dealers);
    } catch (error) {
      console.error("Failed to fetch dealer history:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load dealer history",
        color: "red",
      });
    } finally {
      setLoadingDealer(false);
    }
  };

  // Function to start dealer rotation
  const startDealerRotation = async (tableId: string, initSeatId?: string) => {
    try {
      setLoadingDealer(true);

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
          title: "Player-Dealer Rotation",
          content: "Would you like to be the player-dealer for the next round?",
          status: PromptStatusEnum.PROCESSED,
        });

        // Add the new prompt to our local state
        setTablePrompts([...tablePrompts, dealerPrompt]);
      }

      let seatId: string | undefined = initSeatId;
      // get seatId by next current dealer, next current dealer is the one who is
      // currently dealer
      if (currentDealer && !initSeatId) {
        const seatIndex = tableSeats.findIndex(
          (seat) => seat.id === currentDealer.seatId
        );
        if (seatIndex !== -1 && seatIndex < tableSeats.length - 1) {
          seatId = tableSeats[seatIndex].id;
        }
      } else if (!initSeatId) {
        seatId = tableSeats[1].id; // Default to the first seat if no next dealer found
      }

      // Send the dealer prompt to the table
      await promptService.update(dealerPrompt.id, {
        seatId,
        tableId,
        status: PromptStatusEnum.PROCESSED,
      });

      // Start the dealer rotation
      const result = await dealerService.startDealerRotation(tableId, seatId);

      // reset current prompt
      setSelectedTable((table) =>
        table ? { ...table, promptId: dealerPrompt.id } : null
      );

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
    } finally {
      setLoadingDealer(false);
    }
  };

  // Function to check dealer rotation
  const checkDealerRotation = async (tableId: string) => {
    try {
      setLoadingDealer(true);
      const result = await dealerService.checkDealerRotation(tableId);

      notifications.show({
        title: "Success",
        message: result.message || "Dealer rotation checked successfully",
        color: "green",
      });

      // Refresh dealer information
      await fetchCurrentDealer(tableId);
    } catch (error) {
      console.error("Failed to check dealer rotation:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to check dealer rotation";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoadingDealer(false);
    }
  };

  // Function to end dealer session
  const endDealerSession = async (tableId: string) => {
    try {
      setLoadingDealer(true);
      const result = await dealerService.endDealerSession(tableId);

      notifications.show({
        title: "Success",
        message: result.message || "Dealer session ended successfully",
        color: "green",
      });

      // Reset dealer information
      setCurrentDealer(null);
    } catch (error) {
      console.error("Failed to end dealer session:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to end dealer session";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoadingDealer(false);
    }
  };

  // Handle form submit for creating/updating table
  const handleSubmit = async (
    values: CreateTableRequest & {
      status?: TableStatus;
      userId?: string;
      isVip?: boolean;
      adminNotes?: string;
    }
  ) => {
    try {
      // Validate form before submission
      const validationErrors = form.validate();
      if (validationErrors.hasErrors) {
        return; // Stop submission if there are errors
      }

      // Set table status to AVAILABLE if a manager is assigned, otherwise leave unchanged
      if (selectedTable) {
        // Update existing table
        await tableService.update(selectedTable.id, {
          name: values.name,
          capacity: values.capacity,
          status: values.status || TableStatus.ACTIVE,
          userId: values.userId || null,
        });
        if (values.userId) {
          const seats = await seatService.getByTable(selectedTable.id);
          if (seats.length > 0) {
            // Update all seats to ACTIVE if a manager is assigned
            await Promise.all(
              seats.map((seat) =>
                seatService.update(seat.id, {
                  status: SeatStatus.ACTIVE,
                })
              )
            );

            await sessionService.create({
              seatId: seats[0].id,
              userId: values.userId,
            });
          }
        }

        notifications.show({
          title: "Success",
          message: `Table "${values.name}" has been updated`,
          color: "green",
        });
      } else {
        // Create new table
        await tableService.createTableWithSeats(
          {
            name: values.name,
            capacity: values.capacity,
            // When initially creating, we only use the basic fields
          },
          +values.capacity
        );
        notifications.show({
          title: "Success",
          message: `Table "${values.name}" has been created`,
          color: "green",
        });
      }

      close();
      form.reset();
      fetchTables();
    } catch (error) {
      console.error("Failed to save table:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save table";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    }
  };

  // Handle edit table
  const handleEdit = (table: Table) => {
    setSelectedTable(table);
    form.setValues({
      name: table.name,
      capacity: table.capacity,
      status: table.status,
      userId: table.userId || "",
      isVip: Boolean(
        table.seats?.some((seat) => seat.status === SeatStatus.ACTIVE)
      ),
      adminNotes: `Table #${table.id.substring(
        0,
        4
      )}... - Last updated: ${new Date(table.updatedAt).toLocaleString()}`,
    });
    open();
  };

  // Open delete confirmation modal
  const openDeleteModal = (table: { id: string; name: string }) => {
    setTableToDelete(table);
    setDeleteModalOpen(true);
  };

  // Handle delete table
  const handleDelete = async (id: string, name: string) => {
    try {
      await tableService.delete(id);
      notifications.show({
        title: "Success",
        message: `Table "${name}" has been deleted`,
        color: "green",
      });
      setDeleteModalOpen(false);
      fetchTables();
    } catch (error) {
      console.error("Failed to delete table:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during delete. Please try again.";

      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
      setDeleteModalOpen(false);
    }
  };

  // Handle create new table
  const handleCreate = () => {
    setSelectedTable(null);
    form.reset();
    open();
  };

  // Find manager name for a table
  const getManagerName = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const manager = managers.find((m) => m.id === userId);
    return manager ? manager.name : "Unknown Manager";
  };

  // Handle refresh tables
  const handleRefresh = () => {
    fetchTables();
    fetchManagers();
    if (selectedTable) {
      fetchTableDetails(selectedTable.id);
    }
  };

  return (
    <>
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>Tables Management</Title>
        <Group>
          <Button
            variant="outline"
            leftSection={<IconRefresh size="1rem" />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="light"
            leftSection={<IconPlus size="1rem" />}
            onClick={handleCreate}
          >
            Add Table
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} mb="md">
        <Tabs.List>
          <Tabs.Tab value="tables" leftSection={<IconChartBar size="1rem" />}>
            Tables
          </Tabs.Tab>
          <Tabs.Tab
            value="details"
            leftSection={<IconDetails size="1rem" />}
            disabled={!selectedTable}
          >
            Details
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {activeTab === "tables" && (
        <Card shadow="sm" p="lg" mb="md">
          <Box pos="relative">
            <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
            <MantineTable highlightOnHover striped>
              <MantineTable.Thead>
                <MantineTable.Tr>
                  <MantineTable.Th>ID</MantineTable.Th>
                  <MantineTable.Th ta="center">Name</MantineTable.Th>
                  <MantineTable.Th>Capacity</MantineTable.Th>
                  <MantineTable.Th>Assigned To</MantineTable.Th>
                  <MantineTable.Th>Status</MantineTable.Th>
                  <MantineTable.Th>Created</MantineTable.Th>
                  <MantineTable.Th ta="center">Actions</MantineTable.Th>
                </MantineTable.Tr>
              </MantineTable.Thead>
              <MantineTable.Tbody>
                {loading ? (
                  <MantineTable.Tr>
                    <MantineTable.Td colSpan={7} align="center">
                      Loading...
                    </MantineTable.Td>
                  </MantineTable.Tr>
                ) : tables.length === 0 ? (
                  <MantineTable.Tr>
                    <MantineTable.Td colSpan={7} align="center">
                      No tables found
                    </MantineTable.Td>
                  </MantineTable.Tr>
                ) : (
                  tables.map((table) => (
                    <MantineTable.Tr key={table.id}>
                      <MantineTable.Td>
                        <Tooltip label={`Full ID: ${table.id}`}>
                          <Text>{table.id.substring(0, 8)}...</Text>
                        </Tooltip>
                      </MantineTable.Td>
                      <MantineTable.Td ta="center">
                        <Button
                          variant="subtle"
                          onClick={() => fetchTableDetails(table.id)}
                        >
                          {table.name}
                        </Button>
                      </MantineTable.Td>
                      <MantineTable.Td>{table.capacity}</MantineTable.Td>
                      <MantineTable.Td>
                        <Group gap="xs">
                          {table.userId ? (
                            <>
                              <Avatar color="blue" radius="xl" size="sm">
                                <IconUser size="0.8rem" />
                              </Avatar>
                              <Text size="sm">
                                {getManagerName(table.userId)}
                              </Text>
                            </>
                          ) : (
                            <Text size="sm" c="dimmed">
                              Unassigned
                            </Text>
                          )}
                        </Group>
                      </MantineTable.Td>
                      <MantineTable.Td>
                        {renderStatusBadge(table.status)}
                      </MantineTable.Td>
                      <MantineTable.Td>
                        {format(new Date(table.createdAt), "MMM dd, yyyy")}
                      </MantineTable.Td>
                      <MantineTable.Td>
                        <Group gap="xs" justify="center">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => handleEdit(table)}
                            disabled={table.status === TableStatus.MAINTENANCE}
                          >
                            <IconEdit size="1rem" />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() =>
                              openDeleteModal({
                                id: table.id,
                                name: table.name,
                              })
                            }
                            disabled={
                              currentUser?.role !== Role.ADMIN ||
                              table.status === TableStatus.ACTIVE
                            }
                          >
                            <IconTrash size="1rem" />
                          </ActionIcon>
                          {/* <Tooltip
                            label={
                              table.status === TableStatus.MAINTENANCE
                                ? "Unarchive"
                                : "Archive"
                            }
                          >
                            <ActionIcon
                              variant="light"
                              color={
                                table.status === TableStatus.MAINTENANCE
                                  ? "green"
                                  : "orange"
                              }
                              onClick={() => handleArchiveToggle(table)}
                              disabled={currentUser?.role !== Role.ADMIN}
                            >
                              {table.status === TableStatus.MAINTENANCE ? (
                                <IconRefresh size="1rem" />
                              ) : (
                                <IconAlertCircle size="1rem" />
                              )}
                            </ActionIcon>
                          </Tooltip> */}
                        </Group>
                      </MantineTable.Td>
                    </MantineTable.Tr>
                  ))
                )}
              </MantineTable.Tbody>
            </MantineTable>

            {/* Pagination controls */}
            <Group justify="space-between" mt="md">
              <Text size="sm" c="dimmed">
                Showing {tables.length} of {totalTables} tables
              </Text>
              <Group>
                <Select
                  size="xs"
                  value={String(pageSize)}
                  onChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1); // Reset to first page when changing page size
                  }}
                  data={["5", "10", "20", "50"].map((size) => ({
                    value: size,
                    label: size,
                  }))}
                  style={{ width: 100 }}
                />
                <Pagination
                  value={currentPage}
                  onChange={(page) => {
                    setCurrentPage(page);
                  }}
                  total={Math.ceil(totalTables / pageSize)}
                  size="sm"
                  withEdges
                />
              </Group>
            </Group>
          </Box>
        </Card>
      )}

      {activeTab === "details" && selectedTable && (
        <Stack gap="md">
          <Card shadow="sm" p="lg" mb="xs">
            <Group justify="space-between">
              <Group>
                <Title order={3}>{selectedTable.name}</Title>
                {renderStatusBadge(selectedTable.status)}
              </Group>
              <Group gap="xs">
                <Button
                  variant="default"
                  leftSection={<IconMessage size="1rem" />}
                  onClick={openTableMessageModal}
                >
                  Send Table Message
                </Button>
                <Button
                  variant="outline"
                  leftSection={<IconEdit size="1rem" />}
                  onClick={() => handleEdit(selectedTable)}
                >
                  Edit
                </Button>
                {/* <Button
                  variant="outline"
                  color="red"
                  leftSection={<IconTrash size="1rem" />}
                  onClick={() =>
                    openDeleteModal({
                      id: selectedTable.id,
                      name: selectedTable.name,
                    })
                  }
                >
                  Delete
                </Button> */}
              </Group>
            </Group>
          </Card>

          <Grid gutter="md" columns={10}>
            {/* Left Column - Table Seats Management */}
            <Grid.Col span={{ base: 10, md: 4 }}>
              <Card shadow="sm" p="lg" h="100%">
                <Title order={4} mb="md">
                  {selectedTable.name} Seats
                </Title>
                <Text size="sm" c="dimmed" mb="md">
                  Manage seats and player assignments
                </Text>

                <Box pos="relative">
                  <LoadingOverlay
                    visible={loading}
                    overlayProps={{ blur: 2 }}
                  />
                  <Stack>
                    {tableSeats.length === 0 ? (
                      <Text c="dimmed" ta="center">
                        No seats available for this table
                      </Text>
                    ) : (
                      tableSeats.map((seat, idx) => (
                        <Group key={seat.id}>
                          <Card
                            bg={
                              seat.status === SeatStatus.ACTIVE
                                ? "var(--mantine-color-white-1)"
                                : "var(--mantine-color-gray-1"
                            }
                            withBorder
                            w="55%"
                            p="sm"
                            style={{ cursor: "pointer" }}
                          >
                            <Group justify="space-between" align="start">
                              <Group flex="1">
                                <Avatar
                                  color={
                                    idx === 0
                                      ? "green"
                                      : seat.status === SeatStatus.ACTIVE
                                      ? "blue"
                                      : "gray"
                                  }
                                  radius="xl"
                                  size="md"
                                  style={{ cursor: "pointer" }}
                                >
                                  {seat.number}
                                </Avatar>

                                <Stack gap={0}>
                                  <Text fw={500}>
                                    Seat {String.fromCharCode(64 + seat.number)}{" "}
                                    {currentDealer &&
                                      currentDealer.seatId === seat.id &&
                                      "- Dealer"}
                                  </Text>
                                  <Text size="sm" c="dimmed">
                                    {seat.status === SeatStatus.ACTIVE
                                      ? seat.user
                                        ? idx === 0
                                          ? "Admin"
                                          : "Guest"
                                        : "Not occupied"
                                      : "Not active"}
                                  </Text>
                                </Stack>
                              </Group>

                              <Tooltip label="Change status">
                                <ActionIcon
                                  variant="light"
                                  c={
                                    seat.status === SeatStatus.ACTIVE
                                      ? "green"
                                      : "gray"
                                  }
                                  onClick={(e) => toggleSeatStatus(seat, e)}
                                  disabled={idx === 0}
                                >
                                  {seat.status === SeatStatus.ACTIVE ? (
                                    <IconUserCheck size="1.2rem" />
                                  ) : (
                                    <IconUserX size="1.2rem" />
                                  )}
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Card>

                          {currentPrompt &&
                            seat.status === SeatStatus.ACTIVE && (
                              <Box w="40%">
                                {(() => {
                                  // if seat is not active, return null
                                  if (seat.status !== SeatStatus.ACTIVE) {
                                    return null;
                                  }

                                  // if seat is not session
                                  if (!seat.user) {
                                    return null;
                                  }

                                  // if seat is active and seat admin, return null
                                  if (idx === 0) {
                                    return null;
                                  }
                                  // Find response for this seat and current prompt
                                  const seatResponse = tableResponses.find(
                                    (response) =>
                                      response.seatId === seat.id &&
                                      response.promptId === currentPrompt.id
                                  );

                                  if (!seatResponse) {
                                    return (
                                      <Badge
                                        color="blue"
                                        variant="dot"
                                        size="lg"
                                        fullWidth
                                      >
                                        Waiting for Response
                                      </Badge>
                                    );
                                  } else {
                                    // Format response time
                                    const responseTime = format(
                                      new Date(seatResponse.createdAt),
                                      "HH:mm:ss"
                                    );

                                    let badgeColor = "blue";
                                    let responseText = "Waiting";

                                    if (seatResponse.type === "YES_RESPONSE") {
                                      badgeColor = "green";
                                      responseText = "YES";
                                    } else if (
                                      seatResponse.type === "NO_RESPONSE"
                                    ) {
                                      badgeColor = "red";
                                      responseText = "NO";
                                    } else {
                                      badgeColor = "yellow";
                                      responseText = "SERVICE";
                                    }

                                    return (
                                      <Stack gap={2}>
                                        <Badge
                                          color={badgeColor}
                                          size="lg"
                                          fullWidth
                                        >
                                          {responseText}
                                        </Badge>
                                        <Text
                                          size="xs"
                                          ta="center"
                                          c="dimmed"
                                          fw={500}
                                        >
                                          {responseTime}
                                        </Text>
                                      </Stack>
                                    );
                                  }
                                })()}
                              </Box>
                            )}
                        </Group>
                      ))
                    )}
                  </Stack>
                </Box>
              </Card>
            </Grid.Col>

            {/* Middle Column - Prompt Control */}
            <Grid.Col span={{ base: 10, md: 3 }}>
              <Card shadow="sm" p="lg" h="100%">
                <Title order={4} mb="md">
                  Prompt Control
                </Title>
                <Text size="sm" c="dimmed" mb="md">
                  Send prompts to the table
                </Text>

                <Box pos="relative">
                  <LoadingOverlay
                    visible={loading}
                    overlayProps={{ blur: 2 }}
                  />

                  <Stack>
                    <Text fw={500} size="sm">
                      Select Prompt
                    </Text>
                    <Select
                      placeholder="Select prompt"
                      data={tablePrompts.map((p) => ({
                        value: p.id,
                        label: p.title || p.content.substring(0, 30),
                      }))}
                      onChange={(value) => setTablePrompt(value)}
                      searchable
                      clearable
                    />

                    <Button
                      fullWidth
                      variant="light"
                      // color="violet"
                      leftSection={<IconMessage size="1rem" />}
                      onClick={() => {
                        if (tablePrompt && selectedTable)
                          fetchSendPrompt(tablePrompt, selectedTable.id);
                      }}
                      disabled={!tablePrompt || !selectedTable}
                    >
                      Send Prompt
                    </Button>

                    <Divider
                      my="md"
                      label="Current Prompt"
                      labelPosition="center"
                    />

                    {currentPrompt ? (
                      <Card bg="var(--mantine-color-blue-light)" p="md">
                        <Title order={4}>{currentPrompt.title}</Title>
                        <Text c="dimmed" size="sm">
                          {currentPrompt.content}
                        </Text>
                      </Card>
                    ) : (
                      <Text c="dimmed" size="small">
                        No active prompt
                      </Text>
                    )}
                  </Stack>
                </Box>
              </Card>
            </Grid.Col>

            {/* Right Column - Player-Dealer Management */}
            <Grid.Col span={{ base: 10, md: 3 }}>
              <Card shadow="sm" p="lg" h="100%">
                <Title order={4} mb="md">
                  Player-Dealer Management
                </Title>
                <Text size="sm" c="dimmed" mb="md">
                  Manage dealer rotation and control
                </Text>

                <Box pos="relative">
                  <LoadingOverlay
                    visible={loadingDealer}
                    overlayProps={{ blur: 2 }}
                  />

                  <Stack>
                    {currentDealer ? (
                      <>
                        <Group>
                          <Avatar size="lg" color="blue" radius="xl">
                            <IconUser size="1.5rem" />
                          </Avatar>
                          <Stack gap={0}>
                            <Text fw={500}>Current Dealer</Text>
                            <Text>
                              Seat{" "}
                              {selectedSeat
                                ? String.fromCharCode(64 + selectedSeat.number)
                                : ""}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Rounds: {currentDealer.roundsPlayed}
                            </Text>
                          </Stack>
                        </Group>

                        <Button
                          color="orange"
                          variant="light"
                          onClick={() => checkDealerRotation(selectedTable.id)}
                          loading={loadingDealer}
                        >
                          Check/Update Rotation
                        </Button>

                        <Button
                          color="red"
                          variant="light"
                          onClick={() => endDealerSession(selectedTable.id)}
                          loading={loadingDealer}
                        >
                          End Dealer Session
                        </Button>
                      </>
                    ) : (
                      <>
                        <Text c="dimmed" ta="center" mb="md">
                          No active player-dealer for this table
                        </Text>
                        <Button
                          color="blue"
                          onClick={() => startDealerRotation(selectedTable.id)}
                          loading={loadingDealer}
                        >
                          Start Dealer Rotation
                        </Button>
                      </>
                    )}

                    <Button
                      variant="subtle"
                      onClick={() => {
                        setDealerHistoryOpen(true);
                        fetchDealerHistory(selectedTable.id);
                      }}
                    >
                      View Dealer History
                    </Button>
                  </Stack>
                </Box>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Service Requests and Responses Tabs */}
          {/* <Card shadow="sm" p="lg">
            <Box pos="relative">
              <LoadingOverlay
                visible={loadingDetails}
                overlayProps={{ blur: 2 }}
              />
              <Tabs defaultValue="service-requests">
                <Tabs.List>
                  <Tabs.Tab
                    value="service-requests"
                    leftSection={<IconBell size="1rem" />}
                  >
                    Service Requests ({tableServiceRequests.length})
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="responses"
                    leftSection={<IconClipboardList size="1rem" />}
                  >
                    Responses ({tableResponses.length})
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="service-requests" pt="md">
                  {tableServiceRequests.length === 0 ? (
                    <Text c="dimmed" ta="center">
                      No service requests available for this table
                    </Text>
                  ) : (
                    <MantineTable highlightOnHover striped>
                      <MantineTable.Thead>
                        <MantineTable.Tr>
                          <MantineTable.Th>Seat</MantineTable.Th>
                          <MantineTable.Th>Type</MantineTable.Th>
                          <MantineTable.Th>Status</MantineTable.Th>
                          <MantineTable.Th>Created</MantineTable.Th>
                          <MantineTable.Th>Notes</MantineTable.Th>
                        </MantineTable.Tr>
                      </MantineTable.Thead>
                      <MantineTable.Tbody>
                        {tableServiceRequests.map((request) => {
                          const seat = tableSeats.find(
                            (s) => s.id === request.seatId
                          );
                          return (
                            <MantineTable.Tr key={request.id}>
                              <MantineTable.Td>
                                Seat{" "}
                                {seat
                                  ? String.fromCharCode(64 + seat.number)
                                  : "Unknown"}
                              </MantineTable.Td>
                              <MantineTable.Td>{request.type}</MantineTable.Td>
                              <MantineTable.Td>
                                <Badge
                                  color={
                                    request.status === ServiceRequestStatus.OPEN
                                      ? "red"
                                      : request.status ===
                                        ServiceRequestStatus.IN_PROGRESS
                                      ? "yellow"
                                      : request.status ===
                                        ServiceRequestStatus.RESOLVED
                                      ? "green"
                                      : "red"
                                  }
                                >
                                  {request.status}
                                </Badge>
                              </MantineTable.Td>

                              <MantineTable.Td>
                                {format(
                                  new Date(request.createdAt),
                                  "MMM dd, yyyy h:mm a"
                                )}
                              </MantineTable.Td>
                              <MantineTable.Td>
                                <Text size="sm" lineClamp={2}>
                                  {request.notes || "No notes"}
                                </Text>
                              </MantineTable.Td>
                            </MantineTable.Tr>
                          );
                        })}
                      </MantineTable.Tbody>
                    </MantineTable>
                  )}
                </Tabs.Panel>

                <Tabs.Panel value="responses" pt="md">
                  {tableResponses.length === 0 ? (
                    <Text c="dimmed" ta="center">
                      No responses available for this table
                    </Text>
                  ) : (
                    <MantineTable highlightOnHover striped>
                      <MantineTable.Thead>
                        <MantineTable.Tr>
                          <MantineTable.Th>Guest Name</MantineTable.Th>
                          <MantineTable.Th>Prompt Question</MantineTable.Th>
                          <MantineTable.Th>Response</MantineTable.Th>
                          <MantineTable.Th>Seat</MantineTable.Th>
                          <MantineTable.Th>Time</MantineTable.Th>
                          <MantineTable.Th>Actions</MantineTable.Th>
                        </MantineTable.Tr>
                      </MantineTable.Thead>
                      <MantineTable.Tbody>
                        {tableResponses.map((response) => {
                          const seat = tableSeats.find(
                            (s) => s.id === response.seatId
                          );
                          const prompt = tablePrompts.find(
                            (p) => p.id === response.promptId
                          );
                          const guestName = response.session?.name || "user";

                          return (
                            <MantineTable.Tr key={response.id}>
                              <MantineTable.Td>{guestName}</MantineTable.Td>
                              <MantineTable.Td>
                                {prompt?.title ||
                                  "Would you like to be the player-dealer for the next round?"}
                              </MantineTable.Td>
                              <MantineTable.Td>
                                {response.type === "YES_RESPONSE" ? (
                                  <Badge color="green">YES</Badge>
                                ) : response.type === "NO_RESPONSE" ? (
                                  <Badge color="red">NO</Badge>
                                ) : (
                                  <Badge color="yellow">SERVICE</Badge>
                                )}
                              </MantineTable.Td>
                              <MantineTable.Td>
                                {seat
                                  ? String.fromCharCode(64 + seat.number)
                                  : "A"}
                              </MantineTable.Td>
                              <MantineTable.Td>
                                {format(
                                  new Date(response.createdAt),
                                  "MMM dd, yyyy h:mm a"
                                )}
                              </MantineTable.Td>
                              <MantineTable.Td>
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  size="sm"
                                  title="Delete"
                                >
                                  <IconTrash size="1rem" />
                                </ActionIcon>
                              </MantineTable.Td>
                            </MantineTable.Tr>
                          );
                        })}
                      </MantineTable.Tbody>
                    </MantineTable>
                  )}
                </Tabs.Panel>
              </Tabs>
            </Box>
          </Card> */}
        </Stack>
      )}

      {/* Table form modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={
          selectedTable ? `Edit Table: ${selectedTable.name}` : "Add New Table"
        }
        centered
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Table Name"
                  placeholder="Enter table name"
                  required
                  {...form.getInputProps("name")}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="Capacity"
                  placeholder="Enter seating capacity"
                  required
                  readOnly={
                    !!selectedTable && selectedTable.status !== "INACTIVE"
                  }
                  min={1}
                  {...form.getInputProps("capacity")}
                />
              </Grid.Col>
            </Grid>

            {selectedTable && (
              <>
                <Select
                  label="Assign Manager"
                  placeholder="Select a manager"
                  data={
                    loadingManagers
                      ? [{ value: "loading", label: "Loading managers..." }]
                      : [
                          { value: "", label: "Unassigned" },
                          ...managers.map((manager) => ({
                            value: manager.id,
                            label: `${manager.name} (${manager.email})`,
                          })),
                        ]
                  }
                  disabled={loadingManagers}
                  {...form.getInputProps("userId")}
                  description="When a manager is assigned, table becomes active"
                  clearable
                />

                <Select
                  label="Status"
                  placeholder="Select status"
                  data={[
                    { value: TableStatus.INACTIVE, label: "Inactive" },
                    { value: TableStatus.ACTIVE, label: "Active" },
                    { value: TableStatus.MAINTENANCE, label: "Maintenance" },
                  ]}
                  defaultValue={selectedTable.status}
                  disabled={!!form.values.userId} // Disable if a manager is assigned
                  description={
                    form.values.userId
                      ? "Status is set to AVAILABLE when a manager is assigned"
                      : ""
                  }
                  {...form.getInputProps("status")}
                />

                <Divider label="Admin Settings" labelPosition="center" />
                <Checkbox
                  label="VIP Table"
                  description="Mark this table as VIP for special service"
                  {...form.getInputProps("isVip", { type: "checkbox" })}
                />
                <TextInput
                  label="Admin Notes"
                  placeholder="Enter administrative notes"
                  {...form.getInputProps("adminNotes")}
                />
                <Box>
                  <Text size="xs" c="dimmed">
                    Last Updated:{" "}
                    {new Date(selectedTable.updatedAt).toLocaleString()}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Created:{" "}
                    {new Date(selectedTable.createdAt).toLocaleString()}
                  </Text>
                  {selectedTable.seats && (
                    <Text size="xs" c="dimmed">
                      Associated Seats: {selectedTable.seats.length}
                    </Text>
                  )}
                </Box>
              </>
            )}

            <Button type="submit" mt="md">
              {selectedTable ? "Update Table" : "Create Table"}
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <Text>Are you sure you want to delete this table?</Text>
        <Group justify="right" mt="md">
          <Button
            variant="outline"
            color="red"
            onClick={() =>
              tableToDelete
                ? handleDelete(tableToDelete.id, tableToDelete.name)
                : null
            }
          >
            Delete
          </Button>
          <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
        </Group>
      </Modal>

      {/* Table Message Modal */}
      <Modal
        opened={tableMessageOpen}
        onClose={() => setTableMessageOpen(false)}
        title={`Send Message to ${
          selectedTable ? selectedTable.name : "Table"
        }`}
        centered
      >
        <Stack>
          <Text size="sm">
            Enter a message to send to all players at this table:
          </Text>
          <TextInput
            placeholder="Type your message here..."
            value={tableMessage}
            onChange={(e) => setTableMessage(e.target.value)}
            required
            maxLength={500}
            data-autofocus
          />
          <Text size="xs" c="dimmed">
            Message will be sent as a notification to all players at this table.
          </Text>
          <Group justify="right" mt="md">
            <Button
              variant="outline"
              onClick={() => setTableMessageOpen(false)}
            >
              Cancel
            </Button>
            <Button
              loading={sendingMessage}
              disabled={!tableMessage.trim()}
              onClick={handleSendTableMessage}
            >
              Send
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Dealer History Modal */}
      <Modal
        opened={dealerHistoryOpen}
        onClose={() => setDealerHistoryOpen(false)}
        title="Player-Dealer History"
        size="lg"
      >
        <Box pos="relative">
          <LoadingOverlay visible={loadingDealer} overlayProps={{ blur: 2 }} />

          {tableDealers.length === 0 ? (
            <Text ta="center" c="dimmed">
              No dealer history available
            </Text>
          ) : (
            <MantineTable striped highlightOnHover>
              <MantineTable.Thead>
                <MantineTable.Tr>
                  <MantineTable.Th>Seat</MantineTable.Th>
                  <MantineTable.Th>Player Name</MantineTable.Th>
                  <MantineTable.Th>Rounds Played</MantineTable.Th>
                  <MantineTable.Th>Status</MantineTable.Th>
                  <MantineTable.Th>Start Time</MantineTable.Th>
                </MantineTable.Tr>
              </MantineTable.Thead>
              <MantineTable.Tbody>
                {tableDealers.map((dealer) => {
                  const seat = tableSeats.find((s) => s.id === dealer.seatId);
                  return (
                    <MantineTable.Tr key={dealer.id}>
                      <MantineTable.Td>
                        Seat{" "}
                        {seat ? String.fromCharCode(64 + seat.number) : "?"}
                      </MantineTable.Td>
                      <MantineTable.Td>
                        {dealer.session?.name || "Unknown"}
                      </MantineTable.Td>
                      <MantineTable.Td>{dealer.roundsPlayed}</MantineTable.Td>
                      <MantineTable.Td>
                        <Badge color={dealer.isActive ? "green" : "gray"}>
                          {dealer.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </MantineTable.Td>
                      <MantineTable.Td>
                        {format(
                          new Date(dealer.createdAt),
                          "MMM dd, yyyy h:mm a"
                        )}
                      </MantineTable.Td>
                    </MantineTable.Tr>
                  );
                })}
              </MantineTable.Tbody>
            </MantineTable>
          )}

          <Group justify="right" mt="md">
            <Button onClick={() => setDealerHistoryOpen(false)}>Close</Button>
          </Group>
        </Box>
      </Modal>
    </>
  );
}
