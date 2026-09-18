import { getRandomInteger, isHtmlElement } from "./helpers"
import { SpinningWheelMountProps } from "./types"

export class Spinner {
	private element?: HTMLElement
	private prizes: SpinningWheelMountProps["prizes"] = []
	private spinAnimation?: Animation

	private readonly windupDeg = -33
	private readonly windupMs = 500
	private readonly minTurns = 3
	private readonly maxTurns = 5
	private readonly minSpinMs = 5000
	private readonly maxSpinMs = 7000
	private readonly pauseAfterSpinMs = 1000

	setProps(props: {
		prizes: SpinningWheelMountProps["prizes"]
		element: HTMLElement
	}) {
		this.prizes = props.prizes
		this.element = props.element
	}

	clear() {
		this.spinAnimation?.cancel()
		this.spinAnimation = undefined
	}

	spin(wheel: HTMLElement) {
		void this.playSpin(wheel)
	}

	private async playSpin(wheel: HTMLElement) {
		this.spinAnimation?.cancel()

		const turns = getRandomInteger({ min: this.minTurns, max: this.maxTurns })
		const extraDeg = getRandomInteger({ min: 0, max: 360 })
		const endDeg = turns * 360 + extraDeg
		const spinMs = getRandomInteger({
			min: this.minSpinMs,
			max: this.maxSpinMs,
		})
		const totalMs = this.windupMs + spinMs
		const windupOffset = this.windupMs / totalMs

		const animation = wheel.animate(
			[
				{ transform: "rotate(0deg)", offset: 0, easing: "ease-in-out" },
				{
					transform: `rotate(${this.windupDeg}deg)`,
					offset: windupOffset,
					easing: "cubic-bezier(0.1, 0.7, 0.15, 1)",
				},
				{ transform: `rotate(${endDeg}deg)`, offset: 1 },
			],
			{ duration: totalMs, fill: "forwards" }
		)
		this.spinAnimation = animation

		try {
			await animation.finished
		} catch {
			if (this.spinAnimation === animation) {
				this.spinAnimation = undefined
			}
			return
		}

		if (this.spinAnimation === animation) {
			this.spinAnimation = undefined
		}
		setTimeout(() => {
			this.onStop(wheel)
		}, this.pauseAfterSpinMs)
	}

	private onStop(wheel: HTMLElement) {
		const index = this.getWheelSegmentIndex(wheel)
		const prize = this.prizes[index]
		if (prize === undefined) {
			console.error("Prize not found")
			return
		}
		const prizeElement = wheel.querySelector(
			`.spinning-wheel__prize:nth-child(${index + 1})`
		)
		const resultElement = this.element?.querySelector(`.spinning-wheel__result`)
		if (isHtmlElement(prizeElement) && isHtmlElement(resultElement)) {
			this.animateResult(wheel, prizeElement, resultElement, prize.image, index)
		}

		prize.callback()
	}

	private animateResult(
		wheel: HTMLElement,
		prizeElement: HTMLElement,
		resultElement: HTMLElement,
		image: string,
		index: number
	) {
		const prizeRect = prizeElement.getBoundingClientRect()
		const wheelRect = wheel.getBoundingClientRect()

		const resultSize = resultElement.offsetWidth
		if (resultSize === 0) {
			return
		}

		// Layout size (not AABB) so rotation does not inflate the scale
		const scale = prizeElement.offsetWidth / resultSize

		const wheelAngle = this.getCurrentWheelAngle(wheel)
		const sectorAngle = (360 / this.prizes.length) * index
		// Shortest path to 0deg so the reveal does not spin the long way
		const angle = ((((wheelAngle + sectorAngle) % 360) + 540) % 360) - 180

		const dx =
			prizeRect.left +
			prizeRect.width / 2 -
			(wheelRect.left + wheelRect.width / 2)
		const dy =
			prizeRect.top +
			prizeRect.height / 2 -
			(wheelRect.top + wheelRect.height / 2)

		resultElement.style.setProperty("--bg-image", `url("${CSS.escape(image)}")`)
		resultElement.style.transition = "none"
		resultElement.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${angle}deg) scale(${scale})`
		resultElement.classList.add("spinning-wheel__result--visible")

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				resultElement.style.transition = ""
				resultElement.classList.add("spinning-wheel__result--revealed")
				resultElement.style.transform =
					"translate(-50%, -50%) rotate(0deg) scale(1)"
				this.element?.classList.add("spinning-wheel--spinned")
			})
		})
	}

	private getCurrentWheelAngle(wheel: HTMLElement) {
		const style = window.getComputedStyle(wheel)
		const matrix = new DOMMatrixReadOnly(style.transform)
		const angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI)

		const normalizedAngle = (angle + 360) % 360
		return normalizedAngle
	}

	private getWheelSegmentIndex(wheel: HTMLElement) {
		const wheelAngle = this.getCurrentWheelAngle(wheel)

		const segmentsCount = this.prizes.length
		const segmentAngle = 360 / segmentsCount
		const shifted = (wheelAngle + segmentAngle / 2) % 360

		const clockWiseIndex = Math.floor(shifted / segmentAngle)
		const index = clockWiseIndex === 0 ? 0 : segmentsCount - clockWiseIndex

		return index
	}
}
