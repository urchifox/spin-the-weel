import { defaultSpinOptions } from "./defaults"
import { Geometry } from "./geometry"
import { getRandomInteger, wait } from "./helpers"
import { Prize, SpinOptions } from "./types"

export class Animator {
	private readonly geometry: Geometry
	private spinOptions: Required<SpinOptions> = defaultSpinOptions

	private finalAngle = 0

	constructor(geometry: Geometry) {
		this.geometry = geometry
	}

	setProps(props: { spinOptions?: SpinOptions }) {
		this.spinOptions = {
			...defaultSpinOptions,
			...(props.spinOptions ?? {}),
		}
	}

	clear() {
		this.spinOptions = defaultSpinOptions
		this.finalAngle = 0
	}

	getSpinningAnimation({
		wheel,
		prizeIndex,
	}: {
		wheel: HTMLElement
		prizeIndex: number
	}) {
		this.finalAngle = this.geometry.getRandomAngleForSegmentIndex(prizeIndex)
		const { minTurns, maxTurns, minSpinMs, maxSpinMs, windupMs, windupDeg } =
			this.spinOptions
		const turns = getRandomInteger({ min: minTurns, max: maxTurns })
		const endDeg = turns * 360 + this.finalAngle
		const spinMs = getRandomInteger({
			min: minSpinMs,
			max: maxSpinMs,
		})
		const totalMs = windupMs + spinMs
		const windupOffset = windupMs / totalMs

		const animation = wheel.animate(
			[
				{ transform: "rotate(0deg)", offset: 0, easing: "ease-in-out" },
				{
					transform: `rotate(${windupDeg}deg)`,
					offset: windupOffset,
					easing: "cubic-bezier(0.1, 0.7, 0.15, 1)",
				},
				{ transform: `rotate(${endDeg}deg)`, offset: 1 },
			],
			{ duration: totalMs, fill: "forwards" }
		)
		return animation
	}

	async animateResult({
		element,
		wheel,
		prizeElement,
		resultElement,
		prizeIndex,
		prize,
	}: {
		element: HTMLElement
		wheel: HTMLElement
		resultElement: HTMLElement
		prizeIndex: number
		prize: Prize
		prizeElement: HTMLElement
	}) {
		const resultSize = resultElement.offsetWidth
		if (resultSize === 0) {
			return
		}

		await wait(this.spinOptions.pauseAfterSpinMs)

		// Layout size (not AABB) so rotation does not inflate the scale
		const scale = prizeElement.offsetWidth / resultSize

		const angle = this.geometry.getAngleOfPrize({
			segmentIndex: prizeIndex,
			wheelAngle: this.finalAngle,
		})

		const prizeRect = prizeElement.getBoundingClientRect()
		const wheelRect = wheel.getBoundingClientRect()
		const { dx, dy } = this.geometry.getPrizeOffset({
			prizeRect,
			wheelRect,
		})

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
					element.classList.add("spinning-wheel--result-shown")
					resultElement.addEventListener("transitionend", () => resolve(), {
						once: true,
					})
				})
			})
		})
	}
}
