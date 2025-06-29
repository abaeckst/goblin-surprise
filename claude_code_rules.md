# Claude Code Development Rules - MTG Collection System

**Project:** Goblin Surprise MTG Collection Rebuilder  
**Environment:** Claude Code with WSL2 integration  
**Location:** `/mnt/c/Users/abaec/Development/goblin-surprise`

---

## 🎯 Core Development Principles

### 1. Evidence-Based Development
- **Verify assumptions** before making changes
- **Test incrementally** rather than building large features blind
- **Debug systematically** using step-by-step diagnosis
- **Avoid speculation** - examine actual code behavior

### 2. Risk-Based Testing Strategy
- **Test HIGH risk features only** (5 minutes maximum per test)
- **Skip testing** for straightforward implementations (basic React components, simple utilities)
- **Focus testing** on complex state interactions, API integrations, and data processing
- **Validate end-to-end** critical paths: file upload → parse → database → display

### 3. Progressive Enhancement
- **Get MVP working first** before adding advanced features
- **One feature at a time** with validation before moving to next
- **Maintain working state** - don't break existing functionality
- **Iterative improvement** over big-bang implementations

---

## 🔧 Technical Implementation Rules

### File Management
- **Always use exact project paths:** `/mnt/c/Users/abaec/Development/goblin-surprise`
- **Verify file existence** before attempting modifications
- **Create missing directories** if needed for new components
- **Maintain project structure** as defined in existing layout

### Code Quality Standards
- **TypeScript strict mode** - no `any` types, proper interface definitions
- **React best practices** - functional components, proper hooks usage, clean state management
- **Error handling** - comprehensive try/catch for API calls and file operations
- **Performance conscious** - avoid unnecessary re-renders, optimize expensive operations

### Database Operations
- **Supabase integration** - use established service layer in `src/services/supabase.ts`
- **Real-time subscriptions** - implement for live collaboration features
- **Data validation** - verify database operations succeed before updating UI
- **Error recovery** - graceful handling of network and database failures

---

## 📋 Component Development Guidelines

### React Component Rules
```typescript
// Component structure standard
interface ComponentProps {
  // Explicit prop types - no any or implicit types
}

export const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // State management
  const [state, setState] = useState<Type>(initialValue);
  
  // Effects and handlers
  useEffect(() => {
    // Cleanup properly
    return () => {};
  }, [dependencies]);
  
  // Error boundaries for complex components
  // Loading states for async operations
  // Accessible markup and proper semantic HTML
};
```

### Service Layer Standards
```typescript
// Services should handle errors and return structured results
export class ServiceName {
  static async operation(): Promise<Result<Data, Error>> {
    try {
      // Implementation
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

---

## 🚨 Critical Development Constraints

### Environment Limitations
- **No browser localStorage/sessionStorage** - Use React state or Supabase for persistence
- **Client-side processing only** - No server uploads, process files in browser
- **GitHub Pages deployment** - Static hosting only, no server-side logic
- **Supabase free tier** - Respect rate limits and storage constraints

### File Processing Rules
- **MTGO .dek format only** - XML parsing with `fast-xml-parser`
- **Client-side validation** - Parse and validate before database storage
- **Error handling** - Graceful handling of malformed XML and missing data
- **Progress feedback** - User feedback during file processing

### Database Interaction
- **Real-time subscriptions** - Use Supabase channels for live updates
- **Optimistic updates** - Update UI immediately, handle conflicts gracefully
- **Data consistency** - Ensure calculations remain accurate across updates
- **Change logging** - Track all modifications for debugging and audit

---

## 🔍 Debugging Methodology

### Systematic Debugging Process
1. **Reproduce the issue** - Understand exact failure conditions
2. **Isolate the component** - Test individual parts vs full system
3. **Check the data flow** - Trace state and props through components
4. **Verify assumptions** - Test what you think should be working
5. **Fix incrementally** - Small changes with validation between

### Debug Tools and Techniques
```bash
# Development server with detailed logging
npm start

# Check console output for errors
# Browser dev tools for React state inspection
# Supabase dashboard for database verification
# Network tab for API call debugging
```

### Step-Back Protocol
- **After 2-3 failed attempts:** Stop and reassess approach
- **Request additional context** if fundamental understanding seems missing
- **Consider alternative solutions** rather than forcing current approach
- **Ask for guidance** on complex architectural decisions

---

## 🎯 Feature Implementation Strategy

### Upload System Priority
1. **Debug upload interface visibility** - Current blocking issue
2. **Validate file processing workflow** - Test with existing sample files
3. **Confirm database storage** - Verify cards are stored correctly
4. **Test error handling** - Invalid files and edge cases

### Dashboard Development
1. **Basic progress calculation** - Outstanding vs gathered cards
2. **Simple card tables** - Display card names and quantities
3. **Color coding system** - Red (needed), Green (surplus), Blue (exact)
4. **Real-time updates** - Supabase subscriptions for live data

### Export Functionality
1. **Generate text lists** - Outstanding cards only
2. **Clipboard integration** - Copy to clipboard functionality
3. **Format validation** - "4 Lightning Bolt" format per line
4. **Download option** - Save as .txt file for acquisition

---

## 📊 Quality Assurance Standards

### Testing Focus Areas
- **File upload workflow** - Critical path for MVP functionality
- **Database operations** - CRUD operations and real-time updates
- **Calculation accuracy** - Requirements vs contributions math
- **Error handling** - Invalid inputs and failure scenarios
- **Cross-browser compatibility** - Chrome, Firefox, Safari, Edge

### Performance Requirements
- **Initial load:** <3 seconds for app startup
- **File processing:** <5 seconds for typical .dek files
- **Real-time updates:** <1 second for database changes
- **Export operations:** Instant clipboard copy

### User Experience Standards
- **Clear feedback** - Loading states, success/error messages
- **Intuitive interface** - Self-explanatory without instructions
- **Mobile responsive** - Functional on phone and tablet
- **Accessibility** - Proper ARIA labels and keyboard navigation

---

## 🛠️ Development Workflow

### Session Structure
1. **Start with status check** - What's working, what's broken
2. **Focus on ONE priority** - Complete feature before moving to next
3. **Test incrementally** - Validate changes before continuing
4. **Document decisions** - Note any architectural choices or trade-offs

### Code Review Standards
- **TypeScript compliance** - No compilation errors
- **React best practices** - Proper component patterns
- **Error handling** - Comprehensive edge case coverage
- **Performance optimization** - Efficient rendering and data handling

### Deployment Process
```bash
# Local development
npm start          # Test changes locally

# Production build
npm run build      # Generate optimized build

# Deploy to GitHub Pages
npm run deploy     # Automated deployment

# Verify deployment
# Check live site functionality
```

---

## 🚀 Success Criteria

### MVP Completion
- [ ] Upload interface functional and visible
- [ ] Complete .dek file processing workflow
- [ ] Basic dashboard with progress tracking
- [ ] Outstanding and gathered cards display
- [ ] Export functionality operational
- [ ] Real-time collaboration working
- [ ] Production deployment successful

### Code Quality
- [ ] TypeScript compilation clean
- [ ] No console errors in browser
- [ ] Responsive design working
- [ ] Error handling comprehensive
- [ ] Performance requirements met

### User Experience
- [ ] Intuitive file upload process
- [ ] Accurate progress visualization
- [ ] Clear status indicators
- [ ] Useful export functionality
- [ ] Responsive and accessible interface

---

## ⚠️ Anti-Patterns to Avoid

### Development Anti-Patterns
- **Big-bang implementations** - Build incrementally instead
- **Assumption-based debugging** - Always verify before fixing
- **Ignoring TypeScript errors** - Fix compilation issues immediately
- **Skipping error handling** - Plan for failure scenarios upfront
- **Over-engineering** - Keep it simple for MVP, enhance later

### Code Anti-Patterns
- **Implicit any types** - Always define proper interfaces
- **Direct DOM manipulation** - Use React patterns
- **Inline styles for complex styling** - Use CSS classes
- **Unhandled promises** - Always catch async errors
- **Memory leaks** - Clean up subscriptions and effects

---

**Status:** Ready for Claude Code development with clear guidelines and priorities  
**Approach:** Evidence-based, incremental development with focus on working MVP  
**Success:** Complete working system in 4-6 hours with proper testing and deployment