module.exports = {
  apps: [
    {
      name: "prs-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      exec_mode: "cluster",
      watch: false,
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
      env_development: {
        PORT: 3000,
        NODE_ENV: "development",
      },
      max_memory_restart: "1G",
      error_file: "logs/error.log",
      out_file: "logs/out.log",
      time: true,
      wait_ready: true,
      kill_timeout: 3000,
      autorestart: true,
    },
  ],
};
