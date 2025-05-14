"use client";

import { useState, useEffect } from "react";
import { promptService } from "@/lib/api/services";
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
  Card,
  TextInput,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconTrash, IconPlus, IconSearch } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
// import { Table } from "@/lib/api/types/tables";

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [promptToDelete, setPromptToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // const [loadingTables, setLoadingTables] = useState(true);
  // const [tables, setTables] = useState<Table[]>([]);

  const form = useForm<CreatePromptRequest>({
    initialValues: {
      title: "",
      content: "",
      question: "",
      tableId: "",
      status: PromptStatusEnum.PROCESSED,
    },
    validate: {
      content: (value) => (!value ? "Content is required" : null),
    },
  });

  // Fetch prompts on component mount
  useEffect(() => {
    fetchPrompts();
  }, []);

  // Fetch tables on create and edit prompt
  // useEffect(() => {
  //   if (opened) fetchTables();
  // }, [opened]);

  // Filter prompts based on search query
  const filteredPrompts = prompts.filter((prompt) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      prompt.title.toLowerCase().includes(query) ||
      prompt.content.toLowerCase().includes(query)
    );
  });

  // Function to fetch prompts from API
  const fetchPrompts = async () => {
    try {
      setLoading(true);

      const filters = {};
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
  // const fetchTables = async () => {
  //   try {
  //     setLoadingTables(true);
  //     const data = await tableService.getAll();
  //     setTables(data.docs);
  //   } catch (error: unknown) {
  //     const errorMessage =
  //       error instanceof Error
  //         ? error.message
  //         : "Failed to load tables. Please try again later.";
  //     notifications.show({
  //       title: "Error",
  //       message: errorMessage,
  //       color: "red",
  //     });
  //   } finally {
  //     setLoadingTables(false);
  //   }
  // };

  // Function to handle form submission for creating/updating prompts
  const handleSubmit = async (values: CreatePromptRequest) => {
    try {
      // Validate form before submission
      const validationErrors = form.validate();
      if (validationErrors.hasErrors) {
        return; // Stop submission if there are errors
      }

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
  const handleDelete = async (id: string) => {
    try {
      await promptService.delete(id);
      notifications.show({
        title: "Success",
        message: `Prompt has been deleted`,
        color: "green",
      });
      fetchPrompts();
      closeDelete();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete prompt";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
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
        {status === PromptStatusEnum.PENDING
          ? "Manual"
          : status === PromptStatusEnum.PROCESSED
          ? "Random"
          : "Failed"}
      </Badge>
    );
  };

  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Prompts Management</Title>
        <Button
          variant="light"
          leftSection={<IconPlus size="1rem" />}
          onClick={handleCreate}
        >
          Create Prompt
        </Button>
      </Group>

      <Group justify="apart" mb="md">
        <TextInput
          placeholder="Search prompts..."
          leftSection={<IconSearch size="1rem" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </Group>

      <Card shadow="sm" p="lg" mb="md">
        <MantineTable highlightOnHover striped>
          <MantineTable.Thead>
            <MantineTable.Tr>
              <MantineTable.Th>Title</MantineTable.Th>
              <MantineTable.Th>Content</MantineTable.Th>
              <MantineTable.Th>Question</MantineTable.Th>
              <MantineTable.Th miw="100px">Status</MantineTable.Th>
              <MantineTable.Th ta="center" miw="100px">
                Actions
              </MantineTable.Th>
            </MantineTable.Tr>
          </MantineTable.Thead>
          <MantineTable.Tbody>
            {loading ? (
              <MantineTable.Tr>
                <MantineTable.Td colSpan={5} align="center">
                  Loading...
                </MantineTable.Td>
              </MantineTable.Tr>
            ) : filteredPrompts.length === 0 ? (
              <MantineTable.Tr>
                <MantineTable.Td colSpan={5} align="center">
                  No prompts found
                </MantineTable.Td>
              </MantineTable.Tr>
            ) : (
              filteredPrompts.map((prompt) => (
                <MantineTable.Tr key={prompt.id}>
                  <MantineTable.Td>{prompt.title}</MantineTable.Td>
                  <MantineTable.Td>{prompt.content}</MantineTable.Td>
                  <MantineTable.Td>{prompt.question}</MantineTable.Td>
                  <MantineTable.Td>
                    {renderStatusBadge(prompt.status)}
                  </MantineTable.Td>
                  <MantineTable.Td>
                    <Group justify="center">
                      <ActionIcon
                        color="blue"
                        variant="light"
                        onClick={() => handleEdit(prompt)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => {
                          setPromptToDelete({
                            id: prompt.id,
                            title: prompt.title,
                          });
                          openDelete();
                        }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
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
        <form
          onSubmit={form.onSubmit(handleSubmit, (validationErrors) => {
            console.log("Validation errors:", validationErrors);
            notifications.show({
              title: "Validation Error",
              message: "Please check the form for errors",
              color: "red",
            });
          })}
        >
          <Stack>
            <TextInput
              label="Name"
              placeholder="Enter prompt name"
              required
              {...form.getInputProps("title")}
            />
            <Textarea
              label="Content"
              placeholder="Enter prompt content"
              required
              minRows={3}
              {...form.getInputProps("content")}
            />
            <Textarea
              label="Question"
              placeholder="Enter prompt question"
              required
              minRows={3}
              {...form.getInputProps("question")}
            />
            <Select
              label="Status"
              placeholder="Select prompt type"
              data={[
                { value: PromptStatusEnum.PENDING, label: "Manual" },
                { value: PromptStatusEnum.PROCESSED, label: "Random" },
                // { value: PromptStatusEnum.FAILED, label: "Failed" },
              ]}
              required
              {...form.getInputProps("status")}
            />
            {/* <Select
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
            /> */}

            <Button type="submit" mt="md">
              {selectedPrompt ? "Update Prompt" : "Create Prompt"}
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="Delete Prompt"
        centered
      >
        <Text>
          Are you sure you want to delete the prompt{" "}
          {promptToDelete?.title ? `"${promptToDelete.title}"` : ""}?
          <br />
          And when you delete a reminder, all responses to that reminder are
          deleted. This action cannot be undone.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="outline" color="gray" onClick={closeDelete}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              if (promptToDelete?.id) {
                handleDelete(promptToDelete.id);
              }
            }}
          >
            Confirm Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
}
