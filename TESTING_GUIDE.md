# MTG Collection System - Testing Guide

## 🎯 Test Categories

### 1. BASIC FUNCTIONALITY TESTS

#### Test 1.1: Valid File Upload
**File:** `test-burn-deck.dek`
**Steps:**
1. Enter contributor name: "Test User 1"
2. Upload the burn deck file
3. **Expected:** 
   - File processes successfully
   - Shows 42 total cards (8 unique)
   - Upload results display correctly
   - No errors in console

#### Test 1.2: Database Storage Verification
**After Test 1.1:**
1. Open browser dev tools → Application/Storage → Local Storage
2. Check Supabase connection in console
3. **Expected:** 
   - Database connection shows "✅ Supabase connection successful"
   - Cards stored in gathered_cards table

#### Test 1.3: Multiple File Upload
**Files:** `test-burn-deck.dek` + `test-minimal-deck.dek`
**Steps:**
1. Enter contributor name: "Test User 2"  
2. Select both files and upload together
3. **Expected:**
   - Both files process
   - Results show 2 separate upload cards
   - Total cards: 44 (42 + 2)

---

### 2. CONTRIBUTOR TRACKING TESTS

#### Test 2.1: Different Contributors
**Steps:**
1. Upload `test-burn-deck.dek` as "Alice"
2. Upload `test-control-deck.dek` as "Bob"
3. **Expected:**
   - Each upload shows correct contributor name
   - Cards tracked separately by contributor

#### Test 2.2: Same Contributor, Multiple Uploads
**Steps:**
1. Upload `test-burn-deck.dek` as "Charlie"
2. Upload `test-burn-deck.dek` again as "Charlie"
3. **Expected:**
   - Both uploads show "Charlie" as contributor
   - Duplicate cards are allowed and counted
   - System tracks both upload sessions

---

### 3. ERROR HANDLING TESTS

#### Test 3.1: Invalid XML Format
**File:** `test-invalid-xml.dek`
**Steps:**
1. Enter name and upload file
2. **Expected:**
   - Parser catches XML error
   - Shows warning/error message
   - Some cards may still be processed (partial success)

#### Test 3.2: Empty/Invalid Data
**File:** `test-empty-deck.dek`
**Steps:**
1. Upload empty deck file
2. **Expected:**
   - Shows "No valid cards found" error
   - Upload marked as failed
   - No database insertion

#### Test 3.3: Invalid Quantities
**File:** `test-invalid-quantities.dek`
**Steps:**
1. Upload file with invalid quantities
2. **Expected:**
   - Valid cards processed (should get "Valid Card" x4)
   - Invalid quantity cards skipped
   - Warnings shown for problematic entries

#### Test 3.4: Missing Contributor Name
**Steps:**
1. Leave contributor name blank
2. Try to upload any file
3. **Expected:**
   - Upload button disabled/grayed out
   - Error message: "Please enter your name first"

---

### 4. UI/UX TESTS

#### Test 4.1: Drag and Drop
**Steps:**
1. Enter contributor name
2. Drag `test-burn-deck.dek` onto upload area
3. **Expected:**
   - Drop zone highlights when file dragged over
   - File uploads automatically on drop

#### Test 4.2: Progress Indicators
**File:** `test-control-deck.dek` (large file)
**Steps:**
1. Upload large deck file
2. Watch progress indicators
3. **Expected:**
   - Progress bar shows during processing
   - Spinner animation displays
   - "Processing..." message updates

#### Test 4.3: Results Display
**After any successful upload:**
1. Check upload results section
2. **Expected:**
   - Cards listed with quantities
   - Contributor name displayed
   - Card count accurate
   - Timestamp shown

---

### 5. EDGE CASE TESTS

#### Test 5.1: Very Large File
**File:** Create a deck with 100+ unique cards
**Expected:** System handles without performance issues

#### Test 5.2: Special Characters
**File:** `test-special-chars.dek`
**Expected:** Card names with special characters parse correctly

#### Test 5.3: Rapid Sequential Uploads
**Steps:**
1. Upload 3-4 files quickly in succession
2. **Expected:**
   - All files process correctly
   - No database conflicts
   - Results display in order

---

### 6. DATABASE INTEGRATION TESTS

#### Test 6.1: Connection Status
**On page load:**
1. Check connection indicator
2. **Expected:** Green "Database Connected" status

#### Test 6.2: Real-time Updates (Future)
**If multiple users:** Changes should appear without refresh

#### Test 6.3: Data Persistence
**Steps:**
1. Upload files and close browser
2. Reopen application  
3. **Expected:** Previous uploads should persist

---

## 🔧 DEVELOPMENT TOOLS TESTING

### Test 7.1: Clear All Data Function
**In Development Mode:**
1. Upload several test files
2. Click "Clear All Data" button
3. **Expected:**
   - All data removed from database
   - Upload results cleared
   - Fresh state for testing

### Test 7.2: Sample File Download
**Steps:**
1. Click "Download Sample .dek"
2. **Expected:**
   - File downloads successfully
   - Can be re-uploaded for testing

---

## 📊 SUCCESS CRITERIA

### ✅ MUST PASS (Critical):
- [ ] Valid .dek files upload successfully
- [ ] Cards stored in database correctly
- [ ] Contributor names tracked properly
- [ ] Upload results display accurately
- [ ] Basic error handling works

### ✅ SHOULD PASS (Important):
- [ ] Multiple file uploads work
- [ ] Invalid files handled gracefully
- [ ] UI feedback is clear and helpful
- [ ] No console errors during normal operation

### ✅ NICE TO PASS (Polish):
- [ ] Drag and drop works smoothly
- [ ] Progress indicators are accurate
- [ ] Edge cases handled well
- [ ] Performance acceptable with large files

---

## 🐛 COMMON ISSUES TO WATCH FOR

1. **TypeScript Compilation Errors** - Should be resolved now
2. **Supabase Connection Failures** - Check .env.local configuration
3. **XML Parsing Issues** - Some MTGO exports may have variations
4. **File Size Limits** - Large deck files might cause issues
5. **Browser Compatibility** - Test in Chrome, Firefox, Safari

---

## 📝 TEST EXECUTION LOG

Use this checklist to track your testing progress:

**Basic Functionality:**
- [ ] Test 1.1 - Valid File Upload
- [ ] Test 1.2 - Database Storage  
- [ ] Test 1.3 - Multiple Files

**Contributor Tracking:**
- [ ] Test 2.1 - Different Contributors
- [ ] Test 2.2 - Same Contributor Multiple Uploads

**Error Handling:**
- [ ] Test 3.1 - Invalid XML
- [ ] Test 3.2 - Empty Deck
- [ ] Test 3.3 - Invalid Quantities
- [ ] Test 3.4 - Missing Name

**UI/UX:**
- [ ] Test 4.1 - Drag and Drop
- [ ] Test 4.2 - Progress Indicators
- [ ] Test 4.3 - Results Display

**Edge Cases:**
- [ ] Test 5.1 - Large File
- [ ] Test 5.2 - Special Characters
- [ ] Test 5.3 - Rapid Uploads

**Database:**
- [ ] Test 6.1 - Connection Status
- [ ] Test 6.2 - Data Persistence

**Development Tools:**
- [ ] Test 7.1 - Clear Data
- [ ] Test 7.2 - Sample Download

---

**Testing Status:** Ready for comprehensive validation
**Next Phase:** After testing passes, implement progress dashboard and export features
