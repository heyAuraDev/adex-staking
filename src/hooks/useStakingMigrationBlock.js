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
