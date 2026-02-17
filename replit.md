# Know What You Own - 10-K Business Summary App

## Overview

"Know What You Own" is a free web application that provides AI-powered, plain-English summaries of SEC 10-K filings to help investors understand public companies. It aims to demystify financial reports and make investment research accessible by offering immediate access to comprehensive analyses. The project serves as a proof-of-concept for Restnvest, a platform dedicated to fostering sensible investing through deeper business understanding. The application features a comprehensive marketing site, a watchlist feature for authenticated users, and robust authentication via Google Sign-In.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, leveraging Vite for development, Wouter for routing, and TanStack Query for data management. UI components are sourced from Shadcn UI (built on Radix UI) and styled with Tailwind CSS, adhering to a minimalist design system featuring a monochrome palette, teal accent, and Inter typography. It supports theme toggling and employs a component-based architecture without a global state management library. Key UI patterns include a hero section, structured results with visual clustering, and strong heading hierarchies. The application also supports Progressive Web App (PWA) installation.

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

### Timing Stage (Technical Analysis)

The Timing stage employs a consistent pattern matching Valuation/Performance stages, featuring horizontal navigation for Trend/Momentum/Stretch selection, a two-panel layout with a quadrant visual and explanation, and a timeframe toggle (Weekly/Daily). The Stretch Module uses investor-native language for RSI interpretation, while the Momentum Module employs deterministic case mapping for consistent summaries.

### Strategy Stage (Investment Planning)

The Strategy stage is a user-authored planning tool, featuring a two-column layout for conviction, amount, and "I'm wrong if" builder on the left, and a plan preview with editable tranches on the right. It includes takeaways from other stages, weighted tranche sizing based on conviction, and flexible "When/Gate" tranche scheduling. Manual overrides for tranche amounts are supported, along with a guided "I'm wrong if" builder. All summaries use neutral, non-advisory language.

### Paywall / Email Gate

A three-state paywall (`locked` | `skipped` | `unlocked`) gates analysis stages 4-6 behind email capture, offering a "Friday Report → Monday Actions" value proposition. State management uses localStorage, with auto-unlock for returning users. The paywall uses floating modals (`EmailPaywall`) and an inline banner (`InlineEmailCapture`), with distinct modes for different stages. Email submissions are tracked, and `new_lead` GA4 conversion events are fired upon successful email capture. A `TickerFollowPrompt` banner encourages unlocked users to follow specific tickers.

### Authentication

Google sign-in is implemented via Replit Auth (OpenID Connect). The backend handles login/logout/callback with `passport` and `express-session` backed by PostgreSQL. The client uses a `useAuth()` hook to provide user authentication status.

## External Dependencies

-   **SEC EDGAR API:** For company CIK mapping, filing submissions, and 10-K document access.
-   **OpenAI API:** Utilizes GPT-4 for AI-powered business analysis, summarization, structured output validation, icon mapping, and custom prompts.
-   **Third-Party UI Libraries:** Radix UI (accessible component primitives), Lucide React & React Icons (UI icons), cmdk (command palette), date-fns (date formatting), qrcode.react (QR code generation), recharts (charting and data visualization).
-   **Development Tools:** Vite (frontend build tool), ESBuild (backend bundling), tsx (TypeScript execution in development).
-   **Clearbit Logo API:** Displays company logos.