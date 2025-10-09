# Audio Streaming Application

## Overview

This is a full-stack audio streaming application built with React, Express, and PostgreSQL. The application provides music playback, playlist management, and real-time collaborative listening rooms where multiple users can listen to music together with synchronized playback controls.

The application features a Spotify-inspired interface with dark/light theme support, allowing users to browse albums, search for music, manage their library, and participate in shared listening experiences.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tool**
- React 18+ with TypeScript for type safety
- Vite as the build tool and dev server for fast HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing (alternative to React Router)

**UI Component System**
- Radix UI primitives for accessible, unstyled components (@radix-ui/*)
- shadcn/ui component library built on top of Radix (New York style variant)
- Tailwind CSS for utility-first styling with custom design tokens
- CSS custom properties for theming (light/dark mode support)

**Design System**
- Custom color palette with HSL values defined in CSS variables
- Dark mode primary: deep slate backgrounds (220 15% 8%) with purple-violet accents (280 85% 65%)
- Light mode: near-white backgrounds (220 15% 98%) with adjusted accent colors
- Typography: Inter for UI/body text, Plus Jakarta Sans for display/headings
- Consistent spacing system using Tailwind's 4/8/16/24/32px scale

**State Management**
- TanStack Query (React Query) for server state management and data fetching
- Local React state (useState/useRef) for UI state
- Query client configured with infinite stale time and disabled auto-refetching

**Real-time Communication**
- WebSocket client for real-time listening room synchronization
- Custom `useWebSocket` hook managing connection lifecycle
- Message-based protocol for room events (join, play/pause, track changes)

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for the REST API
- Native Node.js HTTP server for WebSocket support
- Middleware for JSON parsing, URL encoding, and request logging

**API Structure**
- RESTful endpoints under `/api/*` prefix
- Room management: POST/GET `/api/rooms`, GET `/api/rooms/:roomId`
- Participant management: POST `/api/rooms/:roomId/join`, room participant operations
- Queue management endpoints for collaborative playlists

**WebSocket Server**
- ws library for WebSocket implementation
- Room-based connection mapping with participant tracking
- Event-driven architecture for real-time playback synchronization
- Handles: play/pause events, track changes, position updates, participant join/leave

**Development Setup**
- Vite middleware mode in development for seamless SSR-like experience
- Automatic error overlay via Replit plugins
- Hot reload support with proper error handling
- Production build compiles to static assets + bundled Node.js server

### Data Layer

**Database**
- PostgreSQL via Neon serverless driver (@neondatabase/serverless)
- Drizzle ORM for type-safe database queries and migrations
- Schema-first approach with Zod validation integration (drizzle-zod)

**Database Schema**
- **users**: User authentication and profile (id, username, password)
- **listening_rooms**: Collaborative listening sessions with playback state (id, name, hostId, currentTrackId, currentPosition, isPlaying, createdAt)
- **room_participants**: Room membership with permissions (id, roomId, userId, username, canControl, joinedAt)
- **room_queue**: Shared playlist queue for rooms (referenced in storage interface)

**Storage Layer**
- Abstracted storage interface (`IStorage`) for database operations
- In-memory implementation (`MemStorage`) for development/testing
- PostgreSQL implementation (implied for production)
- UUID-based primary keys using `gen_random_uuid()`

**Session Management**
- connect-pg-simple for PostgreSQL-backed session storage
- Session data persisted across server restarts

### External Dependencies

**UI Component Libraries**
- @radix-ui/* (20+ component primitives): accordion, dialog, dropdown, popover, slider, tabs, toast, tooltip, etc.
- cmdk: Command palette component
- embla-carousel-react: Carousel/slider functionality
- lucide-react: Icon library

**Form & Validation**
- react-hook-form: Form state management
- @hookform/resolvers: Form validation resolvers
- zod: Schema validation (used with Drizzle)

**Utilities**
- class-variance-authority (cva): Component variant styling
- clsx + tailwind-merge: Conditional className utilities
- date-fns: Date formatting and manipulation
- nanoid: Unique ID generation

**Development Tools**
- @replit/vite-plugin-*: Development experience plugins (cartographer, dev banner, error modal)
- drizzle-kit: Database migration tooling
- tsx: TypeScript execution for Node.js
- esbuild: Production server bundling

**Data Fetching**
- @tanstack/react-query: Async state management
- Custom `apiRequest` utility for fetch wrapper with error handling

**Media & Assets**
- Mock data system for albums, tracks, artists, and playlists
- Stock images stored in `attached_assets/stock_images/`
- Audio playback controls (currently UI-only, audio engine not implemented)