"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import {
  responseService,
  sessionService,
  serviceRequestService,
} from "@/lib/api/services";
import { Response, ResponseStats } from "@/lib/api/types/responses";
import { ServiceRequestStatus } from "@/lib/api/types/service-requests";
import {
  Title,
  Grid,
  Card,
  Text,
  RingProgress,
  Group,
  Stack,
  Select,
  Button,
  Divider,
  Paper,
  SimpleGrid,
  Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { DatePickerInput } from "@mantine/dates";

export default function ReportsPage() {
  const [responseStats, setResponseStats] = useState<ResponseStats | null>(
    null
  );
  const [serviceRequestStats, setServiceRequestStats] = useState<{
    open: number;
    inProgress: number;
    resolved: number;
    cancelled: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    new Date(new Date().setDate(new Date().getDate() - 30)), // Default 30 days ago
    new Date(),
  ]);

  // Fetch stats on component mount
  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  // Function to fetch stats from API
  const fetchStats = async () => {
    try {
      setLoading(true);

      // Set up date filters if available
      const filters: any = {};
      if (dateRange[0] && dateRange[1]) {
        filters.timestampFrom = dateRange[0].toISOString();
        filters.timestampTo = dateRange[1].toISOString();
      }

      // Fetch response stats
      const responseStatsData = await responseService.getStats(filters);
      setResponseStats(responseStatsData);

      // Fetch service request stats by querying each status
      const openRequests = await serviceRequestService.getAll({
        status: ServiceRequestStatus.OPEN,
        createdAtFrom: filters.timestampFrom,
        createdAtTo: filters.timestampTo,
      });

      const inProgressRequests = await serviceRequestService.getAll({
        status: ServiceRequestStatus.IN_PROGRESS,
        createdAtFrom: filters.timestampFrom,
        createdAtTo: filters.timestampTo,
      });

      const resolvedRequests = await serviceRequestService.getAll({
        status: ServiceRequestStatus.RESOLVED,
        createdAtFrom: filters.timestampFrom,
        createdAtTo: filters.timestampTo,
      });

      const cancelledRequests = await serviceRequestService.getAll({
        status: ServiceRequestStatus.CANCELLED,
        createdAtFrom: filters.timestampFrom,
        createdAtTo: filters.timestampTo,
      });

      setServiceRequestStats({
        open: openRequests.length,
        inProgress: inProgressRequests.length,
        resolved: resolvedRequests.length,
        cancelled: cancelledRequests.length,
        total:
          openRequests.length +
          inProgressRequests.length +
          resolvedRequests.length +
          cancelledRequests.length,
      });
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to load statistics",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle date range change
  const handleDateChange = (dates: [Date | null, Date | null]) => {
    setDateRange(dates);
  };

  // Calculate completion rate for service requests
  const getServiceRequestCompletionRate = () => {
    if (!serviceRequestStats || serviceRequestStats.total === 0) return 0;
    return Math.round(
      (serviceRequestStats.resolved / serviceRequestStats.total) * 100
    );
  };

  // Format dates for display
  const formatDateRange = () => {
    if (dateRange[0] && dateRange[1]) {
      return `${dateRange[0].toLocaleDateString()} to ${dateRange[1].toLocaleDateString()}`;
    }
    return "All time";
  };

  return (
    <DashboardLayout>
      <Group justify="space-between" mb="lg">
        <Title order={1}>Reports & Analytics</Title>
        <DatePickerInput
          type="range"
          label="Date Range"
          placeholder="Filter by date range"
          value={dateRange}
          onChange={handleDateChange}
          clearable
          maxDate={new Date()}
        />
      </Group>

      <Text c="dimmed" mb="xl">
        Viewing data for: {formatDateRange()}
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mb="xl">
        <Card withBorder p="md" radius="md">
          <Text size="lg" fw={700} mb="xs">
            Total Responses
          </Text>
          <Group>
            <div>
              <Text size="xl" fw={700}>
                {responseStats?.totalResponses || 0}
              </Text>
              <Text size="xs" c="dimmed">
                Responses Collected
              </Text>
            </div>
          </Group>
        </Card>

        <Card withBorder p="md" radius="md">
          <Text size="lg" fw={700} mb="xs">
            Response Rate
          </Text>
          <Group align="center">
            <RingProgress
              size={80}
              roundCaps
              thickness={8}
              sections={[{ value: 100, color: "gray" }]}
              label={
                <Text fw={700} ta="center" size="lg">
                  N/A
                </Text>
              }
            />
            <div>
              <Text>Not enough data to calculate response rate.</Text>
            </div>
          </Group>
        </Card>

        <Card withBorder p="md" radius="md">
          <Text size="lg" fw={700} mb="xs">
            Avg. Response Time
          </Text>
          <Group>
            <div>
              <Text size="xl" fw={700}>
                {responseStats?.averageResponseTime
                  ? `${responseStats.averageResponseTime.toFixed(2)}s`
                  : "N/A"}
              </Text>
              <Text size="xs" c="dimmed">
                Average time to respond
              </Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Card withBorder p="md" radius="md">
          <Text size="lg" fw={700} mb="md">
            Service Request Status
          </Text>
          {loading ? (
            <Text>Loading...</Text>
          ) : serviceRequestStats ? (
            <>
              <Group align="center" mb="md">
                <RingProgress
                  size={180}
                  thickness={16}
                  roundCaps
                  sections={[
                    {
                      value:
                        (serviceRequestStats.resolved /
                          Math.max(1, serviceRequestStats.total)) *
                        100,
                      color: "green",
                    },
                    {
                      value:
                        (serviceRequestStats.inProgress /
                          Math.max(1, serviceRequestStats.total)) *
                        100,
                      color: "orange",
                    },
                    {
                      value:
                        (serviceRequestStats.open /
                          Math.max(1, serviceRequestStats.total)) *
                        100,
                      color: "red",
                    },
                    {
                      value:
                        (serviceRequestStats.cancelled /
                          Math.max(1, serviceRequestStats.total)) *
                        100,
                      color: "gray",
                    },
                  ]}
                  label={
                    <Text fw={700} ta="center" size="xl">
                      {serviceRequestStats.total}
                    </Text>
                  }
                />
                <Stack gap="xs">
                  <Group>
                    <Box
                      w={16}
                      h={16}
                      style={{
                        background: "var(--mantine-color-green-6)",
                        borderRadius: "4px",
                      }}
                    />
                    <Text>Resolved ({serviceRequestStats.resolved})</Text>
                  </Group>
                  <Group>
                    <Box
                      w={16}
                      h={16}
                      style={{
                        background: "var(--mantine-color-orange-6)",
                        borderRadius: "4px",
                      }}
                    />
                    <Text>In Progress ({serviceRequestStats.inProgress})</Text>
                  </Group>
                  <Group>
                    <Box
                      w={16}
                      h={16}
                      style={{
                        background: "var(--mantine-color-red-6)",
                        borderRadius: "4px",
                      }}
                    />
                    <Text>Open ({serviceRequestStats.open})</Text>
                  </Group>
                  <Group>
                    <Box
                      w={16}
                      h={16}
                      style={{
                        background: "var(--mantine-color-gray-6)",
                        borderRadius: "4px",
                      }}
                    />
                    <Text>Cancelled ({serviceRequestStats.cancelled})</Text>
                  </Group>
                </Stack>
              </Group>
              <Divider mb="md" />
              <Group justify="space-between">
                <Text>Completion rate:</Text>
                <Text fw={700}>{getServiceRequestCompletionRate()}%</Text>
              </Group>
            </>
          ) : (
            <Text>No service request data available</Text>
          )}
        </Card>

        <Card withBorder p="md" radius="md">
          <Text size="lg" fw={700} mb="md">
            Popular Prompts
          </Text>
          {loading ? (
            <Text>Loading...</Text>
          ) : responseStats?.responsesByPrompt &&
            responseStats.responsesByPrompt.length > 0 ? (
            <Stack gap="sm">
              {responseStats.responsesByPrompt
                .slice(0, 5)
                .map((item, index) => (
                  <Paper p="xs" withBorder key={item.promptId}>
                    <Group justify="space-between">
                      <div>
                        <Text fw={500}>
                          {item.promptTitle || `Prompt ${index + 1}`}
                        </Text>
                        <Text size="xs" c="dimmed">
                          ID: {item.promptId}
                        </Text>
                      </div>
                      <Text fw={700}>{item.count} responses</Text>
                    </Group>
                  </Paper>
                ))}
            </Stack>
          ) : (
            <Text>No prompt data available</Text>
          )}
        </Card>
      </SimpleGrid>

      <Card withBorder p="md" radius="md" mt="xl">
        <Text size="lg" fw={700} mb="md">
          Response Activity by Session
        </Text>
        {loading ? (
          <Text>Loading...</Text>
        ) : responseStats?.responsesBySession &&
          responseStats.responsesBySession.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            {responseStats.responsesBySession.slice(0, 6).map((item) => (
              <Paper p="md" withBorder key={item.sessionId}>
                <Text fw={500}>Session ID: {item.sessionId}</Text>
                <Text size="lg" fw={700} mt="xs">
                  {item.count} responses
                </Text>
              </Paper>
            ))}
          </SimpleGrid>
        ) : (
          <Text>No session activity data available</Text>
        )}
      </Card>
    </DashboardLayout>
  );
}
