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

## Recent Changes

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