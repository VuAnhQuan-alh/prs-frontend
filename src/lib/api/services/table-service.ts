import { apiClient } from "../api-client";
import {
  CreateTableRequest,
  Table,
  TableFilters,
  UpdateTableRequest,
} from "../types/tables";
import { seatService } from "./seat-service";

class TableService {
  private BASE_URL = "/tables";

  async getAll(filters?: TableFilters): Promise<Table[]> {
    return await apiClient.get<Table[]>(this.BASE_URL, { params: filters });
  }

  async getById(id: string): Promise<Table> {
    return await apiClient.get<Table>(`${this.BASE_URL}/${id}`);
  }

  async create(data: CreateTableRequest): Promise<Table> {
    return await apiClient.post<Table>(this.BASE_URL, data);
  }

  async update(id: string, data: UpdateTableRequest): Promise<Table> {
    return await apiClient.put<Table>(`${this.BASE_URL}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_URL}/${id}`);
  }

  async getSeats(tableId: string): Promise<Table> {
    return await apiClient.get<Table>(`${this.BASE_URL}/${tableId}/seats`);
  }

  /**
   * Create a table with seats
   * @param tableData - Table data
   * @param seatCount - Number of seats to create for the table
   * @returns Created table with seats
   */
  async createTableWithSeats(
    tableData: CreateTableRequest,
    seatCount: number
  ): Promise<Table> {
    try {
      // First create the table
      const table = await this.create(tableData);

      // Then create seats for the table
      if (seatCount > 0) {
        await seatService.createMultipleSeats(table.id, seatCount);
      }

      return table;
    } catch (error) {
      console.error("Failed to create table with seats:", error);
      throw error;
    }
  }
}

export const tableService = new TableService();
