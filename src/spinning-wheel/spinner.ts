import { getRandomInteger } from "./helpers"
import { SpinningWheelMountProps } from "./types"

export class Spinner {
	private prizes: SpinningWheelMountProps["prizes"] = []
	private readonly minTime = 1000
	private readonly maxTime = 3000

	setProps(props: Pick<SpinningWheelMountProps, "prizes">) {
		this.prizes = props.prizes
	}

	clear() {}

	spin(wheel: HTMLElement) {
		wheel.classList.add("spinning-wheel__wheel--rolling")
		const time = getRandomInteger({ min: this.minTime, max: this.maxTime })
		setTimeout(() => {
			wheel.classList.remove("spinning-wheel__wheel--rolling")
			requestAnimationFrame(() => {
				this.onStop(wheel)
			})
		}, time)
	}

	private onStop(wheel: HTMLElement) {
		const index = this.getWheelSegmentIndex(wheel)
		const prize = this.prizes[index]
		if (prize === undefined) {
			console.error("Prize not found")
			return
		}
		console.log(prize.name)
	}

	private getWheelSegmentIndex(wheel: HTMLElement) {
		const style = window.getComputedStyle(wheel)
		const matrix = new DOMMatrixReadOnly(style.transform)
		const angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI)
		const normalizedAngle = (angle + 360) % 360

		const segmentsCount = this.prizes.length
		const segmentAngle = 360 / segmentsCount
		const shifted = (normalizedAngle + segmentAngle / 2) % 360

		const clockWiseIndex = Math.floor(shifted / segmentAngle)
		const index = clockWiseIndex === 0 ? 0 : segmentsCount - clockWiseIndex

		return index
	}
}
