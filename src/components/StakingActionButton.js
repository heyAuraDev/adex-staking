import React, { useContext } from "react"
import AppContext from "../AppContext"
import CustomButton from "./CustomButton"

export default function StakingActionButton({
	ButtonComponent = CustomButton,
	onClick,
	...buttonProps
}) {
	const { onStakingActionAttempt } = useContext(AppContext) || {}

	const handleClick = async event => {
		const blocked =
			typeof onStakingActionAttempt === "function" && onStakingActionAttempt()

		if (blocked) {
			if (event && event.preventDefault) event.preventDefault()
			if (event && event.stopPropagation) event.stopPropagation()
			return undefined
		}

		if (typeof onClick === "function") return onClick(event)
		return undefined
	}

	return <ButtonComponent {...buttonProps} onClick={handleClick} />
}
