# Staking Migration Notice and Action Block Design

**Date:** 2026-07-17

## Context

ADX staking has moved from this application to the sibling `adex-mega-app` project, where it is available through the heyAura staking route. This legacy application must remain useful for connecting a wallet and inspecting balances, rewards, staking positions, and transaction history, but it must no longer initiate blockchain writes.

All blockchain writes reachable through the current live routes pass through `wrapDoingTxns` in `src/AppHooks.js`. The live transaction entry controls are implemented either through `WithDialog` action forms or as direct claim/withdraw buttons. Wallet connection, disconnection, data refresh, navigation, and public reads do not use `wrapDoingTxns`.

## Goals

1. Show an always-visible migration banner on every application route.
2. Open a migration-information popup immediately when a user clicks any currently enabled blockchain-action control.
3. Prevent every transaction routed through `wrapDoingTxns` from invoking its underlying transaction function.
4. Preserve the existing transaction implementation in the source code.
5. Keep wallet connection, wallet disconnection, navigation, read-only data, external links, and non-blockchain features operational.
6. Match the existing Material-UI styling and responsive layout.

## Required Copy and Links

The banner and popup must render this exact English copy:

> AdEx is now heyAura. $ADX staking has moved to [app.heyaura.com/staking](http://app.heyaura.com/staking). A token migration is underway. See the [migration announcement](https://blog.heyaura.com/adx-staking-migration/) for details.

The two links must use these destinations:

- `http://app.heyaura.com/staking`
- `https://blog.heyaura.com/adx-staking-migration/`

The copy will be implemented once in a shared React message component and reused by the banner and popup. It will remain exact English copy for every selected locale because no approved translations were supplied.

## User Experience

### Persistent banner

- Render a filled Material-UI `Alert` with `severity="info"` at the top of `Root`'s content area, outside the route `Switch`.
- Place it in the existing `stickyAlerts` container so it remains visible while the main content scrolls.
- Keep it non-dismissible.
- Render both URLs with the project's `ExternalAnchor` component so they use the established typography, external-link icon, new-tab behavior, and `noopener noreferrer` protection.
- Stack it correctly with the existing pending-transaction warning when both are present.

### Action popup

- When a currently enabled transaction action is clicked, do not open its form or confirmation dialog. Open the migration popup immediately.
- Render the popup with the existing `Modal`, `Backdrop`, `Fade`, filled info `Alert`, and `CustomButton` patterns.
- Give the popup the existing centered modal layout and `alwaysOnTop` z-index so the safety guard can also display it above any already-open legacy dialog.
- Reuse the exact banner message and links.
- Provide one `Close` button. Backdrop click and Escape may also close the informational popup through the normal Material-UI `Modal` `onClose` behavior.
- Closing the popup does not enable an action. A later action attempt opens it again.
- Preserve each control's existing eligibility rules. A control that is already disabled because no wallet is connected, data is loading, no rewards are selected, or an action is unavailable remains disabled and does not become clickable solely to show the popup.

## Blocked and Allowed Interactions

### Blocked blockchain actions

The immediate popup and execution guard cover the currently live write flows:

- TOM v5 deposit/stake
- TOM v5 unbond commitment
- TOM v5 unlocked withdrawal
- TOM v5 rage leave
- Loyalty pool deposit
- Loyalty pool withdrawal
- Legacy TOM reward claim
- Legacy bond migration/unbond into v5
- Legacy identity-balance withdrawal

The central execution guard also protects dormant transaction paths that already use `wrapDoingTxns` if a legacy entry point is accidentally exposed again. Existing farm, gasless, swap, new-bond, rebond, and transaction action implementations are not deleted.

### Allowed interactions

The following remain functional:

- Wallet selection and connection
- Wallet disconnection
- Account and network detection
- Connected and public balance/statistics refreshes
- Staking position, reward, APY, history, and price reads
- Navigation between application pages
- Help, terms, source, external information, and migration links
- Language selection and other non-transaction UI controls
- Email signup and other non-blockchain requests

`getSigner` must not be globally blocked because the application uses signer-backed address discovery for connected read-only data. Only transaction execution and transaction entry controls are intercepted.

## Architecture

### Migration configuration

Add a focused migration helper module containing:

- A constant indicating that legacy staking actions are blocked.
- The heyAura staking URL.
- The migration-announcement URL.
- A small blocker function that opens the notice and reports whether it consumed the action attempt.

Keeping the flag and destinations in one module prevents copy drift and makes the guard testable without rendering the network-heavy application.

### Shared notice component

Add a focused migration notice module containing:

- A shared message component that renders the exact copy and two links.
- The persistent info banner.
- The controlled modal popup.

The popup receives `open` and `onClose` props. It does not own transaction state and does not invoke or import transaction actions.

### Shared application state

Add controlled popup state and stable open/close/action-attempt callbacks to `useApp` in `src/AppHooks.js`, and expose them through the existing `AppContext` value.

The existing `wrapDoingTxns` callback will call the shared action-attempt blocker before it displays the signing modal or calls `fn.apply`. When blocking is active it will open the migration popup and return without invoking the supplied function. The current transaction try/catch, progress UI, refresh behavior, and action modules remain in place behind that guard.

### Immediate entry interception

`WithDialog` is currently used only to open transaction forms. Its trigger-button handler will consult the shared action-attempt callback before toggling a dialog. When the callback reports a block, `WithDialog` will leave the form closed.

The two live transaction entry points that do not use `WithDialog` will call the same blocker before changing their confirmation state:

- Reward claim in `src/components/Rewards.js`
- Legacy identity withdrawal in `src/components/UserData.js`

Read-only route links and migration navigation links are not transaction executions and remain navigable. Transaction controls reached on those pages are blocked at their entry points.

### Root rendering

`Root` will:

- Render the banner before routed content in the sticky alert stack.
- Render one controlled popup near the other root-level modals.
- Read popup state and close behavior from `AppContext`.

No per-route popup instances will be created.

## Data and Event Flow

### Immediate action attempt

1. The user clicks an enabled transaction control.
2. The control or `WithDialog` calls the shared action-attempt blocker.
3. The blocker sees that legacy actions are disabled, opens the root popup, and reports that it consumed the attempt.
4. The original form or confirmation dialog remains closed.
5. No transaction action, approval, signature request, relayer request, or wallet-send request is started.

### Safety fallback

1. A missed, dormant, or already-open legacy path reaches `wrapDoingTxns`.
2. `wrapDoingTxns` calls the same blocker before setting `openDoingTx` and before invoking the supplied action.
3. The popup opens and the wrapper returns.
4. The original transaction function remains uncalled.

### Read-only flow

1. The user connects a wallet through the existing connector flow.
2. Existing account detection and `refreshStats` logic load address-scoped data.
3. No migration blocker is consulted because the flow does not attempt a transaction.

## Accessibility and Security

- The banner uses the semantic Material-UI alert role.
- The popup includes unique `aria-labelledby` and `aria-describedby` references and a keyboard-operable Close button.
- Focus is managed by Material-UI `Modal` and returns after closing.
- External links open in a new tab with `rel="noopener noreferrer"` through `ExternalAnchor`.
- The popup remains responsive at narrow viewport widths and uses the existing root modal width constraints and theme spacing.
- No wallet-signing method, transaction function, or contract write is invoked by a blocked attempt.

## Testing Strategy

Implementation follows red-green-refactor with isolated Jest and React Testing Library coverage:

1. Notice component tests:
   - The banner renders the exact copy.
   - Both links have the required destinations and safe external-link attributes.
   - The popup is absent when closed, present when open, and calls `onClose` from its Close button.
2. Transaction-dialog interception tests:
   - Clicking a `WithDialog` transaction trigger calls the blocker.
   - When blocked, the decorated form does not open.
   - When the blocker reports no block, the existing dialog behavior remains available.
3. Direct-entry tests:
   - Representative direct claim/withdraw entry handling opens the notice rather than its legacy confirmation.
4. Execution-guard tests:
   - The blocker reports a consumed attempt and opens the notice while the migration flag is active.
   - A representative wrapped transaction function is not invoked by the blocked path.
5. Verification:
   - Run focused tests under the project's required Node `18.20.x` runtime.
   - Run the full test suite and production build.
   - Confirm that the current stale CRA `App.test.js` baseline and its `setImmediate` dependency issue are either repaired as narrowly as needed for a clean suite or reported separately if unrelated to the feature.

## Acceptance Criteria

- The exact migration banner is visible on `/`, `/stakings`, `/rewards`, and other live routes.
- Both banner links point to the required URLs and open safely in a new tab.
- Clicking any currently enabled live blockchain-action control immediately opens the migration popup.
- No legacy action form or confirmation opens from that click.
- Reaching the transaction wrapper through any fallback path still cannot invoke the underlying transaction function.
- No wallet signature or transaction prompt appears.
- Connecting and disconnecting a wallet still work.
- Public and connected read-only data still load through the existing flows.
- Existing transaction and withdrawal implementation code remains present.
- The UI uses existing theme tokens, alerts, modal behavior, buttons, spacing, and responsive patterns.

## Out of Scope

- Reimplementing the sibling heyAura staking migration in this repository
- Changing staking contracts, ABIs, addresses, or transaction construction
- Translating the supplied migration copy without approved translations
- Removing legacy action modules or forms
- Changing wallet connector capabilities
- Redirecting users automatically away from the legacy application
