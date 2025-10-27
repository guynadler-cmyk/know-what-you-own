# Design Guidelines - Steve Jobs Minimalist Aesthetic

## Philosophy
"Simplicity is the ultimate sophistication." - Leonardo da Vinci (Jobs' favorite quote)

This app embodies Steve Jobs' design philosophy:
- **Focus**: One thing at a time, clear hierarchy
- **Minimalism**: Remove everything unnecessary
- **Beauty**: Every pixel matters
- **Premium**: Attention to detail creates delight
- **Clarity**: No confusion, instant understanding

## Color Palette

### Monochrome Foundation
- **Pure White**: `#FFFFFF` - Primary background, creates breathing room
- **Deep Black**: `#000000` - Primary text, bold statements
- **Subtle Gray**: `#F5F5F7` - Secondary backgrounds (Apple gray)
- **Mid Gray**: `#86868B` - Secondary text, understated elements
- **Divider Gray**: `#D2D2D7` - Subtle separation

### Single Premium Accent
- **Teal**: `hsl(180, 70%, 28%)` - Primary actions, focus (company brand color, WCAG AA compliant)
- **Teal Hover**: `hsl(180, 70%, 24%)` - Interactive states

### Status Colors (Minimal Use)
- **Success Green**: `#30D158` - Positive feedback only
- **Alert Red**: `#FF453A` - Errors only, sparingly

## Typography

### Typeface
- **Primary**: SF Pro Display / Inter (clean, modern sans-serif)
- **Monospace**: SF Mono / JetBrains Mono (for ticker symbols)

### Scale (Large & Bold)
- **Hero**: 72px, weight 700, letter-spacing -0.02em
- **Headline**: 48px, weight 700, letter-spacing -0.01em
- **Title**: 32px, weight 600
- **Subtitle**: 24px, weight 500
- **Body Large**: 20px, weight 400, line-height 1.6
- **Body**: 17px, weight 400, line-height 1.5
- **Caption**: 15px, weight 400
- **Small**: 13px, weight 400

### Rules
- Headlines are BOLD and SHORT
- Body text is generous in line-height (1.5-1.6)
- Never use more than 2 font weights per view
- Ticker symbols always in monospace

## Spacing

### The 8-Point Grid
All spacing uses multiples of 8px:
- **Micro**: 8px (rare, tight relationships)
- **Small**: 16px (related elements)
- **Medium**: 24px (section separation)
- **Large**: 48px (major sections)
- **XLarge**: 80px (hero sections)
- **XXLarge**: 120px (page sections)

### Whitespace Philosophy
- "White space is like air - it lets content breathe"
- Generous padding around all elements (minimum 24px)
- Large margins between sections (80px+)
- Content never touches edges (minimum 32px from viewport)

## Layout

### Centered, Focused Design
- **Max Content Width**: 1200px (readable, not overwhelming)
- **Centered**: All content centered on page
- **Single Column**: One clear path through content
- **Hierarchy**: Size creates importance, not color

### Hero Section
- Full viewport height (100vh)
- Centered headline + tagline
- Single, prominent CTA button
- Minimal, no distractions
- Generous whitespace (80% empty space)

### Results Section
- Clean cards with subtle shadows
- One idea per card
- Clear hierarchy within cards
- Breathing room between all elements

## Components

### Buttons
**Primary Button (CTA):**
- Large pill shape (fully rounded)
- Teal background
- White text, weight 600
- Generous padding: 16px 48px
- Minimum height: 56px
- Smooth hover: slight scale (1.02)
- Fast transition: 0.2s ease

**Secondary Button:**
- Pill shape
- Transparent background
- 2px Teal border
- Teal text
- Same padding as primary

**Text Button:**
- No background, no border
- Teal text only
- Subtle underline on hover

### Input Fields
- Large, spacious (height 56px)
- Subtle border (1px #D2D2D7)
- Rounded corners (12px, not fully rounded)
- Focus: Teal border (2px)
- Placeholder: Mid Gray
- Padding: 16px 24px

### Cards
- White background
- Subtle shadow: 0 2px 8px rgba(0,0,0,0.04)
- Rounded corners: 16px
- Generous internal padding: 32px
- Hover: subtle lift (shadow grows)

### Icons
- Outlined style (not filled)
- Consistent stroke width (2px)
- Single color (usually Mid Gray)
- Size: 24px standard, 32px for emphasis

## Animation & Motion

### Principles
- **Fast**: 200ms for small changes
- **Smooth**: Ease-out timing (starts fast, ends slow)
- **Purposeful**: Every animation has a reason
- **Subtle**: Never distracting

### Examples
- Hover states: 0.2s ease-out
- Page transitions: 0.3s ease-out
- Loading indicators: smooth, continuous
- Card entrance: subtle fade + slide up

## Imagery & Visual Elements

### Minimal Use
- No stock photos
- No decorative graphics
- No unnecessary illustrations
- Only functional icons

### When Used
- High quality only
- Ample breathing room around
- Never distract from content
- Support the message, don't compete

## Voice & Tone

### Copywriting Style
- **Bold statements**: Short, powerful headlines
- **Clear benefit**: User understands value immediately  
- **No jargon**: Plain English, accessible to all
- **Confident**: Direct, authoritative, not apologetic
- **Inspiring**: Connect emotionally

### Examples
- ❌ "Analyze SEC 10-K filings using AI"
- ✅ "Understand the businesses you own."

- ❌ "Please enter a stock ticker symbol"
- ✅ "Which company?"

## Dark Mode
- Pure black background (#000000)
- White text (#FFFFFF)
- Lighter teal for dark mode (hsl(180, 70%, 70%)) - WCAG AA compliant contrast on dark backgrounds
- Subtle grays adjusted for dark (#1C1C1E, #2C2C2E)
- Note: Primary buttons in dark mode use black text on lighter teal background (inverted from light mode)

## Accessibility
- WCAG AA contrast minimum (4.5:1 for text)
- Large touch targets (minimum 44x44px)
- Clear focus indicators (teal outline, 2px)
- Keyboard navigation fully supported

## Visual Clustering

### Information Grouping
Related information must be visually grouped to aid comprehension:
- **Use subtle backgrounds** to cluster related sections
- **Add spacing between clusters** (48px+) but tighter within (24px)
- **Clear section dividers** between major topic areas
- **Visual hierarchy** shows relationships at a glance

### Section Containers
- Subtle background color (muted/secondary tones)
- Generous internal padding (32-48px)
- Rounded corners (16px)
- Clear spacing between containers
- Never nest containers more than 2 levels deep

### Grouping Strategy
Group by logical relationship, not just type:
- Business Overview (what + how)
- Performance Data (metrics + operations)
- Market Context (competition + leadership)
- External Resources (news + videos)

## The "One More Thing"
Every screen should have ONE clear focus:
- Homepage: Enter ticker
- Results: Understand the business
- Error: Try again

Never compete for attention. Clear hierarchy. Obvious next step.
