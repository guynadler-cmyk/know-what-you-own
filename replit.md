# Know What You Own - 10-K Business Summary App

## Overview

"Know What You Own" is a free web application providing AI-powered, plain-English summaries of SEC 10-K filings to help investors understand public companies. It aims to demystify financial reports and make investment research accessible, offering immediate access to comprehensive analyses without requiring sign-up. This project serves as a proof-of-concept for Restnvest, a platform focused on fostering sensible investing through deeper business understanding.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, utilizing Vite for development, Wouter for routing, and TanStack Query for data management. UI components are from Shadcn UI (built on Radix UI) and styled with Tailwind CSS, following a minimalist design system with a monochrome palette, teal accent, and Inter typography. It supports theme toggling and uses a component-based architecture without a global state management library. Key UI patterns include a hero section, structured results with visual clustering, and strong heading hierarchies. The application also supports Progressive Web App (PWA) installation.

### Backend Architecture

The backend uses Node.js and Express.js with TypeScript, exposing a RESTful API, primarily `/api/analyze/:ticker`. Input validation is performed using shared Zod schemas. The data flow involves ticker validation, CIK mapping, fetching 10-K filings from SEC EDGAR, extracting the business section, and sending it to OpenAI for summarization. A service layer pattern separates `secService` for SEC interactions and `openaiService` for OpenAI API calls.

### Data Storage & Security

The application uses a dual database architecture:
- **External Database** (`EXTERNAL_DATABASE_URL`): Google Cloud SQL PostgreSQL for SEC analysis caching (business analysis, temporal analysis, footnotes analysis). Configured with SSL CA certificate (`PG_CA_CERT`) and `checkServerIdentity` disabled for Cloud SQL proxy compatibility. Connection defined in `server/db.ts`, used by repositories in `server/repositories/`.
- **Internal Database** (`DATABASE_URL`): Replit-managed PostgreSQL for app data — users, sessions, waitlist signups, and scheduled checkup emails. Connection defined in `server/internalDb.ts`, used by `server/storage.ts` and `connect-pg-simple` session store.

Zod schema validation ensures data quality, with incomplete AI responses resulting in errors.

### GA4 Conversion Tracking

A single `new_lead` GA4 event fires via Firebase Analytics when a user's email is written to the database for the **first time**. Deduplication checks both `waitlist_signups` and `scheduled_checkup_emails` tables (case-insensitive, normalized to lowercase on insert). All four write endpoints (`/api/lead`, `/api/waitlist`, `/api/strategy-email`, `/api/scheduled-checkups`) return `isNewLead: true/false` in their response. The frontend fires the event only when `isNewLead` is true. Event parameters include `lead_source` (popup/strategy_email/reminder), `ticker`, `stage`, and `company_name` for GA4 analysis. In Google Ads, this single event should be marked as a conversion.

### Type Safety & Validation

Shared Zod schemas, located in `/shared/schema.ts`, ensure type safety and data consistency across both frontend and backend. These schemas define the structure for various data entities and enable runtime validation.

### UI/UX Decisions

The application features a clear, minimalist design with a monochrome palette and a teal accent. It includes a hero section, structured results page with visual clustering, strong heading hierarchies, and accessible elements like mobile-friendly tag explanations using Radix UI Popovers. Investment analysis is multi-dimensional, categorizing drivers into Strategic Themes, Competitive Moats, Market Opportunity, and Value Creation, each with visual icons and color-coded emphasis scoring. A prominent AI-powered investment thesis section summarizes how companies plan to create shareholder value. The landing page provides marketing and onboarding, while an "App page" focuses on analysis, with intuitive navigation between them. The application supports easy link sharing and PWA installation.

### Timing Stage (Technical Analysis)

The Timing stage uses a consistent pattern matching Valuation/Performance stages:
- **Navigation**: Horizontal tiles for Trend/Momentum/Stretch selection
- **Two-panel layout**: Left side shows quadrant visual, right side shows explanation panel
- **Timeframe toggle**: Weekly (default, recommended) and Daily options with localStorage persistence
- **Quadrant visuals**: All three modules (Trend, Momentum, Stretch) use the same quadrant grammar

**Stretch Module**: Uses investor-native language framing RSI as a "who's winning" scoreboard:
- X-axis: One-sidedness (RSI level) — Left = Loss-dominant (<50), Right = Win-dominant (>50)
- Y-axis: Pressure shift — Top = Cooling (toward balance), Bottom = Heating (away from balance)
- Quadrant labels: "Bounce setup" (oversold+cooling), "Still sliding" (oversold+heating), "Cooling off" (overbought+cooling), "Overheating" (overbought+heating), "Neutral" (balanced+flat)
- Chips: "RSI" (Oversold/Balanced/Overbought) + "Pressure" (Heating/Cooling/Flat)
- Pressure calculation: Based on 3-period lookback of distance from balance (RSI=50), with 1-point flat threshold
- "How to read this" guided helper provides 3 bullets explaining the visual

**Momentum Module**: Deterministic Case A/B/C mapping ensures chips never contradict summaries:
- Case A (both weakening): "Downside pressure building" or "easing"
- Case B (short improving, long weak): "Early recovery" or "Bounce fading"
- Case C (both improving): "Momentum aligning" or "Improving but volatile"

### Strategy Stage (Investment Planning)

The Strategy stage (stage 5) is a user-authored planning tool (no investment advice). Key features:
- **Two-column layout**: Left = Conviction slider + Amount input + "I'm wrong if" builder; Right = Plan preview with editable tranches
- **Takeaways**: Expanded by default, compact cards showing Performance/Valuation/Timing summaries with "View details" links that navigate back to the respective stage
- **Weighted tranche sizing**: Non-linear allocation by conviction tier:
  - Exploring (5 tranches): [0.12, 0.18, 0.20, 0.25, 0.25]
  - Interested (3 tranches): [0.35, 0.33, 0.32]
  - High conviction (2 tranches): [0.60, 0.40]
  - Rounding remainder goes to tranche 1
- **When/Gate tranche scheduling**: Each tranche has two fields:
  - **When** (required): Time-only scheduling — Now/soon, After next earnings, In 30 days, On a specific date (date picker), Manual
  - **Gate** (optional, progressive disclosure): Self-check condition — "Fundamentals still look healthy", "My 'I'm wrong if...' conditions are NOT true", "I've re-read the takeaways", "Manual check"
  - Gate hidden by default, revealed via "+ Add a condition" button, removable with X
  - Default: Tranche 1 = "Now / soon", others = "In 30 days"
- **Legacy migration**: Old `trigger` field auto-migrated via `migrateLegacyTranche()` — "recheck" → when=manual + gate=fundamentals_ok
- **Manual overrides**: Each tranche has editable amount with auto/manual lock icon; Reset to auto-split and Even split controls; Remaining/Over indicator with Fix button
- **Amount formatting**: Displayed with Intl.NumberFormat commas, digit-only input sanitization, numeric state storage
- **Guided "I'm wrong if" builder**: 3 chip groups (Area, Change, Threshold), preview sentence, add/delete/reorder statements, final editable textarea
- **Neutral language**: All takeaway summaries use factual, non-advisory wording (no "consider waiting", "worth considering", etc.)
- **Save/Email payload**: Includes conviction, total amount, tranches (with manual/auto flag), "I'm wrong if" text, snapshot scores, and displayed takeaway texts

## External Dependencies

-   **SEC EDGAR API:** For company CIK mapping, filing submissions, and 10-K document access.
-   **OpenAI API:** Utilizes GPT-4 for AI-powered business analysis, summarization, structured output validation, icon mapping, and custom prompts.
-   **Third-Party UI Libraries:**
    -   **Radix UI:** Accessible component primitives.
    -   **Lucide React & React Icons:** UI icons.
    -   **cmdk:** Command palette.
    -   **date-fns:** Date formatting.
    -   **qrcode.react:** QR code generation.
    -   **recharts:** Charting and data visualization.
-   **Development Tools:**
    -   **Vite:** Frontend build tool.
    -   **ESBuild:** Backend bundling.
    -   **tsx:** TypeScript execution in development.
-   **Clearbit Logo API:** Displays company logos.