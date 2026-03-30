# Quick Task: Decorated PDF Visual Improvements

## Goal
Improve the visual presentation of the decorated hymn PDF style with 10 enhancements covering hierarchy, spacing, ornaments, and readability.

## Changes

### File 1: `app/components/pdf-components/shared/pdf-tokens.ts`
- Reduce FOOTER_HEIGHT from 100 to 70 (more compact)
- Add ornament color token
- Add bible text contrast color

### File 2: `app/components/pdf-components/pdf-pages/HymnPageDecorated.tsx`
1. **Header**: Badge-style hymn number with gold background pill
2. **Bible ref**: Higher contrast text (#b0b0b0), italic font style
3. **Verse numbers**: Larger, with ornamental divider lines (— I —)
4. **CORO label**: Differentiated with flanking dashes (— CORO —) and larger size
5. **Verse spacing**: Increase marginBottom from 12 to 16
6. **Left accent line**: Thicker (4pt) continuous gold line on body left edge
7. **Footer**: Compact (70pt), keep author info
8. **Lyrics text**: Remove textTransform uppercase (sentence case)
9. **Ornamental dividers**: Decorative separator between sections using unicode ornaments
10. **Margins**: Reduce horizontal padding for better text width balance

## Verification
- `npm run build` passes
- Visual inspection of changes
