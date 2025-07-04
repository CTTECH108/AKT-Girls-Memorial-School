# School SMS Sender - Student Management Platform

## Overview

This is a full-stack web application built as a school management platform with SMS messaging integration using Fast2SMS. The system allows schools to manage student information, send targeted SMS messages to students or specific grade levels, and track messaging statistics.

## System Architecture

The application follows a monorepo structure with a clear separation between frontend, backend, and shared components:

- **Frontend**: React-based SPA using Vite as the build tool
- **Backend**: Express.js REST API server
- **Database**: PostgreSQL with Drizzle ORM
- **Shared**: Common schemas and types shared between frontend and backend
- **UI Framework**: Shadcn/ui components with Radix UI primitives and Tailwind CSS

## Key Components

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Shadcn/ui component library built on Radix UI
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Animations**: GSAP for enhanced user interactions
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with native MongoDB driver
- **Database Provider**: MongoDB Atlas (cloud-hosted MongoDB)
- **API Design**: RESTful API with consistent error handling
- **Data Validation**: Zod schemas for request/response validation
- **Session Management**: In-memory session store

### Database Schema
The application uses three main MongoDB collections:
- **Students**: Core student information (name, grade, phone, student ID, notes, createdAt)
- **Messages**: Message tracking (content, target type/grade, recipient count, status, createdAt)
- **Users**: Basic user authentication (kept from original template)

### UI Component System
- **Design System**: New York style from Shadcn/ui
- **Component Library**: Comprehensive set of reusable components
- **Form Handling**: React Hook Form with Zod validation
- **Toast Notifications**: Custom toast system for user feedback
- **Responsive Design**: Mobile-first approach with responsive breakpoints

## Data Flow

1. **Student Management**: CRUD operations for student records with real-time updates
2. **Message Composition**: Create messages targeting all students or specific grade levels
3. **WhatsApp Integration**: Format and validate phone numbers for WhatsApp API compatibility
4. **Statistics Tracking**: Real-time dashboard showing student counts, message statistics, and success rates
5. **Data Export**: Excel and PDF export functionality for student data

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, ReactDOM, React Hook Form)
- TanStack Query for data fetching and caching
- Express.js for backend API
- Drizzle ORM with PostgreSQL driver

### UI and Styling
- Radix UI primitives for accessible components
- Tailwind CSS for utility-first styling
- Lucide React for icons
- GSAP for animations

### Database and Storage
- Neon Database for serverless PostgreSQL
- PostgreSQL session store for session management
- Drizzle Kit for database migrations

### Utilities and Tools
- Zod for schema validation
- Axios for HTTP requests
- Date-fns for date manipulation
- XLSX and jsPDF for data export

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

### Development Mode
- Frontend: Vite dev server with HMR
- Backend: Express server with TypeScript execution via tsx
- Database: Connects to Neon Database via DATABASE_URL environment variable

### Production Build
- Frontend: Vite builds static assets to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Deployment: Single Node.js process serving both API and static files

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Development/production mode detection via `NODE_ENV`
- Replit-specific optimizations and error handling

## Changelog

```
Changelog:
- June 29, 2025. Initial setup
- June 29, 2025. Converted WhatsApp messaging to SMS using Vonage API
- June 29, 2025. Updated storage to use permanent in-memory JSON array with 10 pre-loaded students
- June 29, 2025. Switched from Vonage API to Fast2SMS API while maintaining same UI and backend process
- June 29, 2025. Implemented playful onboarding tour for new admin users with interactive steps and animations
- June 29, 2025. Switched from Fast2SMS to UltraMsg WhatsApp API with credentials integration
- June 29, 2025. Added Excel upload feature for sending personalized student marks via WhatsApp
- June 30, 2025. Implemented permanent file-based storage system - students now saved to data/students.json permanently
- July 4, 2025. Integrated MongoDB database with connection string mongodb+srv://bastoffcial:aI4fEcricKXwBZ4f@speedo.swuhr8z.mongodb.net/
- July 4, 2025. Replaced file-based storage with MongoDB Atlas cloud storage while maintaining same UI/UX
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```