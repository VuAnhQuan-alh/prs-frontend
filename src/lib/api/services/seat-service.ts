import { apiClient } from "../api-client";
import {
  CreateSeatRequest,
  Seat,
  SeatFilters,
  UpdateSeatRequest,
} from "../types/tables";

class SeatService {
  private BASE_URL = "/seats";

  async getAll(filters?: SeatFilters): Promise<Seat[]> {
    return await apiClient.get<Seat[]>(this.BASE_URL, { params: filters });
  }

  async getById(id: string): Promise<Seat> {
    return await apiClient.get<Seat>(`${this.BASE_URL}/${id}`);
  }

  async create(data: CreateSeatRequest): Promise<Seat> {
    return await apiClient.post<Seat>(this.BASE_URL, data);
  }

  async update(id: string, data: UpdateSeatRequest): Promise<Seat> {
    return await apiClient.put<Seat>(`${this.BASE_URL}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_URL}/${id}`);
  }

  async getByTable(tableId: string): Promise<Seat[]> {
    return await apiClient.get<Seat[]>(`${this.BASE_URL}/table/${tableId}`);
  }

  /**
   * Create multiple seats for a table
   * @param tableId - ID of the table to create seats for
   * @param count - Number of seats to create
   * @returns Array of created seats
   */
  async createMultipleSeats(tableId: string, count: number): Promise<Seat[]> {
    const seats: Seat[] = [];

    // Create seats sequentially with consecutive numbers
    for (let i = 1; i <= count; i++) {
      const seatData: CreateSeatRequest = {
        tableId: tableId,
        number: i,
      };

      try {
        const seat = await this.create(seatData);
        seats.push(seat);
      } catch (error) {
        console.error(
          `Failed to create seat ${i} for table ${tableId}:`,
          error
        );
        throw error;
      }
    }

    return seats;
  }
}

export const seatService = new SeatService();
