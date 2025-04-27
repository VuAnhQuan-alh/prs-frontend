"use client";

import { useEffect, useState } from "react";
import {
  TextInput,
  Button,
  Box,
  Title,
  Paper,
  Text,
  Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { seatService, sessionService, tableService } from "@/lib/api/services";
import { Seat, SeatStatus, Table, TableStatus } from "@/lib/api/types/tables";
import Image from "next/image";

export default function PlayerPage() {
  const [loading, setLoading] = useState(false);
  const [loadingSeat, setLoadingSeat] = useState(false);
  const router = useRouter();

  const [tables, setTables] = useState<Table[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);

  const form = useForm({
    initialValues: {
      name: "",
      tableId: "",
      seatId: "",
    },
    validate: {
      name: (value) => (!value ? "Name is required" : null),
      tableId: (value) => (!value ? "Table is required" : null),
      seatId: (value) => (!value ? "Seat is required" : null),
    },
  });

  const tableIdWatch = form.getInputProps("tableId").value;

  useEffect(() => {
    if (tableIdWatch) {
      fetchSeats(tableIdWatch);
    } else {
      setSeats([]);
    }
  }, [tableIdWatch]);

  // Fetch tables on create and edit prompt
  useEffect(() => {
    fetchTables();
  }, []);

  // Fetch tables for select input
  const fetchTables = async () => {
    try {
      setLoading(true);
      const data = await tableService.getAll();
      setTables(data);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load tables. Please try again later.";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch seats for selected table
  const fetchSeats = async (tableId: string) => {
    try {
      setLoadingSeat(true);
      const data = await seatService.getByTable(tableId);
      setSeats(data);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load seats. Please try again later.";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoadingSeat(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (values: {
    name: string;
    tableId: string;
    seatId: string;
  }) => {
    try {
      setLoading(true);
      const session = await sessionService.create({
        name: values.name,
        seatId: values.seatId,
      });

      notifications.show({
        title: "Join table successful",
        message: `${values.name} have successfully joined the table.`,
        color: "green",
      });
      router.push(`/auth/joined/${session.id}`);
    } catch (error: unknown) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during login. Please try again.";
      notifications.show({
        title: "Join table failed",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Image
        src="/images/logo-auth.png"
        width="84"
        height="100"
        alt="logo auth"
      />

      <Paper radius="md" p="xl" className="w-full max-w-md mt-10">
        <Title ta="center" c="#228ED0" order={2} mb="sm">
          Guest Login
        </Title>
        <Text ta="center" c="#454C50" size="lg" fw={500} mb="xl">
          Please sign in to continue
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)} autoComplete="off">
          <TextInput
            label="Username"
            placeholder="Your username"
            required
            mb="md"
            {...form.getInputProps("name")}
          />

          <Select
            label="Table"
            placeholder="Select table for joining"
            required
            data={[
              ...tables.map((table) => ({
                value: table.id,
                label: `${table.name} (${table.status})`,
                disabled: table.status === TableStatus.MAINTENANCE,
              })),
            ]}
            disabled={loading}
            {...form.getInputProps("tableId")}
            clearable
            mb="md"
          />

          <Select
            label="Seat"
            placeholder="Select seat for joining"
            required
            data={
              loadingSeat
                ? [{ value: "loading", label: "Loading seats..." }]
                : [
                    ...seats.map((seat) => ({
                      value: seat.id,
                      label: `Seat ${String.fromCharCode(64 + seat.number)}`,
                      disabled: Boolean(
                        seat.status === SeatStatus.INACTIVE || seat.user
                      ),
                    })),
                  ]
            }
            disabled={loadingSeat || loading || !tableIdWatch}
            {...form.getInputProps("seatId")}
            clearable
            mb="md"
          />

          <Button fullWidth type="submit" loading={loading}>
            Sign in
          </Button>
        </form>

        <Text c="dimmed" size="sm" ta="center" mt="md">
          Login with more rule?{" "}
          <Link href="/" className="text-blue-500 hover:underline">
            Choose another role
          </Link>
        </Text>
      </Paper>
    </Box>
  );
}
