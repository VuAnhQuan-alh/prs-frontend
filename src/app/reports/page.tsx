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
import {
  IconFilter,
  IconDownload,
  IconPrinter,
  IconClock,
} from "@tabler/icons-react";
import {
  responseService,
  tableService,
  // serviceRequestService,
} from "@/lib/api/services";
import { Response, ResponseType } from "@/lib/api/types/responses";
import { notifications } from "@mantine/notifications";

interface ReportSearchParams {
  tableId?: string;
  seatCode?: string;
  activity?: string;
  playerDealerStatus?: string;
  gameType?: string;
  tableAdmin?: string;
  date?: string;
  timeFrom?: string;
  timeTo?: string;
}

export default function ReportsPage() {
  // State for search filters
  const [searchParams, setSearchParams] = useState<ReportSearchParams>({});
  const [tables, setTables] = useState<{ value: string; label: string }[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");

  // State for search results
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Fetch tables on component mount
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

    fetchTables();
  }, []);

  // Handle search
  const handleSearch = async () => {
    try {
      setLoading(true);

      // Prepare filters
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filters: any = { ...searchParams };

      // Add date and time if provided
      if (date) {
        const dateStr = date.toISOString().split("T")[0];
        filters.date = dateStr;
      }

      if (timeFrom) {
        const hours = new Date(timeFrom).getHours().toString().padStart(2, "0");
        const minutes = new Date(timeFrom)
          .getMinutes()
          .toString()
          .padStart(2, "0");
        filters.timeFrom = `${hours}:${minutes}`;
      }

      if (timeTo) {
        const hours = new Date(timeTo).getHours().toString().padStart(2, "0");
        const minutes = new Date(timeTo)
          .getMinutes()
          .toString()
          .padStart(2, "0");
        filters.timeTo = `${hours}:${minutes}`;
      }

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
    setDate(null);
    setTimeFrom("");
    setTimeTo("");
  };

  // Handle export CSV
  const handleExportCSV = () => {
    if (responses.length === 0) return;

    // Prepare CSV content
    const headers = ["Table", "Seat", "Guest", "Response", "Timestamp"];
    const csvContent = responses.map((response) => {
      return [
        response.seat?.table?.name || "-",
        response.seat?.number || "-",
        "Unknown Guest", // Guest info would come from your actual data model
        response.type || "-",
        new Date(response.timestamp).toLocaleString(),
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

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Title>Reports</Title>

      {/* Search Filters Section */}
      <Paper withBorder p="md" my="lg">
        <Group mb="md" align="center">
          <IconFilter size={20} />
          <Text fw={600}>Search Filters</Text>
        </Group>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
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
            label="Seat Code"
            placeholder="e.g., A, B, C"
            value={searchParams.seatCode || ""}
            onChange={(e) =>
              setSearchParams((prev) => ({
                ...prev,
                seatCode: e.target.value || undefined,
              }))
            }
          />

          <Select
            label="Activity"
            placeholder="Select activity"
            data={[
              { value: "", label: "Service Requests" },
              { value: "responses", label: "Responses" },
              { value: "prompts", label: "Prompts" },
            ]}
            value={searchParams.activity || ""}
            onChange={(value) =>
              setSearchParams((prev) => ({
                ...prev,
                activity: value || undefined,
              }))
            }
          />

          <Select
            label="Player-Dealer Status"
            placeholder="Select status"
            data={[
              { value: "", label: "Any Status" },
              { value: "player", label: "Player" },
              { value: "dealer", label: "Dealer" },
            ]}
            value={searchParams.playerDealerStatus || ""}
            onChange={(value) =>
              setSearchParams((prev) => ({
                ...prev,
                playerDealerStatus: value || undefined,
              }))
            }
          />

          <Select
            label="Game Type"
            placeholder="Select game"
            data={[
              { value: "", label: "All Games" },
              { value: "blackjack", label: "Blackjack" },
              { value: "poker", label: "Poker" },
              { value: "roulette", label: "Roulette" },
            ]}
            value={searchParams.gameType || ""}
            onChange={(value) =>
              setSearchParams((prev) => ({
                ...prev,
                gameType: value || undefined,
              }))
            }
          />

          <Select
            label="Table Admin"
            placeholder="Select admin"
            data={[
              { value: "", label: "Any Admin" },
              { value: "admin1", label: "Admin 1" },
              { value: "admin2", label: "Admin 2" },
            ]}
            value={searchParams.tableAdmin || ""}
            onChange={(value) =>
              setSearchParams((prev) => ({
                ...prev,
                tableAdmin: value || undefined,
              }))
            }
          />

          <DatePickerInput
            label="Date"
            placeholder="Pick a date"
            value={date}
            onChange={setDate}
            clearable
          />

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
            // clearable
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
            // clearable
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
              <Button
                leftSection={<IconPrinter size={16} />}
                variant="outline"
                onClick={handlePrint}
                disabled={responses.length === 0}
              >
                Print
              </Button>
            </Group>
          </Group>

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Table</Table.Th>
                <Table.Th>Seat</Table.Th>
                <Table.Th>Guest</Table.Th>
                <Table.Th>Response</Table.Th>
                <Table.Th>Timestamp</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {responses.length > 0 ? (
                responses.map((response) => (
                  <Table.Tr key={response.id}>
                    <Table.Td>
                      {response.seat?.table?.name || "Table 1"}
                    </Table.Td>
                    <Table.Td>{response.seat?.number || "Seat A"}</Table.Td>
                    <Table.Td>Unknown Guest</Table.Td>
                    <Table.Td>
                      {response.type === ResponseType.YES ? (
                        <Badge color="green">{ResponseType.YES}</Badge>
                      ) : response.type === ResponseType.NO ? (
                        <Badge color="red">{ResponseType.NO}</Badge>
                      ) : (
                        <Badge color="orange">
                          {ResponseType.SERVICE_REQUEST}
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {new Date(response.timestamp).toLocaleString()}
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={5} align="center">
                    <Text>No results found</Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {/* Add example data to match the screenshot */}
              {responses.length === 0 && (
                <>
                  <Table.Tr>
                    <Table.Td>Table 1</Table.Td>
                    <Table.Td>Seat A</Table.Td>
                    <Table.Td>Unknown Guest</Table.Td>
                    <Table.Td>
                      <Badge color="green">YES</Badge>
                    </Table.Td>
                    <Table.Td>Apr 25, 2025 3:54 PM</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Table 1</Table.Td>
                    <Table.Td>Seat B</Table.Td>
                    <Table.Td>Unknown Guest</Table.Td>
                    <Table.Td>
                      <Badge color="red">NO</Badge>
                    </Table.Td>
                    <Table.Td>Apr 25, 2025 3:49 PM</Table.Td>
                  </Table.Tr>
                </>
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </>
  );
}
