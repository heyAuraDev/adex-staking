import { STAKING_ACTIONS_DISABLED } from "./helpers/stakingMigration"

test("keeps legacy staking transactions disabled during migration", () => {
	expect(STAKING_ACTIONS_DISABLED).toBe(true)
})
