# Know What You Own - 10-K Business Summary App

## Overview

"Know What You Own" is a free web application designed to help investors understand public companies by providing AI-powered, plain-English summaries of SEC 10-K filings. It aims to demystify financial reports, making investment research accessible beyond just ticker symbols. The application provides immediate access to comprehensive analyses, including business overviews, performance metrics, market context, and resources - no sign-up required. This project serves as a proof-of-concept for Restnvest, a platform dedicated to fostering sensible investing through deeper business understanding.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, using Vite for fast development and Wouter for client-side routing. Data fetching and server state management are handled by TanStack Query. The UI employs Shadcn UI components built on Radix UI primitives, styled with Tailwind CSS following a minimalist design system. This system features a monochrome palette with a teal accent, Inter typography, and a strong visual hierarchy with bordered containers and consistent spacing. The application supports theme toggling for light/dark modes and utilizes component-based architecture without a global state management library for simplicity. Key UI patterns include a hero section, structured results page with clear visual clustering, and strong heading hierarchies.

### Backend Architecture

The backend is developed with Node.js and Express.js, leveraging TypeScript for type safety. It exposes a RESTful API with a primary `/api/analyze/:ticker` endpoint. Input validation is performed using Zod schemas, shared with the frontend to ensure consistency. The data flow involves ticker validation, mapping to CIK, fetching 10-K filings from SEC EDGAR, extracting the business section, and sending it to OpenAI for summarization. A service layer pattern separates concerns, with `secService` for SEC interactions and `openaiService` for OpenAI API calls.

### Data Storage & Security

The application uses a fully public API with no authentication required. Company analysis data is not persisted; instead, it is fetched in real-time from the SEC EDGAR API to ensure data freshness and simplify the architecture. Zod schema validation ensures data quality and completeness, with incomplete AI responses resulting in errors rather than partial data. This zero-friction approach allows users to immediately access full company analyses without creating an account.

### Type Safety & Validation

Shared Zod schemas, located in `/shared/schema.ts`, are central to maintaining type safety and data consistency across both frontend and backend. These schemas define the structure for various data entities (products, leaders, competitors, metrics, operations, and the full company summary) and enable runtime validation, preventing invalid data propagation. Path aliases are configured for seamless imports.

## External Dependencies

- **SEC EDGAR API:** Used for mapping company tickers to CIKs, retrieving filing submissions (`company_tickers.json`, `submissions/CIK##########.json`), and accessing 10-K documents. Requires a custom User-Agent header.
- **OpenAI API:** Utilizes GPT-4 for AI-powered business analysis and summarization, structured output validation via Zod schemas, icon mapping, and custom prompts.
- **Third-Party UI Libraries:**
    - **Radix UI:** Provides accessible component primitives.
    - **Lucide React & React Icons:** For various UI icons.
    - **cmdk:** Command palette component.
    - **date-fns:** Date formatting utilities.
    - **qrcode.react:** QR code generation for PWA installation
- **Development Tools:**
    - **Vite:** Frontend build tool.
    - **ESBuild:** Backend bundling.
    - **tsx:** For direct TypeScript execution in development.
- **Clearbit Logo API:** Used for displaying company logos.
- **recharts:** For charting and data visualization.

## Recent Changes

### Removed Authentication - Open Access (Latest - Nov 2025)
**Simplified user experience by removing all authentication barriers:**
- **No sign-up required:** Users get immediate access to full company analyses
- **Removed freemium restrictions:** Everyone receives complete data (all products, metrics, competitors, etc.)
- **Simplified architecture:** Removed Replit Auth, session management, and user database
- **Clean header:** Removed login/logout buttons - now only shows Share, Install, and Theme toggle
- **Single-page experience:** Consolidated to one AppPage instead of separate landing/authenticated views
- **Why:** Early validation phase - want users to try the full product before asking for accounts

### Share & Install Functionality (Nov 2025)
**Added easy link sharing and PWA installation throughout the app:**
- **ShareButton Component:** Uses Web Share API for native mobile sharing (texts, email, social media)
  - Fallback to clipboard copy with toast notification on unsupported browsers
  - Visible in header on all pages with "Share" text label and outline style
  - Accessible to both authenticated and unauthenticated users
- **Install Button:** Download icon in header opens QR code dialog for PWA installation
  - QR code can be scanned with phone camera to install on iOS/Android
  - Shows step-by-step installation instructions
  - Available on all pages for convenient installation access
- **User Experience:** One-click sharing on mobile (share sheet) or desktop (copy to clipboard), and easy PWA installation via QR code

### Progressive Web App (PWA) Support (Nov 2025)
**Made restnvest installable as a mobile app:**
- Web App Manifest with restnvest branding, teal theme color, standalone display mode
- Generated 192x192 and 512x512 app icons with teal brand color
- Service worker for offline caching and faster load times
- iOS and Android support with proper meta tags
- QR code on landing page "Take it with you" section with installation instructions
- Install App button in AppPage header for users who skip landing page
- QRCodeDisplay reusable component using qrcode.react

### Stock Performance Section & Company Logo (Nov 2025)
**Added comprehensive stock performance visualization:**
- Company logo display at top of results using Clearbit Logo API with Building icon fallback
- Years to Doubling visualization with teal-branded card using Rule of 72
- Metric carousel with 6 scrollable performance metrics (P/E, Revenue Growth, Profit Margin, FCF, ROE, Debt/Equity)
- Each metric includes plain-English explanation and 5-year historical chart
- Mock data generation function for testing
- Section positioned between Market Context and Resources

### Freemium Authentication (Nov 2025)
**Complete two-tier system with Replit Auth:**
- PostgreSQL database for authentication and session management
- Public landing page with hero section and demo feature
- Demo shows limited preview (tagline, website, ≤3 products, CEO, 1 video)
- Seamless login flow with ticker preservation through sessionStorage
- Full analysis available to authenticated users