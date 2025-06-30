# Goblin Surprise - MTG Collection Rebuilder

A collaborative web application to help rebuild a stolen Magic: The Gathering collection by tracking friend contributions and progress toward completing target decks.

## 🎯 Project Overview

**Purpose:** After having an MTGO collection stolen, this tool helps coordinate friends who want to contribute cards by tracking what's been gathered and what's still needed across multiple target decks.

**Key Features:**
- 📤 Upload MTGO .dek files for both requirements and contributions
- 📊 Real-time progress tracking with visual dashboard
- 👥 Multi-contributor support with attribution
- 🔄 Live updates for collaborative gathering
- 📋 Export lists of outstanding cards needed
- 💰 Real-time MTGO card pricing from Scryfall API
- 📈 Collection value tracking and metrics
- ✏️ Full edit capabilities with audit logging

## 🚀 Current Status

**Development Progress:** ALL 6 SESSIONS COMPLETE ✅
- ✅ Upload system fully functional with dual modes (requirements/contributions)
- ✅ Enhanced parser supports multiple .dek formats
- ✅ Real-time database updates and live collaboration
- ✅ Complete dashboard with progress tracking and pricing
- ✅ Export functionality for missing cards
- ✅ MTGO pricing system with automatic updates
- ✅ Production-ready build and deployment preparation
- ✅ Clean UI polish with debug tools removed for public deployment

**Status:** Full MVP deployed to GitHub Pages and operational
**Live Site:** https://abaeckst.github.io/goblin-surprise

## 🛠️ Technical Stack

- **Frontend:** React 19 + TypeScript
- **Database:** Supabase (PostgreSQL) with real-time subscriptions
- **Styling:** Tailwind CSS v3
- **File Processing:** Client-side XML parsing (fast-xml-parser)
- **Deployment:** GitHub Pages (static hosting)

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/abaeckst/goblin-surprise.git
cd goblin-surprise
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

4. Start the development server:
```bash
npm start
```

## 🎮 Usage

### Contributing Cards
1. Navigate to the upload interface
2. Enter your name as the contributor
3. Drag and drop (or click to select) your MTGO .dek file
4. Review the parsed cards and confirm submission
5. Cards are instantly added to the shared collection

### Supported .dek Formats
- ✅ Standard element-based XML (e.g., `<Card><Name>...</Name></Card>`)
- ✅ Attribute-based XML (e.g., `<Cards Name="..." Quantity="..."/>`)
- ✅ Automatic sideboard filtering
- ✅ Duplicate card consolidation

## 📊 Database Schema

- `requirement_decks` - Target deck configurations
- `requirement_cards` - Cards needed per deck
- `gathered_cards` - Contributed cards with attribution
- `card_metadata` - Scryfall API data cache
- `change_log` - Edit history and audit trail

## 🧪 Testing

Sample .dek files are provided in the `/public` directory:
- `sample-jeskai-control.dek` - Standard format example
- `sample-power-nine.dek` - High-value cards test
- `test-burn-deck.dek` - Basic deck test
- Additional test files for edge cases

## 🚢 Deployment

Build for production:
```bash
npm run build
```

Deploy to GitHub Pages:
```bash
npm run deploy
```

## 📝 Development History

### ✅ Session 1: Foundation (COMPLETE)
- [x] React + TypeScript foundation with Supabase integration
- [x] File upload system with drag-and-drop
- [x] XML parser with multi-format support
- [x] Real-time database updates

### ✅ Session 2: Styling & Parser Enhancement (COMPLETE)
- [x] Tailwind CSS styling implementation
- [x] Enhanced parser for multiple .dek formats
- [x] Better error handling and edge cases

### ✅ Session 3: Requirements System (COMPLETE)
- [x] Requirements upload interface
- [x] MAX quantity calculation logic
- [x] Initial dashboard with progress tracking

### ✅ Session 4: Export & Production (COMPLETE)
- [x] Complete dashboard with progress visualization
- [x] Card status tables (needed/gathered/surplus)
- [x] Export functionality for outstanding cards
- [x] Production build optimization

### ✅ Session 5: MTGO Pricing Integration (COMPLETE)
- [x] Scryfall API integration for MTGO card prices
- [x] Real-time pricing updates and caching
- [x] Collection value calculations and display
- [x] Cross-printing price discovery system

### ✅ Session 6: Production Deployment (COMPLETE)
- [x] UI cleanup and polish for public deployment
- [x] Debug tools removal for production interface
- [x] Contributions panel fixes with accurate progress tracking
- [x] Final deployment preparation and GitHub Pages setup

## 🤝 Contributing

This is a personal project to rebuild a stolen collection, but the code is open source. Feel free to fork and adapt for your own collection tracking needs!

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Thanks to all the friends contributing cards to help rebuild the collection. Your generosity powers this project! 🎉