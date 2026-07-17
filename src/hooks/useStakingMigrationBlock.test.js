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
