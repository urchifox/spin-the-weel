import { createElement, isHtmlElement } from "./helpers"
import { Prize, WheelColors } from "./types"
import { Geometry } from "./geometry"
import { defaultWheelColors } from "./defaults"
import { Animator } from "./animator"

export class UI {
	private readonly geometry: Geometry
	private readonly animator: Animator

	private claimedPrize: Prize | null = null
	private wheelColors: Required<WheelColors> = defaultWheelColors

	private element?: HTMLElement

	constructor(props: { geometry: Geometry; animator: Animator }) {
		this.geometry = props.geometry
		this.animator = props.animator
	}

	setProps(props: { claimedPrize: Prize | null; wheelColors?: WheelColors }) {
		this.wheelColors = {
			...defaultWheelColors,
			...(props.wheelColors ?? {}),
		}
		this.claimedPrize = props.claimedPrize
	}

	clear() {
		this.element?.remove()
		this.element = undefined
		this.wheelColors = defaultWheelColors
		this.claimedPrize = null
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
		root.appendChild(element)
		this.renderPrizes(prizes)
		this.setWheelCSSProperties()

		if (this.claimedPrize !== null) {
			this.renderClaimedPrize(this.claimedPrize)
		}
		this.fitWheelIntoRoot(root)

		return element
	}

	private renderPrizes(prizes: Array<Prize>) {
		const prizesListElement = this.getElement(".spinning-wheel__prizes")
		if (prizesListElement === null) {
			return
		}

		const prizeTemplate = this.getElement<HTMLTemplateElement>(
			"#spinning-wheel-prize-template"
		)
		if (prizeTemplate === null) {
			return
		}
		const prizeTemplateElement = prizeTemplate.content.firstElementChild
		if (!isHtmlElement(prizeTemplateElement)) {
			return
		}

		prizes.forEach((prize, index) => {
			const prizeElement = this.createPrizeElement({
				prize,
				index,
				prizeTemplateElement,
			})
			if (prizeElement !== null) {
				prizesListElement.appendChild(prizeElement)
			}
		})
	}

	private createPrizeElement({
		prize,
		index,
		prizeTemplateElement,
	}: {
		prize: Prize
		index: number
		prizeTemplateElement: HTMLElement
	}) {
		const { id, name, image } = prize
		const prizeElement = prizeTemplateElement.cloneNode(true)
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

		this.toggleButtonDisabled(true)
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

	setButtonClickHandler(
		callback: (event: Event) => void,
		signal?: AbortSignal
	) {
		const button = this.getElement(".spinning-wheel__button")
		button?.addEventListener("click", callback, {
			signal,
		})
	}

	toggleButtonDisabled(disabled: boolean) {
		const button = this.getElement<HTMLButtonElement>(".spinning-wheel__button")
		if (button !== null) {
			button.disabled = disabled
		}
	}

	animateSpin(prizeIndex: number) {
		const wheel = this.getElement(".spinning-wheel__wheel")
		if (wheel === null) {
			return
		}

		return this.animator.getSpinningAnimation({
			wheel,
			prizeIndex,
		})
	}

	animateSpinResult(spinResult: { prizeIndex: number; prize: Prize }) {
		if (this.element === undefined) {
			return
		}

		const wheel = this.getElement(".spinning-wheel__wheel")
		const { prizeIndex, prize } = spinResult
		const prizeElement = this.getElement(
			`.spinning-wheel__prize:nth-child(${prizeIndex + 1})`
		)
		const resultElement = this.getElement(`.spinning-wheel__result`)
		if (wheel === null || prizeElement === null || resultElement === null) {
			return
		}

		return this.animator.animateResult({
			element: this.element,
			wheel,
			prizeElement,
			resultElement,
			prizeIndex,
			prize,
		})
	}

	private getElement<T extends HTMLElement>(selector?: string): T | null {
		if (this.element === undefined) {
			return null
		}

		if (selector === undefined) {
			return (this.element as T) ?? null
		}

		return (this.element.querySelector(selector) as T) ?? null
	}
}
