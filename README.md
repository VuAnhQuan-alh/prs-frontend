# PRS Frontend

A modern, responsive frontend for the Prompt and Response System (PRS) built with Next.js, Mantine UI, and Tailwind CSS.

## Overview

PRS is a comprehensive customer interaction management system featuring:

- **Table/Seat Management**: Organize and monitor seating arrangements
- **Prompts/Responses Processing**: Create and manage automated prompts and collect customer responses
- **Service Request Management**: Handle customer assistance needs efficiently
- **Real-time Monitoring**: Track activities across your system in real-time

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: [Mantine UI](https://mantine.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **API Communication**: [Axios](https://axios-http.com/)
- **State Management**: React Hooks
- **Form Handling**: Mantine Form
- **Real-time Features**: WebSockets

## Project Structure

```
src/
├── app/ - Next.js app router pages
│   ├── auth/ - Authentication pages
│   ├── dashboard/ - Main dashboard
│   ├── tables/ - Table management
│   ├── sessions/ - Session management
│   └── ...
├── components/ - Reusable UI components
│   ├── auth/ - Authentication components
│   ├── layouts/ - Layout components
│   └── ...
└── lib/ - Utility functions and services
    ├── api/ - API client and services
    │   ├── services/ - API services for different features
    │   └── types/ - TypeScript interfaces and types
    └── ...
```

## API Services

The application communicates with the PRS backend API through these services:

- `authService` - Authentication and user management
- `tableService` - Table CRUD operations
- `seatService` - Seat management
- `sessionService` - Session operations
- `promptService` - Prompt creation and management
- `responseService` - Response collection and analysis
- `serviceRequestService` - Customer service request handling
- `notificationService` - System notifications
- `useWebSocket` - Real-time communication hook

## Features

1. **Authentication System**

   - Login/logout functionality
   - Route protection
   - User session management

2. **Dashboard**

   - Overview statistics
   - Visual representation of data
   - Quick access to key features

3. **Table Management**

   - Create, update, delete tables
   - Assign seats
   - Monitor table status

4. **Prompt and Response System**

   - Create various prompt types
   - Collect and analyze responses
   - Generate insights from data

5. **Service Request Handling**

   - Create and track service requests
   - Assign staff to requests
   - Monitor resolution status

6. **Real-time Notifications**
   - WebSocket-based updates
   - Persistent notifications
   - Priority-based alert system

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- Yarn package manager

### Installation

1. Clone the repository

   ```
   git clone <repository-url>
   cd prs-frontend
   ```

2. Install dependencies

   ```
   yarn install
   ```

3. Create a `.env.local` file with the following variables

   ```
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   NEXT_PUBLIC_WS_URL=ws://localhost:3000
   ```

4. Start the development server

   ```
   yarn dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Building for Production

```
yarn build
```

Then start the production server:

```
yarn start
```

## Environment Variables

- `NEXT_PUBLIC_API_URL`: URL to the PRS backend API
- `NEXT_PUBLIC_WS_URL`: WebSocket URL for real-time communication

## Deployment

This application can be deployed on any platform that supports Next.js, such as:

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [AWS Amplify](https://aws.amazon.com/amplify/)

## License

[MIT](LICENSE)
