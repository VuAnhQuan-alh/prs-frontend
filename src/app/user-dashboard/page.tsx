"use client";

import { useState } from "react";
import {
  Title,
  Text,
  Paper,
  SimpleGrid,
  Card,
  Group,
  Badge,
  RingProgress,
  Center,
  Stack,
} from "@mantine/core";
import { IconArmchair, IconMessage, IconTicket } from "@tabler/icons-react";
import { useAccessControl } from "@/contexts/AccessControlContext";

export default function UserDashboardPage() {
  const { currentUser: user } = useAccessControl();
  const [stats] = useState({
    totalResponses: 0,
    pendingPrompts: 0,
    serviceRequests: 0,
    seatAssigned: false,
    tableNumber: null,
    seatCode: null,
  });

  if (!user) {
    return <Text>Loading...</Text>;
  }

  return (
    <Stack gap="md" p="md">
      <Paper p="md">
        <Title order={2} mb={10}>
          Welcome, {user.name}!
        </Title>
        <Text c="dimmed">
          This is your personal dashboard where you can view your prompts,
          responses, and request services.
        </Text>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        {/* Seat Assignment Card */}
        <Card withBorder padding="lg" radius="md">
          <Group justify="apart">
            <Text fw={500}>Seat Assignment</Text>
            <IconArmchair size={22} stroke={1.5} />
          </Group>
          <Group mt="md">
            <Badge color={stats.seatAssigned ? "green" : "red"}>
              {stats.seatAssigned ? "Assigned" : "Not Assigned"}
            </Badge>
          </Group>
          {stats.seatAssigned ? (
            <Text mt="md">
              You are assigned to Table {stats.tableNumber}, Seat{" "}
              {stats.seatCode}
            </Text>
          ) : (
            <Text mt="md">You need to select a seat to participate</Text>
          )}
        </Card>

        {/* Responses Card */}
        <Card withBorder padding="lg" radius="md">
          <Group justify="apart">
            <Text fw={500}>Prompts & Responses</Text>
            <IconMessage size={22} stroke={1.5} />
          </Group>
          <Group mt="md" justify="center">
            <RingProgress
              sections={[
                { value: stats.totalResponses * 10, color: "blue" },
                { value: stats.pendingPrompts * 10, color: "orange" },
              ]}
              label={
                <Center>
                  <Text fw={700} ta="center" size="xl">
                    {stats.totalResponses}
                  </Text>
                </Center>
              }
            />
          </Group>
          <Group justify="apart" mt="md">
            <Text>Answered prompts</Text>
            <Text fw={500}>{stats.totalResponses}</Text>
          </Group>
          <Group justify="apart" mt={5}>
            <Text>Pending prompts</Text>
            <Text fw={500}>{stats.pendingPrompts}</Text>
          </Group>
        </Card>

        {/* Service Requests Card */}
        <Card withBorder padding="lg" radius="md">
          <Group justify="apart">
            <Text fw={500}>Service Requests</Text>
            <IconTicket size={22} stroke={1.5} />
          </Group>
          <Text mt="md" size="lg" ta="center" fw={700}>
            {stats.serviceRequests}
          </Text>
          <Text ta="center" c="dimmed">
            Active requests
          </Text>
          <Group justify="apart" mt="xl">
            <Badge color="green">Available</Badge>
            <Text>Assistance available</Text>
          </Group>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
