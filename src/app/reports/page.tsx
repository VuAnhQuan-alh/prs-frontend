"use client";

import { useState, useEffect } from "react";
import {
  Group,
  Title,
  TextInput,
  Button,
  Select,
  Table,
  Text,
  Paper,
  Badge,
  rem,
} from "@mantine/core";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import { IconFilter, IconDownload, IconClock } from "@tabler/icons-react";
import { responseService, tableService, userService } from "@/lib/api/services";
import { Response, ResponseType } from "@/lib/api/types/responses";
import { notifications } from "@mantine/notifications";
import { Role } from "@/lib/api/types/auth";
import { format } from "date-fns";

interface ReportSearchParams {
  tableId?: string;
  seatNumber?: string;
  promptId?: string;
  sessionId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  timeFrom?: string;
  timeTo?: string;
  tableAdmin?: string;
}

export default function ReportsPage() {
  // State for search filters
  const [searchParams, setSearchParams] = useState<ReportSearchParams>({});
  const [tables, setTables] = useState<{ value: string; label: string }[]>([]);
  const [date, setDate] = useState<[Date | null, Date | null]>([null, null]);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");

  // State for user role
  const [userRole, setUserRole] = useState<{ value: string; label: string }[]>(
    []
  );

  // State for search results
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // State for response types dropdown
  const [responseTypes] = useState([
    { value: "", label: "All Types" },
    { value: ResponseType.YES, label: "YES" },
    { value: ResponseType.NO, label: "NO" },
    { value: ResponseType.SERVICE_REQUEST, label: "SERVICE" },
  ]);

  // Fetch tables and user role table on component mount
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const tablesData = await tableService.getAll();
        const tableOptions = tablesData.docs.map((table) => ({
          value: table.id,
          label: table.name,
        }));
        setTables([{ value: "", label: "All Tables" }, ...tableOptions]);
      } catch (error) {
        console.error("Error fetching tables:", error);
        notifications.show({
          title: "Error",
          message: "Failed to load tables",
          color: "red",
        });
      }
    };

    const fetchAdminTables = async () => {
      try {
        const userTable = await userService.getAll({ role: Role.TABLE });
        setUserRole(
          userTable.docs.map((user) => ({
            value: user.id,
            label: user.name,
          }))
        );
      } catch (error) {
        console.error("Error fetching admin tables:", error);
        notifications.show({
          title: "Error",
          message: "Failed to load admin tables",
          color: "red",
        });
      }
    };

    fetchAdminTables();
    fetchTables();
  }, []);

  // Handle search
  const handleSearch = async () => {
    try {
      setLoading(true);

      // Create a copy of the search parameters
      const filters: ReportSearchParams = { ...searchParams };

      // Format the date for the API request
      if (date[0] && date[1]) {
        const startDateStr = date[0].toISOString().split("T")[0];
        const endDateStr = date[1].toISOString().split("T")[0];
        filters.startDate = startDateStr;
        filters.endDate = endDateStr;
      }

      // Format time values for the API request
      if (timeFrom) {
        filters.timeFrom = timeFrom;
        // const timeFromObj = new Date(timeFrom);
        // const hours = timeFromObj.getHours().toString().padStart(2, "0");
        // const minutes = timeFromObj.getMinutes().toString().padStart(2, "0");
        // filters.timeFrom = `${hours}:${minutes}`;
      }

      if (timeTo) {
        filters.timeTo = timeTo;
        // const timeToObj = new Date(timeTo);
        // const hours = timeToObj.getHours().toString().padStart(2, "0");
        // const minutes = timeToObj.getMinutes().toString().padStart(2, "0");
        // filters.timeTo = `${hours}:${minutes}`;
      }

      // Clean up empty filters
      Object.keys(filters).forEach((key) => {
        if (!filters[key as keyof ReportSearchParams]) {
          delete filters[key as keyof ReportSearchParams];
        }
      });

      // Fetch responses based on filters
      const responsesData = await responseService.getAll(filters);
      setResponses(responsesData);
      setSearched(true);
    } catch (error) {
      console.error("Error fetching responses:", error);
      notifications.show({
        title: "Error",
        message: "Failed to search responses",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle reset filters
  const handleReset = () => {
    setSearchParams({});
    setDate([null, null]);
    setTimeFrom("");
    setTimeTo("");
    setSearched(false);
  };

  // Handle export CSV
  const handleExportCSV = () => {
    if (responses.length === 0) return;

    // Prepare CSV content
    const headers = [
      "Admin",
      "Table",
      "Seat",
      "Prompt",
      "Response",
      "Timestamp",
    ];
    const csvContent = responses.map((response) => {
      return [
        response.tableAdmin?.name || "-",
        response.table?.name || "-",
        response.seat?.number ? "Seat " + response.seat.number : "-",
        response.prompt?.title || "Unknown Prompt",
        response.type || "-",
        format(new Date(response.createdAt), "MM/dd/yyyy HH:mm"),
      ].join(",");
    });

    const csv = [headers.join(","), ...csvContent].join("\n");

    // Create and trigger download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `responses-report-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Title order={2}>Reports</Title>

      {/* Search Filters Section */}
      <Paper withBorder p="md" my="lg">
        <Group mb="md" align="center">
          <IconFilter size={20} />
          <Text fw={600}>Search Filters</Text>
        </Group>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <Select
            label="Table"
            placeholder="Select table"
            data={tables}
            value={searchParams.tableId || ""}
            onChange={(value) =>
              setSearchParams((prev) => ({
                ...prev,
                tableId: value || undefined,
              }))
            }
            clearable
          />

          <TextInput
            label="Seat Number"
            placeholder="e.g., 1, 2, 3"
            value={searchParams.seatNumber || ""}
            onChange={(e) =>
              setSearchParams((prev) => ({
                ...prev,
                seatNumber: e.target.value || undefined,
              }))
            }
          />

          <Select
            label="Response Type"
            placeholder="Select type"
            data={responseTypes}
            value={searchParams.type || ""}
            onChange={(value) =>
              setSearchParams((prev) => ({
                ...prev,
                type: value || undefined,
              }))
            }
            clearable
          />

          <Select
            label="Table Admin"
            placeholder="Select admin"
            data={userRole}
            value={searchParams.tableAdmin || ""}
            onChange={(value) =>
              setSearchParams((prev) => ({
                ...prev,
                tableAdmin: value || undefined,
              }))
            }
            clearable
          />

          <div style={{ gridColumn: "span 2" }}>
            <DatePickerInput
              label="Date"
              type="range"
              placeholder="Pick a date"
              value={date}
              onChange={setDate}
              clearable
            />
          </div>

          <TimeInput
            label="Time From"
            placeholder="--:--"
            value={timeFrom}
            onChange={(event) => setTimeFrom(event.currentTarget.value)}
            leftSection={
              <IconClock
                style={{ width: rem(16), height: rem(16) }}
                stroke={1.5}
              />
            }
          />

          <TimeInput
            label="Time To"
            placeholder="--:--"
            value={timeTo}
            onChange={(event) => setTimeTo(event.currentTarget.value)}
            leftSection={
              <IconClock
                style={{ width: rem(16), height: rem(16) }}
                stroke={1.5}
              />
            }
          />
        </div>

        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleSearch} loading={loading}>
            Search
          </Button>
        </Group>
      </Paper>

      {/* Search Results Section */}
      {searched && (
        <Paper withBorder p="md" my="lg">
          <Group justify="space-between" mb="md">
            <Text fw={600} size="lg">
              Search Results
            </Text>
            <Group>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="outline"
                onClick={handleExportCSV}
                disabled={responses.length === 0}
              >
                Export CSV
              </Button>
            </Group>
          </Group>

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Table Admin</Table.Th>
                <Table.Th>Table</Table.Th>
                <Table.Th>Seat</Table.Th>
                <Table.Th>Prompt</Table.Th>
                <Table.Th ta="center">Response</Table.Th>
                <Table.Th ta="end">Timestamp</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {responses.length > 0 ? (
                responses.map((response) => (
                  <Table.Tr key={response.id}>
                    <Table.Td>{response.tableAdmin?.name || "-"}</Table.Td>
                    <Table.Td>{response.table?.name || "-"}</Table.Td>
                    <Table.Td>
                      {response.seat?.number
                        ? "Seat " + response.seat.number
                        : "-"}
                    </Table.Td>
                    <Table.Td>{response.prompt?.title || "-"}</Table.Td>
                    <Table.Td ta="center">
                      {response.type === ResponseType.YES ? (
                        <Badge color="green">YES</Badge>
                      ) : response.type === ResponseType.NO ? (
                        <Badge color="red">NO</Badge>
                      ) : (
                        <Badge color="yellow">SERVICE</Badge>
                      )}
                    </Table.Td>
                    <Table.Td ta="end">
                      {format(new Date(response.createdAt), "MM/dd/yyyy HH:mm")}
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={6} align="center">
                    <Text>No results found</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </>
  );
}
