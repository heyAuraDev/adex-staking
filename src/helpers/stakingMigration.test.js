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
		const guardedTransaction = withStakingMigrationGuard(onBlocked, transaction)

		await guardedTransaction("legacy-argument")

		expect(onBlocked).toHaveBeenCalledTimes(1)
		expect(transaction).not.toHaveBeenCalled()
	})
})
