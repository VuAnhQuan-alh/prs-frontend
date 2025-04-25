"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Container, Text, Title, Group } from "@mantine/core";
import { authService } from "@/lib/api/services";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (authService.isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleGetStarted = () => {
    router.push("/auth/login");
  };

  return (
    <Container
      size="md"
      className="h-screen flex flex-col items-center justify-center text-center"
    >
      <Title order={1} size="2.5rem" mb="md">
        PRS - Prompt and Response System
      </Title>
      <Text mb="xl" size="lg" c="dimmed" className="max-w-2xl">
        A comprehensive system for managing customer interactions through
        automated prompts and responses, with powerful tools for table
        management, session tracking, and real-time service requests.
      </Text>
      <Group justify="center" mt="xl">
        <Button size="lg" onClick={handleGetStarted}>
          Get Started
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push("/auth/register")}
        >
          Create an Account
        </Button>
      </Group>
    </Container>
  );
}
