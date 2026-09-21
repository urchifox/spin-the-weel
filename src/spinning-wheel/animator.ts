import { defaultSpinOptions, reducedMotionSpinOptions } from "./defaults"
import { Geometry } from "./geometry"
import { getRandomInteger, isPreferReducedMotion, wait } from "./helpers"
import { SpinOptions } from "./types"

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
			this.getSpinOptions()
		const turns = getRandomInteger({ min: minTurns, max: maxTurns })
		const endDeg = turns * 360 + this.finalAngle
		const spinMs = getRandomInteger({
			min: minSpinMs,
			max: maxSpinMs,
		})

		if (windupMs <= 0) {
			return wheel.animate(
				[{ transform: "rotate(0deg)" }, { transform: `rotate(${endDeg}deg)` }],
				{
					duration: spinMs,
					fill: "forwards",
					easing: "ease-out",
				}
			)
		}

		const totalMs = windupMs + spinMs
		const windupOffset = windupMs / totalMs

		return wheel.animate(
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
	}

	async animateResult({
		element,
		wheel,
		prizeRect,
		resultElement,
		prizeIndex,
	}: {
		element: HTMLElement
		wheel: HTMLElement
		resultElement: HTMLElement
		prizeIndex: number
		prizeRect: {
			top: number
			left: number
			width: number
			height: number
		}
	}) {
		const resultSize = resultElement.offsetWidth
		if (resultSize === 0) {
			return
		}

		if (isPreferReducedMotion()) {
			this.revealResult({ element, resultElement })
			return
		}

		const scale = prizeRect.width / resultSize
		const wheelRect = wheel.getBoundingClientRect()
		const { dx, dy } = this.geometry.getPrizeOffset({
			prizeRect,
			wheelRect,
		})
		const angle = this.geometry.getAngleOfPrize({
			segmentIndex: prizeIndex,
			wheelAngle: this.finalAngle,
		})

		await wait(this.spinOptions.pauseAfterSpinMs)

		resultElement.style.transition = "none"
		resultElement.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${angle}deg) scale(${scale})`
		resultElement.classList.add("spinning-wheel__result--visible")

		return new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					resultElement.style.transition = ""
					this.revealResult({ element, resultElement })
					resultElement.addEventListener("transitionend", () => resolve(), {
						once: true,
					})
				})
			})
		})
	}

	private getSpinOptions(): Required<SpinOptions> {
		return isPreferReducedMotion() ? reducedMotionSpinOptions : this.spinOptions
	}

	private revealResult({
		element,
		resultElement,
	}: {
		element: HTMLElement
		resultElement: HTMLElement
	}) {
		resultElement.classList.add("spinning-wheel__result--visible")
		resultElement.classList.add("spinning-wheel__result--revealed")
		resultElement.style.transform =
			"translate(-50%, -50%) rotate(0deg) scale(1)"
		element.classList.add("spinning-wheel--result-shown")
	}
}
