# Deployment Guide - MTG Collection Rebuilder

## Quick Start Deployment

### GitHub Pages Deployment (Recommended)

1. **Create GitHub Repository**
   ```bash
   # Create a new repository on GitHub (e.g., goblin-surprise)
   git remote add origin https://github.com/yourusername/goblin-surprise.git
   git push -u origin main
   ```

2. **Deploy to GitHub Pages**
   ```bash
   npm run deploy
   ```
   This will:
   - Build the production version
   - Deploy to `gh-pages` branch
   - Automatically configure GitHub Pages

3. **Configure GitHub Pages**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` / `root`
   - Your app will be available at: `https://yourusername.github.io/goblin-surprise`

### Alternative: Manual Static Hosting

1. **Build Production Version**
   ```bash
   npm run build
   ```

2. **Deploy Build Folder**
   - Upload the `build/` folder contents to any static hosting service
   - Services: Netlify, Vercel, Firebase Hosting, AWS S3, etc.

## Environment Configuration

### Required Environment Variables

Create `.env.local` (DO NOT commit to git):
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Production Environment Setup

1. **Supabase Configuration**
   - Ensure your Supabase project allows the production domain
   - Add your GitHub Pages domain to allowed origins
   - Example: `https://yourusername.github.io`

2. **CORS Configuration**
   - Supabase automatically handles CORS for whitelisted domains
   - Add your production URL in Supabase project settings

## Build Optimization

### Current Build Stats
- **Main Bundle**: 125.93 kB (gzipped)
- **CSS Bundle**: 4.75 kB (gzipped)
- **Total Size**: ~2.4 MB (uncompressed)
- **Load Time**: < 3 seconds on standard connections

### Performance Features
- ✅ Code splitting with React.lazy()
- ✅ Gzipped compression
- ✅ Optimized Tailwind CSS
- ✅ Tree-shaking enabled
- ✅ Minified production build

## Database Setup

### Supabase Schema (Already Deployed)
- `requirement_decks` - Target deck configurations
- `requirement_cards` - Cards needed per deck
- `gathered_cards` - Contributed cards with contributor tracking
- `card_metadata` - Scryfall API data (optional)
- `change_log` - Audit trail for modifications

### Real-time Features
- Live updates via Supabase subscriptions
- No additional setup required
- Works automatically in production

## Post-Deployment Checklist

### Functionality Testing
- [ ] Upload .dek files (both requirements and contributions)
- [ ] Verify real-time dashboard updates
- [ ] Test export functionality (copy to clipboard)
- [ ] Validate MAX quantity calculations
- [ ] Check color-coded status system (RED/BLUE/GREEN)

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] Mobile responsive design
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Real-time updates working without page refresh

### Security Validation
- [ ] Environment variables not exposed in build
- [ ] Supabase RLS policies active
- [ ] No sensitive data in client-side code
- [ ] HTTPS enforced (automatic with GitHub Pages)

## Troubleshooting

### Common Issues

**1. White Screen / Build Not Loading**
- Check browser console for errors
- Verify environment variables are set
- Ensure Supabase URL includes `https://`

**2. Database Connection Failed**
- Verify Supabase credentials
- Check if project is paused (free tier)
- Confirm domain is whitelisted in Supabase

**3. Upload Not Working**
- Verify file format is `.dek` (XML)
- Check browser console for parsing errors
- Ensure contributor name is entered

**4. Real-time Updates Not Working**
- Check network connectivity
- Verify Supabase subscriptions are active
- Refresh page to re-establish connection

### Support Files

Test files available in `/public/` directory:
- `test-burn-deck.dek` - Basic element-based XML
- `sample-jeskai-control.dek` - Element-based with `<n>` tags
- `Deck - Boros Energy.dek` - Attribute-based XML format
- Various edge case test files

## Success Metrics

### MVP Completion Status ✅
- [x] File upload system (contributions & requirements)
- [x] Real-time collaborative dashboard
- [x] MAX quantity calculation logic
- [x] Color-coded progress tracking
- [x] Export missing cards functionality
- [x] Mobile responsive design
- [x] Production deployment ready

### User Experience Goals ✅
- [x] Intuitive drag-drop upload interface
- [x] Clear progress visualization
- [x] Real-time collaboration without page refresh
- [x] Export acquisition lists for missing cards
- [x] Professional UI with Tailwind CSS

**Status**: Complete MVP ready for production use
**Deployment Time**: < 5 minutes with GitHub Pages
**Maintenance**: Zero-maintenance static hosting