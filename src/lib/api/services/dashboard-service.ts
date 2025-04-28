import { apiClient } from "../api-client";
import { IDashboard } from "../types/dashboards";

class DashboardService {
  private BASE_URL = "/dashboard";

  async getStatistics(): Promise<IDashboard> {
    return await apiClient.get<IDashboard>(`${this.BASE_URL}/statistics`);
  }
}

export const dashboardService = new DashboardService();
