"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import {
  tableService,
  seatService,
  promptService,
  serviceRequestService,
  responseService,
  sessionService,
} from "@/lib/api/services";
import {
  Table,
  TableStatus,
  CreateTableRequest,
  Seat,
  SeatStatus,
} from "@/lib/api/types/tables";
import { Prompt, PromptStatusEnum } from "@/lib/api/types/prompts";
import { ServiceRequest } from "@/lib/api/types/service-requests";
import { Response } from "@/lib/api/types/responses";
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
  Switch,
  Checkbox,
  Avatar,
  LoadingOverlay,
  ScrollArea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconChartBar,
  IconSettings,
  IconUser,
  IconAlertCircle,
  IconRefresh,
  IconDetails,
  IconBell,
  IconMessage,
  IconClipboardList,
  IconDownload,
  IconPrinter,
  IconStatusChange,
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { userService } from "@/lib/api/services/user-service";
import { Role } from "@/lib/api/types/auth";

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
  const [showArchived, setShowArchived] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  // New state for table details
  const [tablePrompt, setTablePrompt] = useState<string | null>(null);
  const [tableSeats, setTableSeats] = useState<Seat[]>([]);
  const [tablePrompts, setTablePrompts] = useState<Prompt[]>([]);
  const [tableServiceRequests, setTableServiceRequests] = useState<
    ServiceRequest[]
  >([]);
  const [tableResponses, setTableResponses] = useState<Response[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [, setSelectedDetailTab] = useState<string>("seats");
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

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
      status: TableStatus.AVAILABLE,
      userId: "",
      isVip: false,
      adminNotes: "",
    },
    validate: {
      name: (value) => (!value ? "Table name is required" : null),
      capacity: (value) =>
        !value || value <= 0 ? "Capacity must be greater than 0" : null,
    },
  });

  // current prompt selected
  const currentPrompt = useMemo(() => {
    if (selectedTable && tablePrompts.length) {
      return tablePrompts.find(
        (prompt) => prompt.id === selectedTable.promptId
      );
    }
    return null;
  }, [tablePrompts, selectedTable]);

  // Fetch tables on component mount
  useEffect(() => {
    fetchTables();
    fetchManagers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  // Fetch prompts on detail
  useEffect(() => {
    if (selectedTable) {
      fetchPrompts();
    }
  }, [selectedTable]);

  // Function to fetch tables from API
  const fetchTables = async () => {
    try {
      setLoading(true);
      const data = await tableService.getAll();

      // Filter tables based on archived status if needed
      const filteredTables = showArchived
        ? data
        : data.filter((table) => table.status !== TableStatus.MAINTENANCE);

      setTables(filteredTables);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load tables",
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
      const managers = await userService.getAll({ role: Role.MANAGER });
      setManagers(managers);
    } catch (error) {
      console.error("Failed to fetch managers:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load managers",
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
      notifications.show({
        title: "Error",
        message: "Failed to load prompts",
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
      await fetchPrompts();
    } catch (error) {
      console.error("Failed to send prompt:", error);
      notifications.show({
        title: "Error",
        message: "Failed to send prompt",
        color: "red",
      });
    }
  };

  // New function to fetch table details when a table is selected
  const fetchTableDetails = async (tableId: string) => {
    setLoadingDetails(true);
    setSelectedTable(tables.find((table) => table.id === tableId) || null);
    setSelectedSeat(null);

    try {
      // Fetch seats for the table
      const seats = await seatService.getByTable(tableId);
      setTableSeats(seats || []);

      // Initialize other data arrays
      setTableServiceRequests([]);
      setTableResponses([]);

      // Set selected detail tab to seats by default
      setSelectedDetailTab("seats");
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
      setLoadingDetails(false);
    }
  };

  // New function to fetch data for a selected seat
  const fetchSeatDetails = async (seatId: string) => {
    if (!seatId) return;

    setLoadingDetails(true);
    const seat = tableSeats.find((s) => s.id === seatId);
    setSelectedSeat(seat || null);

    try {
      // Fetch service requests for this seat
      const requests = await serviceRequestService.getBySeat(seatId);
      setTableServiceRequests(requests || []);

      // Fetch prompt responses for this seat
      const responses = await responseService.getBySeat(seatId);
      setTableResponses(responses || []);

      // Fetch prompts shown to this seat
      // Since there's no direct API to get prompts by seat,
      // we can extract unique promptIds from responses
      const promptIds = [...new Set(responses.map((r) => r.promptId))];
      const prompts: Prompt[] = [];

      for (const promptId of promptIds) {
        try {
          const prompt = await promptService.getById(promptId);
          if (prompt) {
            prompts.push(prompt);
          }
        } catch (e) {
          console.error(`Failed to fetch prompt ${promptId}:`, e);
        }
      }

      setTablePrompts(prompts);
    } catch (error) {
      console.error("Failed to fetch seat details:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load seat details",
        color: "red",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // New function to toggle seat status when clicked
  const toggleSeatStatus = async (seat: Seat, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the fetchSeatDetails from triggering

    try {
      setLoadingDetails(true);

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
      notifications.show({
        title: "Error",
        message: "Failed to update seat status",
        color: "red",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Function to render table status badge
  const renderStatusBadge = (status: TableStatus) => {
    const colorMap: Record<TableStatus, string> = {
      [TableStatus.AVAILABLE]: "gray",
      [TableStatus.OCCUPIED]: "green",
      [TableStatus.RESERVED]: "blue",
      [TableStatus.MAINTENANCE]: "orange",
    };

    return (
      <Badge color={colorMap[status]} variant="filled">
        {status}
      </Badge>
    );
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
      // Set table status to AVAILABLE if a manager is assigned, otherwise leave unchanged
      const newStatus = values.userId
        ? TableStatus.AVAILABLE
        : values.status || TableStatus.AVAILABLE;

      if (selectedTable) {
        // Update existing table
        await tableService.update(selectedTable.id, {
          name: values.name,
          capacity: values.capacity,
          status: newStatus,
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
      notifications.show({
        title: "Error",
        message: "Failed to save table",
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

  // Handle delete table
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete table "${name}"?`)) {
      try {
        await tableService.delete(id);
        notifications.show({
          title: "Success",
          message: `Table "${name}" has been deleted`,
          color: "green",
        });
        fetchTables();
      } catch (error) {
        console.error("Failed to delete table:", error);
        notifications.show({
          title: "Error",
          message: "Failed to delete table",
          color: "red",
        });
      }
    }
  };

  // Handle create new table
  const handleCreate = () => {
    setSelectedTable(null);
    form.reset();
    open();
  };

  // Handle archive/unarchive table
  const handleArchiveToggle = async (table: Table) => {
    try {
      const newStatus =
        table.status === TableStatus.MAINTENANCE
          ? TableStatus.AVAILABLE
          : TableStatus.MAINTENANCE;

      await tableService.update(table.id, {
        status: newStatus,
      });

      notifications.show({
        title: "Success",
        message: `Table "${table.name}" has been ${
          newStatus === TableStatus.MAINTENANCE ? "archived" : "unarchived"
        }`,
        color: "green",
      });

      fetchTables();
    } catch (error) {
      console.error("Failed to update table status:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update table status",
        color: "red",
      });
    }
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
  };

  // Render seat status badge
  // const renderSeatStatusBadge = (status: string) => {
  //   const colorMap: Record<string, string> = {
  //     AVAILABLE: "gray",
  //     OCCUPIED: "green",
  //     RESERVED: "blue",
  //     OUT_OF_SERVICE: "orange",
  //     INACTIVE: "red",
  //   };

  //   return (
  //     <Badge color={colorMap[status] || "gray"} variant="filled">
  //       {status}
  //     </Badge>
  //   );
  // };

  return (
    <DashboardLayout>
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>Tables</Title>
        <Group>
          <Button
            variant="outline"
            leftSection={<IconRefresh size="1rem" />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button leftSection={<IconPlus size="1rem" />} onClick={handleCreate}>
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
          <Tabs.Tab value="admin" leftSection={<IconSettings size="1rem" />}>
            Admin Settings
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {activeTab === "admin" && (
        <Card shadow="sm" p="lg" mb="md">
          <Stack>
            <Group justify="space-between">
              <Text fw={500}>Admin Controls</Text>
            </Group>
            <Divider />
            <Group>
              <Switch
                label="Show Archived Tables"
                checked={showArchived}
                onChange={(event) =>
                  setShowArchived(event.currentTarget.checked)
                }
              />
            </Group>
            <Text size="sm" c="dimmed">
              Additional admin settings can be configured here.
            </Text>
          </Stack>
        </Card>
      )}

      {activeTab === "tables" && (
        <Card shadow="sm" p="lg" mb="md">
          <Box pos="relative">
            <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
            <MantineTable highlightOnHover striped>
              <MantineTable.Thead>
                <MantineTable.Tr>
                  <MantineTable.Th>ID</MantineTable.Th>
                  <MantineTable.Th>Name</MantineTable.Th>
                  <MantineTable.Th>Capacity</MantineTable.Th>
                  <MantineTable.Th>Assigned To</MantineTable.Th>
                  <MantineTable.Th>Status</MantineTable.Th>
                  <MantineTable.Th>Created</MantineTable.Th>
                  <MantineTable.Th>Actions</MantineTable.Th>
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
                    <MantineTable.Tr
                      key={table.id}
                      opacity={
                        table.status === TableStatus.MAINTENANCE ? 0.5 : 1
                      }
                    >
                      <MantineTable.Td>
                        <Tooltip label={`Full ID: ${table.id}`}>
                          <Text>{table.id.substring(0, 8)}...</Text>
                        </Tooltip>
                      </MantineTable.Td>
                      <MantineTable.Td>
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
                        {new Date(table.createdAt).toLocaleDateString()}
                      </MantineTable.Td>
                      <MantineTable.Td>
                        <Group gap="xs">
                          <ActionIcon
                            color="blue"
                            onClick={() => handleEdit(table)}
                            disabled={table.status === TableStatus.MAINTENANCE}
                          >
                            <IconEdit size="1rem" />
                          </ActionIcon>
                          <ActionIcon
                            color="red"
                            onClick={() => handleDelete(table.id, table.name)}
                            disabled={
                              table.status === TableStatus.MAINTENANCE &&
                              !showArchived
                            }
                          >
                            <IconTrash size="1rem" />
                          </ActionIcon>
                          <Tooltip
                            label={
                              table.status === TableStatus.MAINTENANCE
                                ? "Unarchive"
                                : "Archive"
                            }
                          >
                            <ActionIcon
                              color={
                                table.status === TableStatus.MAINTENANCE
                                  ? "green"
                                  : "orange"
                              }
                              onClick={() => handleArchiveToggle(table)}
                            >
                              {table.status === TableStatus.MAINTENANCE ? (
                                <IconRefresh size="1rem" />
                              ) : (
                                <IconAlertCircle size="1rem" />
                              )}
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </MantineTable.Td>
                    </MantineTable.Tr>
                  ))
                )}
              </MantineTable.Tbody>
            </MantineTable>
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
                  variant="outline"
                  leftSection={<IconEdit size="1rem" />}
                  onClick={() => handleEdit(selectedTable)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  color="red"
                  leftSection={<IconTrash size="1rem" />}
                  onClick={() =>
                    handleDelete(selectedTable.id, selectedTable.name)
                  }
                >
                  Delete
                </Button>
              </Group>
            </Group>
          </Card>

          <Grid gutter="md">
            {/* Left Column - Table Seats Management */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow="sm" p="lg" withBorder h="100%">
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
                      tableSeats.map((seat) => (
                        <Card
                          key={seat.id}
                          bg={
                            seat.status === SeatStatus.ACTIVE
                              ? "var(--mantine-color-blue-light)"
                              : "var(--mantine-color-gray-0)"
                          }
                          withBorder
                          p="sm"
                          style={{ cursor: "pointer" }}
                        >
                          <Group justify="space-between" align="start">
                            <Group flex="1">
                              <Avatar
                                color={
                                  seat.status === SeatStatus.ACTIVE
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
                                  Seat {String.fromCharCode(64 + seat.number)}
                                </Text>
                                <Text size="sm" c="dimmed">
                                  {seat.status === SeatStatus.ACTIVE
                                    ? seat.user
                                      ? seat.user.name
                                          .split(" ")[0]
                                          .substring(0, 8) + "..."
                                      : "Not occupied"
                                    : "Not active"}
                                </Text>
                              </Stack>
                            </Group>

                            <ActionIcon
                              variant="subtle"
                              onClick={(e) => {
                                e.stopPropagation();
                                // handleEdit(selectedTable);
                              }}
                            >
                              <IconUser size="1.2rem" />
                            </ActionIcon>

                            <Tooltip label="View Details">
                              <ActionIcon
                                variant="light"
                                c="gray"
                                // onClick={(e) => toggleSeatStatus(seat, e)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fetchSeatDetails(seat.id);
                                }}
                              >
                                <IconDetails size="1.2rem" />
                              </ActionIcon>
                            </Tooltip>

                            <Tooltip label="Change status">
                              <ActionIcon
                                variant="light"
                                c="green"
                                onClick={(e) => toggleSeatStatus(seat, e)}
                              >
                                <IconStatusChange size="1.2rem" />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Card>
                      ))
                    )}
                  </Stack>
                </Box>
              </Card>
            </Grid.Col>

            {/* Middle Column - Prompt Control */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow="sm" p="lg" withBorder h="100%">
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
                        label: p.content || p.content.substring(0, 30),
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
                        <Text c="black" size="sm">
                          {currentPrompt.title}
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

            {/* Right Column - Administrative Actions */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow="sm" p="lg" withBorder h="100%">
                <Title order={4} mb="md">
                  Administrative Actions
                </Title>
                <Text size="sm" c="dimmed" mb="md">
                  Manage table operations
                </Text>

                <Stack>
                  <Button
                    variant="default"
                    leftSection={<IconMessage size="1rem" />}
                    fullWidth
                    justify="start"
                    styles={{
                      inner: { justifyContent: "flex-start" },
                    }}
                  >
                    Send Table Message
                  </Button>

                  <Button
                    variant="default"
                    leftSection={<IconDownload size="1rem" />}
                    fullWidth
                    justify="start"
                    styles={{
                      inner: { justifyContent: "flex-start" },
                    }}
                  >
                    Export Data
                  </Button>

                  <Button
                    variant="default"
                    leftSection={<IconPrinter size="1rem" />}
                    fullWidth
                    justify="start"
                    styles={{
                      inner: { justifyContent: "flex-start" },
                    }}
                  >
                    Print Report
                  </Button>

                  <Divider
                    my="md"
                    label="Table Statistics"
                    labelPosition="center"
                  />

                  <Group justify="space-between">
                    <Text size="sm">Occupied Seats:</Text>
                    <Text size="sm" fw={500}>
                      {
                        tableSeats.filter(
                          (seat) => seat.status === SeatStatus.ACTIVE
                        ).length
                      }
                      /{tableSeats.length}
                    </Text>
                  </Group>

                  <Group justify="space-between">
                    <Text size="sm">Response Rate:</Text>
                    <Text size="sm" fw={500}>
                      {tableResponses.length > 0 && tablePrompts.length > 0
                        ? `${Math.round(
                            (tableResponses.length / tablePrompts.length) * 100
                          )}%`
                        : "0%"}
                    </Text>
                  </Group>

                  <Group justify="space-between">
                    <Text size="sm">Average Rating:</Text>
                    <Badge color="green">Active</Badge>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Service Requests and Responses Tabs */}
          <Card shadow="sm" p="lg">
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
                          <MantineTable.Th>Priority</MantineTable.Th>
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
                                    request.status === "OPEN"
                                      ? "blue"
                                      : request.status === "IN_PROGRESS"
                                      ? "yellow"
                                      : request.status === "RESOLVED"
                                      ? "green"
                                      : "red"
                                  }
                                >
                                  {request.status}
                                </Badge>
                              </MantineTable.Td>
                              <MantineTable.Td>
                                <Badge
                                  color={
                                    request.priority === "HIGH"
                                      ? "red"
                                      : request.priority === "MEDIUM"
                                      ? "yellow"
                                      : request.priority === "URGENT"
                                      ? "orange"
                                      : "blue" // LOW
                                  }
                                >
                                  {request.priority}
                                </Badge>
                              </MantineTable.Td>
                              <MantineTable.Td>
                                {new Date(request.createdAt).toLocaleString()}
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
                    <ScrollArea h={400}>
                      {tableResponses.map((response) => {
                        const seat = tableSeats.find(
                          (s) => s.id === response.seatId
                        );
                        const prompt = tablePrompts.find(
                          (p) => p.id === response.promptId
                        );

                        return (
                          <Card key={response.id} withBorder mb="sm">
                            <Group justify="space-between" mb="xs">
                              <Group>
                                <Badge>
                                  Seat{" "}
                                  {seat
                                    ? String.fromCharCode(64 + seat.number)
                                    : "Unknown"}
                                </Badge>
                                <Text fw={500}>
                                  {prompt ? prompt.content : "Unknown Prompt"}
                                </Text>
                              </Group>
                              <Text size="xs" c="dimmed">
                                {new Date(response.createdAt).toLocaleString()}
                              </Text>
                            </Group>
                            <Divider mb="sm" />
                            <Text>{response.value}</Text>
                            {response.promptId && (
                              <Badge mt="xs" variant="outline">
                                Selected option: {response.promptId}
                              </Badge>
                            )}
                          </Card>
                        );
                      })}
                    </ScrollArea>
                  )}
                </Tabs.Panel>
              </Tabs>
            </Box>
          </Card>
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
                    { value: TableStatus.AVAILABLE, label: "Available" },
                    { value: TableStatus.OCCUPIED, label: "Occupied" },
                    { value: TableStatus.RESERVED, label: "Reserved" },
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
    </DashboardLayout>
  );
}
