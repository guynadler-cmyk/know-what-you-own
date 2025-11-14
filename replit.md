# Know What You Own - 10-K Business Summary App

## Overview

"Know What You Own" is a free web application providing AI-powered, plain-English summaries of SEC 10-K filings to help investors understand public companies. It aims to demystify financial reports, making investment research accessible by offering immediate access to comprehensive analyses without requiring sign-up. This project serves as a proof-of-concept for Restnvest, a platform dedicated to fostering sensible investing through deeper business understanding.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, utilizing Vite for development and Wouter for routing. TanStack Query manages data fetching and server state. The UI uses Shadcn UI components (built on Radix UI) styled with Tailwind CSS, featuring a minimalist design with a monochrome palette, teal accent, Inter typography, and strong visual hierarchy. It supports light/dark modes and employs a component-based architecture without a global state management library. Key UI patterns include a hero section and structured results with visual clustering.

### Backend Architecture

The backend uses Node.js and Express.js with TypeScript, exposing a RESTful API, primarily `/api/analyze/:ticker`. Zod schemas, shared with the frontend, handle input validation. The data flow involves ticker validation, CIK mapping, fetching 10-K filings from SEC EDGAR, extracting the business section, and sending it to OpenAI for summarization. A service layer separates concerns for SEC and OpenAI interactions.

### Data Storage & Security

The application is fully public with no authentication. Company analysis data is not persisted; it is fetched in real-time from the SEC EDGAR API to ensure freshness. Zod schema validation maintains data quality, with incomplete AI responses resulting in errors. This zero-friction approach allows immediate access to full analyses.

### Type Safety & Validation

Shared Zod schemas in `/shared/schema.ts` enforce type safety and data consistency across frontend and backend. They define data structures for various entities and enable runtime validation, preventing invalid data propagation.

### UI/UX Decisions

The application employs a minimalist design system with a monochrome palette and a teal accent. Typography uses the Inter font, and visual hierarchy is established with bordered containers and consistent spacing. The application supports theme toggling for light/dark modes. Investment analyses are presented with four distinct tag categories (Strategic Themes, Competitive Moats, Market Opportunity, Value Creation), each with visual icons and color-coded emphasis levels. A new landing page provides a hero section, sample AI stock cards, benefits, and a PWA QR code. Mobile accessibility for tag explanations has been implemented using Radix UI Popover for click/tap support.

### Feature Specifications

The application provides AI-powered investment thesis analysis with four distinct dimensions (Strategic Themes, Competitive Moats, Market Opportunity, Value Creation), comprehensive business overviews, key metrics from official filings, competitor analysis, leadership information, and curated resources. It includes share functionality via the Web Share API and PWA installation support via QR codes and instructions. The main carousel features three visually distinct slides, each showcasing a different aspect of the analysis (Filing Analysis, Emphasis Scoring, Four Dimensions) with aggressive marketing messaging.

**6-Stage Investment Journey:** After analyzing a company, users navigate through six progressive stages: (1) Understand the Business (full analysis with SummaryCard), (2) Understand Performance, (3) Evaluate the Stock, (4) Plan Your Investment, (5) Time It Sensibly, and (6) Protect What's Yours. Features include a collapsible philosophy narrative explaining the investment approach, numbered circle navigation (1-6) with teal highlighting for the current stage, stage-specific content (Stage 1 shows full analysis, Stages 2-6 show "Coming Soon" placeholders), and contextual transition buttons ("I like this business - let's check performance →" for Stage 1, "Continue to Next Stage →" and "← Previous Stage" for others). URL syncing with `?ticker=X&stage=N` enables direct navigation and sharing of specific stages.

## Recent Changes

### 6-Stage Investment Journey Added (Nov 2025)
**Implemented progressive navigation system for investment decision-making:**
- **Journey Narrative:** Collapsible section explaining investment philosophy ("We only buy great businesses at great prices, entered wisely, protected carefully") with 6-step breakdown
- **Stage Navigation:** Numbered circles (1-6) with teal highlighting for current stage, clickable for direct navigation
- **Stage Content:**
  - Stage 1: "Understand the Business" - Full company analysis (existing SummaryCard)
  - Stage 2: "Understand Performance" - Coming Soon
  - Stage 3: "Evaluate the Stock" - Coming Soon
  - Stage 4: "Plan Your Investment" - Coming Soon
  - Stage 5: "Time It Sensibly" - Coming Soon
  - Stage 6: "Protect What's Yours" - Coming Soon
- **Transition Buttons:** Context-aware navigation with stage-specific button text
- **URL Syncing:** Full support for `?ticker=AAPL&stage=3` format, enabling direct stage navigation and sharing
- **LandingPage Redirect:** Automatic redirect from `/` to `/app` when ticker param is present in URL

### Service Worker Removed (Nov 2025)
**Eliminated service worker to solve persistent caching issues:**
- **Removed:** Service worker registration from `index.html` and `service-worker.js` file
- **Added:** Cleanup script in `index.html` that actively unregisters any existing service workers and clears all caches
- **How Cleanup Works:** Script runs on every page load, detects old service workers, unregisters them, clears caches, and reloads once
- **Rationale:** Service worker caused aggressive caching that prevented users from seeing latest updates, even after deployments
- **PWA Features Preserved:** App still supports "Add to Home Screen" on iOS/Android, Web Share API, and all PWA metadata via `manifest.json`
- **Why Service Worker Not Needed:** App requires internet connection for SEC API and OpenAI calls, so offline mode provides no value
- **Result:** Users now always get the latest version immediately, no more cache invalidation issues
- **Mobile Experience:** Smooth installation, sharing, and updates without caching problems

### Stock Performance Section Removed (Nov 2025)
**Removed mock data section based on beta tester feedback:**
- **Removed Components:** Years to Doubling card and Metric Carousel (P/E, Revenue Growth, etc.)
- **Rationale:** Beta testers indicated the mock stock performance visualizations were not adding value
- **Cleanup:** Removed all related imports, props, and mock data generation
- **Preserved Sections:** Investment Thesis, Business Overview, By The Numbers (filing metrics), Market Context, Resources
- **Why:** Focus on high-value filing analysis rather than placeholder market data
- **Testing:** End-to-end tests confirmed clean removal with no regressions

## External Dependencies

-   **SEC EDGAR API:** For ticker-to-CIK mapping, retrieving filing submissions, and accessing 10-K documents.
-   **OpenAI API:** Utilizes GPT-4 for AI-powered business analysis, summarization, structured output validation, and custom prompts.
-   **Third-Party UI Libraries:** Radix UI (accessible components), Lucide React & React Icons (UI icons), cmdk (command palette), date-fns (date formatting), qrcode.react (QR code generation).
-   **Development Tools:** Vite (frontend build), ESBuild (backend bundling), tsx (TypeScript execution).
-   **Clearbit Logo API:** Used for displaying company logos.
-   **recharts:** For charting and data visualization.