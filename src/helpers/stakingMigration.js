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
