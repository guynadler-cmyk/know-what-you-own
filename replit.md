# Know What You Own - 10-K Business Summary App

## Overview

"Know What You Own" is a free web application that provides AI-powered, plain-English summaries of SEC 10-K filings to help investors understand public companies. It aims to demystify financial reports and make investment research accessible by offering immediate access to comprehensive analyses. The project serves as a proof-of-concept for Restnvest, a platform dedicated to fostering sensible investing through deeper business understanding. The application features a comprehensive marketing site, a watchlist feature for authenticated users, and robust authentication via Google Sign-In.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, leveraging Vite for development, Wouter for routing, and TanStack Query for data management. UI components are sourced from Shadcn UI (built on Radix UI) and styled with Tailwind CSS, adhering to a minimalist design system featuring a monochrome palette, teal accent (`--lp-teal-deep: #0d4a47`), and DM Sans / Playfair Display / DM Mono typography. It supports theme toggling and employs a component-based architecture without a global state management library. Key UI patterns include a hero section, structured results with visual clustering, and strong heading hierarchies. The application also supports Progressive Web App (PWA) installation.

### Analysis Stage Design System (Stages 2–4)

Each analysis stage follows a consistent visual pattern:
- **Stage page header**: Small-caps teal eyebrow (e.g. "Stage 2 of 6 · Financial Performance") + Playfair Display italic serif headline + muted subtitle
- **Stage navigation** (`StageNavigation.tsx`): Compact tab-bar with filled teal circles for active, outlined teal ✓ for completed, and muted circles for future stages
- **Analysis card mac-header**: Dark teal (`--lp-teal-deep`) header bar on each analysis card showing stage label on left, ticker in DM Mono center, current module on right
- **Insight panel**: Italic Playfair Display heading + teal left-border callout for insight text
- **Scorecard rows**: Compact status dots (✓/!/✗ colored circles) with title + verdict label; teal-tinted verdict bar at bottom
- **"Coming up next" preview sections**: Divider with serif headline + preview card at bottom of Stages 2, 3, and 4 (previewing the next stage)

### Backend Architecture

The backend utilizes Node.js and Express.js with TypeScript, exposing a RESTful API, primarily `/api/analyze/:ticker`. Input validation is performed using shared Zod schemas. The data flow involves ticker validation, CIK mapping, fetching 10-K filings from SEC EDGAR, extracting the business section, and sending it to OpenAI for summarization. A service layer pattern separates `secService` for SEC interactions and `openaiService` for OpenAI API calls.

### Data Storage & Security

The application employs a dual database architecture:
- **External Database**: Google Cloud SQL PostgreSQL for SEC analysis caching (business analysis, temporal analysis, footnotes analysis).
- **Internal Database**: Replit-managed PostgreSQL for application data such as users, sessions, waitlist signups, and scheduled checkup emails.
Zod schema validation ensures data quality, with incomplete AI responses resulting in errors.

### GA4 Conversion Tracking

A single `new_lead` GA4 event is triggered via Firebase Analytics when a user's email is recorded in the database for the first time. Deduplication checks against both `waitlist_signups` and `scheduled_checkup_emails` tables. Frontend logic ensures the event fires only when the API response indicates `isNewLead: true`.

### Type Safety & Validation

Shared Zod schemas, located in `/shared/schema.ts`, ensure type safety and data consistency across both frontend and backend by defining data structures and enabling runtime validation.

### UI/UX Decisions

The application features a clear, minimalist design with a monochrome palette and a teal accent. It includes a hero section, a structured results page with visual clustering, strong heading hierarchies, and accessible elements like mobile-friendly tag explanations using Radix UI Popovers. Investment analysis is multi-dimensional, categorizing drivers into Strategic Themes, Competitive Moats, Market Opportunity, and Value Creation, each with visual icons and color-coded emphasis scoring. A prominent AI-powered investment thesis section summarizes how companies plan to create shareholder value. The landing page provides marketing and onboarding, while an "App page" focuses on analysis, with intuitive navigation between them. The application supports easy link sharing and PWA installation.

### Valuation Quadrant Positioning (Stage 3)

Valuation sub-quadrants use continuous x/y positioning based on actual metric values (not discrete 3-position snapping). The backend computes `position: { x, y }` (0-100 scale, clamped 5-95) for each quadrant and sends it in the API response. The frontend falls back to the old 3-position system for cached data without position fields. Position mappings per quadrant:
- **Price Discipline**: x = distance from 52-week high (more = right), y = entry risk from SMA/trajectory (recovering = low/bottom, drifting = high/top). Green = Bottom Right.
- **Price Tag**: x = inverted P/E (low P/E = right), y = inverted earnings growth (high growth = low/bottom). Green = Bottom Right.
- **Capital Discipline**: x = share buyback tendency (buybacks = right), y = ROIC (high = top). Green = Top Right.
- **Doubling Potential**: x = inverted CAGR (high CAGR = left), y = inverted ROIC (high ROIC = bottom). Green = Bottom Left.

### Timing Stage (Technical Analysis)

The Timing stage employs a consistent pattern matching Valuation/Performance stages, featuring horizontal navigation for Trend/Momentum/Stretch selection, a two-panel layout with a quadrant visual and explanation, and a timeframe toggle (Weekly/Daily). The Stretch Module uses investor-native language for RSI interpretation, while the Momentum Module employs deterministic case mapping for consistent summaries.

### Strategy Stage (Investment Planning)

The Strategy stage is a user-authored planning tool, featuring a two-column layout for conviction, amount, and "I'm wrong if" builder on the left, and a plan preview with editable tranches on the right. It includes takeaways from other stages, weighted tranche sizing based on conviction, and flexible "When/Gate" tranche scheduling. Manual overrides for tranche amounts are supported, along with a guided "I'm wrong if" builder. All summaries use neutral, non-advisory language.

### Paywall / Email Gate

A three-state paywall (`locked` | `skipped` | `unlocked`) gates analysis stages 4-6 behind email capture, offering a "Friday Report → Monday Actions" value proposition. State management uses localStorage, with auto-unlock for returning users. The paywall uses floating modals (`EmailPaywall`) and an inline banner (`InlineEmailCapture`), with distinct modes for different stages. Email submissions are tracked, and `new_lead` GA4 conversion events are fired upon successful email capture. A `TickerFollowPrompt` banner encourages unlocked users to follow specific tickers.

### Authentication

Google Sign-In is implemented via Firebase Authentication (Google provider with popup flow). The frontend uses `firebase/auth` for sign-in/sign-out and passes Firebase ID tokens via `Authorization: Bearer <token>` headers. The backend uses `firebase-admin` to verify tokens and upsert users. The client uses a `useAuth()` hook (based on `onAuthStateChanged`) to provide user authentication status. Auth module: `server/firebaseAuth.ts`, client config: `client/src/lib/firebase.ts`.

### Homepage Interactive Demos

The landing page features four live demo sections between the hero CTA and the static feature sections:

1. **Investment Thesis** (`HeroThesisDemo.tsx`) — inside the hero section. Pre-fetches AAPL/NVDA/MSFT from `/api/analyze/:ticker` (all cache hits). Three-button toggle, instant switch. Uses `InvestmentThesisCard.tsx` (standalone extraction from `SummaryCard.tsx`).

2. **Changes Over Time** (`HeroTemporalDemo.tsx`) — first demo section after hero. Reuses same cached queries as `HeroThesisDemo` (zero extra API calls). Defaults to NVDA (AAPL's temporal data not in route cache). Renders `TemporalAnalysis` component directly.

3. **Financial Analysis** (`HeroFinancialDemo.tsx`) — second demo section. Uses static AAPL JSON stored in `client/src/data/sampleFinancialData.ts` (captured from `/api/financials/AAPL`). Renders `QuadrantExplorer` + `FinancialScorecard` with `generateQuadrantData`. "Sample analysis" label links to `/app`.

4. **Technical Analysis** (`HeroTimingDemo.tsx`) — third demo section. Uses static AAPL JSON stored in `client/src/data/sampleTimingData.ts` (captured from `/api/timing/AAPL?timeframe=weekly`). Injects data via `TimingStage`'s new optional `placeholderData` prop (prevents API call when `ticker=""` and `placeholderData` provided). "Sample analysis" label links to `/app`.

The `TimingStage` component (`TimingStage.tsx`) now accepts an optional `placeholderData?: TimingAnalysis` prop. When provided with an empty `ticker`, `enabled: false` prevents any network request and `placeholderData` is used directly by TanStack Query.

Landing page feature sections reduced to 2 (Business Overview + Competition); the 3 other screenshot sections were replaced by the live interactive demos above.

### Discover Page

The Discover page (`/discover`) displays a filterable grid of all cached stock analyses. The `GET /api/discover` endpoint queries the external DB's `ai_business_analysis` table, deduplicates by ticker (latest entry), and derives a letter grade (A–F) from high-emphasis moat/theme/value/opportunity counts. The frontend (`client/src/pages/DiscoverPage.tsx`) renders a responsive tile grid with client-side search, grade filtering, and sorting. Each tile links to `/stocks/:ticker`. A "Discover" nav link is in the site header.

### Watchlist

The watchlist (`/watchlist`) lets authenticated users save stock analyses with snapshot history tracking. Each watchlist entry stores the current analysis snapshot plus a `snapshotHistory` array of past snapshots with timestamps, enabling progression tracking over time. Features include: save/update snapshot from analysis page (`SaveToWatchlist` component), search by ticker/company/notes, sort (recently updated, oldest, A-Z, Z-A), inline notes editing, expandable snapshot history timeline with visual dot indicators, and remove with confirmation. Backend routes: `GET /api/watchlist`, `GET /api/watchlist/check/:ticker`, `POST /api/watchlist`, `PATCH /api/watchlist/:id/notes`, `PATCH /api/watchlist/:id/snapshot`, `DELETE /api/watchlist/:id`.

## External Dependencies

-   **SEC EDGAR API:** For company CIK mapping, filing submissions, and 10-K document access.
-   **OpenAI API:** Utilizes GPT-4 for AI-powered business analysis, summarization, structured output validation, icon mapping, and custom prompts.
-   **Third-Party UI Libraries:** Radix UI (accessible component primitives), Lucide React & React Icons (UI icons), cmdk (command palette), date-fns (date formatting), qrcode.react (QR code generation), recharts (charting and data visualization).
-   **Development Tools:** Vite (frontend build tool), ESBuild (backend bundling), tsx (TypeScript execution in development).
-   **Clearbit Logo API:** Displays company logos.