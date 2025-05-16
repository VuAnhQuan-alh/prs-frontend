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
  Switch,
  Pagination,
  PasswordInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconUserCheck,
  IconUsers,
} from "@tabler/icons-react";
import { format } from "date-fns";
import {
  User,
  UpdateUserRequest,
  CreateUserRequest,
  UserFilters,
} from "@/lib/api/types/users";
import { Role } from "@/lib/api/types/auth";
import { userService } from "@/lib/api/services/user-service";
import { useAccessControl } from "@/contexts/AccessControlContext";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const { currentUser } = useAccessControl();

  const createForm = useForm<CreateUserRequest>({
    initialValues: {
      email: "",
      name: "",
      firstName: "",
      lastName: "",
      password: "",
      role: Role.USER,
      isActive: true,
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      name: (value) =>
        value.length < 2 ? "Name must be at least 2 characters" : null,
      password: (value) => {
        if (value.length < 8) return "Password must be at least 8 characters";
        // if (!/[A-Z]/.test(value))
        //   return "Password must contain at least one uppercase letter";
        // if (!/[a-z]/.test(value))
        //   return "Password must contain at least one lowercase letter";
        // if (!/[0-9]/.test(value))
        //   return "Password must contain at least one number";
        if (!/[^A-Za-z0-9]/.test(value))
          return "Password must contain at least one special character";
        return null;
      },
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
      isActive: true,
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

    mode: "controlled",
  });

  // Fetch users on component mount and when active tab, page, or page size changes
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, pageSize]);

  // Function to fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      let filters: UserFilters = {
        page: currentPage,
        limit: pageSize,
      };

      if (activeTab !== "all" && activeTab) {
        filters = {
          ...filters,
          role: activeTab as Role,
        };
      }

      const data = await userService.getAll(filters);
      setUsers(data.docs);
      setTotalItems(data.total);
      setTotalPages(Math.ceil(data.total / pageSize));
    } catch (error) {
      console.error("Failed to fetch users:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load users";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // When search query changes, reset to first page and apply search
  useEffect(() => {
    if (searchQuery) {
      setCurrentPage(1);
    }
  }, [searchQuery]);

  // Filter users based on search query (client-side filtering for the current page)
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
      // Validate form before submission
      const validationErrors = createForm.validate();
      if (validationErrors.hasErrors) {
        return; // Stop submission if there are errors
      }

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
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create user";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    }
  };

  // Handle edit form submit
  const handleEditSubmit = async (values: UpdateUserRequest) => {
    if (!selectedUser) return;

    // Validate form before submission
    const validationErrors = editForm.validate();
    if (validationErrors.hasErrors) {
      return; // Stop submission if there are errors
    }

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
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update user";
      notifications.show({
        title: "Error",
        message: errorMessage,
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
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete user";
      notifications.show({
        title: "Error",
        message: errorMessage,
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
      isActive: user.isActive,
      // Don't set password as it shouldn't be pre-filled
    });
    setEditModalOpen(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  // Function to render service request status badge
  const renderRoleBadge = (role: Role) => {
    const colorMap: Record<Role, string> = {
      [Role.ADMIN]: "red",
      [Role.TABLE]: "yellow",
      [Role.USER]: "green",
    };

    return (
      <Badge color={colorMap[role]} variant="filled">
        {role === Role.ADMIN
          ? "Admin"
          : role === Role.TABLE
          ? "Table Admin"
          : "FSR"}
      </Badge>
    );
  };

  return (
    <>
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>Users Management</Title>
        <Button
          variant="light"
          leftSection={<IconPlus size="1rem" />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create User
        </Button>
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
              value={Role.TABLE}
              leftSection={<IconUserCheck size="0.8rem" />}
            >
              Table Admins
            </Tabs.Tab>
            <Tabs.Tab
              value={Role.USER}
              leftSection={<IconUserCheck size="0.8rem" />}
            >
              FSR
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
                <Table.Th ta="center">Role</Table.Th>
                <Table.Th>Active</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th ta="center">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredUsers.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} align="center">
                    No users found
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
                    <Table.Td ta="center">
                      {renderRoleBadge(user.role)}
                    </Table.Td>
                    <Table.Td>
                      <Switch
                        checked={user.isActive}
                        disabled={
                          currentUser?.role !== user.role &&
                          currentUser?.role !== Role.ADMIN
                        }
                        onChange={() => {
                          // Handle switch change if needed
                          const newIsActive = !user.isActive;
                          userService
                            .update(user.id, { isActive: newIsActive })
                            .then(() => {
                              notifications.show({
                                title: "Success",
                                message: `User ${
                                  newIsActive ? "activated" : "deactivated"
                                } successfully`,
                                color: "green",
                              });
                              setUsers((prev) =>
                                prev.map((u) =>
                                  u.id === user.id
                                    ? { ...u, isActive: newIsActive }
                                    : u
                                )
                              );
                            })
                            .catch((error) => {
                              console.error(
                                "Failed to update user status:",
                                error
                              );
                              notifications.show({
                                title: "Error",
                                message: "Failed to update user status",
                                color: "red",
                              });
                            });
                        }}
                      />
                    </Table.Td>
                    <Table.Td>
                      {format(new Date(user.createdAt), "MMM dd, yyyy")}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" justify="center">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => openEditModal(user)}
                          disabled={
                            currentUser?.role !== user.role &&
                            currentUser?.role !== Role.ADMIN
                          }
                        >
                          <IconEdit size="1rem" />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => openDeleteModal(user)}
                          disabled={
                            currentUser?.role !== user.role &&
                            currentUser?.role !== Role.ADMIN
                          }
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

          {/* Pagination - only show if there's data and potentially more than one page */}
          {users.length > 0 && (
            <Group justify="space-between" mt="md">
              <Text size="sm" c="dimmed">
                Showing {users.length} of {totalItems} users
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
                  onChange={setCurrentPage}
                  total={totalPages}
                  size="sm"
                  withEdges
                />
              </Group>
            </Group>
          )}
        </Box>
      </Card>

      {/* Create User Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New User"
        size="md"
      >
        <form
          onSubmit={createForm.onSubmit(
            handleCreateSubmit,
            (validationErrors) => {
              console.log("Validation errors:", validationErrors);
              notifications.show({
                title: "Validation Error",
                message: "Please check the form for errors",
                color: "red",
              });
            }
          )}
        >
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
            <PasswordInput
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
              data={[
                { value: Role.ADMIN, label: "Admin" },
                { value: Role.TABLE, label: "Table Admin" },
                { value: Role.USER, label: "FSR" },
              ]}
              {...createForm.getInputProps("role")}
            />
            <Switch
              label="Is Active"
              {...createForm.getInputProps("isActive", {
                type: "checkbox",
              })}
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
        <form
          onSubmit={editForm.onSubmit(handleEditSubmit, (validationErrors) => {
            console.log("Validation errors:", validationErrors);
            notifications.show({
              title: "Validation Error",
              message: "Please check the form for errors",
              color: "red",
            });
          })}
        >
          <Stack align="stretch">
            <TextInput
              label="Email"
              placeholder="user@example.com"
              required
              {...editForm.getInputProps("email")}
            />
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              required
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
            <PasswordInput
              label="Password"
              placeholder="Leave blank to keep current password"
              type="password"
              {...editForm.getInputProps("password")}
            />
            <Select
              label="Role"
              placeholder="Select role"
              required
              readOnly
              data={[
                { value: Role.ADMIN, label: "Admin" },
                { value: Role.TABLE, label: "Table Admin" },
                { value: Role.USER, label: "FSR" },
              ]}
              {...createForm.getInputProps("role")}
            />
            <Switch
              label="Is Active"
              {...editForm.getInputProps("isActive", {
                type: "checkbox",
              })}
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
    </>
  );
}
