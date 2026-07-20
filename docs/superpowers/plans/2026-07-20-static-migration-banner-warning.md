# Static Migration Banner Warning Color Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render only the persistent staking-migration banner with the project's warning theme while leaving the popup on the info theme.

**Architecture:** Keep the existing shared filled Material-UI `Alert` wrapper. Verify each notice surface's generated severity class, then change only `StakingMigrationBanner` from `info` to `warning`; Material-UI and `lightTheme.palette.warning` continue to own the background and contrast text.

**Tech Stack:** React 17, Material-UI 4, Jest, React Testing Library, Yarn 1, Node 18.20.3

## Global Constraints

- Use `severity="warning"` only on the persistent migration banner.
- Keep the migration popup at `severity="info"`.
- Use the existing `palette.warning` theme values; add no inline styles, hardcoded component colors, CSS overrides, or theme tokens.
- Preserve all copy, links, placement, accessibility, responsiveness, and action-blocking behavior.

---

### Task 1: Apply the warning severity to the static banner

**Files:**
- Modify: `src/components/StakingMigrationNotice.test.js`
- Modify: `src/components/StakingMigrationNotice.js`

**Interfaces:**
- Consumes: Material-UI `Alert`'s `severity` prop and generated `MuiAlert-filledWarning` / `MuiAlert-filledInfo` classes.
- Produces: A warning-themed `StakingMigrationBanner`; `StakingMigrationPopup` remains info-themed.

- [ ] **Step 1: Write the failing severity assertions**

Add this assertion to the existing banner test after retrieving `alert`:

```js
expect(alert).toHaveClass("MuiAlert-filledWarning")
expect(alert).not.toHaveClass("MuiAlert-filledInfo")
```

In the open-popup test, retain the popup alert in a variable and assert its unchanged severity:

```js
const alert = within(dialog).getByRole("alert")
expect(alert).toHaveClass("MuiAlert-filledInfo")
expect(alert).not.toHaveClass("MuiAlert-filledWarning")
expect(normalizedText(alert)).toBe(`${EXPECTED_MESSAGE}Close`)
```

- [ ] **Step 2: Run the focused test and verify the banner assertion fails**

Run under Node 18.20.3:

```bash
CI=true yarn test --watchAll=false --runInBand src/components/StakingMigrationNotice.test.js
```

Expected: FAIL because the banner has `MuiAlert-filledInfo`, not `MuiAlert-filledWarning`; the popup assertions pass.

- [ ] **Step 3: Make the minimal component change**

Change only the banner severity in `src/components/StakingMigrationNotice.js`:

```jsx
<Alert id="staking-migration-banner" severity="warning">
```

- [ ] **Step 4: Run the focused test and verify it passes**

```bash
CI=true yarn test --watchAll=false --runInBand src/components/StakingMigrationNotice.test.js
```

Expected: PASS with three tests passing.

- [ ] **Step 5: Run full automated verification**

```bash
CI=true yarn test --watchAll=false --runInBand
yarn build
git diff --check
```

Expected: all tests pass, the production build exits successfully, and `git diff --check` reports no errors.

- [ ] **Step 6: Inspect desktop and mobile rendering**

Start the app under Node 18.20.3 with `yarn start`, then inspect `/` at 1440×900 and 375×812.

Expected: the static banner uses the orange warning background and theme-provided contrast text without overflow; the action popup remains blue/info.

- [ ] **Step 7: Commit the tested change**

```bash
git add src/components/StakingMigrationNotice.js src/components/StakingMigrationNotice.test.js
git commit -m "style: use warning theme for migration banner"
```
