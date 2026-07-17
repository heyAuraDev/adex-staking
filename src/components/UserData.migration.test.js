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
	totalStaked: ZERO,
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

	fireEvent.click(screen.getByRole("button", { name: "common.withdrawLegacy" }))

	expect(onStakingActionAttempt).toHaveBeenCalledTimes(1)
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
})
