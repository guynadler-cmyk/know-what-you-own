# Know What You Own - 10-K Business Summary App

## Overview

A web application that helps investors understand the businesses they own by providing AI-powered, plain-English summaries of SEC 10-K filings. Users input a stock ticker symbol, and the app fetches the company's most recent 10-K filing from the SEC EDGAR system, extracts the business description, and generates a comprehensive summary using OpenAI.

This is a proof-of-concept for Restnvest, a platform promoting sensible investing by helping people understand businesses beyond just ticker symbols or ETFs.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Libraries:**
- React with TypeScript using Vite as the build tool
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and data fetching
- Shadcn UI component library with Radix UI primitives for accessible components
- Tailwind CSS for styling with custom design system

**Design System:**
- Inspired by fintech aesthetics (Stripe's clarity + Robinhood's approachability)
- Custom color palette supporting light/dark modes
- Typography: Inter for primary text, JetBrains Mono for ticker symbols and financial data
- Consistent spacing using Tailwind's 4px-based scale

**State Management:**
- TanStack Query handles all server state with custom query client configuration
- Local component state with React hooks
- No global state management library (Redux/Zustand) - keeps architecture simple

**Key UI Patterns:**
- Single-page application with component-based architecture
- Custom components for ticker input, loading states, error states, and summary cards
- Theme toggle supporting light/dark modes with localStorage persistence

### Backend Architecture

**Runtime & Framework:**
- Node.js with Express.js server
- TypeScript for type safety across the stack
- ESM (ES Modules) for modern JavaScript module system

**API Design:**
- RESTful API with single primary endpoint: `/api/analyze/:ticker`
- Input validation using Zod schemas shared between frontend and backend
- Comprehensive error handling with appropriate HTTP status codes
- Request/response logging middleware for debugging

**Data Flow:**
1. Ticker validation (1-5 letter format)
2. Map ticker to CIK (Central Index Key) via SEC's static JSON
3. Fetch company's recent filings from SEC EDGAR API
4. Extract latest 10-K filing's business section
5. Send to OpenAI for analysis and summarization
6. Return structured summary validated against Zod schema

**Service Layer Pattern:**
- `secService`: Handles all SEC EDGAR API interactions (ticker mapping, filing retrieval, content extraction)
- `openaiService`: Manages OpenAI API calls for business analysis
- Clear separation of concerns between external API integrations

### Data Storage

**No Traditional Database:**
- Application is stateless - no persistent data storage
- All data fetched in real-time from SEC EDGAR API
- No user accounts, sessions, or saved analyses
- Caching handled at HTTP level, not application level

**Rationale:**
- Simplifies architecture for proof-of-concept
- SEC data is authoritative source - no need to store
- Reduces infrastructure requirements
- Fresh data on every request ensures accuracy

### External Dependencies

**SEC EDGAR API:**
- Company ticker to CIK mapping: `https://www.sec.gov/files/company_tickers.json`
- Filing submissions: `https://data.sec.gov/submissions/CIK##########.json`
- 10-K document retrieval from SEC's document server
- Custom User-Agent header required: "Know What You Own info@restnvest.com"

**OpenAI API:**
- GPT-4 for business analysis and summarization
- Structured output using Zod schemas for validation
- Icon mapping logic for product categorization
- Custom prompts designed to extract key business information

**Third-Party UI Libraries:**
- Radix UI: Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- Lucide React: Icon library for UI elements
- React Icons: Additional icon set (specifically for X/Twitter)
- cmdk: Command palette component
- date-fns: Date formatting utilities

**Development Tools:**
- Vite: Fast development server and optimized production builds
- Replit-specific plugins: Cartographer, dev banner, runtime error modal
- ESBuild: Fast TypeScript/JavaScript bundler for production

**Build & Deployment:**
- Development: `tsx` for running TypeScript directly
- Production: Vite builds frontend, ESBuild bundles backend
- Static assets served from `dist/public`
- Backend served from `dist/index.js`

### Type Safety & Validation

**Shared Schema Architecture:**
- Zod schemas in `/shared/schema.ts` used by both frontend and backend
- Type inference from Zod schemas ensures consistency
- Runtime validation prevents invalid data propagation
- Schemas define: products, leaders, competitors, metrics, operations, and full company summary structure

**Path Aliases:**
- `@/`: Client source files
- `@shared/`: Shared schemas and types
- `@assets/`: Attached assets directory
- Configured in both TypeScript and Vite for seamless imports