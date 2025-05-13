"use client";

import { useState, useEffect } from "react";
import { tableService, seatService, sessionService } from "@/lib/api/services";
import {
  Table,
  TableStatus,
  CreateTableRequest,
  SeatStatus,
} from "@/lib/api/types/tables";
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
  Text,
  Grid,
  Box,
  Tooltip,
  Avatar,
  LoadingOverlay,
  Pagination,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconUser,
  IconRefresh,
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { userService } from "@/lib/api/services/user-service";
import { Role } from "@/lib/api/types/auth";
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
  const [managers, setManagers] = useState<Manager[]>([]);
  // const [loadingManagers, setLoadingManagers] = useState(false);

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
  // const watchUserId = form.getInputProps("userId").value;

  // // update stable status active when userId is assigned
  // useEffect(() => {
  //   if (!selectedTable) return;

  //   if (watchUserId) {
  //     form.setFieldValue("status", TableStatus.ACTIVE);
  //   } else {
  //     form.setFieldValue("status", TableStatus.INACTIVE);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [watchUserId, selectedTable]);

  useEffect(() => {
    fetchManagers();
  }, []);

  // Fetch tables on component mount or when pagination changes
  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

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
      // Get users with manager role using the userService
      const managers = await userService.getAll({ role: Role.TABLE });
      setManagers(managers.docs);
    } catch (error) {
      console.error("Failed to fetch managers:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load managers";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
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
      // isVip: Boolean(
      //   table.seats?.some((seat) => seat.status === SeatStatus.ACTIVE)
      // ),
      // adminNotes: `Table #${table.id.substring(
      //   0,
      //   4
      // )}... - Last updated: ${new Date(table.updatedAt).toLocaleString()}`,
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
                    <MantineTable.Td ta="center">{table.name}</MantineTable.Td>
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
                {/* <Select
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
                /> */}

                <Select
                  label="Status"
                  placeholder="Select status"
                  data={[
                    { value: TableStatus.ACTIVE, label: "Active" },
                    { value: TableStatus.INACTIVE, label: "Inactive" },
                    // { value: TableStatus.MAINTENANCE, label: "Maintenance" },
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
    </>
  );
}
