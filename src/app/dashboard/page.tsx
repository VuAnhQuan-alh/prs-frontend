"use client";

import { useState, useEffect } from "react";
import {
  Title,
  Grid,
  Paper,
  Text,
  Stack,
  Group,
  Button,
  // Card,
  Table,
  Badge,
  RingProgress,
  Center,
  SimpleGrid,
  ThemeIcon,
  rem,
} from "@mantine/core";
import {
  IconUsers,
  IconTable,
  // IconClipboardText,
  IconMessageDots,
  IconBell,
  IconArrowUp,
  IconArrowDown,
  IconCheck,
  // IconFileReport,
} from "@tabler/icons-react";
import { dashboardService, serviceRequestService } from "@/lib/api/services";
import {
  ServiceRequestStatus,
  ServiceRequest,
} from "@/lib/api/types/service-requests";
import { format } from "date-fns";
import Link from "next/link";
import { IDashboard } from "@/lib/api/types/dashboards";

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
  diff?: number;
}

function StatsCard({ title, value, icon, description, diff }: StatsCardProps) {
  return (
    <Paper radius="md" withBorder p="md" mih={150}>
      <Group justify="space-between">
        <Text size="xs" fw={700} c="dimmed">
          {title}
        </Text>
        <ThemeIcon size={40} radius="md" variant="light">
          {icon}
        </ThemeIcon>
      </Group>

      <Title order={2} fw={700} my="sm">
        {value}
      </Title>

      {description && (
        <Group align="center" gap="xs" pos="absolute" bottom="md" left="md">
          {diff && (
            <ThemeIcon
              color={diff > 0 ? "green" : "red"}
              size="sm"
              radius="sm"
              variant="filled"
            >
              {diff > 0 ? (
                <IconArrowUp size={rem(14)} />
              ) : (
                <IconArrowDown size={rem(14)} />
              )}
            </ThemeIcon>
          )}
          <Text
            c={
              diff && diff > 0
                ? "teal.7"
                : diff && diff < 0
                ? "red.7"
                : "dimmed"
            }
            fz="sm"
            fw={500}
          >
            {diff ? `${Math.abs(diff)}%` : ""} {description}
          </Text>
        </Group>
      )}
    </Paper>
  );
}

export default function Dashboard() {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<IDashboard | null>(null);

  // Mock statistics distribution for the ring progress
  const serviceRequestsStats = [
    { status: "Open", color: "red", value: 25 },
    { status: "In Progress", color: "yellow", value: 45 },
    { status: "Resolved", color: "green", value: 30 },
  ];

  // Fetch service requests on component mount
  useEffect(() => {
    fetchServiceRequests();
    fetchDashboardStats();
  }, []);

  // Function to fetch statistics from API
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getStatistics();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch service requests from API
  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      // Get only the latest 5 open service requests
      const data = await serviceRequestService.getAll({
        status: ServiceRequestStatus.OPEN,
        // limit: 5,
        // sort: "createdAt:desc",
      });
      setServiceRequests(data);
    } catch (error) {
      console.error("Failed to fetch service requests:", error);
    } finally {
      setLoading(false);
    }
  };

  // Render service request status badge
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

  return (
    <>
      <Title order={1} mb={30}>
        Dashboard
      </Title>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb={30} spacing="md">
        <StatsCard
          title="ACTIVE USERS"
          value={stats ? stats.activeSessions.count.toString() : "0"}
          icon={<IconUsers size="1.5rem" stroke={1.5} />}
          description="compared to last week"
          diff={stats ? stats.activeSessions.percentChange : 0}
        />
        <StatsCard
          title="ACTIVE TABLES"
          value={
            stats
              ? stats.activeTablesWithMultipleSessions.count.toString()
              : "0"
          }
          icon={<IconTable size="1.5rem" stroke={1.5} />}
          description="in service now"
        />
        <StatsCard
          title="ACTIVE PROMPTS"
          value={stats ? stats.prompts.count.toString() : "0"}
          icon={<IconMessageDots size="1.5rem" stroke={1.5} />}
          description="deployed in system"
        />
        <StatsCard
          title="SERVICE REQUESTS"
          value={stats ? stats.serviceRequests.count.toString() : "0"}
          icon={<IconBell size="1.5rem" stroke={1.5} />}
          description="require attention"
          diff={stats ? stats.serviceRequests.percentChange : 0}
        />
      </SimpleGrid>

      {/* Main content sections */}
      <Grid gutter="md">
        {/* Service Requests Section */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper radius="md" withBorder p="md">
            <Group justify="space-between" mb="md">
              <Title order={3}>Recent Service Requests</Title>
              <Button variant="light" component={Link} href="/service-requests">
                View All
              </Button>
            </Group>

            <Table highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Created</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {loading ? (
                  <Table.Tr>
                    <Table.Td colSpan={4} align="center">
                      Loading...
                    </Table.Td>
                  </Table.Tr>
                ) : serviceRequests.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={4} align="center">
                      No open service requests
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  serviceRequests.map((request) => (
                    <Table.Tr key={request.id}>
                      <Table.Td>{request.type.replace("_", " ")}</Table.Td>
                      <Table.Td>
                        {request.description.substring(0, 40)}...
                      </Table.Td>
                      <Table.Td>{renderStatusBadge(request.status)}</Table.Td>
                      <Table.Td>
                        {format(new Date(request.createdAt), "MMM dd, HH:mm")}
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Grid.Col>

        {/* Service Requests Stats */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper radius="md" withBorder p="md" h="100%">
            <Stack align="center" justify="center" h="100%">
              <Title order={3} mb="md">
                Service Request Status
              </Title>
              <RingProgress
                size={200}
                thickness={20}
                roundCaps
                sections={serviceRequestsStats.map((item) => ({
                  value: item.value,
                  color: item.color,
                  tooltip: `${item.status}: ${item.value}%`,
                }))}
                label={
                  <Center>
                    <ThemeIcon
                      color="teal"
                      variant="light"
                      radius="xl"
                      size="xl"
                    >
                      <IconCheck style={{ width: rem(22), height: rem(22) }} />
                    </ThemeIcon>
                  </Center>
                }
              />
              <Group mt="md">
                {serviceRequestsStats.map((stat) => (
                  <Group key={stat.status} gap={8}>
                    <Badge color={stat.color} variant="dot" size="lg">
                      {stat.status}: {stat.value}%
                    </Badge>
                  </Group>
                ))}
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Quick Actions */}
        {/* <Grid.Col span={12}>
          <Paper radius="md" withBorder p="md">
            <Title order={3} mb="md">
              Quick Actions
            </Title>
            <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="md">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section bg="blue.0" py="md">
                  <Center>
                    <ThemeIcon size="xl" radius="md" color="blue">
                      <IconTable size="1.5rem" />
                    </ThemeIcon>
                  </Center>
                </Card.Section>
                <Text fw={500} size="sm" mt="md" ta="center">
                  Manage Tables
                </Text>
                <Button
                  variant="light"
                  fullWidth
                  mt="md"
                  component={Link}
                  href="/tables"
                >
                  Go
                </Button>
              </Card>

              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section bg="green.0" py="md">
                  <Center>
                    <ThemeIcon size="xl" radius="md" color="green">
                      <IconClipboardText size="1.5rem" />
                    </ThemeIcon>
                  </Center>
                </Card.Section>
                <Text fw={500} size="sm" mt="md" ta="center">
                  Active Sessions
                </Text>
                <Button
                  variant="light"
                  fullWidth
                  mt="md"
                  color="green"
                  component={Link}
                  href="/sessions"
                >
                  Go
                </Button>
              </Card>

              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section bg="orange.0" py="md">
                  <Center>
                    <ThemeIcon size="xl" radius="md" color="orange">
                      <IconMessageDots size="1.5rem" />
                    </ThemeIcon>
                  </Center>
                </Card.Section>
                <Text fw={500} size="sm" mt="md" ta="center">
                  Manage Prompts
                </Text>
                <Button
                  variant="light"
                  fullWidth
                  mt="md"
                  color="orange"
                  component={Link}
                  href="/prompts"
                >
                  Go
                </Button>
              </Card>

              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section bg="red.0" py="md">
                  <Center>
                    <ThemeIcon size="xl" radius="md" color="red">
                      <IconBell size="1.5rem" />
                    </ThemeIcon>
                  </Center>
                </Card.Section>
                <Text fw={500} size="sm" mt="md" ta="center">
                  Service Requests
                </Text>
                <Button
                  variant="light"
                  fullWidth
                  mt="md"
                  color="red"
                  component={Link}
                  href="/service-requests"
                >
                  Go
                </Button>
              </Card>

              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section bg="violet.0" py="md">
                  <Center>
                    <ThemeIcon size="xl" radius="md" color="violet">
                      <IconUsers size="1.5rem" />
                    </ThemeIcon>
                  </Center>
                </Card.Section>
                <Text fw={500} size="sm" mt="md" ta="center">
                  Manage Users
                </Text>
                <Button
                  variant="light"
                  fullWidth
                  mt="md"
                  color="violet"
                  component={Link}
                  href="/users"
                >
                  Go
                </Button>
              </Card>

              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section bg="gray.0" py="md">
                  <Center>
                    <ThemeIcon size="xl" radius="md" color="gray">
                      <IconFileReport size="1.5rem" />
                    </ThemeIcon>
                  </Center>
                </Card.Section>
                <Text fw={500} size="sm" mt="md" ta="center">
                  View Reports
                </Text>
                <Button
                  variant="light"
                  fullWidth
                  mt="md"
                  color="gray"
                  component={Link}
                  href="/reports"
                >
                  Go
                </Button>
              </Card>
            </SimpleGrid>
          </Paper>
        </Grid.Col> */}
      </Grid>
    </>
  );
}
