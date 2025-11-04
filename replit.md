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
- Minimalist aesthetic inspired by Apple/Steve Jobs design philosophy
- Monochrome palette (pure white/black) with Teal (hsl(180, 70%, 28%)) accent - company brand color
- Typography: Inter for primary text, JetBrains Mono for ticker symbols
- Bold, large typography with generous whitespace
- Strong visual hierarchy with bordered containers for clear section divisions
- Consistent spacing using Tailwind's 8px-based scale (8, 16, 24, 48, 64px)
- WCAG AA compliant color contrast for accessibility (4.5:1 minimum)

**State Management:**
- TanStack Query handles all server state with custom query client configuration
- Local component state with React hooks
- No global state management library (Redux/Zustand) - keeps architecture simple

**Key UI Patterns:**
- Single-page application with component-based architecture
- Custom components for ticker input, loading states, error states, and summary cards
- Theme toggle supporting light/dark modes with localStorage persistence
- Hero section with reduced height to fit entire homepage on one screen
- Results page with bordered section containers for clear visual clustering
- Strong heading hierarchy (h1-h4) with uppercase main section headers
- Visual separators (borders, dividers, underlines) for clear information architecture

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

## Recent Changes

### Interactive Features (Latest)
**Expandable Competitors:**
- Competitors with ticker symbols are now expandable inline (accordion-style)
- Click to expand/collapse directly within the competition section - no popup dialogs
- Expanded view shows quick summary (tagline, key products, key metrics)
- "Dive Deeper" button opens full competitor analysis in new tab
- ChevronDown icon rotates to indicate expansion state
- **Instant expansion**: Competitor data is prefetched in background after main analysis loads, so expansion happens instantly with no loading delays
- Schema updated: Competitor objects now include optional `ticker` field

**Sales Channel Tooltips:**
- Sales channel badges now display explanatory tooltips on hover
- AI generates plain-English explanations for each channel
- Example: "Third-party sellers: Products sold through retailers like Amazon or Best Buy"
- Schema updated: Channels changed from string array to SalesChannel objects with `name` and `explanation`

**Components Added:**
- CompetitorQuickSummary: Inline expandable component for competitor quick-view analysis

### Language Simplification
**Removed Professional Jargon:**
- Hero tagline: "SEC filings" → "Understand any public company in minutes"
- SummaryCard footer: "SEC EDGAR 10-K Filing • CIK..." → "Source: Official company report"
- Global footer: Removed "SEC EDGAR • OpenAI" line, kept only disclaimer
- Goal: Make the app accessible to non-financial professionals without technical jargon

### UI/UX Improvements
**Home Page Optimization:**
- Reduced hero section height from 80vh to fixed padding (pt-12 pb-8)
- Reduced spacing between hero and input from 64px to 32px
- Entire home screen (headline + input) now fits on one viewport without scrolling

**Results Page Visual Hierarchy:**
- Added strong bordered containers (2px borders) for each major section
- Created header bars with solid backgrounds and uppercase titles
- Implemented clear heading hierarchy: h2 (main sections), h3 (subsections), h4 (labels)
- Added multiple visual separators: borders, dividers, underlines
- Improved text alignment throughout with consistent spacing
- Sections now have distinct visual boundaries preventing mixing

**Visual Structure:**
- Four main sections: BUSINESS OVERVIEW, PERFORMANCE, MARKET CONTEXT, RESOURCES
- Each section has header bar + content area with subtle background
- Subsections within sections have underlined headers
- Clear separation prevents information from blending together

**Resources Section Enhancement:**
- Added distinctive visual indicators to make news and videos stand out:
  - News articles: Gray newspaper icon (SVG) on left that turns blue on hover
  - YouTube videos: Red YouTube logo icon (SVG) on left that darkens on hover
- Transformed plain links into attractive card components:
  - Background, borders, rounded corners, generous padding
  - Flex layout with icon prominently displayed on left
  - Hover elevation effects for better clickable affordance
- Removed overflow-hidden from section containers to allow hover shadows to display
- Clear visual differentiation helps users immediately identify content type

### SEC Parsing Robustness
- Implemented multiple fallback regex patterns for extracting ITEM 1 from 10-K filings
- Handles various 10-K formatting styles (different SEC filing formats)
- Added better error logging for debugging extraction failures
- Improved HTML entity cleanup (including numeric entities)