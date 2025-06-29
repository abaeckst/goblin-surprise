# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Goblin Surprise MTG Collection Rebuilder** - A React web application for rebuilding a stolen Magic: The Gathering collection through collaborative friend contributions. Users upload MTGO .dek files to contribute cards and track progress toward completing target decks.

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
MTGO .dek Upload → XML Parse → Database Insert → Real-time Update → Dashboard Refresh
```

### Database Schema
- `requirement_decks` - Target deck configurations
- `requirement_cards` - Cards needed per deck
- `gathered_cards` - Contributed cards with contributor tracking
- `card_metadata` - Scryfall API data (mana cost, type, rarity, colors)
- `change_log` - Audit trail for all modifications

### Key Services
- `src/services/supabase.ts` - Database operations and real-time subscriptions
- `src/services/dekParser.ts` - MTGO .dek file XML parsing (enhanced for multiple formats)
- `src/services/requirementsService.ts` - MAX quantity calculation and card status logic
- `src/services/scryfallApi.ts` - Card metadata fetching

### Component Structure
```
src/components/
├── upload/           # File upload and processing
│   ├── FileUpload.tsx         # Contribution deck uploads
│   ├── RequirementsUpload.tsx # Target deck requirements uploads
│   └── UploadResults.tsx      # Upload success/error display
├── dashboard/        # Progress tracking and visualization
│   ├── Dashboard.tsx          # Main progress dashboard
│   ├── ProgressBar.tsx        # Completion percentage visual
│   ├── ProgressSummary.tsx    # Legacy summary component
│   └── RecentContributions.tsx # Recent upload activity
├── cards/           # Card display tables and management
│   ├── OutstandingCardsTable.tsx # Cards still needed (RED)
│   └── GatheredCardsTable.tsx    # Contributed cards (all statuses)
└── common/          # Shared UI components
    └── UploadModeToggle.tsx      # Switch between upload modes
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

### File Processing
- Accepts MTGO .dek format (XML-based)
- Supports both element-based and attribute-based XML formats
- Automatic sideboard card filtering
- Duplicate card consolidation
- Client-side parsing only (no server storage)
- Contributor name required for each upload
- Error handling for malformed XML and invalid data

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
**Session 4 (NEXT):** Complete production deployment, final polish, and comprehensive testing

**Current Status:** SESSIONS 1, 2 & 3 COMPLETE - Full requirements-driven collection rebuilding system with real-time dashboard. Ready for Session 4: Production deployment.

## Recent Enhancements

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

## Development Workflow

**Session-Based Approach:** Each session builds working, testable functionality before moving to next phase. Test incrementally with provided .dek files in `/public/` directory.

**Real-time First:** Implement Supabase subscriptions immediately when building features for live collaboration.

**Quality Standards:** TypeScript strict mode, comprehensive error handling, mobile responsive design, cross-browser compatibility.

## Constraints

- GitHub Pages static hosting (no server-side processing)
- Supabase free tier rate limits  
- Client-side file processing only
- No user authentication (public contribution model)
- MTGO .dek format dependency
- 4-session development timeline for complete MVP