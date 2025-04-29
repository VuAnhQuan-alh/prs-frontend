"use client";

import { useState, useEffect } from "react";
import { promptService, tableService } from "@/lib/api/services";
import {
  Prompt,
  CreatePromptRequest,
  PromptStatusEnum,
} from "@/lib/api/types/prompts";
import {
  Title,
  Button,
  Badge,
  Table as MantineTable,
  Group,
  ActionIcon,
  Select,
  Modal,
  Stack,
  Textarea,
  Tabs,
  Card,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { Table } from "@/lib/api/types/tables";

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [activeTab, setActiveTab] = useState<string | null>("all");

  const [loadingTables, setLoadingTables] = useState(true);
  const [tables, setTables] = useState<Table[]>([]);

  const form = useForm<CreatePromptRequest>({
    initialValues: {
      title: "",
      content: "",
      tableId: "",
      status: PromptStatusEnum.PENDING,
    },
    validate: {
      content: (value) => (!value ? "Content is required" : null),
    },
  });

  // Fetch prompts on component mount
  useEffect(() => {
    fetchPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Fetch tables on create and edit prompt
  useEffect(() => {
    if (opened) fetchTables();
  }, [opened]);

  // Function to fetch prompts from API
  const fetchPrompts = async () => {
    try {
      setLoading(true);

      let filters = {};
      if (activeTab !== "all" && activeTab) {
        filters = { status: activeTab as PromptStatusEnum };
      }

      const data = await promptService.getAll(filters);
      setPrompts(data);
    } catch (error: unknown) {
      console.error("Error fetching prompts:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load prompts. Please try again later.";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch tables for select input
  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      const data = await tableService.getAll();
      setTables(data.docs);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load tables. Please try again later.";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoadingTables(false);
    }
  };

  // Function to handle form submission for creating/updating prompts
  const handleSubmit = async (values: CreatePromptRequest) => {
    try {
      if (!values.tableId) {
        values.tableId = null;
      }
      if (values.tableId === "all") {
        values.tableId = null;
        values.isAllTables = true;
      }
      if (selectedPrompt) {
        // Update existing prompt
        await promptService.update(selectedPrompt.id, values);
        notifications.show({
          title: "Success",
          message: `Prompt "${values.content}" has been updated`,
          color: "green",
        });
      } else {
        // Create new prompt
        await promptService.create(values);
        notifications.show({
          title: "Success",
          message: `Prompt "${values.content}" has been created`,
          color: "green",
        });
      }
      close();
      form.reset();
      fetchPrompts();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save prompt";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    }
  };

  // Handle edit prompt
  const handleEdit = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    form.setValues({
      title: prompt.title,
      content: prompt.content,
      status: prompt.status,
    });
    open();
  };

  // Handle delete prompt
  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete prompt "${title}"?`)) {
      try {
        await promptService.delete(id);
        notifications.show({
          title: "Success",
          message: `Prompt "${title}" has been deleted`,
          color: "green",
        });
        fetchPrompts();
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete prompt";
        notifications.show({
          title: "Error",
          message: errorMessage,
          color: "red",
        });
      }
    }
  };

  // Handle create new prompt
  const handleCreate = () => {
    setSelectedPrompt(null);
    form.reset();
    open();
  };

  // Function to render service request status badge
  const renderStatusBadge = (status: PromptStatusEnum) => {
    const colorMap: Record<PromptStatusEnum, string> = {
      [PromptStatusEnum.FAILED]: "red",
      [PromptStatusEnum.PROCESSED]: "green",
      [PromptStatusEnum.PENDING]: "gray",
    };

    return (
      <Badge color={colorMap[status]} variant="filled">
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Prompts</Title>
        <Button leftSection={<IconPlus size="1rem" />} onClick={handleCreate}>
          Create Prompt
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} mb="md">
        <Tabs.List>
          <Tabs.Tab value="all">All</Tabs.Tab>
          <Tabs.Tab value={PromptStatusEnum.PROCESSED}>Processed</Tabs.Tab>
          <Tabs.Tab value={PromptStatusEnum.PENDING}>Pending</Tabs.Tab>
          <Tabs.Tab value={PromptStatusEnum.FAILED}>Failed</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Card shadow="sm" p="lg" mb="md">
        <MantineTable highlightOnHover striped>
          <MantineTable.Thead>
            <MantineTable.Tr>
              <MantineTable.Th>Title</MantineTable.Th>
              <MantineTable.Th>Content</MantineTable.Th>
              <MantineTable.Th>Status</MantineTable.Th>
              <MantineTable.Th>Actions</MantineTable.Th>
            </MantineTable.Tr>
          </MantineTable.Thead>
          <MantineTable.Tbody>
            {loading ? (
              <MantineTable.Tr>
                <MantineTable.Td colSpan={5} align="center">
                  Loading...
                </MantineTable.Td>
              </MantineTable.Tr>
            ) : prompts.length === 0 ? (
              <MantineTable.Tr>
                <MantineTable.Td colSpan={5} align="center">
                  No prompts found
                </MantineTable.Td>
              </MantineTable.Tr>
            ) : (
              prompts.map((prompt) => (
                <MantineTable.Tr key={prompt.id}>
                  <MantineTable.Td>{prompt.title}</MantineTable.Td>
                  <MantineTable.Td>{prompt.content}</MantineTable.Td>
                  <MantineTable.Td>
                    {renderStatusBadge(prompt.status)}
                  </MantineTable.Td>
                  <MantineTable.Td>
                    <Group>
                      <ActionIcon
                        color="blue"
                        onClick={() => handleEdit(prompt)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        onClick={() => handleDelete(prompt.id, prompt.title)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                      {/* <ActionIcon
                      color="green"
                      onClick={() => fetchResponseOptions(prompt.id)}
                    >
                      <IconListDetails size={16} />
                    </ActionIcon> */}
                    </Group>
                  </MantineTable.Td>
                </MantineTable.Tr>
              ))
            )}
          </MantineTable.Tbody>
        </MantineTable>
      </Card>

      {/* Prompt form modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={
          selectedPrompt
            ? `Edit Prompt: ${selectedPrompt.title}`
            : "Create New Prompt"
        }
        size="lg"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Title"
              placeholder="Enter prompt title"
              required
              {...form.getInputProps("title")}
            />
            <Textarea
              label="Content"
              placeholder="Enter prompt content/question"
              required
              minRows={3}
              {...form.getInputProps("content")}
            />
            <Select
              label="Status"
              placeholder="Select prompt type"
              data={Object.values(PromptStatusEnum).map((type) => ({
                value: type,
                label: type.replace("_", " "),
              }))}
              required
              {...form.getInputProps("status")}
            />
            <Select
              label="Table"
              placeholder="Select Table"
              data={
                loadingTables
                  ? [{ value: "loading", label: "Loading managers..." }]
                  : [
                      { value: "", label: "Unassigned" },
                      { value: "all", label: "All table not prompt" },
                      ...tables.map((table) => ({
                        value: table.id,
                        label: `${table.name} (${table.status})`,
                      })),
                    ]
              }
              {...form.getInputProps("tableId")}
              clearable
            />

            <Button type="submit" mt="md">
              {selectedPrompt ? "Update Prompt" : "Create Prompt"}
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Response options modal */}
      {/* <Modal
        opened={responseOptionsOpen}
        onClose={closeOptions}
        title="Response Options"
        size="md"
        centered
      >
        {responseOptions.length === 0 ? (
          <Text>No response options defined for this prompt.</Text>
        ) : (
          <Accordion>
            {responseOptions.map((option) => (
              <Accordion.Item key={option.id} value={option.id}>
                <Accordion.Control>{option.label}</Accordion.Control>
                <Accordion.Panel>
                  <Stack>
                    <Group>
                      <Text fw={500}>Value:</Text>
                      <Text>{option.value}</Text>
                    </Group>
                    <Group>
                      <Text fw={500}>Order:</Text>
                      <Text>{option.order}</Text>
                    </Group>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
        <Button fullWidth mt="md" onClick={closeOptions}>
          Close
        </Button>
      </Modal> */}
    </>
  );
}
