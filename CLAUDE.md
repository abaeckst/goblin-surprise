# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Goblin Surprise MTG Collection Rebuilder** - A React web application for rebuilding a stolen Magic: The Gathering collection through collaborative friend contributions. Users can upload MTGO .dek files to contribute cards, log monetary donations (USD/MTGO tix), and track progress toward completing target decks.

## Commands

### Development
```bash
npm start          # Start development server (http://localhost:3000)
npm run build      # Build production version
npm test           # Run Jest test suite
npm run deploy     # Deploy to GitHub Pages
```

### Environment Setup
- Copy `.env.example` to `.env.local`
- Set `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
- Database connection test runs automatically on app load

## Architecture

### Technology Stack
- **Frontend**: React 19 + TypeScript + Create React App
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **File Processing**: Client-side XML parsing with `fast-xml-parser`
- **Deployment**: GitHub Pages (static hosting)
- **Styling**: Tailwind CSS v3 (properly configured with PostCSS)

### Core Data Flow
```
Card Contributions: MTGO .dek/.txt Upload → Format Detection → Parse (XML/Text) → Database Insert → Real-time Update → Dashboard Refresh
Monetary Donations: Donation Form → Validation → Database Insert → Real-time Update → Progress Recalculation
```

### Database Schema
- `requirement_decks` - Target deck configurations
- `requirement_cards` - Cards needed per deck
- `gathered_cards` - Contributed cards with contributor tracking
- `monetary_donations` - **NEW**: Cash and MTGO tix donations with contributor tracking
- `card_metadata` - Scryfall API data (mana cost, type, rarity, colors, **MTGO prices**)
- `change_log` - Audit trail for all modifications

### Key Services
- `src/services/supabase.ts` - Database operations, real-time subscriptions, and test mode functionality
- `src/services/deckParser.ts` - Universal deck parser with format detection (.dek/.txt)
- `src/services/txtParser.ts` - Plain text deck file parsing with sideboard filtering
- `src/services/requirementsService.ts` - MAX quantity calculation and card status logic
- `src/services/scryfallApi.ts` - Card metadata and price fetching from Scryfall API with robust cross-printing search
- `src/services/scryfallPriceService.ts` - MTGO price data management and caching
- `src/services/priceUpdateService.ts` - Background price updates and batch processing

### Component Structure
```
src/components/
├── upload/           # File upload and processing
│   ├── FileUpload.tsx         # Contribution deck uploads
│   ├── RequirementsUpload.tsx # Target deck requirements uploads
│   └── UploadResults.tsx      # Upload success/error display
├── donations/        # Monetary donation system
│   └── MonetaryDonationForm.tsx # Form for logging USD/MTGO tix donations
├── dashboard/        # Progress tracking and visualization
│   ├── Dashboard.tsx          # Main progress dashboard with collapsible sections
│   ├── ProgressBar.tsx        # Completion percentage visual (1 decimal place)
│   ├── ProgressSummary.tsx    # Summary component with value-based contributor rankings
│   ├── RecentContributions.tsx # Shows both card and monetary contributions
│   └── RequirementDecksOverview.tsx # **NEW**: Collapsible requirement decks display
├── cards/           # Card display tables and management
│   ├── OutstandingCardsTable.tsx # **ENHANCED**: Collapsible, paginated, searchable cards needed
│   └── GatheredCardsTable.tsx    # **ENHANCED**: Collapsible, paginated, searchable gathered cards
├── debug/           # Collection analysis and database correction tools
│   └── DatabaseCorrection.tsx    # Collection vs database discrepancy correction tool
└── common/          # Shared UI components
    └── UploadModeToggle.tsx      # Three-way toggle (Cards → Donations → Requirements)
```

## Business Logic

### Card Quantity Calculations
```typescript
// Requirements: MAX quantity needed across all target decks
required_quantity = MAX(quantity) across all requirement_decks

// Outstanding calculation
outstanding_quantity = required_quantity - gathered_quantity

// Status color coding
RED: outstanding_quantity > 0 (cards still needed)
BLUE: outstanding_quantity === 0 (exact match)
GREEN: outstanding_quantity < 0 (surplus cards)
```

### **NEW: Monetary Donation System**
```typescript
// Donation tracking (1:1 USD to MTGO tix conversion)
monetary_donations = SUM(amount) from all donations

// Value-based progress calculation
total_required_value = SUM(card_price * required_quantity)
total_contributed_value = card_collection_value + monetary_donations
adjusted_outstanding_value = MAX(0, total_required_value - total_contributed_value)
completion_percentage = (total_contributed_value / total_required_value) * 100

// Contributor rankings (by total value, not card count)
contributor_value = card_contribution_value + monetary_donation_amount
```

### File Processing
- **Dual Format Support**: Accepts both MTGO .dek (XML) and .txt (plain text) formats
- **XML Processing**: Supports both element-based and attribute-based XML formats
- **Text Processing**: Simple `<quantity> <card name>` format with automatic sideboard filtering
- **Format Detection**: Automatic detection based on file extension
- **Validation**: Comprehensive error handling for malformed files and invalid data
- **Client-side Only**: No server-side file storage required
- **Contributor Tracking**: Name required for each upload
- **Duplicate Handling**: Automatic card consolidation and quantity aggregation

## Development Guidelines

### TypeScript Usage
- Strict mode enabled - no `any` types
- Comprehensive type definitions in `src/types/`
- Proper error handling with try/catch blocks

### Component Patterns
- Functional components with hooks
- Props interfaces for all components
- Loading states for async operations
- Real-time updates via Supabase subscriptions

### Database Operations
- Use `DatabaseService` class for all operations
- Handle connection failures gracefully
- Implement optimistic UI updates
- Real-time subscriptions for collaborative features

### Testing Strategy
- Focus on critical paths: file upload → parse → database → display
- Test files available in `public/` directory
- Use development tools for data clearing and debugging
- Validate with multiple .dek file formats

## Implementation Plan

**Following implementation_plan_revised.md** for structured development:

**Session 1 (COMPLETE):** ✅ Upload system working with real-time updates  
**Session 2 (COMPLETE):** ✅ Fixed styling issues, enhanced parser for multiple formats  
**Session 3 (COMPLETE):** ✅ Requirements upload system with MAX quantity calculation logic and dashboard
**Session 4 (COMPLETE):** ✅ Export functionality, production build optimization, and deployment preparation
**Session 5 (COMPLETE):** ✅ MTGO Card Pricing System Integration with full price display
**Session 6 (COMPLETE):** ✅ Production deployment preparation with UI cleanup and polish
**Session 7 (COMPLETE):** ✅ **Monetary Donation System** - Full integration of USD/MTGO tix donation tracking
**Session 8 (COMPLETE):** ✅ **Dashboard UX Overhaul** - Responsive redesign with collapsible sections and improved mobile experience

**Current Status:** Full MVP complete with enhanced dashboard UX and production-ready deployment. All features working including real-time MTGO pricing, card contributions tracking, monetary donation logging, dual format file support (.dek/.txt), test mode for safe development, collapsible dashboard sections, database correction tool, and clean production interface.

## Recent Enhancements

### **Database Correction Tool - COMPLETE ✅**
- **Collection vs Database Analysis:** Upload MTGO collection file to identify discrepancies between actual collection and database records
- **Smart Correction Logic:** Automatically identifies cards where database quantity exceeds collection quantity
- **Selective Contributor Targeting:** Preserves specific contributors (e.g., BK) while reducing quantities from other contributors
- **Surgical Database Updates:** Reduces quantities when possible, deletes records only when quantity reaches zero
- **Preview System:** Shows all planned database changes before execution for review and confirmation
- **Safety Features:** Clear warnings, confirmation prompts, and detailed action summaries
- **Real-time Verification:** Re-analyzes collection after corrections to confirm changes were applied correctly
- **Debug View Integration:** Accessible through Debug tab for collection maintenance and data integrity management

### **Dashboard UX Overhaul (Session 8) - COMPLETE ✅**
- **Collapsible Sections:** All three main dashboard sections (Outstanding Cards, Gathered Cards, Requirement Decks) now collapsible with default collapsed state
- **Requirement Decks Display:** New component showing all target decks with progress bars, completion percentages, and expandable card lists
- **Enhanced Card Tables:**
  - **Pagination:** 20 cards per page with smooth navigation controls
  - **Search Functionality:** Real-time search within each table
  - **Compact Layout:** Combined information display (e.g., "3/4" progress) to eliminate horizontal scrolling
  - **Mobile Responsive:** Optimized column headers and stacked information for mobile devices
- **Progressive Disclosure:** Clean initial view with just progress overview, users expand sections as needed
- **No Horizontal Scrolling:** Completely eliminated on both desktop and mobile
- **Visual Progress Indicators:** Inline progress bars and status badges for quick scanning

### **Monetary Donation System Integration (Session 7) - COMPLETE ✅**
- **Database Schema:** Added `monetary_donations` table with contributor tracking, amount, donation type (USD/tix), and optional notes
- **Three-Way Upload Toggle:** Enhanced upload interface with "Contribute Cards → Log Donation → Set Requirements" workflow
- **Value-Based Progress:** Unified progress calculation using monetary donations + card values for accurate completion tracking
- **Real-time Integration:** Live updates across Dashboard and Recent Contributions when donations are logged
- **Contributor Rankings:** Updated leaderboard to rank by total monetary value (cards + donations) instead of card count
- **Visual Distinction:** Monetary donations display with green credit card icons vs blue card contribution icons
- **Progress Breakdown:** Dashboard shows detailed breakdown of card value vs donation value contributing to progress
- **Decimal Precision:** Fixed progress percentages to display 1 decimal place (75.3% instead of 75.287%)
- **Consistent Calculations:** Both Dashboard and Upload tabs now use identical progress calculation methods
- **Test Mode Support:** Full test mode integration for safe donation logging during development

### Recent Contributions Panel Optimization - COMPLETE ✅
- **Data Fetching Overhaul:** Replaced inefficient multiple queries with single batch query for all gathered cards
- **Performance Improvement:** Eliminated N+1 query problem by fetching all data at once and processing client-side
- **Historical Data Support:** Now accurately displays card counts and dollar values for ALL past contributions
- **Metadata Integration:** Proper price data fetching with graceful fallback for cards without MTGO pricing
- **Real-time Updates:** Enhanced live refresh system using efficient batch processing approach
- **Client-side Processing:** Smart grouping by contributor + deck filename with accurate totals calculation

### Production Deployment Preparation (Session 6) - COMPLETE ✅
- **Contributions Panel Fix:** Fixed progress tracking to use proper RequirementsService instead of hardcoded empty data
- **Accurate Progress Tracking:** Progress bars and statistics now reflect real requirements vs gathered cards
- **Contributor Dollar Amounts:** Enhanced display to show both card counts and MTGO pricing values per contributor
- **Collection Value Dashboard:** Added Collection Value and Outstanding Value metrics with real pricing data
- **Clean Production Interface:** Production-ready interface with appropriate debug tools for collection management
- **UI Polish:** Professional appearance suitable for public GitHub Pages deployment
- **Bundle Optimization:** Final production build at 130.56 kB with optimized performance

### MTGO Price Integration (Session 5) - COMPLETE ✅
- **Comprehensive Pricing System:** Full MTGO price integration using Scryfall API working perfectly
- **Database Schema Updates:** Added `price_tix` and `last_price_update` columns to `card_metadata` table
- **Smart Caching:** 24-hour price cache with automatic stale data refresh
- **UI Price Display:** Price and Total Value columns in all card tables with sorting
- **Dashboard Metrics:** Collection Value and Outstanding Value summary statistics with real prices
- **Background Updates:** Automatic price refresh on app load and periodic updates (6 hours)
- **Manual Controls:** "Get Prices" and "Refresh Prices" buttons working with status feedback
- **Rate Limiting:** Respects Scryfall's 10 requests/second API limits
- **Contribution Values:** Recent contributions show individual contribution values

**Session 5 Resolution:** Fixed database constraint issue (missing unique constraint on card_name + set_code) and metadata joining in RequirementsService. Prices now display correctly throughout the application.

### Robust MTGO Price Discovery Enhancement - COMPLETE ✅
- **Cross-Printing Price Search:** Enhanced system to find MTGO prices across ALL printings of each card
- **Multi-Tier Fallback Strategy:** 3-level approach (exact set → all printings → no restriction)
- **Scryfall API Enhancement:** New `findBestMtgoPrintingForCard()` method using `unique=prints` and `order=tix`
- **Smart Set Code Updates:** Automatically updates metadata to use the set with available MTGO pricing
- **Advanced Debug Tools:** Comprehensive debugging panels for metadata and pricing issues
- **Handles Edge Cases:** Properly finds prices for cards from paper-only sets, remaster sets, etc.

**Key Innovation:** Cards like "Dragon's Rage Channeler" from MH2, "Unearth" from various printings, and shock lands from multiple sets now correctly find their MTGO prices regardless of which specific printing appears in deck files.

### Export & Production Features (Session 4)
- **Export Missing Cards:** One-click export of outstanding cards with copy to clipboard
- **Production Build:** Optimized 2.4MB bundle with code splitting and tree-shaking
- **GitHub Pages Ready:** Complete deployment preparation with automated scripts
- **Performance Optimized:** < 3 second load times with gzipped compression
- **Git Repository:** Complete version control with professional commit history

### Requirements System (Session 3)
- **Dual Upload Modes:** Separate interfaces for contributions vs requirements with clear visual distinction
- **MAX Quantity Logic:** `required_quantity = MAX(quantity)` across all requirement decks
- **Real-time Dashboard:** Complete progress tracking with color-coded status system
- **Card Status Tables:** Outstanding cards (RED), gathered cards with status indicators
- **Progress Visualization:** Completion percentage with detailed stats breakdown
- **Real-time Updates:** Live dashboard refresh on requirements/contributions changes

### Parser Improvements (Session 2)
- **Multi-format Support:** Now handles both element-based and attribute-based XML
- **Sideboard Filtering:** Automatically excludes sideboard cards (Sideboard="true")
- **Duplicate Consolidation:** Merges multiple entries for the same card
- **Better Error Handling:** Proper null checks and edge case handling

### Fixed Issues
- ✅ Upload interface visibility (Tailwind CSS configuration)
- ✅ Parser compatibility with Boros Energy deck format
- ✅ TypeError when accessing card attributes
- ✅ Requirements upload system with database integration
- ✅ Color-coded status system (RED/BLUE/GREEN) implementation
- ✅ Real-time subscriptions for collaborative updates
- ✅ MTGO pricing system with Scryfall API integration
- ✅ Database constraint and metadata joining issues resolved
- ✅ Robust cross-printing MTGO price discovery for cards from any set
- ✅ Missing metadata detection and automatic population
- ✅ Advanced debugging tools for pricing and metadata issues
- ✅ Production-ready interface with appropriate collection management tools (Session 6)
- ✅ Accurate contributions panel with real progress tracking (Session 6)
- ✅ Clean deployment-ready build optimized for GitHub Pages (Session 6)
- ✅ Recent Contributions panel performance optimization with historical data support
- ✅ **Monetary Donation System with full integration and real-time updates (Session 7)**
- ✅ **Dashboard UX overhaul with collapsible sections and mobile optimization (Session 8)**
- ✅ **Database Correction Tool for collection vs database discrepancy resolution**

### Dual Format File Support (.dek/.txt) - COMPLETE ✅
- **Universal Deck Parser:** New `deckParser.ts` with automatic format detection based on file extension
- **Plain Text Parser:** Dedicated `txtParser.ts` for simple text format (`<quantity> <card name>` per line)
- **Format Support:** Both .dek (XML) and .txt (plain text) files accepted in all upload interfaces
- **Backward Compatibility:** Maintained full compatibility with existing .dek files and workflows
- **Sideboard Handling:** Automatic filtering of sideboard cards in both formats (XML attributes and empty line detection)
- **Error Handling:** Comprehensive validation and error reporting for both file formats
- **Test Files:** Created comprehensive test suite including malformed files for validation testing
- **UI Updates:** Updated upload interfaces to clearly indicate support for both formats

### Test Mode System - COMPLETE ✅
- **Safe Development:** Complete test mode system for all operations without database pollution
- **Database Service Integration:** Test mode flag integrated into all database write operations (cards + donations)
- **Console Logging:** Detailed console output showing exactly what would be saved to database
- **UI Indicators:** Clear visual indicators when test mode is active across all components
- **Full Flow Testing:** Upload process validation and donation logging without data persistence
- **Monetary Donation Testing:** Test mode works for card contributions, monetary donations, and requirements uploads
- **Developer Tools:** Global DatabaseService access for debugging and manual database operations
- **Bottom Placement:** Test mode toggle positioned at bottom of page for clean UI

## Development Workflow

**Session-Based Approach:** Each session builds working, testable functionality before moving to next phase. Test incrementally with provided files in `/public/` directory.

**Test Files Available:**
- `.dek` files: Various XML-based MTGO deck exports for testing existing functionality
- `.txt` files: Plain text deck lists including `test-burn-deck.txt`, `test-minimal-deck.txt`, `test-sideboard.txt` (with sideboard filtering), and `test-malformed.txt` (for error handling validation)
- `Izzet Prowess PT.txt`: Real deck example for comprehensive testing

**Real-time First:** Implement Supabase subscriptions immediately when building features for live collaboration.

**Quality Standards:** TypeScript strict mode, comprehensive error handling, mobile responsive design, cross-browser compatibility.

## Constraints

- GitHub Pages static hosting (no server-side processing)
- Supabase free tier rate limits  
- Client-side file processing only
- No user authentication (public contribution model)
- MTGO deck file dependency (.dek XML or .txt plain text formats)
- 8-session development timeline for complete MVP with monetary donation system, dashboard UX overhaul, and production deployment (COMPLETE)
- Test mode available for safe development without database pollution