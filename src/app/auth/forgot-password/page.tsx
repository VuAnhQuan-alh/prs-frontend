"use client";

// import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { authService } from "@/lib/api/services/auth-service";
import { Box, Button, Paper, Text, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: "",
    },
    validate: {
      email: (value) => (!value ? "Email is required" : null),
    },
  });

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      await authService.forgotPassword(values.email);
      notifications.show({
        title: "Reset link sent",
        message:
          "If the email exists, password reset instructions have been sent.",
        color: "green",
        autoClose: false,
      });
      form.reset();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      notifications.show({
        title: "Error",
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
          Forgot Password
        </Title>
        <Text ta="center" c="#454C50" size="lg" fw={500} mb="xl">
          Enter your email to receive reset instructions
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)} autoComplete="off">
          <TextInput
            label="Email"
            placeholder="Your email"
            required
            mb="xl"
            {...form.getInputProps("email")}
          />

          <Button fullWidth type="submit" loading={loading}>
            Send Reset Link
          </Button>
        </form>

        <Text c="dimmed" size="sm" ta="center" mt="md">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-blue-500 hover:underline">
            Back to login
          </Link>
        </Text>
      </Paper>
    </Box>
  );
}
