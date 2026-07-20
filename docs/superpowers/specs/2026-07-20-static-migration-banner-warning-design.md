# Static Migration Banner Warning Color Design

**Date:** 2026-07-20

## Goal

Change only the persistent staking-migration banner from the themed filled info appearance to the project's themed filled warning appearance.

## Design

- Keep the existing shared `Alert` wrapper and its `variant="filled"` behavior.
- Set `StakingMigrationBanner` to `severity="warning"`.
- Rely entirely on the Material-UI theme's `palette.warning` values: `#FEB006` for the background and the configured warning contrast text for content and inherited links.
- Do not add inline styles, hardcoded component colors, custom CSS overrides, or new theme tokens.
- Keep `StakingMigrationPopup` at `severity="info"`, so only the static banner changes color.
- Preserve the banner copy, links, placement, accessibility, responsive behavior, and all action-blocking behavior.

## Testing and Verification

- Add a focused assertion that the static banner uses Material-UI's filled-warning class while retaining its exact copy and destinations.
- Confirm the popup continues to use the filled-info class.
- Run the focused notice test, the complete test suite, and the production build under Node 18.20.3.
- Inspect the local static banner at desktop and mobile widths to confirm the theme-provided warning background and contrast text render without overflow.

## Acceptance Criteria

- The persistent migration banner uses the existing warning theme color.
- Its text and links use the theme's automatic contrast color.
- The migration popup remains blue/info.
- No inline or non-theme color styles are introduced.
- No behavior or copy changes occur.
