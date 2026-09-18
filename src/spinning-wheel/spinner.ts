import { getRandomInteger, isHtmlElement, wait } from "./helpers"
import { Prize, SpinningWheelMountProps } from "./types"

type SpinResult = {
	prize: Prize
	animationPromise: Promise<void>
}

export class Spinner {
	private element?: HTMLElement
	private prizes: SpinningWheelMountProps["prizes"] = []
	private spinAnimation?: Animation
	private spinResult: {
		finalAngle: number
		index: number
		prize: Prize
	} | null = null

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
		this.element = undefined
		this.prizes = []
		this.spinAnimation?.cancel()
		this.spinAnimation = undefined
		this.spinResult = null
	}

	spin(): SpinResult | null {
		const finalAngle = getRandomInteger({ min: 0, max: 359 })
		const index = this.getWheelSegmentIndex(finalAngle)
		const prize = this.prizes[index]
		if (prize === undefined) {
			return null
		}

		this.spinResult = {
			finalAngle,
			index,
			prize,
		}

		return {
			prize,
			animationPromise: this.playSpin(),
		}
	}

	private async playSpin() {
		const wheel = this.element?.querySelector(".spinning-wheel__wheel")
		if (!isHtmlElement(wheel)) {
			return
		}

		this.spinAnimation?.cancel()
		const animation = this.getSpinningAnimation(wheel)
		this.spinAnimation = animation

		let wasCanceled = false
		try {
			await animation?.finished
		} catch {
			wasCanceled = true
		}

		if (this.spinAnimation === animation) {
			this.spinAnimation = undefined
		}

		if (wasCanceled) {
			return
		}

		await wait(this.pauseAfterSpinMs)
		await this.animateResult(wheel)
	}

	private getSpinningAnimation(wheel: HTMLElement) {
		if (this.spinResult === null) {
			return
		}

		const { finalAngle } = this.spinResult
		const turns = getRandomInteger({ min: this.minTurns, max: this.maxTurns })
		const endDeg = turns * 360 + finalAngle
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
		return animation
	}

	private animateResult(wheel: HTMLElement) {
		if (this.spinResult === null) {
			return
		}

		const { finalAngle, index, prize } = this.spinResult
		const prizeElement = this.element?.querySelector(
			`.spinning-wheel__prize:nth-child(${index + 1})`
		)
		const resultElement = this.element?.querySelector(`.spinning-wheel__result`)
		if (!isHtmlElement(prizeElement) || !isHtmlElement(resultElement)) {
			return
		}

		const prizeRect = prizeElement.getBoundingClientRect()
		const wheelRect = wheel.getBoundingClientRect()

		const resultSize = resultElement.offsetWidth
		if (resultSize === 0) {
			return
		}

		// Layout size (not AABB) so rotation does not inflate the scale
		const scale = prizeElement.offsetWidth / resultSize

		const sectorAngle = (360 / this.prizes.length) * index
		// Shortest path to 0deg so the reveal does not spin the long way
		const angle = ((((finalAngle + sectorAngle) % 360) + 540) % 360) - 180

		const dx =
			prizeRect.left +
			prizeRect.width / 2 -
			(wheelRect.left + wheelRect.width / 2)
		const dy =
			prizeRect.top +
			prizeRect.height / 2 -
			(wheelRect.top + wheelRect.height / 2)

		resultElement.style.setProperty(
			"--bg-image",
			`url("${CSS.escape(prize.image)}")`
		)
		resultElement.style.transition = "none"
		resultElement.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${angle}deg) scale(${scale})`
		resultElement.classList.add("spinning-wheel__result--visible")

		return new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					resultElement.style.transition = ""
					resultElement.classList.add("spinning-wheel__result--revealed")
					resultElement.style.transform =
						"translate(-50%, -50%) rotate(0deg) scale(1)"
					this.element?.classList.add("spinning-wheel--spinned")
					resultElement.addEventListener("transitionend", () => resolve(), {
						once: true,
					})
				})
			})
		})
	}

	private getWheelSegmentIndex(wheelAngle: number) {
		const segmentsCount = this.prizes.length
		const segmentAngle = 360 / segmentsCount
		const shifted = (wheelAngle + segmentAngle / 2) % 360

		const clockWiseIndex = Math.floor(shifted / segmentAngle)
		const index = clockWiseIndex === 0 ? 0 : segmentsCount - clockWiseIndex

		return index
	}
}
