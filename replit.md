# Overview

Clarify.id is a modern news aggregation and verification platform built with a full-stack TypeScript architecture. The application provides users with trusted, verified news content organized by categories with real-time search capabilities. The platform emphasizes news source verification and content credibility through visual indicators and trust ratings.

The application follows a monorepo structure with separate client and server directories, utilizing modern web technologies including React with TypeScript for the frontend, Express.js for the backend API, and PostgreSQL with Drizzle ORM for data persistence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client is built using **React 18** with **TypeScript** and follows a component-based architecture using shadcn/ui design system. Key architectural decisions include:

- **Routing**: Uses Wouter for lightweight client-side routing instead of React Router to minimize bundle size
- **State Management**: Leverages TanStack Query (React Query) for server state management and caching, eliminating the need for complex global state solutions like Redux
- **Styling**: Implements Tailwind CSS with a custom design system featuring CSS variables for theming support
- **UI Components**: Uses Radix UI primitives with shadcn/ui for consistent, accessible components
- **Build System**: Vite for fast development and optimized production builds

## Backend Architecture

The server implements a **RESTful API** using Express.js with TypeScript:

- **API Structure**: RESTful endpoints under `/api` namespace for news articles, categories, and sources
- **Data Validation**: Uses Zod schemas for runtime type validation and API request/response validation
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Storage Abstraction**: Implements storage interface pattern allowing for easy switching between in-memory and database storage

## Data Storage Solutions

**Database**: PostgreSQL as the primary database with Drizzle ORM for type-safe database operations:

- **Schema Design**: Three main entities - news_articles, categories, and sources with appropriate relationships
- **ORM Choice**: Drizzle ORM chosen over Prisma for better TypeScript integration and smaller runtime footprint
- **Migration Strategy**: Uses Drizzle Kit for database migrations stored in `/migrations` directory

**Caching Strategy**: TanStack Query provides intelligent client-side caching with configurable stale times and background refetch policies.

## Authentication and Authorization

Currently implements a simple session-based approach with placeholder for future authentication integration. The architecture supports easy integration of authentication providers through the existing API structure.

## Design System and Theming

Implements a comprehensive design system with:

- **Color System**: Custom CSS variables supporting light/dark themes
- **Typography**: Multiple font families (DM Sans, Geist Mono, Architects Daughter, Fira Code)
- **Component Variants**: Uses class-variance-authority for type-safe component styling
- **Responsive Design**: Mobile-first approach with Tailwind's responsive utilities

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL hosting service (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe database toolkit (drizzle-orm, drizzle-kit)

## UI and Component Libraries
- **Radix UI**: Primitive components for building accessible UI (@radix-ui/react-*)
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Touch-friendly carousel component

## Development and Build Tools
- **Vite**: Build tool with React plugin and custom Replit integrations
- **TypeScript**: Static type checking across the entire codebase
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing with autoprefixer

## Data Fetching and Validation
- **TanStack Query**: Server state management and caching
- **Zod**: Schema validation for API requests/responses
- **React Hook Form**: Form handling with @hookform/resolvers

## Date and Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx + tailwind-merge**: Conditional CSS class management
- **nanoid**: Unique ID generation

## Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions