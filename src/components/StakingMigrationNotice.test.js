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
		renderWithTheme(<StakingMigrationPopup open={false} onClose={jest.fn()} />)

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
