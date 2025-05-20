"use client";

// import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { authService } from "@/lib/api/services/auth-service";
import {
  Alert,
  Box,
  Button,
  Paper,
  PasswordInput,
  Text,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle } from "@tabler/icons-react";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const form = useForm({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validate: {
      password: (value) =>
        !value
          ? "Password is required"
          : value.length < 6
          ? "Password must be at least 6 characters"
          : null,
      confirmPassword: (value, values) =>
        !value
          ? "Please confirm your password"
          : value !== values.password
          ? "Passwords do not match"
          : null,
    },
  });

  const handleSubmit = async (values: {
    password: string;
    confirmPassword: string;
  }) => {
    setLoading(true);
    try {
      await authService.resetPassword(token, values.password);
      setSuccess(true);
      notifications.show({
        title: "Success",
        message: "Your password has been reset successfully.",
        color: "green",
        autoClose: false,
      });
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
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

  if (!token) {
    return (
      <Box className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        {/* <Image
          src="/images/logo-auth.png"
          width="84"
          height="100"
          alt="logo auth"
        /> */}
        <Paper radius="md" p="xl" className="w-full max-w-md mt-20">
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            title="Error"
            color="red"
          >
            Missing password reset token. Please use the link from your email.
          </Alert>
          <Box mt="lg">
            <Link href="/auth/login" className="text-blue-500 hover:underline">
              Back to login
            </Link>
          </Box>
        </Paper>
      </Box>
    );
  }

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
          Reset Password
        </Title>
        <Text ta="center" c="#454C50" size="lg" fw={500} mb="xl">
          {success
            ? "Your password has been reset successfully"
            : "Please enter your new password"}
        </Text>

        {success ? (
          <Box>
            <Text ta="center" c="dimmed" mb="md">
              You will be redirected to login page in a moment...
            </Text>
            <Button component={Link} href="/auth/login" fullWidth>
              Back to Login
            </Button>
          </Box>
        ) : (
          <form onSubmit={form.onSubmit(handleSubmit)} autoComplete="off">
            <PasswordInput
              label="New Password"
              placeholder="Enter your new password"
              required
              mb="md"
              {...form.getInputProps("password")}
            />

            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your new password"
              required
              mb="xl"
              {...form.getInputProps("confirmPassword")}
            />

            <Button fullWidth type="submit" loading={loading}>
              Reset Password
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
}
