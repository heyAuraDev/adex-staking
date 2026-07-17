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

		expect(
			screen.queryByText("Legacy transaction form")
		).not.toBeInTheDocument()
	})

	it("retains the existing dialog behavior when blocking is inactive", async () => {
		renderDialog(false)

		fireEvent.click(screen.getByRole("button", { name: "Withdraw" }))

		expect(
			await screen.findByText("Legacy transaction form")
		).toBeInTheDocument()
	})
})
