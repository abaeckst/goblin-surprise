# Sample .dek Files

These are sample MTGO .dek files for testing the MTG Collection Rebuilding System.

## Files:

1. **sample-jeskai-control.dek** - A realistic Jeskai Control Legacy deck with 75 cards
2. **sample-power-nine.dek** - A simplified deck with Power Nine cards for testing

## How to use:

1. Download these files from the development tools section
2. Upload them using the file upload interface
3. Verify that cards are parsed and stored correctly

## Format:

These files follow the standard MTGO .dek XML format:
- `<Quantity>X</Quantity>` - Number of copies
- `<n>Card Name</n>` - Card name as it appears in Magic Online

## Testing scenarios:

- Normal upload flow
- Multiple file upload
- Duplicate uploads (should add to totals)
- Error handling for malformed files
