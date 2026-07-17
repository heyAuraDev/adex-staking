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
