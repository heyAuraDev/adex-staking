import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { MuiThemeProvider } from "@material-ui/core/styles"
import AppContext from "../AppContext"
import { lightTheme } from "../themeMUi"
import StakingActionButton from "./StakingActionButton"

const renderActionButton = ({ blocked, onClick }) => {
	const onStakingActionAttempt = jest.fn(() => blocked)

	render(
		<MuiThemeProvider theme={lightTheme}>
			<AppContext.Provider value={{ onStakingActionAttempt }}>
				<StakingActionButton onClick={onClick}>Withdraw</StakingActionButton>
			</AppContext.Provider>
		</MuiThemeProvider>
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
