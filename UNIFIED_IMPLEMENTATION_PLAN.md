# MTG Collection Rebuilder - Unified Implementation Plan

**Project:** Goblin Surprise MTG Collection Rebuilder  
**Target:** Production-ready web application with full MVP functionality  
**Development Environment:** Claude Code with WSL2  
**Last Updated:** June 29, 2025

---

## 🎯 Project Overview & Current State

### Core Functionality Goals
- **Dual Upload System:** Separate interfaces for requirements and contributions
- **Real-time Progress Tracking:** Live collaboration with instant updates
- **Multi-contributor System:** Track who contributed which cards
- **Export Functionality:** Generate acquisition lists for missing cards
- **Full Dashboard:** Complete progress visualization with color-coded status

### Infrastructure Complete ✅
- React + TypeScript environment operational
- Supabase database with 5 tables deployed and connected
- File processing system (XML parser for MTGO .dek files)
- TypeScript compilation clean with proper type definitions
- Testing files and environment configuration ready

### Current Blocking Issue 🚨
- Upload interface visibility problem despite successful database connection
- Root cause: Component conditional rendering logic needs investigation

---

## 📋 Implementation Sessions (4 Sessions Total)

## Session 1: Debug & Validate Core Upload System 🔧
**Duration:** 2-3 hours  
**Goal:** Ensure existing contribution upload system works end-to-end with real-time updates

### Phase 1A: Debug Upload Interface (45 minutes)
**Objective:** Resolve upload interface visibility issue

**Tasks:**
1. **Investigate component rendering**
   - Trace `isConnected` state flow from App.tsx to FileUpload.tsx
   - Verify conditional rendering logic in FileUpload component
   - Check props passing and React re-rendering behavior
   - Add debugging logs to identify exact failure point

2. **Test connection status flow**
   - Validate DatabaseService.testConnection() returns true
   - Confirm App.tsx state updates properly
   - Verify ConnectionStatus component renders correctly
   - Ensure FileUpload receives correct disabled prop

**Files to examine:**
- `src/App.tsx` - State management and component integration
- `src/components/upload/FileUpload.tsx` - Upload component conditional display
- `src/components/EnvTest.tsx` - Connection status component

**Success Criteria:**
- Upload interface visible when database connected
- File drag-and-drop area functional
- Contributor name input accessible
- No console errors during rendering

### Phase 1B: Validate Upload Workflow (60 minutes)
**Objective:** Test complete .dek file processing pipeline

**Tasks:**
1. **Test file processing pipeline**
   - Validate XML parser with test files in `/public/`
   - Confirm database storage in `gathered_cards` table
   - Test upload results display
   - Verify contributor tracking and deck filename storage

2. **Error handling validation**
   - Test with invalid XML files
   - Test with empty files and malformed data
   - Verify error messages display correctly
   - Confirm graceful degradation for edge cases

3. **Multi-file upload testing**
   - Test uploading multiple .dek files simultaneously
   - Verify each file processes independently
   - Confirm contributor name persists across uploads
   - Test upload state management and progress indicators

**Testing Resources:**
- `public/test-burn-deck.dek` - Valid MTGO format (42 cards)
- `public/test-invalid-xml.dek` - Error handling test
- `public/test-empty-deck.dek` - Edge case testing
- Plus 6 additional test scenarios

**Success Criteria:**
- All valid .dek files parse without errors
- Cards stored correctly in database with proper metadata
- Upload results display with accurate card counts
- Error handling works for all invalid file types
- Contributor tracking functions properly

### Phase 1C: Implement Real-time Updates (30 minutes)
**Objective:** Add Supabase real-time subscriptions for live collaboration

**Tasks:**
1. **Add real-time subscriptions**
   - Implement Supabase real-time listeners for `gathered_cards` table
   - Update UI when new contributions are added by other users
   - Handle subscription lifecycle (setup/cleanup)
   - Test multi-user collaboration scenarios

2. **Update upload results display**
   - Show live updates when other contributors upload
   - Refresh upload results list in real-time
   - Handle concurrent uploads gracefully

**Success Criteria:**
- Real-time updates work without page refresh
- Multiple users can contribute simultaneously
- Upload results update live across all connected clients

---

## Session 2: Requirements Upload System 📋
**Duration:** 2-3 hours  
**Goal:** Build separate interface for uploading target deck requirements

### Phase 2A: Create Requirements Upload Interface (90 minutes)
**Objective:** Build separate upload component for target decks

**Tasks:**
1. **Create RequirementsUpload component**
   - Build component similar to FileUpload but for requirements
   - Clear labeling to distinguish from contributions
   - Store uploads in `requirement_decks` and `requirement_cards` tables
   - Different visual styling to prevent confusion

2. **Implement requirements processing logic**
   - Parse .dek files and store as requirement decks
   - Handle deck naming and uploader tracking
   - Validate requirement deck uploads
   - Process cards into requirement_cards table

3. **Add requirements management interface**
   - Display list of uploaded requirement decks
   - Show deck names, uploader, and upload date
   - Allow removal of requirement decks
   - Confirm before deletion with impact warning

**New Components:**
- `src/components/upload/RequirementsUpload.tsx`
- `src/components/requirements/RequirementsList.tsx`
- `src/components/requirements/RequirementDeckCard.tsx`

**Success Criteria:**
- Separate, clearly labeled requirements upload interface
- Requirements stored in proper database tables
- Management interface for viewing and removing requirements
- Clear visual distinction from contribution uploads

### Phase 2B: Requirements Calculation Logic (60 minutes)
**Objective:** Implement MAX quantity calculations across requirement decks

**Tasks:**
1. **Build calculation engine**
   - Calculate `MAX(quantity)` for each card across all requirement decks
   - Create computed requirements view for dashboard consumption
   - Handle requirements updates when new decks added
   - Implement recalculation when requirements removed

2. **Create requirements service layer**
   - `src/services/requirementsService.ts`
   - Functions for calculating outstanding quantities
   - Real-time subscription handling for requirement changes
   - Cached calculations for performance

3. **Test calculation accuracy**
   - Upload multiple requirement decks with overlapping cards
   - Verify MAX quantity logic works correctly
   - Test edge cases (single deck, no requirements, etc.)

**Success Criteria:**
- Accurate MAX quantity calculations across all requirement decks
- Requirements automatically recalculate when decks added/removed
- Performance optimized for large numbers of requirement decks

---

## Session 3: Dashboard & Progress Tracking 📊
**Duration:** 2-3 hours  
**Goal:** Build comprehensive dashboard showing collection progress

### Phase 3A: Core Dashboard Components (90 minutes)
**Objective:** Create main dashboard structure with progress visualization

**Tasks:**
1. **Build dashboard component architecture**
   - `src/components/dashboard/Dashboard.tsx` - Main container
   - `src/components/dashboard/ProgressBar.tsx` - Completion percentage
   - `src/components/dashboard/ProgressStats.tsx` - Summary statistics
   - Responsive layout for desktop and mobile

2. **Implement progress calculations**
   - Calculate overall completion percentage
   - Outstanding = required - gathered quantities per card
   - Aggregate statistics (total cards needed, cards found, etc.)
   - Handle edge cases (no requirements, over-contributions)

3. **Add real-time dashboard updates**
   - Subscribe to both `gathered_cards` and `requirement_cards` changes
   - Update progress in real-time as contributions/requirements change
   - Smooth animations for progress bar updates
   - Handle concurrent updates from multiple users

**Success Criteria:**
- Working dashboard with accurate progress calculations
- Real-time updates without page refresh
- Responsive design works on mobile devices
- Progress bar and statistics update correctly

### Phase 3B: Card Display Tables (90 minutes)
**Objective:** Build tables showing outstanding and gathered cards

**Tasks:**
1. **Outstanding Cards Table**
   - `src/components/cards/OutstandingCardsTable.tsx`
   - Show cards still needed with quantities
   - Display card name, required qty, gathered qty, outstanding qty
   - Color coding: RED for needed cards
   - Sortable by card name, quantity needed, etc.

2. **Gathered Cards Table**
   - `src/components/cards/GatheredCardsTable.tsx`
   - Show all contributed cards with contributor information
   - Display card name, quantity, contributor, deck filename, date
   - Color coding: GREEN for surplus, BLUE for exact match
   - Filter by contributor name

3. **Implement color coding system**
   - RED: outstanding_quantity > 0 (cards still needed)
   - BLUE: outstanding_quantity === 0 (exact match)
   - GREEN: outstanding_quantity < 0 (surplus cards)
   - Consistent color scheme across all components

**New Components:**
- `src/components/cards/OutstandingCardsTable.tsx`
- `src/components/cards/GatheredCardsTable.tsx`
- `src/components/cards/CardRow.tsx`
- `src/components/cards/CardStatusBadge.tsx`

**Success Criteria:**
- Both tables display correct card information
- Color coding works according to specification
- Tables update in real-time as cards added/removed
- Sorting and filtering functions properly

### Phase 3C: Export Functionality (30 minutes)
**Objective:** Add copy-to-clipboard export for outstanding cards

**Tasks:**
1. **Implement export functionality**
   - Generate text list of outstanding cards only
   - Format: "4 Lightning Bolt" (quantity + card name per line)
   - Copy to clipboard functionality
   - Visual confirmation when copy succeeds

2. **Add export button to dashboard**
   - Prominent "Copy Outstanding Cards" button
   - Show count of cards in export
   - Disable if no outstanding cards
   - Success/error feedback

**Success Criteria:**
- Export generates correct format text list
- Copy to clipboard works reliably
- Only includes cards with outstanding > 0
- Clear user feedback for export actions

---

## Session 4: Polish, Testing & Deployment 🚀
**Duration:** 1-2 hours  
**Goal:** Comprehensive testing, UI improvements, and production deployment

### Phase 4A: Comprehensive Testing (45 minutes)
**Objective:** Test all workflows and edge cases

**Tasks:**
1. **End-to-end workflow testing**
   - Test complete requirements → contributions → dashboard flow
   - Validate multi-user real-time collaboration
   - Test all provided .dek files for processing
   - Verify export functionality works correctly

2. **Edge case and error testing**
   - Test with no requirements defined
   - Test with over-contributions
   - Test with rapid sequential uploads
   - Validate error handling and recovery

3. **Cross-browser compatibility**
   - Test in Chrome, Firefox, Safari, Edge
   - Verify mobile responsive design
   - Check file upload compatibility across browsers

**Success Criteria:**
- All workflows function correctly
- Edge cases handled gracefully
- No console errors in any supported browser
- Mobile experience is fully functional

### Phase 4B: UI/UX Polish (30 minutes)
**Objective:** Final visual improvements and accessibility

**Tasks:**
1. **Visual polish**
   - Consistent spacing and typography
   - Loading states for all async operations
   - Error boundaries for crash prevention
   - Improved visual hierarchy and readability

2. **Accessibility improvements**
   - Proper ARIA labels for screen readers
   - Keyboard navigation support
   - High contrast color choices
   - Focus management for file uploads

**Success Criteria:**
- Professional, polished visual design
- Accessible to users with disabilities
- Consistent user experience across all features

### Phase 4C: Production Deployment (15 minutes)
**Objective:** Deploy to GitHub Pages

**Tasks:**
1. **Build and deploy**
   - Run `npm run build` for production build
   - Deploy to GitHub Pages using `npm run deploy`
   - Verify all functionality works in production
   - Test with production Supabase environment

2. **Final validation**
   - Test live site functionality
   - Verify environment variables work in production
   - Confirm real-time updates work across different networks
   - Performance check (<3 second load time)

**Success Criteria:**
- Live application accessible via GitHub Pages
- All functionality works in production environment
- Performance meets requirements
- Multi-user collaboration works across internet

---

## 🔧 Technical Architecture

### Component Hierarchy
```
App.tsx
├── ConnectionStatus
├── RequirementsUpload (Session 2)
├── FileUpload (Session 1)
├── Dashboard (Session 3)
│   ├── ProgressBar
│   ├── ProgressStats
│   ├── OutstandingCardsTable
│   └── GatheredCardsTable
└── UploadResults
```

### Data Flow
```
Requirements Upload → requirement_decks/requirement_cards tables
Contributions Upload → gathered_cards table
Both trigger → Real-time recalculation → Dashboard updates
Dashboard → Export functionality
```

### Service Layer
- `DatabaseService` - All Supabase operations
- `DekParser` - MTGO .dek file processing
- `RequirementsService` - Calculation engine (new)
- `ScryfallApi` - Card metadata (future enhancement)

### Business Logic
```typescript
// Card status calculations
required_quantity = MAX(quantity) across all requirement_decks
gathered_quantity = SUM(quantity) from gathered_cards
outstanding_quantity = required_quantity - gathered_quantity

// Color coding
if outstanding_quantity > 0: RED (needed)
if outstanding_quantity === 0: BLUE (exact)
if outstanding_quantity < 0: GREEN (surplus)
```

---

## 🎯 Success Criteria & Quality Standards

### MVP Completion Checklist
- [ ] Dual upload system (requirements + contributions) functional
- [ ] Real-time collaboration working without page refresh
- [ ] Complete dashboard with progress tracking
- [ ] Outstanding and gathered cards display with color coding
- [ ] Export functionality for acquisition lists
- [ ] Production deployment successful
- [ ] Mobile responsive design

### Quality Standards
- [ ] TypeScript compilation with zero errors
- [ ] No console errors during normal operation
- [ ] Real-time updates work reliably
- [ ] Performance: <3 second initial load time
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Accessibility standards met
- [ ] Comprehensive error handling

### User Experience Goals
- [ ] Intuitive dual upload process with clear labeling
- [ ] Accurate real-time progress tracking
- [ ] Easy-to-understand color-coded status system
- [ ] Reliable export functionality
- [ ] Clear error messages and recovery guidance
- [ ] Professional, polished visual design

---

## 🛠️ Development Guidelines

### Session Management
- Each session ends with working, testable functionality
- Test incrementally as features are built
- Validate database operations after each major change
- Use provided test files for consistent validation

### Real-time Implementation
- Implement Supabase subscriptions immediately when building features
- Test multi-user scenarios throughout development
- Handle subscription cleanup properly to prevent memory leaks

### Error Handling
- Comprehensive try/catch blocks for all async operations
- User-friendly error messages for all failure scenarios
- Graceful degradation when APIs unavailable
- Console logging for debugging but clean user experience

### Testing Approach
- Use provided test .dek files in `/public/` directory
- Test edge cases and error scenarios as features are built
- Validate real-time functionality with multiple browser tabs
- Cross-browser testing before moving to next session

---

**Status:** Ready for implementation with comprehensive, session-based plan  
**Approach:** Sequential sessions building from core functionality to complete MVP  
**Timeline:** 8-10 hours total across 4 focused development sessions