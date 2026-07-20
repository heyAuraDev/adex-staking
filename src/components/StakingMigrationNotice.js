import React from "react"
import { Backdrop, Box, Fade, Modal } from "@material-ui/core"
import { Alert as MuiAlert } from "@material-ui/lab"
import { ExternalAnchor } from "./Anchor"
import CustomButton from "./CustomButton"
import {
	HEYAURA_STAKING_URL,
	MIGRATION_ANNOUNCEMENT_URL
} from "../helpers/stakingMigration"

function Alert(props) {
	return <MuiAlert variant="filled" {...props} />
}

export function StakingMigrationMessage({ idPrefix }) {
	return (
		<span id={`${idPrefix}-description`}>
			<span id={`${idPrefix}-title`}>AdEx is now heyAura.</span>{" "}
			{"$ADX staking has moved to "}
			<ExternalAnchor
				id={`${idPrefix}-staking-link`}
				href={HEYAURA_STAKING_URL}
				color="inherit"
				preserveProtocol
			>
				app.heyaura.com/staking
			</ExternalAnchor>
			{". A token migration is underway. See the "}
			<ExternalAnchor
				id={`${idPrefix}-announcement-link`}
				href={MIGRATION_ANNOUNCEMENT_URL}
				color="inherit"
				preserveProtocol
			>
				migration announcement
			</ExternalAnchor>
			{" for details."}
		</span>
	)
}

export function StakingMigrationBanner() {
	return (
		<Alert id="staking-migration-banner" severity="warning">
			<StakingMigrationMessage idPrefix="staking-migration-banner" />
		</Alert>
	)
}

export function StakingMigrationPopup({ open, onClose, className }) {
	return (
		<Modal
			open={open}
			onClose={onClose}
			role="dialog"
			aria-modal="true"
			aria-labelledby="staking-migration-popup-title"
			aria-describedby="staking-migration-popup-description"
			BackdropComponent={Backdrop}
			className={className}
			closeAfterTransition
			BackdropProps={{ timeout: 300 }}
		>
			<Fade in={open}>
				<Box width="calc(100% - 16px)" maxWidth={520} m={1}>
					<Alert severity="info">
						<StakingMigrationMessage idPrefix="staking-migration-popup" />
						<Box mt={2} display="flex" justifyContent="flex-end">
							<CustomButton btnType="primary" radius={false} onClick={onClose}>
								Close
							</CustomButton>
						</Box>
					</Alert>
				</Box>
			</Fade>
		</Modal>
	)
}
