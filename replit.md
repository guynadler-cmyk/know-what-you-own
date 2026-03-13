# Know What You Own - 10-K Business Summary App

## Overview

"Know What You Own" is a free web application that provides AI-powered, plain-English summaries of SEC 10-K filings to help investors understand public companies. It aims to demystify financial reports and make investment research accessible by offering immediate access to comprehensive analyses. The project serves as a proof-of-concept for Restnvest, a platform dedicated to fostering sensible investing through deeper business understanding. The application features a comprehensive marketing site, a watchlist feature for authenticated users, and robust authentication via Google Sign-In.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, leveraging Vite, Wouter for routing, and TanStack Query for data management. UI components are from Shadcn UI (built on Radix UI) and styled with Tailwind CSS, adhering to a minimalist design system featuring a monochrome palette, teal accent (`--lp-teal-deep: #0d4a47`), and specific typography (DM Sans, Playfair Display, DM Mono). It supports theme toggling, employs a component-based architecture, and is a Progressive Web App (PWA).

### Backend Architecture

The backend utilizes Node.js and Express.js with TypeScript, exposing a RESTful API. Input validation uses shared Zod schemas. Data flow involves ticker validation, CIK mapping, fetching 10-K filings from SEC EDGAR, extracting business sections, and sending to OpenAI for summarization. A service layer separates SEC interactions (`secService`) and OpenAI API calls (`openaiService`).

### Data Storage & Security

The application uses a dual database architecture: Google Cloud SQL PostgreSQL for SEC analysis caching and Replit-managed PostgreSQL for application data (users, sessions, waitlist signups). Zod schema validation ensures data quality.

### UI/UX Decisions

The application features a clear, minimalist design with a monochrome palette and a teal accent. Key elements include a hero section, structured results with visual clustering, strong heading hierarchies, and mobile-friendly tag explanations. Investment analysis is multi-dimensional, categorizing drivers into Strategic Themes, Competitive Moats, Market Opportunity, and Value Creation, with visual icons and color-coded emphasis scoring. A prominent AI-powered investment thesis section summarizes how companies plan to create shareholder value. The landing page provides marketing and onboarding, while an "App page" focuses on analysis, with intuitive navigation. The application supports easy link sharing and PWA installation. The navigation header has two states: one for marketing/home pages and another for stock analysis, dynamically changing based on context. Analysis stages (2-4) follow a consistent visual pattern with stage headers, compact stage navigation, mac-style analysis card headers, insight panels, scorecard rows, and "coming up next" previews. Valuation quadrant positioning is continuous, not discrete, based on actual metric values. The Timing stage uses a consistent pattern with horizontal navigation for Trend/Momentum/Stretch selection, a two-panel layout, and a timeframe toggle.

### Feature Specifications

*   **Strategy Stage:** A user-authored planning tool with: Research Recap (4-column clickable grid), Conviction Level (3 cards: Exploring/Interested/High Conviction), AI-generated Investment Memo (`GET /api/memo/:ticker`), Guardrails tag builder (multi-row), and Entry Plan (tranche table with amount/timing/condition). Export via email modal. All state persists to localStorage.
*   **Paywall / Email Gate:** A three-state paywall (`locked` | `skipped` | `unlocked`) gates analysis stages 4-6 behind email capture, offering a "Friday Report → Monday Actions" value proposition, with auto-unlock for returning users.
*   **Authentication:** Google Sign-In via Firebase Authentication (Google provider with popup flow). Frontend uses `firebase/auth`, backend uses `firebase-admin` for token verification and user management.
*   **Homepage Interactive Demos:** The landing page includes live, interactive demo sections for Investment Thesis, Changes Over Time, Financial Analysis, and Technical Analysis, reusing cached data or static JSON.
*   **Discover Page:** A VC-style stock discovery engine at `/discover`. Features a grouped tag screener panel (two labelled sections: Competitive Moats + Investment Themes with per-tag frequency counts), AND/OR filter mode toggle, Related Tags co-occurrence suggestions, a Discovery Insights bar (top moat, top theme, grade distribution for filtered set), smart search (matching ticker/name/tag text), sort options (Highest Grade, Lowest Grade, Most Moats, Newest, A→Z, Z→A), Find Similar (Jaccard similarity panel), and a clickable Tag Frequency chart that triggers a "Who else has [tag]?" panel via `GET /api/discover/by-tag?tag=`. Backend endpoints: `GET /api/discover` with `?tags=` and `?mode=all` params, `GET /api/discover/similar?ticker=` returning top 8 Jaccard-similar companies, `GET /api/discover/by-tag?tag=` returning companies matching a specific tag (uses `theme_tags`/`moat_tags` TEXT[] columns). All tag data derived dynamically from actual DB frequency. **Stock Discovery Workflow:** The Investment Thesis section on stock pages and the HeroThesisDemo component include a "Show Companies Similar to [TICKER]" button that opens `/discover` in a new tab with `themes=`, `moats=`, `origin=`, and `name=` query params. The Discover page reads these params on load and pre-populates the active tag filters. An origin banner shows "Showing companies similar to [Company Name]" with a "Back to [TICKER] analysis" link. A drag-and-drop "Build Your Discovery" panel (using `@dnd-kit/core` and `@dnd-kit/sortable`) sits above the results with Available Tags (left) and Selected Tags (right); users can drag tags between panels or click X to remove. Results count line shows "X companies match your strategy" when filters are active.
*   **Investment Discovery Map:** An interactive force-directed graph at `/discover/map` visualizing company relationships based on tag-based similarity. Uses `react-force-graph-2d` to render up to 300 nodes colored by theme cluster (AI Infrastructure=purple #8B5CF6, Cloud Platforms=blue #3B82F6, Cybersecurity=orange #F97316, Data Platforms=teal #14B8A6, Enterprise SaaS=green #22C55E, Semiconductors=amber #D97706). Connection-based node sizing (degree scales node radius). Edges connect companies with similarity > 0.35 (60% tag overlap + 40% Jaccard similarity). Features: zoom/pan, hover highlighting with fade effect (connected nodes stay bright, others fade to 8% opacity), floating legend panel in bottom-left corner, click-to-navigate to `/stocks/:ticker`, search box to focus on a node, `?focus=TICKER` query param for deep linking. Backend endpoint: `GET /api/discover/map` returns `{ nodes, links }`. Entry points: "Investment Map" button on Discover page, "Explore Investment Map" button on stock page TickerContextCard.
*   **Watchlist:** Allows authenticated users to save stock analyses with snapshot history tracking, enabling progression tracking over time. Features include save/update, search, sort, inline notes editing, expandable history, and removal.

## External Dependencies

*   **SEC EDGAR API:** For company CIK mapping, filing submissions, and 10-K document access.
*   **OpenAI API:** Utilizes GPT-4 for AI-powered business analysis, summarization, structured output validation, icon mapping, and custom prompts.
*   **Third-Party UI Libraries:** Radix UI, Lucide React & React Icons, cmdk, date-fns, qrcode.react, recharts.
*   **Development Tools:** Vite, ESBuild, tsx.
*   **Clearbit Logo API:** Displays company logos.