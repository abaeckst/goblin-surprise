

## MTG Collection Rebuilding System - Product Requirements Document.md

12.88 KB •392 lines•Formatting may be inconsistent from source

# MTG Collection Rebuilding System - Product Requirements Document

**Project:** Goblin Surprise MTG Collection Rebuilder 
**Version:** 1.0 
**Date:** June 29, 2025 
**Purpose:** Help rebuild Sam's stolen MTGO collection through collaborative friend contributions

---

## 1. Product Overview

### 1.1 Purpose

A web application that tracks Magic: The Gathering card collection progress toward completing multiple target decks through collaborative contributions from friends. The system manages requirements, tracks contributions, and provides real-time progress updates.

### 1.2 Core Functionality

- **Requirements Management:** Define target card quantities from multiple deck configurations
- **Contribution Tracking:** Process .dek file uploads to track gathered cards
- **Progress Visualization:** Real-time dashboard showing outstanding vs gathered cards
- **Export Tools:** Generate acquisition lists for missing cards
- **Change Management:** Full edit capabilities with change logging

---

## 2. User Stories & Use Cases

### 2.1 Primary User Stories

**As a Collection Manager, I want to:**

- Upload multiple .dek files to establish collection requirements
- See real-time progress toward completing all target decks
- Export lists of cards still needed for acquisition
- Modify requirements by adding/removing target decks
- Track which contributors provided which cards
  **As a Contributor, I want to:**
- Upload my .dek files with my username to contribute cards
- See what cards I've contributed to the collection
- View overall collection progress
- See which decks are being built
  **As any User, I want to:**
- Edit card quantities or contributor information when needed
- See detailed card information (mana cost, type, rarity, color)
- View comprehensive logs of all changes made
  
  ### 2.2 Core Use Cases
  
  **UC1: Initial Requirements Setup**
1. User uploads series of .dek files representing target decks
2. System parses each file and extracts card lists
3. System calculates maximum quantity needed per card across all decks
4. System fetches card metadata from Scryfall API
5. Requirements are established and displayed
   **UC2: Contribution Processing**
6. Contributor enters username
7. Contributor uploads .dek file
8. System parses file and matches cards against outstanding requirements
9. Cards move from outstanding to gathered (with contributor tracking)
10. Outstanding quantities update in real-time
11. Progress indicators refresh
    **UC3: Progress Monitoring**
12. User views dashboard with outstanding and gathered card tables
13. System displays color-coded quantities (red/green/blue)
14. User sees overall completion percentage
15. User can export outstanding cards list

---

## 3. Functional Requirements

### 3.1 Requirements Management

**REQ-001: Deck Upload for Requirements**

- Users can upload multiple .dek files to establish collection requirements
- System supports MTGO .dek format (XML-based)
- Requirements are fully configurable (add/remove target decks anytime)
- System automatically recalculates when requirements change
  **REQ-002: Maximum Quantity Logic**
- For each unique card, system determines maximum copies needed across all target decks
- Example: If Deck A needs 4 Lightning Bolt and Deck B needs 2 Lightning Bolt, requirement is 4 total
- Logic applies per card name (not per deck instance)
  **REQ-003: Dynamic Recalculation**
- When new requirement decks added, system recalculates outstanding vs gathered
- Existing contributions remain valid and are re-evaluated against new requirements
- No data loss when requirements change
  
  ### 3.2 Contribution System
  
  **REQ-004: Contributor Upload Process**
- Contributors must enter username before uploading .dek file
- System accepts MTGO .dek format files
- Uses filename as deck name for tracking purposes
- No duplicate upload protection required
  **REQ-005: Contribution Processing Logic**
- System matches uploaded cards against current outstanding requirements
- Cards move from "outstanding" to "gathered" status
- Contributor information attached to each contributed card
- Over-contributions are accepted and tracked
  **REQ-006: Over-Contribution Handling**
- System accepts contributions even when requirements already met
- Tracks over-contributions separately from required amounts
- Displays surplus quantities distinctly from needed amounts
  
  ### 3.3 Data Management
  
  **REQ-007: Card Information Integration**
- System fetches card metadata from Scryfall API
- Required fields: mana cost, card type, rarity, color
- Uses canonical set per card name (oldest set preferred)
- Handles API failures gracefully with fallback display
  **REQ-008: Change Logging**
- All users can edit card quantities and contributor information
- System logs all changes with timestamp and modification details
- Change history is persistent and viewable
- No user authentication required for edits
  **REQ-009: Data Validation**
- System attempts to parse invalid .dek files as best as possible
- Logs parsing errors and continues processing valid cards
- Provides feedback on file processing results
- Handles malformed XML and missing card data
  
  ### 3.4 Display & Visualization
  
  **REQ-010: Outstanding Cards Table**
- Displays all cards still needed with quantities
- Shows card name, mana cost, type, rarity, color, set
- Color coding: Red text for needed quantities
- Sortable and filterable by card attributes
  **REQ-011: Gathered Cards Table**
- Displays all contributed cards with quantities
- Shows same card info as outstanding table plus contributor name
- Color coding: Green text for surplus quantities, blue for exact matches
- Tracks which contributor provided which cards
  **REQ-012: Progress Visualization**
- Overall completion percentage bar
- Real-time updates as contributions are processed
- Clear visual distinction between complete and incomplete cards
  **REQ-013: Deck Tracking Display**
- List of all uploaded .dek files (both requirements and contributions)
- Shows deck name (filename), uploader/contributor, upload date
- Displays number of cards contributed per deck
- Links to view specific cards from each deck
  
  ### 3.5 Export Functionality
  
  **REQ-014: Outstanding Cards Export**
- One-click copy to clipboard functionality
- Format: "4 Lightning Bolt" (quantity + card name)
- Text format suitable for acquisition lists
- Includes only cards with outstanding quantities > 0

---

## 4. Technical Requirements

### 4.1 Architecture

**TECH-001: Technology Stack**

- Frontend: React with TypeScript
- Database: Supabase (PostgreSQL)
- Deployment: GitHub Pages
- Development: Claude Code with WSL2
  **TECH-002: Real-time Updates**
- Supabase real-time subscriptions for live data updates
- Dashboard refreshes automatically when contributions added
- No page refresh required for data updates
  **TECH-003: File Processing**
- XML parser for MTGO .dek format
- Client-side file processing with server-side storage
- Support for standard MTGO export format
  
  ### 4.2 External Integrations
  
  **TECH-004: Scryfall API Integration**
- Fetch card metadata by card name
- Cache results to minimize API calls
- Handle rate limiting and API errors
- Fallback gracefully when API unavailable
  
  ### 4.3 Data Schema
  
  **TECH-005: Database Design**
  
  ```sql
  requirement_decks: id, deck_name, uploaded_by, created_at
  requirement_cards: id, deck_id, card_name, quantity, created_at
  gathered_cards: id, card_name, quantity, contributor_name, deck_filename, created_at
  card_metadata: card_name, mana_cost, type, rarity, color, set_code, scryfall_id
  change_log: id, table_name, record_id, field_changed, old_value, new_value, changed_at
  ```

---

## 5. User Interface Requirements

### 5.1 Layout & Navigation

**UI-001: Single Page Application**

- Clean, intuitive layout with clear sections
- Mobile responsive design
- Fast navigation between functions
- No complex menu structures needed
  **UI-002: Primary Sections**
- Dashboard (progress overview)
- Outstanding Cards (cards still needed)
- Gathered Cards (cards contributed)
- Upload Area (file uploads)
- Deck History (tracking uploads)
  
  ### 5.2 Visual Design
  
  **UI-003: Color Coding System**
- **Red:** Cards/quantities still needed (outstanding > 0)
- **Green:** Cards/quantities in surplus (gathered > required)
- **Blue:** Cards with exact quantities met (outstanding = 0, gathered = required)
- **Standard:** Neutral information and interface elements
  **UI-004: Progress Indicators**
- Prominent percentage bar showing overall completion
- Card-level progress indicators
- Visual feedback during file processing
- Success/error messaging for user actions
  
  ### 5.3 Interactive Elements
  
  **UI-005: File Upload Interface**
- Drag-and-drop zone for .dek files
- Username input field (required)
- Clear file processing feedback
- Error handling and user guidance
  **UI-006: Export Controls**
- Prominent "Copy to Clipboard" button for outstanding cards
- Visual confirmation when copy succeeds
- Clear labeling of export format
  **UI-007: Edit Capabilities**
- Inline editing for card quantities
- Edit contributor names and deck information
- Save/cancel options for modifications
- Change confirmation and logging

---

## 6. Business Logic Specifications

### 6.1 Card Quantity Calculations

**BL-001: Requirements Calculation**

```
For each unique card_name:
 required_quantity = MAX(quantity) across all requirement_decks

Example:
 Deck A: 4 Lightning Bolt
 Deck B: 2 Lightning Bolt 
Deck C: 3 Lightning Bolt
 Result: required_quantity = 4
```

**BL-002: Outstanding Calculation**

```
For each card:
 gathered_quantity = SUM(quantity) from gathered_cards WHERE card_name = card
 outstanding_quantity = required_quantity - gathered_quantity

Color coding:
 IF outstanding_quantity > 0: RED (needed)
 IF outstanding_quantity < 0: GREEN (surplus) 
IF outstanding_quantity = 0: BLUE (exact)
```

**BL-003: Progress Calculation**

```
total_required = SUM(required_quantity) for all cards
total_gathered = SUM(MIN(gathered_quantity, required_quantity)) for all cards
completion_percentage = (total_gathered / total_required) * 100
```

### 6.2 Contribution Processing

**BL-004: Upload Processing Flow**

1. Parse .dek file and extract card list
2. For each card in upload:
   - Check against current requirements
   - Add to gathered_cards table with contributor info
   - Update outstanding calculations
3. Refresh all displays with new data
4. Log the upload event
   **BL-005: Requirement Updates**
5. When new requirement deck added:
   - Recalculate required quantities for all cards
   - Re-evaluate outstanding vs gathered status
   - Update progress calculations
   - Preserve all existing contribution data

---

## 7. Success Criteria

### 7.1 MVP Success Metrics

**MVP-001: Core Functionality**

- ✅ Upload .dek files to establish requirements
- ✅ Upload .dek files to contribute cards
- ✅ View real-time outstanding and gathered cards
- ✅ Export outstanding cards list
- ✅ Track contributors and deck uploads
  **MVP-002: Data Accuracy**
- ✅ Correct quantity calculations across multiple decks
- ✅ Accurate tracking of contributions and over-contributions
- ✅ Proper color coding for card status
- ✅ Real-time updates without page refresh
  **MVP-003: User Experience**
- ✅ Intuitive upload process with clear feedback
- ✅ Readable card information with proper formatting
- ✅ Working export functionality
- ✅ Edit capabilities for data correction
  
  ### 7.2 Performance Requirements
  
  **PERF-001: Response Times**
- File upload processing: < 5 seconds for typical .dek files
- Dashboard updates: < 1 second after contribution
- Export to clipboard: Instant response
- Card metadata fetching: < 3 seconds per batch
  **PERF-002: Data Handling**
- Support 50+ requirement decks
- Handle 500+ unique cards
- Process 100+ contributor uploads
- Maintain performance with large datasets

---

## 8. Constraints & Assumptions

### 8.1 Technical Constraints

- GitHub Pages static hosting (no server-side processing)
- Supabase free tier limitations
- Scryfall API rate limits and availability
- Browser-based file processing only
  
  ### 8.2 Business Assumptions
- Users will upload valid MTGO .dek format files
- Card names in .dek files match Scryfall database
- Contributors will use consistent usernames
- No user authentication or access control needed
- Single collection instance (not multi-tenant)
  
  ### 8.3 Scope Limitations
- No advanced user management or permissions
- No mobile app (web responsive only)
- No offline functionality
- No advanced analytics or reporting
- No integration with other MTG tools

---

## 9. Future Enhancements (Out of Scope)

### 9.1 Potential Phase 2 Features

- User authentication and profiles
- Advanced analytics and reporting
- Integration with MTG price APIs
- Automated deck importing from online sources
- Mobile app development
- Advanced export formats (PDF, spreadsheet)
- Card image display and visualization
- Deck completion notifications
- Contributor leaderboards and gamification

---

**Document Status:** Complete and ready for development 
**Next Step:** Begin technical architecture implementation based on these requirements
