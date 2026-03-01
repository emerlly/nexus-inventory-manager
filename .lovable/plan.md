

## Plan: Fix Build Error & Continue Updates

### 1. Fix Build Error
The `User` type in `src/types/index.ts` is missing a `company` property. The sidebar references `user?.company?.name` at line 79.

**Fix:** Add `company?: { name: string }` to the `User` interface in `src/types/index.ts`.

### 2. Restore Order Item Editing
The previous diff removed the inline item editing capability from `OrdersPage.tsx`. Will restore the expand/edit items functionality that was previously implemented.

### 3. Summary
- One-line type fix resolves the build error
- Order page editing restoration ensures no feature regression

