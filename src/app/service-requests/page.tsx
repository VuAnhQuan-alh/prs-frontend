"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";

import { serviceRequestService } from "@/lib/api/services";
import {
  ServiceRequest,
  ServiceRequestFilters,
  ServiceRequestStatus,
  ServiceRequestType,
} from "@/lib/api/types/service-requests";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  LoadingOverlay,
  Modal,
  Pagination,
  Select,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconSearch,
  IconTrash,
  IconUserCircle,
} from "@tabler/icons-react";

export default function ServiceRequestsPage() {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [resolveOpened, { open: openResolve, close: closeResolve }] =
    useDisclosure(false);
  const [requestToDelete, setRequestToDelete] = useState<string>("");
  const [requestToResolve, setRequestToResolve] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRequest, setTotalRequest] = useState(0);

  // Fetch service requests on component mount
  useEffect(() => {
    fetchServiceRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, pageSize]);

  // Function to fetch service requests from API
  const fetchServiceRequests = async () => {
    try {
      setLoading(true);

      let filters: ServiceRequestFilters = {
        page: currentPage,
        limit: pageSize,
      };
      if (activeTab !== "all" && activeTab) {
        filters = {
          ...filters,
          status: activeTab as ServiceRequestStatus,
        };
      }

      const data = await serviceRequestService.getAll(filters);
      setServiceRequests(data.docs);
      setTotalRequest(data.total);
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
      [ServiceRequestStatus.COMPLETED]: "green",
      [ServiceRequestStatus.CANCELLED]: "gray",
    };

    return (
      <Badge color={colorMap[status]} variant="filled">
        {status.replace("_", " ")}
      </Badge>
    );
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
        status: ServiceRequestStatus.COMPLETED,
      });
      notifications.show({
        title: "Success",
        message: "Service request has been completed",
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
      </Group>

      <Group justify="apart" mb="md">
        <Tabs
          value={activeTab}
          onChange={(value) => {
            setActiveTab(value);
            setCurrentPage(1); // Reset to first page when changing tab
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="all">All Requests</Tabs.Tab>
            <Tabs.Tab value={ServiceRequestStatus.OPEN}>Open</Tabs.Tab>
            <Tabs.Tab value={ServiceRequestStatus.IN_PROGRESS}>
              In Progress
            </Tabs.Tab>
            <Tabs.Tab value={ServiceRequestStatus.COMPLETED}>
              Completed
            </Tabs.Tab>
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
                <Table.Th>Caller</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th ta="center">Status</Table.Th>
                <Table.Th>Assigned To</Table.Th>
                <Table.Th ta="end">Created</Table.Th>
                <Table.Th ta="center">Actions</Table.Th>
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
                  <Table.Tr
                    key={request.id}
                    style={{
                      backgroundColor:
                        request.type === ServiceRequestType.TABLE_ADMIN
                          ? "rgba(255, 249, 219, 0.75)"
                          : undefined,
                    }}
                  >
                    <Table.Td>
                      {request.type === ServiceRequestType.PLAYER_DEALER
                        ? "Player"
                        : "Admin"}
                    </Table.Td>
                    <Table.Td>{request.description}</Table.Td>
                    <Table.Td ta="center">
                      {renderStatusBadge(request.status)}
                    </Table.Td>
                    <Table.Td>
                      {request?.assigned?.name || "Unassigned"}
                    </Table.Td>
                    <Table.Td ta="end">
                      {format(new Date(request.createdAt), "MM/dd/yyyy")}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" justify="center">
                        {request.status === ServiceRequestStatus.OPEN && (
                          <ActionIcon
                            onClick={() => {
                              serviceRequestService
                                .putAssignServiceRequest(request.id)
                                .then(() => {
                                  notifications.show({
                                    title: "Success",
                                    message:
                                      "Service request has been assigned",
                                    color: "green",
                                  });
                                  fetchServiceRequests();
                                })
                                .catch(() => {
                                  notifications.show({
                                    title: "Error",
                                    message: "Failed to assign service request",
                                    color: "red",
                                  });
                                });
                            }}
                            variant="light"
                            color="blue"
                          >
                            <IconUserCircle size="1rem" />
                          </ActionIcon>
                        )}
                        {request.status !== ServiceRequestStatus.COMPLETED && (
                          <ActionIcon
                            variant="light"
                            color="green"
                            onClick={() => {
                              setRequestToResolve(request.id);
                              openResolve();
                            }}
                            title="Mark as Completed"
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

          <Group justify="space-between" mt="md">
            <Text size="sm" c="dimmed">
              Showing {serviceRequests.length} of {totalRequest} requests
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
                total={Math.ceil(totalRequest / pageSize)}
                size="sm"
                withEdges
              />
            </Group>
          </Group>
        </Box>
      </Card>

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
