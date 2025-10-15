# Design Guidelines: Know What You Own - 10-K Business Summary App

## Design Approach

**Selected Approach:** Design System with Fintech Reference
- **Inspiration:** Stripe's clarity + Robinhood's approachability + traditional finance trust
- **Rationale:** Financial tools require trustworthiness, clarity, and efficiency. Users need to quickly understand complex business information without distraction.
- **Principles:** Information hierarchy, trust through simplicity, purposeful use of space

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: 220 90% 56% (Trust Blue - CTAs, links, emphasis)
- Background: 0 0% 100% (Pure White)
- Surface: 220 14% 96% (Soft Gray - cards, elevated surfaces)
- Text Primary: 220 9% 15% (Near Black)
- Text Secondary: 220 9% 46% (Medium Gray)
- Border: 220 13% 91% (Subtle borders)
- Success: 142 71% 45% (Data positive)
- Warning: 38 92% 50% (Alerts)

**Dark Mode:**
- Primary: 220 90% 56% (Same blue, accessible on dark)
- Background: 220 13% 9% (Deep Navy Black)
- Surface: 220 12% 14% (Elevated surfaces)
- Text Primary: 220 9% 98% (Near White)
- Text Secondary: 220 9% 65% (Light Gray)
- Border: 220 13% 20% (Subtle borders)

### B. Typography

**Font Families:**
- Primary: Inter (Google Fonts) - Clean, professional, excellent readability for financial data
- Monospace: JetBrains Mono - For ticker symbols, numbers, technical data

**Hierarchy:**
- H1: 2.5rem/3rem, font-bold (Page titles)
- H2: 2rem/2.5rem, font-semibold (Section headers)
- H3: 1.5rem/2rem, font-semibold (Card titles)
- Body Large: 1.125rem/1.75rem, font-normal (Primary content)
- Body: 1rem/1.5rem, font-normal (Standard text)
- Small: 0.875rem/1.25rem, font-normal (Metadata, captions)
- Ticker/Data: 1rem/1.5rem, font-mono, font-medium (Stock symbols, numbers)

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 4, 6, 8, 12, 16, 24
- Consistent spacing: p-4, p-6, p-8 for cards
- Section gaps: gap-6, gap-8, gap-12
- Page padding: px-4 md:px-6 lg:px-8

**Grid Structure:**
- Single column focus on mobile/tablet
- Max-width container: max-w-4xl for optimal reading
- Form width: max-w-md for input sections
- Results width: max-w-3xl for summaries

### D. Component Library

**Input Section:**
- Large, centered ticker input with clear label
- Input styling: border-2, rounded-lg, px-6 py-4, text-lg
- Search/Submit button: Primary color, rounded-lg, px-8 py-3
- Placeholder: "Enter stock ticker (e.g., AAPL, TSLA)"
- Real-time validation feedback below input

**Results Card:**
- White/dark surface card with border
- Rounded corners: rounded-xl
- Padding: p-8
- Shadow: shadow-lg for depth
- Header section: Company name + ticker (mono font) + filing date
- Divider line between header and summary
- Summary text: Body Large size, generous line-height

**Status Indicators:**
- Loading state: Spinner with "Fetching 10-K filing..." message
- Success: Subtle green accent on card border
- Error: Warning color alert banner with clear message
- Info badges: Small pills for filing type (10-K), fiscal year

**Navigation (Header):**
- Simple top bar with logo/app name left
- Minimal navigation (About, How it Works links)
- Height: h-16
- Border bottom: Subtle border

**Footer:**
- Simple centered layout
- SEC disclaimer text (small, secondary color)
- Link to Restnvest, Privacy Policy
- Note: "Powered by SEC EDGAR & OpenAI"

### E. Page Layouts

**Home/Input Page:**
- Hero section (40vh): 
  - Centered content
  - App tagline: "Understand the businesses you own"
  - Subtext: Brief value proposition
  - Background: Subtle gradient from primary (10% opacity) to transparent
- Input section: 
  - Centered, max-w-md
  - Large ticker input
  - Clear CTA button
  - Example tickers shown below
- Features section:
  - 3-column grid (mobile: stack)
  - Icon + title + description
  - Icons: Document (10-K filing), Brain (AI summary), Check (Plain English)

**Results Page:**
- Back button (top left, secondary style)
- Company header card:
  - Large company name
  - Ticker symbol (mono, muted)
  - Filing date (small, secondary)
- Business Summary card:
  - "Business Description" heading
  - AI-generated summary (generous spacing)
  - Source attribution at bottom
- Metadata section:
  - Filing type, fiscal year, CIK (collapsed/expandable)

## Images

**Hero Section Background (Optional Enhancement):**
- Abstract financial chart visualization or minimalist business imagery
- Treatment: 20% opacity overlay, blurred slightly
- Alt: Keep solid gradient if image complicates clarity
- Position: Background of hero section only

**No other images needed** - This is an information-focused utility tool where clarity trumps decoration.

## Interaction Patterns

**Input States:**
- Default: Border subtle
- Focus: Primary color border, ring effect
- Error: Warning color border + shake animation
- Valid: Success color border

**Button States:**
- Default: Primary background, white text
- Hover: Slightly darker (brightness-95)
- Active: Even darker (brightness-90)
- Loading: Disabled state with spinner

**Card Animations:**
- Results appear: Fade in + slide up (300ms ease)
- No aggressive animations - maintain professional feel

## Accessibility & Responsiveness

- Maintain WCAG AAA contrast ratios
- Dark mode: Consistent implementation across all components
- Input fields: Large touch targets (min 44px height)
- Error messages: Clear, actionable text with icons
- Responsive breakpoints: sm (640px), md (768px), lg (1024px)
- Focus indicators: Clear ring on all interactive elements

## Design Philosophy

**Trust Through Clarity:** Every design decision prioritizes user understanding over visual flourish. Financial information demands trustworthiness - achieved through consistent spacing, clear typography, and purposeful use of color.

**Progressive Disclosure:** Show essential information first, make additional details available without overwhelming. The ticker input is prominent, results are comprehensive but scannable, metadata is available but not intrusive.

**Professional Minimalism:** Clean interfaces build confidence. Use whitespace generously, limit color to purposeful accents, ensure every element serves the user's goal of understanding businesses.