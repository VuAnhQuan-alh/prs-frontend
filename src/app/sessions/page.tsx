"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import {
  sessionService,
  tableService,
  responseService,
} from "@/lib/api/services";
import {
  Session,
  SessionStatus,
  CreateSessionRequest,
} from "@/lib/api/types/sessions";
import { Table } from "@/lib/api/types/tables";
import { Response } from "@/lib/api/types/responses";
import {
  Title,
  Button,
  Badge,
  Table as MantineTable,
  Group,
  ActionIcon,
  TextInput,
  Select,
  Modal,
  Stack,
  Card,
  Text,
  Tabs,
  Grid,
  Paper,
  Accordion,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconBox,
  IconClock,
  IconMessageCircle,
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { format, formatDistanceToNow } from "date-fns";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionResponses, setSessionResponses] = useState<Response[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [responsesOpen, { open: openResponses, close: closeResponses }] =
    useDisclosure(false);
  const [activeTab, setActiveTab] = useState<string | null>("active");

  const form = useForm<CreateSessionRequest>({
    initialValues: {
      tableId: "",
      userId: "",
      seatIds: [],
    },
    validate: {
      tableId: (value) => (!value ? "Table is required" : null),
      userId: (value) => (!value ? "User is required" : null),
    },
  });

  // Fetch sessions on component mount
  useEffect(() => {
    fetchSessions();
    fetchTables();
  }, [activeTab]);

  // Function to fetch sessions from API
  const fetchSessions = async () => {
    try {
      setLoading(true);

      let filters = {};
      if (activeTab !== "all" && activeTab) {
        filters = { status: activeTab as SessionStatus };
      }

      const data = await sessionService.getAll(filters);
      setSessions(data);
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to load sessions",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch tables
  const fetchTables = async () => {
    try {
      const data = await tableService.getAll({ status: "ACTIVE" });
      setTables(data);
    } catch (error: any) {
      console.error("Failed to load tables:", error);
    }
  };

  // Fetch responses for a session
  const fetchSessionResponses = async (sessionId: string) => {
    try {
      const responses = await responseService.getBySession(sessionId);
      setSessionResponses(responses);
      openResponses();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to load session responses",
        color: "red",
      });
    }
  };

  // Function to render session status badge
  const renderStatusBadge = (status: SessionStatus) => {
    const colorMap: Record<SessionStatus, string> = {
      [SessionStatus.ACTIVE]: "green",
      [SessionStatus.COMPLETED]: "blue",
      [SessionStatus.PAUSED]: "orange",
      [SessionStatus.CANCELLED]: "gray",
    };

    return (
      <Badge color={colorMap[status]} variant="filled">
        {status}
      </Badge>
    );
  };

  // Handle form submit for creating session
  const handleSubmit = async (values: CreateSessionRequest) => {
    try {
      await sessionService.create(values);
      notifications.show({
        title: "Success",
        message: "Session has been created",
        color: "green",
      });

      close();
      form.reset();
      fetchSessions();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to create session",
        color: "red",
      });
    }
  };

  // Handle end session
  const handleEndSession = async (id: string) => {
    if (window.confirm("Are you sure you want to end this session?")) {
      try {
        await sessionService.end(id);
        notifications.show({
          title: "Success",
          message: "Session has been ended",
          color: "green",
        });
        fetchSessions();
      } catch (error: any) {
        notifications.show({
          title: "Error",
          message: error.message || "Failed to end session",
          color: "red",
        });
      }
    }
  };

  // Handle create new session
  const handleCreate = () => {
    form.reset();
    open();
  };

  return (
    <DashboardLayout>
      <Group justify="space-between" mb="lg">
        <Title order={1}>Sessions</Title>
        <Button leftSection={<IconPlus size="1rem" />} onClick={handleCreate}>
          Create Session
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} mb="md">
        <Tabs.List>
          <Tabs.Tab value="all">All Sessions</Tabs.Tab>
          <Tabs.Tab value={SessionStatus.ACTIVE}>Active</Tabs.Tab>
          <Tabs.Tab value={SessionStatus.COMPLETED}>Completed</Tabs.Tab>
          <Tabs.Tab value={SessionStatus.PAUSED}>Paused</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <MantineTable highlightOnHover withTableBorder>
        <MantineTable.Thead>
          <MantineTable.Tr>
            <MantineTable.Th>Table</MantineTable.Th>
            <MantineTable.Th>User</MantineTable.Th>
            <MantineTable.Th>Status</MantineTable.Th>
            <MantineTable.Th>Start Time</MantineTable.Th>
            <MantineTable.Th>Duration</MantineTable.Th>
            <MantineTable.Th>Actions</MantineTable.Th>
          </MantineTable.Tr>
        </MantineTable.Thead>
        <MantineTable.Tbody>
          {loading ? (
            <MantineTable.Tr>
              <MantineTable.Td colSpan={6} align="center">
                Loading...
              </MantineTable.Td>
            </MantineTable.Tr>
          ) : sessions.length === 0 ? (
            <MantineTable.Tr>
              <MantineTable.Td colSpan={6} align="center">
                No sessions found
              </MantineTable.Td>
            </MantineTable.Tr>
          ) : (
            sessions.map((session) => (
              <MantineTable.Tr key={session.id}>
                <MantineTable.Td>{session.tableId}</MantineTable.Td>
                <MantineTable.Td>{session.userId}</MantineTable.Td>
                <MantineTable.Td>
                  {renderStatusBadge(session.status)}
                </MantineTable.Td>
                <MantineTable.Td>
                  {format(new Date(session.startTime), "PPp")}
                </MantineTable.Td>
                <MantineTable.Td>
                  {formatDistanceToNow(new Date(session.startTime))}
                </MantineTable.Td>
                <MantineTable.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => fetchSessionResponses(session.id)}
                      title="View Responses"
                    >
                      <IconMessageCircle size="1rem" />
                    </ActionIcon>

                    {session.status === SessionStatus.ACTIVE && (
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleEndSession(session.id)}
                        title="End Session"
                      >
                        <IconClock size="1rem" />
                      </ActionIcon>
                    )}
                  </Group>
                </MantineTable.Td>
              </MantineTable.Tr>
            ))
          )}
        </MantineTable.Tbody>
      </MantineTable>

      {/* Create session modal */}
      <Modal
        opened={opened}
        onClose={close}
        title="Create New Session"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Table"
              placeholder="Select table"
              data={tables.map((table) => ({
                value: table.id,
                label: table.name,
              }))}
              required
              {...form.getInputProps("tableId")}
            />

            <TextInput
              label="User ID"
              placeholder="Enter user ID"
              required
              {...form.getInputProps("userId")}
            />

            <Button type="submit" mt="md">
              Create Session
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Responses modal */}
      <Modal
        opened={responsesOpen}
        onClose={closeResponses}
        title="Session Responses"
        size="lg"
        centered
      >
        {sessionResponses.length === 0 ? (
          <Text>No responses recorded for this session.</Text>
        ) : (
          <Accordion>
            {sessionResponses.map((response) => (
              <Accordion.Item key={response.id} value={response.id}>
                <Accordion.Control>
                  {response.prompt?.title || "Response"}
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack>
                    <Group>
                      <Text fw={500}>Prompt:</Text>
                      <Text>{response.prompt?.content || "N/A"}</Text>
                    </Group>
                    <Group>
                      <Text fw={500}>Response:</Text>
                      <Text>{response.value}</Text>
                    </Group>
                    <Group>
                      <Text fw={500}>Timestamp:</Text>
                      <Text>{format(new Date(response.timestamp), "PPp")}</Text>
                    </Group>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
        <Button fullWidth mt="md" onClick={closeResponses}>
          Close
        </Button>
      </Modal>
    </DashboardLayout>
  );
}
