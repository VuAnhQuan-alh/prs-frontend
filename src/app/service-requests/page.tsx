"use client";

import { useState, useEffect } from "react";
import {
  seatService,
  serviceRequestService,
  userService,
} from "@/lib/api/services";
import { tableService } from "@/lib/api/services"; // Add this import
import {
  ServiceRequest,
  ServiceRequestStatus,
  // ServiceRequestPriority,
  ServiceRequestType,
  CreateServiceRequestRequest,
  UpdateServiceRequestRequest,
} from "@/lib/api/types/service-requests";
import { Seat, Table as TableType } from "@/lib/api/types/tables"; // Add this import
import {
  Title,
  Button,
  Badge,
  Table,
  Group,
  ActionIcon,
  TextInput,
  Select,
  Modal,
  Stack,
  Textarea,
  Tabs,
  Box,
  Textarea as MantineTextarea,
  Text,
  Card,
  LoadingOverlay,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconSearch,
  IconCheck,
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { format } from "date-fns";
import { Role } from "@/lib/api/types/auth";
import { User } from "@/lib/api/types/users";

export default function ServiceRequestsPage() {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [tables, setTables] = useState<TableType[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Adjust type as needed
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableSeats, setTableSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(
    null
  );
  const [createOpened, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);
  const [updateOpened, { open: openUpdate, close: closeUpdate }] =
    useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [resolveOpened, { open: openResolve, close: closeResolve }] =
    useDisclosure(false);
  const [requestToDelete, setRequestToDelete] = useState<string>("");
  const [requestToResolve, setRequestToResolve] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>("all");

  const createForm = useForm<CreateServiceRequestRequest>({
    initialValues: {
      seatId: "",
      sessionId: "",
      type: ServiceRequestType.ASSISTANCE,
      description: "",
    },
    validate: {
      description: (value) => (!value ? "Description is required" : null),
      seatId: (value) => (!value ? "Seat ID is required" : null),
      sessionId: (value) => (!value ? "Session ID is required" : null),
    },
  });

  const updateForm = useForm<UpdateServiceRequestRequest>({
    initialValues: {
      status: ServiceRequestStatus.OPEN,
      // priority: ServiceRequestPriority.MEDIUM,
      assignId: "",
      notes: "",
    },
  });

  useEffect(() => {
    fetchTables();
    fetchUsers();
  }, []);

  // Fetch service requests on component mount
  useEffect(() => {
    fetchServiceRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Function to fetch tables from API
  const fetchTables = async () => {
    try {
      const data = await tableService.getAll();
      setTables(data.docs);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load tables",
        color: "red",
      });
    }
  };

  // Fetch users for the update form, role User, is active
  const fetchUsers = async () => {
    try {
      const data = await userService.getAll({
        role: Role.USER,
        isActive: true,
      });
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown Failed to load users";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    }
  };

  // Function to fetch seats for a selected table
  const fetchTableSeats = async (tableId: string) => {
    try {
      const data = await seatService.getByTable(tableId);
      if (data) {
        setTableSeats(data);
      }
    } catch (error) {
      console.error("Failed to fetch table seats:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load table seats",
        color: "red",
      });
    }
  };

  // Handle table selection change
  const handleTableChange = (value: string | null) => {
    setSelectedTable(value);
    createForm.setFieldValue("seatId", "");

    if (value) {
      fetchTableSeats(value);
    } else {
      setTableSeats([]);
    }
  };

  // Function to fetch service requests from API
  const fetchServiceRequests = async () => {
    try {
      setLoading(true);

      let filters = {};
      if (activeTab !== "all" && activeTab) {
        filters = { status: activeTab as ServiceRequestStatus };
      }

      const data = await serviceRequestService.getAll(filters);
      setServiceRequests(data);
    } catch (error) {
      console.error("Failed to fetch service requests:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load service requests",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to render service request status badge
  const renderStatusBadge = (status: ServiceRequestStatus) => {
    const colorMap: Record<ServiceRequestStatus, string> = {
      [ServiceRequestStatus.OPEN]: "red",
      [ServiceRequestStatus.IN_PROGRESS]: "yellow",
      [ServiceRequestStatus.RESOLVED]: "green",
      [ServiceRequestStatus.CANCELLED]: "gray",
    };

    return (
      <Badge color={colorMap[status]} variant="filled">
        {status.replace("_", " ")}
      </Badge>
    );
  };

  // Handle create form submit
  const handleCreateSubmit = async (values: CreateServiceRequestRequest) => {
    try {
      // Validate form before submission
      const validationErrors = createForm.validate();
      if (validationErrors.hasErrors) {
        return; // Stop submission if there are errors
      }

      await serviceRequestService.create(values);
      notifications.show({
        title: "Success",
        message: "Service request has been created",
        color: "green",
      });

      closeCreate();
      createForm.reset();
      fetchServiceRequests();
    } catch (error) {
      console.error("Failed to create service request:", error);
      notifications.show({
        title: "Error",
        message: "Failed to create service request",
        color: "red",
      });
    }
  };

  // Handle update form submit
  const handleUpdateSubmit = async (values: UpdateServiceRequestRequest) => {
    if (!selectedRequest) return;

    // Validate form before submission
    const validationErrors = updateForm.validate();
    if (validationErrors.hasErrors) {
      return; // Stop submission if there are errors
    }

    try {
      await serviceRequestService.update(selectedRequest.id, {
        status: values.status ? values.status : null,
        assignId: values.assignId ? values.assignId : null,
        notes: values.notes ? values.notes : null,
      });
      notifications.show({
        title: "Success",
        message: "Service request has been updated",
        color: "green",
      });

      closeUpdate();
      updateForm.reset();
      fetchServiceRequests();
    } catch (error) {
      console.error("Failed to update service request:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update service request",
        color: "red",
      });
    }
  };

  // Handle delete service request
  const handleDelete = async (id: string) => {
    try {
      await serviceRequestService.update(id, {
        status: ServiceRequestStatus.CANCELLED,
      });
      notifications.show({
        title: "Success",
        message: "Service request has been deleted",
        color: "green",
      });
      fetchServiceRequests();
    } catch (error) {
      console.error("Failed to delete service request:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete service request",
        color: "red",
      });
    }
  };

  // Handle resolve service request
  const handleResolve = async (id: string) => {
    try {
      await serviceRequestService.update(id, {
        status: ServiceRequestStatus.RESOLVED,
      });
      notifications.show({
        title: "Success",
        message: "Service request has been resolved",
        color: "green",
      });
      fetchServiceRequests();
    } catch (error) {
      console.error("Failed to resolve service request:", error);
      notifications.show({
        title: "Error",
        message: "Failed to resolve service request",
        color: "red",
      });
    }
  };

  // Handle update button click
  const handleUpdateClick = (request: ServiceRequest) => {
    setSelectedRequest(request);
    updateForm.setValues({
      status: request.status,
      // priority: request.priority,
      assignId: request.assignId || "",
      notes: request.notes || "",
    });
    openUpdate();
  };

  // Filter service requests based on search term
  const filteredRequests = serviceRequests.filter(
    (request) =>
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.notes &&
        request.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Service Requests</Title>

        <Button
          variant="light"
          leftSection={<IconPlus size="1rem" />}
          onClick={openCreate}
        >
          New Request
        </Button>
      </Group>

      <Group justify="apart" mb="md">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="all">All Requests</Tabs.Tab>
            <Tabs.Tab value={ServiceRequestStatus.OPEN}>Open</Tabs.Tab>
            <Tabs.Tab value={ServiceRequestStatus.IN_PROGRESS}>
              In Progress
            </Tabs.Tab>
            <Tabs.Tab value={ServiceRequestStatus.RESOLVED}>Resolved</Tabs.Tab>
          </Tabs.List>
        </Tabs>
        <TextInput
          placeholder="Search requests..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          leftSection={<IconSearch size="1rem" />}
        />
      </Group>

      <Card shadow="sm" p="lg" mb="md">
        <Box pos="relative">
          <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
          <Table highlightOnHover striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Type</Table.Th>
                {/* <Table.Th>Priority</Table.Th> */}
                <Table.Th>Description</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Assigned To</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={7} align="center">
                    Loading...
                  </Table.Td>
                </Table.Tr>
              ) : filteredRequests.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} align="center">
                    No service requests found
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredRequests.map((request) => (
                  <Table.Tr key={request.id}>
                    <Table.Td>{request.type.replace("_", " ")}</Table.Td>
                    {/* <Table.Td>{renderPriorityBadge(request.priority)}</Table.Td> */}
                    <Table.Td>
                      {request.description.substring(0, 50)}...
                    </Table.Td>
                    <Table.Td>{renderStatusBadge(request.status)}</Table.Td>
                    <Table.Td>
                      {format(new Date(request.createdAt), "MMM dd, yyyy")}
                    </Table.Td>
                    <Table.Td>
                      {request?.assigned?.name || "Unassigned"}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleUpdateClick(request)}
                          title="Edit"
                        >
                          <IconEdit size="1rem" />
                        </ActionIcon>
                        {request.status !== ServiceRequestStatus.RESOLVED && (
                          <ActionIcon
                            variant="light"
                            color="green"
                            onClick={() => {
                              setRequestToResolve(request.id);
                              openResolve();
                            }}
                            title="Mark as Resolved"
                          >
                            <IconCheck size="1rem" />
                          </ActionIcon>
                        )}
                        {request.status !== ServiceRequestStatus.CANCELLED && (
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => {
                              setRequestToDelete(request.id);
                              openDelete();
                            }}
                            title="Delete"
                          >
                            <IconTrash size="1rem" />
                          </ActionIcon>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </Card>

      {/* Create service request modal */}
      <Modal
        opened={createOpened}
        onClose={closeCreate}
        title="Create Service Request"
        centered
      >
        <form onSubmit={createForm.onSubmit(handleCreateSubmit)}>
          <Stack>
            <Select
              label="Table"
              placeholder="Select a table"
              data={tables.map((table) => ({
                value: table.id,
                label: `${table.name} (Capacity: ${table.capacity})`,
              }))}
              value={selectedTable}
              onChange={handleTableChange}
              required
            />

            <Select
              label="Seat"
              placeholder={
                selectedTable ? "Select a seat" : "Select a table first"
              }
              data={tableSeats.map((seat) => ({
                value: seat.id,
                label: `Seat ${seat.number} (${seat.status})`,
              }))}
              disabled={!selectedTable || tableSeats.length === 0}
              {...createForm.getInputProps("seatId")}
              required
            />

            <TextInput
              label="Session ID"
              placeholder="Enter session ID"
              {...createForm.getInputProps("sessionId")}
              required
            />

            <Select
              label="Type"
              placeholder="Select request type"
              data={Object.values(ServiceRequestType).map((type) => ({
                value: type,
                label: type.replace("_", " "),
              }))}
              {...createForm.getInputProps("type")}
            />

            {/* <Select
              label="Priority"
              placeholder="Select priority"
              data={Object.values(ServiceRequestPriority).map((priority) => ({
                value: priority,
                label: priority,
              }))}
              {...createForm.getInputProps("priority")}
            /> */}

            <Textarea
              label="Description"
              placeholder="Enter request description"
              minRows={3}
              required
              {...createForm.getInputProps("description")}
            />

            <Button type="submit" mt="md">
              Create Request
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Update service request modal */}
      <Modal
        opened={updateOpened}
        onClose={closeUpdate}
        title="Update Service Request"
        centered
      >
        {selectedRequest && (
          <form onSubmit={updateForm.onSubmit(handleUpdateSubmit)}>
            <Stack>
              <Box mb="sm">
                <Text size="sm" fw={500}>
                  Request Type
                </Text>
                <Text>{selectedRequest.type.replace("_", " ")}</Text>
              </Box>

              <Box mb="sm">
                <Text size="sm" fw={500}>
                  Description
                </Text>
                <Text>{selectedRequest.description}</Text>
              </Box>

              <Select
                label="Status"
                placeholder="Select status"
                data={Object.values(ServiceRequestStatus).map((status) => ({
                  value: status,
                  label: status.replace("_", " "),
                }))}
                {...updateForm.getInputProps("status")}
              />

              <Select
                label="Assigned User"
                placeholder="Select assigned user"
                data={users.map((user) => ({
                  value: user.id,
                  label: `${user.name} (${user.email})`,
                }))}
                {...updateForm.getInputProps("assignId")}
              />

              <MantineTextarea
                label="Notes"
                placeholder="Add notes about this request"
                minRows={3}
                {...updateForm.getInputProps("notes")}
              />

              <Button type="submit" mt="md">
                Update Request
              </Button>
            </Stack>
          </form>
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="Delete Service Request"
        centered
      >
        <Text>Are you sure you want to delete this service request?</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="outline" color="gray" onClick={closeDelete}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={async () => {
              if (requestToDelete) {
                await handleDelete(requestToDelete);
                closeDelete();
              }
            }}
          >
            Confirm Delete
          </Button>
        </Group>
      </Modal>

      {/* Resolve confirmation modal */}
      <Modal
        opened={resolveOpened}
        onClose={closeResolve}
        title="Resolve Service Request"
        centered
      >
        <Text>
          Are you sure you want to mark this service request as resolved?
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="outline" color="gray" onClick={closeResolve}>
            Cancel
          </Button>
          <Button
            color="green"
            onClick={async () => {
              if (requestToResolve) {
                await handleResolve(requestToResolve);
                closeResolve();
              }
            }}
          >
            Confirm Resolve
          </Button>
        </Group>
      </Modal>
    </>
  );
}
