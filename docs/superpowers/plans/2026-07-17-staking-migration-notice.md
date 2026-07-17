# Staking Migration Notice and Action Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the exact heyAura migration notice and prevent all live legacy staking transactions while preserving wallet connection and read-only data.

**Architecture:** A shared migration policy and hook own the block flag, popup state, and transaction guard. A reusable migration-action button intercepts enabled transaction entry controls immediately, while `wrapDoingTxns` uses the same guard as a second safety layer. A single themed notice component supplies both the sticky banner and root-level popup.

**Tech Stack:** React 18, JavaScript, Material-UI 4, React Context/hooks, Jest/CRA, React Testing Library, Node 18.20.x, Yarn 1.22.

## Global Constraints

- Render this exact copy in both surfaces: `AdEx is now heyAura. $ADX staking has moved to app.heyaura.com/staking. A token migration is underway. See the migration announcement for details.`
- Link `app.heyaura.com/staking` to `http://app.heyaura.com/staking`.
- Link `migration announcement` to `https://blog.heyaura.com/adx-staking-migration/`.
- Open the popup on the first click of every currently enabled blockchain-action control; do not open the legacy form first.
- Preserve all existing transaction, withdrawal, approval, signing, and relayer implementation code behind the guard.
- Preserve wallet connect/disconnect, navigation, read-only data, language controls, external links, and non-blockchain requests.
- Preserve existing action eligibility and disabled-state rules.
- Use existing Material-UI alerts, modal/backdrop/fade behavior, `CustomButton`, `ExternalAnchor`, theme tokens, root spacing, and responsive patterns.
- Display the supplied copy in English for every selected locale; do not invent translations.

---

### Task 1: Migration Policy and Stateful Guard

**Files:**

- Create: `src/helpers/stakingMigration.js`
- Create: `src/helpers/stakingMigration.test.js`
- Create: `src/hooks/useStakingMigrationBlock.js`
- Create: `src/hooks/useStakingMigrationBlock.test.js`
- Modify: `src/App.test.js`

**Interfaces:**

- Produces: `STAKING_ACTIONS_DISABLED: boolean`
- Produces: `HEYAURA_STAKING_URL: string`
- Produces: `MIGRATION_ANNOUNCEMENT_URL: string`
- Produces: `blockStakingAction(onBlocked: () => void): boolean`
- Produces: `withStakingMigrationGuard(onBlocked: () => void, action: (...args) => Promise<unknown> | unknown): (...args) => Promise<unknown | undefined>`
- Produces: `useStakingMigrationBlock(): { stakingMigrationNoticeOpen, openStakingMigrationNotice, closeStakingMigrationNotice, onStakingActionAttempt, guardStakingAction }`

- [ ] **Step 1: Write the failing policy and guard tests**

Create `src/helpers/stakingMigration.test.js`:

```js
import {
	blockStakingAction,
	withStakingMigrationGuard
} from "./stakingMigration"

describe("staking migration transaction guard", () => {
	it("opens the migration notice and consumes an action attempt", () => {
		const onBlocked = jest.fn()

		expect(blockStakingAction(onBlocked)).toBe(true)
		expect(onBlocked).toHaveBeenCalledTimes(1)
	})

	it("does not invoke a guarded legacy transaction", async () => {
		const onBlocked = jest.fn()
		const transaction = jest.fn()
		const guardedTransaction = withStakingMigrationGuard(
			onBlocked,
			transaction
		)

		await guardedTransaction("legacy-argument")

		expect(onBlocked).toHaveBeenCalledTimes(1)
		expect(transaction).not.toHaveBeenCalled()
	})
})
```

Replace the stale CRA placeholder in `src/App.test.js` with the application-level policy assertion:

```js
import { STAKING_ACTIONS_DISABLED } from "./helpers/stakingMigration"

test("keeps legacy staking transactions disabled during migration", () => {
	expect(STAKING_ACTIONS_DISABLED).toBe(true)
})
```

- [ ] **Step 2: Write the failing state-hook tests**

Create `src/hooks/useStakingMigrationBlock.test.js`:

```js
import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import useStakingMigrationBlock from "./useStakingMigrationBlock"

function MigrationBlockHarness({ transaction = jest.fn() }) {
	const {
		stakingMigrationNoticeOpen,
		closeStakingMigrationNotice,
		onStakingActionAttempt,
		guardStakingAction
	} = useStakingMigrationBlock()

	return (
		<>
			<div data-testid="migration-notice-state">
				{stakingMigrationNoticeOpen ? "open" : "closed"}
			</div>
			<button onClick={onStakingActionAttempt}>Attempt action</button>
			<button onClick={closeStakingMigrationNotice}>Close notice</button>
			<button onClick={guardStakingAction(transaction)}>
				Run guarded transaction
			</button>
		</>
	)
}

describe("useStakingMigrationBlock", () => {
	it("opens and closes the migration notice", () => {
		render(<MigrationBlockHarness />)

		expect(screen.getByTestId("migration-notice-state")).toHaveTextContent(
			"closed"
		)
		fireEvent.click(screen.getByRole("button", { name: "Attempt action" }))
		expect(screen.getByTestId("migration-notice-state")).toHaveTextContent(
			"open"
		)
		fireEvent.click(screen.getByRole("button", { name: "Close notice" }))
		expect(screen.getByTestId("migration-notice-state")).toHaveTextContent(
			"closed"
		)
	})

	it("opens the notice without running a guarded transaction", async () => {
		const transaction = jest.fn()
		render(<MigrationBlockHarness transaction={transaction} />)

		fireEvent.click(
			screen.getByRole("button", { name: "Run guarded transaction" })
		)

		expect(screen.getByTestId("migration-notice-state")).toHaveTextContent(
			"open"
		)
		expect(transaction).not.toHaveBeenCalled()
	})
})
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
source /Users/klatibook/.nvm/nvm.sh
nvm use 18.20.3
CI=true yarn test --watchAll=false --runInBand src/helpers/stakingMigration.test.js src/hooks/useStakingMigrationBlock.test.js src/App.test.js
```

Expected: FAIL because `stakingMigration`, `useStakingMigrationBlock`, and their exports do not exist.

- [ ] **Step 4: Implement the migration policy and transaction guard**

Create `src/helpers/stakingMigration.js`:

```js
export const STAKING_ACTIONS_DISABLED = true
export const HEYAURA_STAKING_URL = "http://app.heyaura.com/staking"
export const MIGRATION_ANNOUNCEMENT_URL =
	"https://blog.heyaura.com/adx-staking-migration/"

export const blockStakingAction = onBlocked => {
	if (!STAKING_ACTIONS_DISABLED) return false

	if (typeof onBlocked === "function") onBlocked()
	return true
}

export const withStakingMigrationGuard = (onBlocked, action) => async (
	...args
) => {
	if (blockStakingAction(onBlocked)) return undefined
	return action(...args)
}
```

- [ ] **Step 5: Implement the stateful migration hook**

Create `src/hooks/useStakingMigrationBlock.js`:

```js
import { useCallback, useState } from "react"
import {
	blockStakingAction,
	withStakingMigrationGuard
} from "../helpers/stakingMigration"

export default function useStakingMigrationBlock() {
	const [stakingMigrationNoticeOpen, setStakingMigrationNoticeOpen] = useState(
		false
	)

	const openStakingMigrationNotice = useCallback(() => {
		setStakingMigrationNoticeOpen(true)
	}, [])

	const closeStakingMigrationNotice = useCallback(() => {
		setStakingMigrationNoticeOpen(false)
	}, [])

	const onStakingActionAttempt = useCallback(
		() => blockStakingAction(openStakingMigrationNotice),
		[openStakingMigrationNotice]
	)

	const guardStakingAction = useCallback(
		action => withStakingMigrationGuard(openStakingMigrationNotice, action),
		[openStakingMigrationNotice]
	)

	return {
		stakingMigrationNoticeOpen,
		openStakingMigrationNotice,
		closeStakingMigrationNotice,
		onStakingActionAttempt,
		guardStakingAction
	}
}
```

- [ ] **Step 6: Run the focused tests and verify GREEN**

Run the Step 3 command again.

Expected: PASS for `stakingMigration.test.js`, `useStakingMigrationBlock.test.js`, and `App.test.js`; zero failed tests.

- [ ] **Step 7: Commit the policy and guard**

```bash
git add src/helpers/stakingMigration.js src/helpers/stakingMigration.test.js src/hooks/useStakingMigrationBlock.js src/hooks/useStakingMigrationBlock.test.js src/App.test.js
git commit -m "feat: add staking migration transaction guard"
```

---

### Task 2: Shared Styled Banner and Popup

**Files:**

- Create: `src/components/StakingMigrationNotice.js`
- Create: `src/components/StakingMigrationNotice.test.js`
- Modify: `src/components/Anchor.js:20-56`

**Interfaces:**

- Consumes: `HEYAURA_STAKING_URL` and `MIGRATION_ANNOUNCEMENT_URL` from Task 1.
- Produces: `StakingMigrationMessage({ idPrefix: string })`
- Produces: `StakingMigrationBanner()`
- Produces: `StakingMigrationPopup({ open: boolean, onClose: () => void, className?: string })`
- Extends: `Anchor`/`ExternalAnchor` with `preserveProtocol?: boolean`, defaulting to the existing protocol-relative behavior.

- [ ] **Step 1: Write the failing notice tests**

Create `src/components/StakingMigrationNotice.test.js`:

```js
import React from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { MuiThemeProvider } from "@material-ui/core/styles"
import { lightTheme } from "../themeMUi"
import {
	StakingMigrationBanner,
	StakingMigrationPopup
} from "./StakingMigrationNotice"

const EXPECTED_MESSAGE =
	"AdEx is now heyAura. $ADX staking has moved to app.heyaura.com/staking. A token migration is underway. See the migration announcement for details."

const renderWithTheme = ui =>
	render(<MuiThemeProvider theme={lightTheme}>{ui}</MuiThemeProvider>)

const normalizedText = node => node.textContent.replace(/\s+/g, " ").trim()

describe("StakingMigrationBanner", () => {
	it("renders the exact migration copy and destinations", () => {
		renderWithTheme(<StakingMigrationBanner />)

		const alert = screen.getByRole("alert")
		expect(normalizedText(alert)).toBe(EXPECTED_MESSAGE)

		const stakingLink = screen.getByRole("link", {
			name: /app\.heyaura\.com\/staking/i
		})
		const announcementLink = screen.getByRole("link", {
			name: /migration announcement/i
		})

		expect(stakingLink).toHaveAttribute(
			"href",
			"http://app.heyaura.com/staking"
		)
		expect(announcementLink).toHaveAttribute(
			"href",
			"https://blog.heyaura.com/adx-staking-migration/"
		)

		for (const link of [stakingLink, announcementLink]) {
			expect(link).toHaveAttribute("target", "_blank")
			expect(link).toHaveAttribute("rel", "noopener noreferrer")
		}
	})
})

describe("StakingMigrationPopup", () => {
	it("does not render a dialog while closed", () => {
		renderWithTheme(
			<StakingMigrationPopup open={false} onClose={jest.fn()} />
		)

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
	})

	it("renders the exact message and closes from its button", () => {
		const onClose = jest.fn()
		renderWithTheme(<StakingMigrationPopup open onClose={onClose} />)

		const dialog = screen.getByRole("dialog")
		expect(normalizedText(within(dialog).getByRole("alert"))).toBe(
			`${EXPECTED_MESSAGE}Close`
		)

		fireEvent.click(within(dialog).getByRole("button", { name: "Close" }))
		expect(onClose).toHaveBeenCalledTimes(1)
	})
})
```

- [ ] **Step 2: Run the notice test and verify RED**

Run:

```bash
source /Users/klatibook/.nvm/nvm.sh
nvm use 18.20.3
CI=true yarn test --watchAll=false --runInBand src/components/StakingMigrationNotice.test.js
```

Expected: FAIL because `StakingMigrationNotice.js` does not exist.

- [ ] **Step 3: Preserve exact protocols through the existing anchor style**

Update `getUrl`, the `Anchor` props, and the external URL selection in `src/components/Anchor.js`:

```js
const getUrl = (url, preserveProtocol) => {
	if (preserveProtocol) return url

	url = (url || "").replace(/^(https?:)?\/\//i, "")
	if (url) {
		url = "//" + url
	}

	return url
}
```

Add `preserveProtocol` to the destructured `Anchor` props, then select the URL with:

```js
const url = isExternal ? getUrl(href, preserveProtocol) : href
```

Do not forward `preserveProtocol` to the DOM. Existing anchors omit it and retain their current protocol-relative behavior.

- [ ] **Step 4: Implement the shared message, banner, and popup**

Create `src/components/StakingMigrationNotice.js`:

```js
import React from "react"
import { Backdrop, Box, Fade, Modal } from "@material-ui/core"
import { Alert as MuiAlert } from "@material-ui/lab"
import { ExternalAnchor } from "./Anchor"
import CustomButton from "./CustomButton"
import {
	HEYAURA_STAKING_URL,
	MIGRATION_ANNOUNCEMENT_URL
} from "../helpers/stakingMigration"

function Alert(props) {
	return <MuiAlert variant="filled" {...props} />
}

export function StakingMigrationMessage({ idPrefix }) {
	return (
		<span id={`${idPrefix}-description`}>
			<span id={`${idPrefix}-title`}>AdEx is now heyAura.</span>{" "}
			{"$ADX staking has moved to "}
			<ExternalAnchor
				id={`${idPrefix}-staking-link`}
				href={HEYAURA_STAKING_URL}
				color="inherit"
				preserveProtocol
			>
				app.heyaura.com/staking
			</ExternalAnchor>
			{". A token migration is underway. See the "}
			<ExternalAnchor
				id={`${idPrefix}-announcement-link`}
				href={MIGRATION_ANNOUNCEMENT_URL}
				color="inherit"
				preserveProtocol
			>
				migration announcement
			</ExternalAnchor>
			{" for details."}
		</span>
	)
}

export function StakingMigrationBanner() {
	return (
		<Alert id="staking-migration-banner" severity="info">
			<StakingMigrationMessage idPrefix="staking-migration-banner" />
		</Alert>
	)
}

export function StakingMigrationPopup({ open, onClose, className }) {
	return (
		<Modal
			open={open}
			onClose={onClose}
			role="dialog"
			aria-modal="true"
			aria-labelledby="staking-migration-popup-title"
			aria-describedby="staking-migration-popup-description"
			BackdropComponent={Backdrop}
			className={className}
			closeAfterTransition
			BackdropProps={{ timeout: 300 }}
		>
			<Fade in={open}>
				<Box width="calc(100% - 16px)" maxWidth={520} m={1}>
					<Alert severity="info">
						<StakingMigrationMessage idPrefix="staking-migration-popup" />
						<Box mt={2} display="flex" justifyContent="flex-end">
							<CustomButton
								btnType="primary"
								radius={false}
								onClick={onClose}
							>
								Close
							</CustomButton>
						</Box>
					</Alert>
				</Box>
			</Fade>
		</Modal>
	)
}
```

- [ ] **Step 5: Run the notice test and verify GREEN**

Run the Step 2 command again.

Expected: PASS with three passing tests and exact link attributes.

- [ ] **Step 6: Commit the shared notice UI**

```bash
git add src/components/Anchor.js src/components/StakingMigrationNotice.js src/components/StakingMigrationNotice.test.js
git commit -m "feat: add staking migration notice UI"
```

---

### Task 3: Immediate Transaction Entry Interception

**Files:**

- Create: `src/components/StakingActionButton.js`
- Create: `src/components/StakingActionButton.test.js`
- Create: `src/components/WithDialog.test.js`
- Create: `src/components/UserData.migration.test.js`
- Modify: `src/components/WithDialog.js:17,145-164`
- Modify: `src/components/Rewards.js:38,413-420`
- Modify: `src/components/UserData.js:1-3,131-145`

**Interfaces:**

- Consumes: `AppContext.onStakingActionAttempt(): boolean` from Task 1.
- Produces: `StakingActionButton({ ButtonComponent?: React.ComponentType, onClick?: (event) => unknown, ...buttonProps })`.
- Preserves: Existing `WithDialog`, claim button, and identity-withdraw button props and disabled states.

- [ ] **Step 1: Write the failing reusable action-button tests**

Create `src/components/StakingActionButton.test.js`:

```js
import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import AppContext from "../AppContext"
import StakingActionButton from "./StakingActionButton"

const renderActionButton = ({ blocked, onClick }) => {
	const onStakingActionAttempt = jest.fn(() => blocked)

	render(
		<AppContext.Provider value={{ onStakingActionAttempt }}>
			<StakingActionButton onClick={onClick}>
				Withdraw
			</StakingActionButton>
		</AppContext.Provider>
	)

	return onStakingActionAttempt
}

describe("StakingActionButton", () => {
	it("consumes a blocked click without calling the legacy handler", () => {
		const onClick = jest.fn()
		const onStakingActionAttempt = renderActionButton({
			blocked: true,
			onClick
		})

		fireEvent.click(screen.getByRole("button", { name: "Withdraw" }))

		expect(onStakingActionAttempt).toHaveBeenCalledTimes(1)
		expect(onClick).not.toHaveBeenCalled()
	})

	it("preserves the original handler when no block is reported", () => {
		const onClick = jest.fn()
		renderActionButton({ blocked: false, onClick })

		fireEvent.click(screen.getByRole("button", { name: "Withdraw" }))

		expect(onClick).toHaveBeenCalledTimes(1)
	})
})
```

- [ ] **Step 2: Write the failing transaction-dialog integration tests**

Create `src/components/WithDialog.test.js`:

```js
import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { MuiThemeProvider } from "@material-ui/core/styles"
import AppContext from "../AppContext"
import { lightTheme } from "../themeMUi"
import WithDialog from "./WithDialog"

const LegacyTransactionForm = () => <div>Legacy transaction form</div>
const TransactionDialog = WithDialog(LegacyTransactionForm)

const renderDialog = blocked =>
	render(
		<MuiThemeProvider theme={lightTheme}>
			<AppContext.Provider
				value={{ onStakingActionAttempt: jest.fn(() => blocked) }}
			>
				<TransactionDialog
					id="legacy-withdraw"
					title="Legacy withdraw"
					btnLabel="Withdraw"
				/>
			</AppContext.Provider>
		</MuiThemeProvider>
	)

describe("WithDialog transaction entry", () => {
	it("leaves the legacy form closed when the action is blocked", () => {
		renderDialog(true)

		fireEvent.click(screen.getByRole("button", { name: "Withdraw" }))

		expect(screen.queryByText("Legacy transaction form")).not.toBeInTheDocument()
	})

	it("retains the existing dialog behavior when blocking is inactive", async () => {
		renderDialog(false)

		fireEvent.click(screen.getByRole("button", { name: "Withdraw" }))

		expect(await screen.findByText("Legacy transaction form")).toBeInTheDocument()
	})
})
```

- [ ] **Step 3: Write the failing direct identity-withdraw test**

Create `src/components/UserData.migration.test.js`:

```js
import React from "react"
import { BigNumber } from "ethers"
import { fireEvent, render, screen } from "@testing-library/react"
import { MuiThemeProvider } from "@material-ui/core/styles"
import AppContext from "../AppContext"
import { lightTheme } from "../themeMUi"
import UserData from "./UserData"

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: key => key })
}))
jest.mock("./StatsCardNav", () => () => null)
jest.mock("./ConfirmationDialog", () => {
	const React = require("react")
	return ({ isOpen }) =>
		isOpen
			? React.createElement(
					"div",
					{ role: "dialog" },
					"Legacy withdraw confirmation"
			  )
			: null
})
jest.mock("../actions", () => ({ identityWithdraw: jest.fn() }))

const ZERO = BigNumber.from(0)
const stats = {
	identityDeployed: true,
	userIdentityBalance: BigNumber.from(1),
	totalBalanceADX: ZERO,
	userWalletBalance: ZERO,
	gaslessAddrBalance: ZERO,
	userBalance: ZERO,
	totalLockedOnDeposits: ZERO,
	userTotalStake: ZERO,
	totalPendingToUnlock: ZERO,
	totalUnlockedDeposits: ZERO,
	tomRewardADX: ZERO,
	connectedWalletAddress: "0x0000000000000000000000000000000000000001"
}

test("opens the migration notice instead of legacy withdraw confirmation", () => {
	const onStakingActionAttempt = jest.fn(() => true)

	render(
		<MuiThemeProvider theme={lightTheme}>
			<AppContext.Provider
				value={{
					chosenWalletType: { name: "browser" },
					wrapDoingTxns: jest.fn(),
					onStakingActionAttempt
				}}
			>
				<UserData stats={stats} prices={{ USD: 0 }} />
			</AppContext.Provider>
		</MuiThemeProvider>
	)

	fireEvent.click(
		screen.getByRole("button", { name: "common.withdrawLegacy" })
	)

	expect(onStakingActionAttempt).toHaveBeenCalledTimes(1)
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
})
```

- [ ] **Step 4: Run the interception tests and verify RED**

Run:

```bash
source /Users/klatibook/.nvm/nvm.sh
nvm use 18.20.3
CI=true yarn test --watchAll=false --runInBand src/components/StakingActionButton.test.js src/components/WithDialog.test.js src/components/UserData.migration.test.js
```

Expected: FAIL because `StakingActionButton` does not exist and current direct/dialog triggers still open their legacy UI.

- [ ] **Step 5: Implement the reusable migration-aware action button**

Create `src/components/StakingActionButton.js`:

```js
import React, { useContext } from "react"
import AppContext from "../AppContext"
import CustomButton from "./CustomButton"

export default function StakingActionButton({
	ButtonComponent = CustomButton,
	onClick,
	...buttonProps
}) {
	const { onStakingActionAttempt } = useContext(AppContext) || {}

	const handleClick = async event => {
		const blocked =
			typeof onStakingActionAttempt === "function" &&
			onStakingActionAttempt()

		if (blocked) {
			if (event && event.preventDefault) event.preventDefault()
			if (event && event.stopPropagation) event.stopPropagation()
			return undefined
		}

		if (typeof onClick === "function") return onClick(event)
		return undefined
	}

	return <ButtonComponent {...buttonProps} onClick={handleClick} />
}
```

- [ ] **Step 6: Route every live transaction entry button through the interceptor**

In `src/components/WithDialog.js`, replace the `CustomButton` import and trigger element with `StakingActionButton`:

```js
import StakingActionButton from "./StakingActionButton"
```

```jsx
<StakingActionButton
	id={id}
	btnType={btnType}
	w={fullWidth ? "100%" : ""}
	disabled={disabled}
	aria-label={btnLabel || ""}
	label={btnLabel || ""}
	onClick={ev => handleClick(ev)}
	{...btnProps}
>
	{icon}
	{(!iconButton && btnLabel) || ""}
</StakingActionButton>
```

In `src/components/Rewards.js`, replace the `CustomButton` import and claim-button tags with `StakingActionButton`, preserving all existing props and children:

```js
import StakingActionButton from "./StakingActionButton"
```

```jsx
<StakingActionButton
	id="btn-rewards-page-claim"
	btnType="outline"
	onClick={() => setClaimOpen(true)}
	disabled={!!disableActionsMsg}
>
	{t("common.claim")}
</StakingActionButton>
```

In `src/components/UserData.js`, import the wrapper and replace only the active legacy-withdraw button:

```js
import StakingActionButton from "./StakingActionButton"
```

```jsx
<StakingActionButton
	ButtonComponent={Button}
	id="btn-rewards-page-claim"
	variant="contained"
	color="secondary"
	onClick={() => setWithdrawIdentityOpen(true)}
>
	{t("common.withdrawLegacy")}
</StakingActionButton>
```

Do not change connect-wallet, navigation, form input, selection, Close, Cancel, language, or external-link buttons.

- [ ] **Step 7: Run the interception tests and verify GREEN**

Run the Step 4 command again.

Expected: PASS for the reusable button, transaction dialog, and direct legacy-withdraw behavior.

- [ ] **Step 8: Commit immediate entry interception**

```bash
git add src/components/StakingActionButton.js src/components/StakingActionButton.test.js src/components/WithDialog.js src/components/WithDialog.test.js src/components/Rewards.js src/components/UserData.js src/components/UserData.migration.test.js
git commit -m "feat: intercept legacy staking action clicks"
```

---

### Task 4: Application Wiring and Root-Level Rendering

**Files:**

- Create: `src/components/Root.migration.test.js`
- Modify: `src/AppHooks.js:1-18,268-289,408-448`
- Modify: `src/components/Root.js:14-24,66-100,144-178,385`

**Interfaces:**

- Consumes: `useStakingMigrationBlock()` from Task 1.
- Consumes: `StakingMigrationBanner` and `StakingMigrationPopup` from Task 2.
- Provides through `AppContext`: `onStakingActionAttempt`, popup state/open/close callbacks, and guarded `wrapDoingTxns`.
- Preserves: Existing `wrapDoingTxns(fn)(...args)` caller API.

- [ ] **Step 1: Write the failing root integration tests**

Create `src/components/Root.migration.test.js`:

```js
import React from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { MuiThemeProvider } from "@material-ui/core/styles"
import { MemoryRouter } from "react-router-dom"
import AppContext from "../AppContext"
import { lightTheme } from "../themeMUi"
import Root from "./Root"

jest.mock("./SideNav", () => () => null)
jest.mock("./Toolbar", () => ({ AppToolbar: () => null }))
jest.mock("./Stakings", () => () => null)
jest.mock("./Rewards", () => () => null)
jest.mock("./Stats", () => () => null)
jest.mock("./Pools", () => () => null)
jest.mock("./ChooseWallet", () => () => null)
jest.mock("./ConfirmationDialog", () => () => null)
jest.mock("./NewBondForm", () => () => null)
jest.mock("./MigrateNowPopup", () => ({
	MigrateNowAlert: () => null,
	MigrateNowPopup: () => null
}))
jest.mock("./../Snack", () => ({ ShtarvolinkiSnack: () => null }))
jest.mock("../actions", () => ({ createNewBond: jest.fn() }))

const EXPECTED_MESSAGE =
	"AdEx is now heyAura. $ADX staking has moved to app.heyaura.com/staking. A token migration is underway. See the migration announcement for details."

const normalizedText = node => node.textContent.replace(/\s+/g, " ").trim()

const makeContext = overrides => ({
	isNewBondOpen: false,
	setNewBondOpen: jest.fn(),
	toUnbond: null,
	setToUnbond: jest.fn(),
	openErr: false,
	openDoingTx: false,
	snackbarErr: "errors.unexpectedError",
	stats: { hasPendingTransactions: false, loaded: false, userBonds: [] },
	connectWallet: null,
	setConnectWallet: jest.fn(),
	chosenWalletType: {},
	wrapDoingTxns: fn => fn,
	onRequestUnbond: jest.fn(),
	onUnbond: jest.fn(),
	onClaimRewards: jest.fn(),
	handleErrClose: jest.fn(),
	getSigner: jest.fn(),
	prices: {},
	onWalletTypeSelect: jest.fn(),
	onConnectionDisconnect: jest.fn(),
	snackHooks: {},
	chainWarning: false,
	newBondPool: null,
	setNewBondPool: jest.fn(),
	legacySwapInPrg: false,
	setLegacySwapInPrg: jest.fn(),
	legacySwapOpen: false,
	setLegacySwapInOpen: jest.fn(),
	idlePopupOpen: false,
	onIdleDialogAction: jest.fn(),
	account: null,
	updatingStats: false,
	stakingMigrationNoticeOpen: false,
	closeStakingMigrationNotice: jest.fn(),
	...overrides
})

const renderRoot = overrides => {
	const context = makeContext(overrides)
	render(
		<MuiThemeProvider theme={lightTheme}>
			<AppContext.Provider value={context}>
				<MemoryRouter initialEntries={["/"]}>
					<Root />
				</MemoryRouter>
			</AppContext.Provider>
		</MuiThemeProvider>
	)
	return context
}

describe("Root staking migration notice", () => {
	it("always renders the exact sticky banner", () => {
		renderRoot()

		expect(normalizedText(screen.getByRole("alert"))).toBe(EXPECTED_MESSAGE)
	})

	it("renders and closes the root popup from context state", () => {
		const context = renderRoot({ stakingMigrationNoticeOpen: true })
		const dialog = screen.getByRole("dialog")

		fireEvent.click(within(dialog).getByRole("button", { name: "Close" }))

		expect(context.closeStakingMigrationNotice).toHaveBeenCalledTimes(1)
	})
})
```

- [ ] **Step 2: Run the root test and verify RED**

Run:

```bash
source /Users/klatibook/.nvm/nvm.sh
nvm use 18.20.3
CI=true yarn test --watchAll=false --runInBand src/components/Root.migration.test.js
```

Expected: FAIL because `Root` does not yet render the banner or popup.

- [ ] **Step 3: Integrate the stateful block and safety guard into `useApp`**

Add the hook import to `src/AppHooks.js`:

```js
import useStakingMigrationBlock from "./hooks/useStakingMigrationBlock"
```

Inside `useApp`, call and destructure it:

```js
const {
	stakingMigrationNoticeOpen,
	openStakingMigrationNotice,
	closeStakingMigrationNotice,
	onStakingActionAttempt,
	guardStakingAction
} = useStakingMigrationBlock()
```

Replace only the outer construction of `wrapDoingTxns`; retain its existing transaction body, error handling, progress state, and refresh behavior:

```js
const wrapDoingTxns = useCallback(
	fn =>
		guardStakingAction(async (...args) => {
			try {
				setOpenDoingTx(true)
				setOpenErr(false)
				const res = await fn.apply(null, args)
				setOpenDoingTx(false)
				refreshStats()
				return res
			} catch (e) {
				console.error(e)
				setOpenDoingTx(false)
				setSnackbarErr(
					e.values
						? {
								msg: e.message || "errors.unknownError",
								opts: e.values || {}
						  }
						: e.message || "errors.unknownError"
				)
				setOpenErr(true)
			}
		}),
	[guardStakingAction, refreshStats]
)
```

Add these values to the existing return object without removing any existing field:

```js
stakingMigrationNoticeOpen,
openStakingMigrationNotice,
closeStakingMigrationNotice,
onStakingActionAttempt,
guardStakingAction
```

- [ ] **Step 4: Render the banner and one controlled popup in `Root`**

Add the imports to `src/components/Root.js`:

```js
import {
	StakingMigrationBanner,
	StakingMigrationPopup
} from "./StakingMigrationNotice"
```

Destructure the controlled values from `AppContext`:

```js
stakingMigrationNoticeOpen,
closeStakingMigrationNotice,
```

Insert the banner as the first child of the existing sticky alert container, immediately before the unchanged `{stats.hasPendingTransactions && (...)}` block:

```jsx
<StakingMigrationBanner />
```

Render the popup once near the other root-level modals, before `MigrateNowPopup`:

```jsx
<StakingMigrationPopup
	open={stakingMigrationNoticeOpen}
	onClose={closeStakingMigrationNotice}
	className={clsx(classes.modal, classes.alwaysOnTop)}
/>
<MigrateNowPopup />
```

- [ ] **Step 5: Run the root test and all focused migration tests**

Run:

```bash
source /Users/klatibook/.nvm/nvm.sh
nvm use 18.20.3
CI=true yarn test --watchAll=false --runInBand src/App.test.js src/helpers/stakingMigration.test.js src/hooks/useStakingMigrationBlock.test.js src/components/StakingMigrationNotice.test.js src/components/StakingActionButton.test.js src/components/WithDialog.test.js src/components/UserData.migration.test.js src/components/Root.migration.test.js
```

Expected: PASS for all migration tests; zero failed suites and zero failed tests.

- [ ] **Step 6: Commit application wiring**

```bash
git add src/AppHooks.js src/components/Root.js src/components/Root.migration.test.js
git commit -m "feat: disable legacy staking transactions"
```

---

### Task 5: Requirement Audit, Full Verification, and Visual QA

**Files:**

- Verify: all files modified in Tasks 1-4
- Reference: `docs/superpowers/specs/2026-07-17-staking-migration-notice-design.md`

**Interfaces:**

- Consumes all prior task outputs.
- Produces no new runtime interface; this task validates the complete feature.

- [ ] **Step 1: Audit live action-entry coverage**

Run:

```bash
rg -n "StakingActionButton|WithDialog\(|setClaimOpen\(true\)|setWithdrawIdentityOpen\(true\)" src/components
rg -n "wrapDoingTxns|guardStakingAction|fn\.apply" src/AppHooks.js src/components
```

Expected review result:

- All `WithDialog` transaction forms reach `StakingActionButton` through `WithDialog`.
- The reward claim and legacy identity-withdraw controls use `StakingActionButton` directly.
- Wallet/menu/navigation controls do not use `StakingActionButton`.
- `fn.apply(null, args)` remains present inside the original transaction body, which is wrapped by `guardStakingAction`.

- [ ] **Step 2: Audit required copy, destinations, and retained transaction code**

Run:

```bash
rg -n "AdEx is now heyAura|app\.heyaura\.com/staking|adx-staking-migration" src docs/superpowers/specs
rg -n "approve\(|withdraw\(|rageLeave\(|channelWithdraw|executeBySender|deployAndExecute|/execute|/stake-gasless" src/actions src/components/LegacyADXSwapDialog.js
```

Expected review result: one shared rendered message supplies the exact copy; both required URLs are constants; legacy write implementation remains in place.

- [ ] **Step 3: Check formatting and the complete diff**

Run:

```bash
git diff --check
git status --short
git diff --stat HEAD~4..HEAD
```

Expected: no whitespace errors and only the planned feature, tests, and documentation are changed.

- [ ] **Step 4: Run the complete test suite under the required runtime**

Run:

```bash
source /Users/klatibook/.nvm/nvm.sh
nvm use 18.20.3
CI=true yarn test --watchAll=false --runInBand
```

Expected: all suites and tests PASS with zero failures. The stale CRA `learn react` test no longer imports the network-heavy application; it now asserts the migration safety policy.

- [ ] **Step 5: Run the production build**

Run:

```bash
source /Users/klatibook/.nvm/nvm.sh
nvm use 18.20.3
yarn build
```

Expected: exit code 0 and a production bundle in `build/`. Existing Create React App dependency warnings may be reported, but there must be no compile error.

- [ ] **Step 6: Inspect the local UI at desktop and mobile widths**

Start the app:

```bash
source /Users/klatibook/.nvm/nvm.sh
nvm use 18.20.3
BROWSER=none yarn start
```

Inspect `http://localhost:3000` at approximately `1440x900` and `375x812` and verify:

- The filled info banner sits at the top of the content column, respects the 347px desktop drawer, and fits the mobile content width.
- Long copy wraps without horizontal overflow.
- Both links are legible against the filled info background and show the existing external-link icon.
- The wallet connection control still opens its existing wallet chooser.
- With an already connected test wallet, an enabled deposit, withdraw, migration, claim, or legacy-withdraw click opens the centered popup immediately and does not open the legacy form.
- Close, Escape, and backdrop dismissal close the popup; a later action click reopens it.

If a connected test wallet is unavailable, record that limitation and rely on the focused interaction tests for popup triggering; do not alter production eligibility rules just to expose the popup.

- [ ] **Step 7: Review final repository state**

Run:

```bash
git status --short --branch
git log -5 --oneline --decorate
```

Expected: the implementation commits are present, the worktree contains no unexpected files, and no required work remains.
