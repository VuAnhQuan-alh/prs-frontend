"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authService } from "@/lib/api/services";
import { Role } from "@/lib/api/types/auth";
import {
  Box,
  Button,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => {
        const trimmedValue = value.trim();
        if (!trimmedValue) return "Email is required";
        return null;
      },
      password: (value) => (!value ? "Password is required" : null),
    },
  });

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      // Trim email before sending to API
      const trimmedValues = {
        ...values,
        email: values.email.trim(),
      };
      const auth = await authService.login(trimmedValues);
      notifications.show({
        title: "Login successful",
        message: "You have been logged in successfully.",
        color: "green",
      });
      if (auth.user.role === Role.ADMIN) {
        router.push("/dashboard");
      } else if (auth.user.role === Role.TABLE) {
        router.push("/retable");
      } else if (auth.user.role === Role.USER) {
        router.push("/users");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during login. Please try again.";
      notifications.show({
        title: "Login failed",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      {/* <Image
        src="/images/logo-auth.png"
        width="84"
        height="100"
        alt="logo auth"
      /> */}

      <Paper radius="md" p="xl" className="w-full max-w-md mt-20">
        <Title ta="center" c="#228ED0" order={2} mb="sm">
          Admin Login
        </Title>
        <Text ta="center" c="#454C50" size="lg" fw={500} mb="xl">
          Please sign in to continue
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)} autoComplete="off">
          <TextInput
            label="Email"
            placeholder="Your email"
            required
            mb="sm"
            onBlur={(e) => {
              const trimmedValue = e.target.value.trim();
              if (trimmedValue !== e.target.value) {
                form.setFieldValue("email", trimmedValue);
              }
            }}
            {...form.getInputProps("email")}
          />

          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mb="sm"
            {...form.getInputProps("password")}
          />

          <Box className="flex justify-end mb-4">
            <Link
              href="/auth/forgot-password"
              className="text-blue-500 hover:underline text-sm"
            >
              Forgot password?
            </Link>
          </Box>

          <Button fullWidth type="submit" loading={loading}>
            Sign in
          </Button>
        </form>

        <Text c="dimmed" size="sm" ta="center" mt="md">
          Login with more rule?{" "}
          <Link href="/auth/player" className="text-blue-500 hover:underline">
            Choose another role
          </Link>
        </Text>
      </Paper>
    </Box>
  );
}
