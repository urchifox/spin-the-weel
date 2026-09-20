import { createElement, getRandomInteger, isHtmlElement, wait } from "./helpers"
import { Prize, WheelColors } from "./types"
import { Geometry } from "./geometry"

export class Renderer {
	private readonly geometry: Geometry
	private claimedPrize: Prize | null = null

	private element?: HTMLElement

	private readonly defaultWheelColors = {
		hueStart: 0,
		hueEnd: 360,
		saturation: 100,
		lightness: 50,
	} satisfies WheelColors
	private wheelColors: Required<WheelColors> = this.defaultWheelColors

	private readonly windupDeg = -33
	private readonly windupMs = 500
	private readonly minTurns = 3
	private readonly maxTurns = 5
	private readonly minSpinMs = 5000
	private readonly maxSpinMs = 7000
	private readonly pauseAfterSpinMs = 1000

	private finalAngle = 0

	constructor(geometry: Geometry) {
		this.geometry = geometry
	}

	setProps(props: { claimedPrize: Prize | null; wheelColors?: WheelColors }) {
		this.wheelColors = {
			...this.defaultWheelColors,
			...(props.wheelColors ?? {}),
		}
		this.claimedPrize = props.claimedPrize
	}

	clear() {
		this.element?.remove()
		this.element = undefined
		this.claimedPrize = null
		this.finalAngle = 0
	}

	createElement({
		markup,
		prizes,
		root,
	}: {
		markup: string
		prizes: Array<Prize>
		root: HTMLElement
	}) {
		const element = createElement(markup)
		if (!isHtmlElement(element)) {
			this.clear()
			return null
		}

		this.element = element
		this.renderPrizes(prizes)
		if (this.claimedPrize !== null) {
			this.renderClaimedPrize(this.claimedPrize)
		}
		this.fitWheelIntoRoot(root)

		return element
	}

	private renderPrizes(prizes: Array<Prize>) {
		if (this.element === undefined) {
			return
		}
		const prizesListElement = this.getElement(".spinning-wheel__prizes")
		if (prizesListElement === null) {
			return
		}

		let prizesCount = 0
		prizes.forEach((prize) => {
			const prizeElement = this.createPrizeElement(prize, prizesCount)
			if (prizeElement === null) {
				return
			}
			prizesListElement.appendChild(prizeElement)
			prizesCount++
		})

		this.setWheelCSSProperties()
	}

	renderClaimedPrize(prize: Prize) {
		const resultElement = this.getElement(`.spinning-wheel__result`)
		if (resultElement === null) {
			return
		}

		resultElement.style.setProperty(
			"--bg-image",
			`url("${CSS.escape(prize.image)}")`
		)
		resultElement.classList.add("spinning-wheel__result--visible")
		resultElement.classList.add("spinning-wheel__result--revealed")
		this.element?.classList.add("spinning-wheel--result-shown")

		const button = this.getElement<HTMLButtonElement>(".spinning-wheel__button")
		if (button !== null) {
			button.disabled = true
		}
	}

	private createPrizeElement(prize: Prize, index: number) {
		const { id, name, image } = prize
		const markup = `
			<li class="spinning-wheel__prize">
				<span class="spinning-wheel__prize-icon" aria-hidden="true"></span>
			</li>
		`
		const prizeElement = createElement(markup)
		if (!isHtmlElement(prizeElement)) {
			return null
		}

		prizeElement.dataset.id = id
		prizeElement.setAttribute("aria-label", name)
		prizeElement.style.setProperty("--nth", `${index}`)
		prizeElement.style.setProperty("--bg-image", `url("${CSS.escape(image)}")`)

		return prizeElement
	}

	private setWheelCSSProperties() {
		if (this.element === undefined) {
			return
		}

		const { iconSize, sectorAngle, xOffset, yOffset } =
			this.geometry.getSectorsGeometry()
		const gradient = this.getGradient()

		const wheelProperties = {
			"--icon-size": `${iconSize}%`,
			"--sector-angle": `${sectorAngle}deg`,
			"--x-offset": `${xOffset}%`,
			"--y-offset": `${yOffset}%`,
			"--wheel-gradient": gradient,
		}

		for (const [key, value] of Object.entries(wheelProperties)) {
			this.element.style.setProperty(key, value)
		}
	}

	private getGradient() {
		const { hueStart, hueEnd, saturation, lightness } = this.wheelColors
		const { startAngle, gradientSteps } = this.geometry.getGradientInfo({
			hueStart,
			hueEnd,
		})
		const colorStops = gradientSteps.map(({ hue, startAngle, endAngle }) => {
			const color = `hsl(${hue}deg ${saturation}% ${lightness}%)`
			const colorStop = `${color} ${startAngle}deg ${endAngle}deg`
			return colorStop
		})
		const gradient = `conic-gradient(from ${startAngle}deg, ${colorStops.join(", ")})`
		return gradient
	}

	fitWheelIntoRoot(root: HTMLElement) {
		if (this.element === undefined) {
			return
		}

		this.element.style.setProperty("--wheel-size", "")
		this.element.style.setProperty("--root-size", "")

		const rootStyles = getComputedStyle(root)
		const rootPaddingLeft = parseFloat(rootStyles.paddingLeft)
		const rootPaddingRight = parseFloat(rootStyles.paddingRight)
		const rootPaddingTop = parseFloat(rootStyles.paddingTop)
		const rootPaddingBottom = parseFloat(rootStyles.paddingBottom)
		const rootBorderLeftWidth = parseFloat(rootStyles.borderLeftWidth)
		const rootBorderRightWidth = parseFloat(rootStyles.borderRightWidth)
		const rootBorderTopWidth = parseFloat(rootStyles.borderTopWidth)
		const rootBorderBottomWidth = parseFloat(rootStyles.borderBottomWidth)

		const rootInnerWidth =
			root.clientWidth -
			rootPaddingLeft -
			rootPaddingRight -
			rootBorderLeftWidth -
			rootBorderRightWidth
		const rootInnerHeight =
			root.clientHeight -
			rootPaddingTop -
			rootPaddingBottom -
			rootBorderTopWidth -
			rootBorderBottomWidth

		const rootSize = Math.max(0, Math.min(rootInnerWidth, rootInnerHeight))
		this.element.style.setProperty("--root-size", `${rootSize}px`)

		const elementStyles = getComputedStyle(this.element)
		const elementPaddingLeft = parseFloat(elementStyles.paddingLeft)
		const elementPaddingRight = parseFloat(elementStyles.paddingRight)
		const wheelAvailableWidth = Math.max(
			0,
			this.element.clientWidth - elementPaddingLeft - elementPaddingRight
		)

		const wheelAvailableHeight = Math.max(
			0,
			rootInnerHeight - this.element.clientHeight
		)

		const wheelSize = Math.min(wheelAvailableWidth, wheelAvailableHeight)
		this.element.style.setProperty("--wheel-size", `${wheelSize}px`)
	}

	getElement<T extends HTMLElement>(selector?: string): T | null {
		if (this.element === undefined) {
			return null
		}
		if (selector === undefined) {
			return (this.element as T) ?? null
		}
		return (this.element.querySelector(selector) as T) ?? null
	}

	getSpinningAnimation(prizeIndex: number) {
		const wheel = this.getElement(".spinning-wheel__wheel")
		if (wheel === null) {
			return
		}

		this.finalAngle = this.geometry.getRandomAngleForSegmentIndex(prizeIndex)
		const turns = getRandomInteger({ min: this.minTurns, max: this.maxTurns })
		const endDeg = turns * 360 + this.finalAngle
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

	async animateResult(spinResult: { prizeIndex: number; prize: Prize }) {
		const wheel = this.getElement(".spinning-wheel__wheel")
		if (wheel === null) {
			return
		}

		const { prizeIndex, prize } = spinResult
		const prizeElement = this.getElement(
			`.spinning-wheel__prize:nth-child(${prizeIndex + 1})`
		)
		const resultElement = this.getElement(`.spinning-wheel__result`)
		if (prizeElement === null || resultElement === null) {
			return
		}

		const resultSize = resultElement.offsetWidth
		if (resultSize === 0) {
			return
		}

		await wait(this.pauseAfterSpinMs)

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
					this.element?.classList.add("spinning-wheel--result-shown")
					resultElement.addEventListener("transitionend", () => resolve(), {
						once: true,
					})
				})
			})
		})
	}
}
