export interface IDashboard {
  activeUsers: {
    count: number;
  };
  activeSessions: {
    count: number;
    percentChange: number;
  };
  activeTablesWithMultipleSessions: {
    count: number;
  };
  responses: {
    count: number;
  };
  serviceRequests: {
    count: number;
    percentChange: number;
  };
  prompts: {
    count: number;
  };
}
