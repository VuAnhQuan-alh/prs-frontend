"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  TextInput,
  Modal,
  Group,
  Select,
  Stack,
  Title,
  Badge,
  Tabs,
  Box,
  Card,
  Text,
  LoadingOverlay,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconUserCheck,
  IconUserX,
  IconUsers,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import {
  User,
  UpdateUserRequest,
  CreateUserRequest,
} from "@/lib/api/types/users";
import { Role } from "@/lib/api/types/auth";
import { userService } from "@/lib/api/services/user-service";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const roleColors: Record<string, string> = {
    [Role.ADMIN]: "red",
    [Role.MANAGER]: "blue",
    [Role.STAFF]: "green",
    [Role.USER]: "gray",
  };

  const createForm = useForm<CreateUserRequest>({
    initialValues: {
      email: "",
      name: "",
      firstName: "",
      lastName: "",
      password: "",
      role: Role.USER,
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      name: (value) =>
        value.length < 2 ? "Name must be at least 2 characters" : null,
      password: (value) =>
        value.length < 6 ? "Password must be at least 6 characters" : null,
    },
  });

  const editForm = useForm<UpdateUserRequest>({
    initialValues: {
      email: "",
      name: "",
      firstName: "",
      lastName: "",
      password: "",
      role: Role.USER,
    },
    validate: {
      email: (value) =>
        value && !/^\S+@\S+$/.test(value) ? "Invalid email" : null,
      name: (value) =>
        value && value.length < 2 ? "Name must be at least 2 characters" : null,
      password: (value) =>
        value && value.length < 6
          ? "Password must be at least 6 characters"
          : null,
    },
  });

  // Fetch users on component mount and when active tab changes
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Function to fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      let filters = {};

      if (activeTab !== "all" && activeTab) {
        filters = {
          role: activeTab,
        };
      }

      const data = await userService.getAll(filters);
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load users",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.firstName?.toLowerCase().includes(query) ?? false) ||
      (user.lastName?.toLowerCase().includes(query) ?? false)
    );
  });

  // Handle create form submit
  const handleCreateSubmit = async (values: CreateUserRequest) => {
    try {
      await userService.create(values);
      notifications.show({
        title: "Success",
        message: "User created successfully",
        color: "green",
      });
      createForm.reset();
      setCreateModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Failed to create user:", error);
      notifications.show({
        title: "Error",
        message: "Failed to create user",
        color: "red",
      });
    }
  };

  // Handle edit form submit
  const handleEditSubmit = async (values: UpdateUserRequest) => {
    if (!selectedUser) return;

    // Create a copy of the values for the API call
    const apiValues = { ...values };

    // Remove password from API request if empty, but keep it in form state
    if (apiValues.password === "") {
      delete apiValues.password;
    }

    try {
      await userService.update(selectedUser.id, apiValues);
      notifications.show({
        title: "Success",
        message: "User updated successfully",
        color: "green",
      });
      editForm.reset();
      setEditModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update user",
        color: "red",
      });
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await userService.delete(selectedUser.id);
      notifications.show({
        title: "Success",
        message: "User deleted successfully",
        color: "green",
      });
      setDeleteModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete user",
        color: "red",
      });
    }
  };

  // Open edit modal with selected user data
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    editForm.setValues({
      email: user.email,
      name: user.name,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role,
      // Don't set password as it shouldn't be pre-filled
    });
    setEditModalOpen(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  return (
    <DashboardLayout>
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>Users Management</Title>
        <Button
          leftSection={<IconPlus size="1rem" />}
          onClick={() => setCreateModalOpen(true)}
        >
          Add User
        </Button>
      </Group>

      <Group justify="apart" mb="md">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="all" leftSection={<IconUsers size="0.8rem" />}>
              All
            </Tabs.Tab>
            <Tabs.Tab
              value={Role.ADMIN}
              leftSection={<IconUserCheck size="0.8rem" />}
            >
              Admins
            </Tabs.Tab>
            <Tabs.Tab
              value={Role.MANAGER}
              leftSection={<IconUserCheck size="0.8rem" />}
            >
              Managers
            </Tabs.Tab>
            <Tabs.Tab
              value={Role.STAFF}
              leftSection={<IconUserCheck size="0.8rem" />}
            >
              Staff
            </Tabs.Tab>
            <Tabs.Tab
              value={Role.USER}
              leftSection={<IconUserX size="0.8rem" />}
            >
              Users
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <TextInput
          placeholder="Search users..."
          leftSection={<IconSearch size="1rem" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </Group>

      <Card shadow="sm" p="lg" mb="md">
        <Box pos="relative">
          <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredUsers.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text style={{ textAlign: "center" }} c="dimmed" py="md">
                      No users found
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredUsers.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Tooltip label={`Full ID: ${user.id}`}>
                        <Text>{user.id.substring(0, 8)}...</Text>
                      </Tooltip>
                    </Table.Td>
                    <Table.Td>{user.name}</Table.Td>
                    <Table.Td>{user.email}</Table.Td>
                    <Table.Td>
                      <Badge color={roleColors[user.role]}>{user.role}</Badge>
                    </Table.Td>
                    <Table.Td>
                      {format(new Date(user.createdAt), "MMM dd, yyyy")}
                    </Table.Td>
                    <Table.Td>
                      <Group>
                        <ActionIcon
                          color="blue"
                          onClick={() => openEditModal(user)}
                        >
                          <IconEdit size="1rem" />
                        </ActionIcon>
                        <ActionIcon
                          color="red"
                          onClick={() => openDeleteModal(user)}
                        >
                          <IconTrash size="1rem" />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </Card>

      {/* Create User Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New User"
        size="md"
      >
        <form onSubmit={createForm.onSubmit(handleCreateSubmit)}>
          <Stack align="stretch">
            <TextInput
              label="Email"
              placeholder="user@example.com"
              required
              {...createForm.getInputProps("email")}
            />
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              required
              {...createForm.getInputProps("name")}
            />
            <Group grow>
              <TextInput
                label="First Name"
                placeholder="John"
                {...createForm.getInputProps("firstName")}
              />
              <TextInput
                label="Last Name"
                placeholder="Doe"
                {...createForm.getInputProps("lastName")}
              />
            </Group>
            <TextInput
              label="Password"
              placeholder="Password"
              type="password"
              required
              {...createForm.getInputProps("password")}
            />
            <Select
              label="Role"
              placeholder="Select role"
              required
              data={Object.values(Role).map((role) => ({
                value: role,
                label: role,
              }))}
              {...createForm.getInputProps("role")}
            />
            <Group justify="right" mt="md">
              <Button
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit User"
        size="md"
      >
        <form onSubmit={editForm.onSubmit(handleEditSubmit)}>
          <Stack align="stretch">
            <TextInput
              label="Email"
              placeholder="user@example.com"
              {...editForm.getInputProps("email")}
            />
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              {...editForm.getInputProps("name")}
            />
            <Group grow>
              <TextInput
                label="First Name"
                placeholder="John"
                {...editForm.getInputProps("firstName")}
              />
              <TextInput
                label="Last Name"
                placeholder="Doe"
                {...editForm.getInputProps("lastName")}
              />
            </Group>
            <TextInput
              label="Password"
              placeholder="Leave blank to keep current password"
              type="password"
              {...editForm.getInputProps("password")}
            />
            <Select
              label="Role"
              placeholder="Select role"
              data={Object.values(Role).map((role) => ({
                value: role,
                label: role,
              }))}
              {...editForm.getInputProps("role")}
            />
            <Group justify="right" mt="md">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete User"
        size="sm"
      >
        <Text mb="md">
          Are you sure you want to delete user &quot;{selectedUser?.name}&quot;?
          This action cannot be undone.
        </Text>
        <Group justify="right">
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteUser}>
            Delete
          </Button>
        </Group>
      </Modal>
    </DashboardLayout>
  );
}
