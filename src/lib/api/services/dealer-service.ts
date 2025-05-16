import { apiClient } from "../api-client";
import { Dealer } from "../types/dealers";

class DealerService {
  private BASE_URL = "/tables";
  private DEALER_URL = "/dealers";

  /**
   * Start dealer rotation for a table
   * @param tableId Table ID to start dealer rotation for
   * @param seatId Optional seat ID to target a specific seat for the dealer prompt
   * @returns Success message
   */
  async handleDealerRotation(
    tableId: string,
    seatId?: string
  ): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>(
      `${this.BASE_URL}/${tableId}/dealer/start-rotation`,
      seatId ? { seatId } : undefined
    );
  }

  /**
   * Check dealer rotation and update rounds if needed
   * @param tableId Table ID to check rotation for
   * @returns Success message
   */
  async checkDealerRotation(tableId: string): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>(
      `${this.BASE_URL}/${tableId}/dealer/check-rotation`
    );
  }

  /**
   * End dealer session for a table
   * @param tableId Table ID to end dealer session for
   * @returns Success message
   */
  async endDealerSession(tableId: string): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>(
      `${this.BASE_URL}/${tableId}/dealer/end-session`
    );
  }

  /**
   * Set table admin as dealer
   * @param tableId Table ID to set admin as dealer for
   * @returns Success message
   */
  async setTableAdminAsDealer(tableId: string): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>(
      `${this.DEALER_URL}/table/${tableId}/as-dealer`
    );
  }

  /**
   * Handle player response to dealer prompt
   * @param tableId Table ID
   * @param seatId Seat ID of the player
   * @param sessionId Session ID of the player
   * @param response Player's response (ACCEPT or DECLINE)
   * @param playerName Optional player name
   * @returns Success message
   */
  async handleDealerResponse(
    tableId: string,
    seatId: string,
    sessionId: string,
    response: "ACCEPT" | "DECLINE",
    playerName?: string,
    playerNotes?: string
  ): Promise<{ success: boolean; message: string; response: string }> {
    return await apiClient.post<{
      success: boolean;
      message: string;
      response: string;
    }>(`${this.DEALER_URL}/response`, {
      tableId,
      seatId,
      sessionId,
      response,
      playerName,
      playerNotes,
    });
  }

  /**
   * Get current dealer for a table
   * @param tableId Table ID
   * @returns Current dealer or null if none
   */
  async getCurrentDealer(tableId: string): Promise<Dealer | null> {
    try {
      return await apiClient.get<Dealer>(
        `${this.BASE_URL}/${tableId}/dealer/current`
      );
    } catch {
      return null;
    }
  }

  /**
   * Get all dealers for a table
   * @param tableId Table ID
   * @returns List of dealers for the table
   */
  async getTableDealers(tableId: string): Promise<Dealer[]> {
    return await apiClient.get<Dealer[]>(`${this.BASE_URL}/${tableId}/dealers`);
  }
}

export const dealerService = new DealerService();
