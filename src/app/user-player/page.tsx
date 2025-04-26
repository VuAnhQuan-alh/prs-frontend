"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  Text,
  Group,
  Title,
  Container,
  Paper,
  Flex,
  Badge,
  Divider,
} from "@mantine/core";
import { IconBell, IconRefresh, IconLogout } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";

type ResponseOption = "YES" | "NO" | "SERVICE";

export default function UserPlayerPage() {
  const router = useRouter();

  // User and Session states
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPrompt, setCurrentPrompt] = useState<any | null>(null);
  const [selectedResponse, setSelectedResponse] =
    useState<ResponseOption | null>(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connected" | "connecting" | "disconnected"
  >("connecting");

  // Mock function to simulate getting user data - in a real app, this would come from authentication
  useEffect(() => {
    // Simulating retrieving the logged in user
    const mockUser = {
      id: "usr-12345",
      firstName: "John",
      lastName: "Player",
      tableNumber: 1,
      seatCode: "A2",
      currentSeat: {
        id: "seat-123",
        tableId: 1,
        code: "A2",
        status: "OCCUPIED",
      },
    };

    setUser(mockUser);
    setLoading(false);
  }, []);

  // Fetch the latest prompt for this player
  const fetchCurrentPrompt = async () => {
    try {
      if (!user?.tableNumber) return;

      // In a real implementation, we would fetch prompts for this table using an API call
      // For now, we'll simulate with mock data
      const mockPrompt = {
        id: "prompt-123",
        content: "Would you like to see the dessert menu?",
        status: "ACTIVE",
        tableId: user.tableNumber,
        createdAt: new Date().toISOString(),
      };

      setCurrentPrompt(mockPrompt);
      setSelectedResponse(null);
      setHasResponded(false);
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load prompts. Please try again.",
        color: "red",
      });
    }
  };

  useEffect(() => {
    if (user?.tableNumber) {
      fetchCurrentPrompt();

      // In a real app, we would set up real-time connections here
      const timer = setTimeout(() => setRealtimeStatus("connected"), 1500);

      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleResponse = async (response: ResponseOption) => {
    if (!currentPrompt || !user) return;

    try {
      setSelectedResponse(response);

      if (response === "SERVICE") {
        // Create a service request - in real implementation, call the API
        // For now, just simulate success
        // await serviceRequestService.create({
        //   description: 'Service request from seat ' + user.seatCode,
        //   type: ServiceRequestType.ASSISTANCE,
        //   seatId: user.seatCode,
        //   tableId: user.tableNumber,
        //   status: 'PENDING',
        // });

        notifications.show({
          title: "Service Request Submitted",
          message: "Your service request has been sent to staff.",
          color: "blue",
        });
      } else {
        // Record the yes/no response - in real implementation, call the API
        // For now, just simulate success
        // await serviceResponseService.create({
        //   promptId: currentPrompt.id,
        //   seatId: user.seatCode,
        //   content: response,
        //   tableId: user.tableNumber,
        // });

        setHasResponded(true);

        notifications.show({
          title: "Response Recorded",
          message: "Thank you for your response.",
          color: "green",
        });
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      notifications.show({
        title: "Error",
        message: "Failed to submit response. Please try again.",
        color: "red",
      });
    }
  };

  const handleManualRefresh = async () => {
    notifications.show({
      title: "Refreshing...",
      message: "Fetching the latest data from the server.",
    });
    await fetchCurrentPrompt();
  };

  const handleLogout = () => {
    notifications.show({
      title: "Logging out",
      message: "You have been signed out.",
    });
    router.push("/auth");
  };

  if (loading) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Text>Loading...</Text>
      </Flex>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <header
        style={{
          padding: "1rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          backgroundColor: "#fff",
        }}
      >
        <Container size="xl">
          <Flex justify="space-between" align="center">
            <div>
              <Title order={4}>PRS Player Interface</Title>
              <Text size="sm" c="dimmed">
                Table {user?.tableNumber}, Seat {user?.seatCode}
              </Text>
            </div>
            <Group>
              <Button
                variant="subtle"
                size="sm"
                leftSection={<IconRefresh size={16} />}
                onClick={handleManualRefresh}
                title="Refresh data"
              >
                Refresh
              </Button>
              <Button
                variant="light"
                size="sm"
                leftSection={<IconLogout size={16} />}
                onClick={handleLogout}
              >
                Exit
              </Button>
            </Group>
          </Flex>
        </Container>
      </header>

      <Container size="md" py="xl">
        {realtimeStatus !== "connected" && (
          <Paper
            mb="md"
            p="md"
            withBorder
            style={{
              borderLeft: `4px solid ${
                realtimeStatus === "connecting" ? "orange" : "red"
              }`,
            }}
          >
            <Group>
              <IconBell
                size={20}
                color={realtimeStatus === "connecting" ? "orange" : "red"}
              />
              <div>
                <Text fw={500}>
                  {realtimeStatus === "connecting"
                    ? "Connecting to server..."
                    : "Disconnected"}
                </Text>
                <Text size="sm" c="dimmed">
                  {realtimeStatus === "connecting"
                    ? "Please wait while we establish a connection."
                    : "Unable to connect to the server. Please check your internet connection."}
                </Text>
              </div>
            </Group>
          </Paper>
        )}

        <Card shadow="sm" mb="lg" p="lg" radius="md" withBorder>
          <Group mb="md">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: "#228be6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: "1.2rem",
              }}
            >
              {user?.firstName?.[0] || "U"}
            </div>
            <div>
              <Text fw={500} size="lg">
                Welcome, {user?.firstName} {user?.lastName}
              </Text>
              <Text size="sm" c="dimmed">
                You are seated at Table {user?.tableNumber}, Seat{" "}
                {user?.seatCode}
              </Text>
            </div>
          </Group>
        </Card>

        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Title order={3} mb="xs">
            Current Prompt
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            Please respond using the buttons below
          </Text>

          <Divider mb="lg" />

          <div
            style={{
              padding: "1.5rem",
              minHeight: "100px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontSize: "1.25rem",
            }}
          >
            {currentPrompt ? (
              <Text>{currentPrompt.content}</Text>
            ) : (
              <Text fs="italic" c="dimmed">
                Waiting for prompt...
              </Text>
            )}
          </div>

          <Flex gap="md" justify="center" mt="xl" mb="md">
            <Button
              size="xl"
              radius="xl"
              color="green"
              variant={selectedResponse === "YES" ? "filled" : "light"}
              onClick={() => handleResponse("YES")}
              disabled={!currentPrompt || hasResponded}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                fontSize: "1.2rem",
              }}
            >
              YES
            </Button>

            <Button
              size="xl"
              radius="xl"
              color="red"
              variant={selectedResponse === "NO" ? "filled" : "light"}
              onClick={() => handleResponse("NO")}
              disabled={!currentPrompt || hasResponded}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                fontSize: "1.2rem",
              }}
            >
              NO
            </Button>

            <Button
              size="xl"
              radius="xl"
              color="yellow"
              variant={selectedResponse === "SERVICE" ? "filled" : "light"}
              onClick={() => handleResponse("SERVICE")}
              disabled={!currentPrompt}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                fontSize: "1.2rem",
              }}
            >
              SERVICE
            </Button>
          </Flex>

          {selectedResponse && (
            <Text ta="center" mt="md" size="sm" c="dimmed">
              {selectedResponse === "SERVICE"
                ? "Service request sent!"
                : "Thank you for your response!"}
            </Text>
          )}
        </Card>
      </Container>
    </div>
  );
}
