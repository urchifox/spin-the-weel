import { createElement, isHtmlElement } from "./helpers"
import { Prize, SpinningWheelMountProps, WheelColors } from "./types"
import { Geometry } from "./geometry"

export class Renderer {
	private readonly geometry: Geometry
	private root?: SpinningWheelMountProps["root"]
	private prizes: Array<Prize> = []
	private claimedPrizeId: string | null = null

	private element?: HTMLElement

	private readonly defaultWheelColors = {
		hueStart: 0,
		hueEnd: 360,
		saturation: 100,
		lightness: 50,
	} satisfies WheelColors
	private wheelColors: Required<WheelColors> = this.defaultWheelColors

	constructor(geometry: Geometry) {
		this.geometry = geometry
	}

	setProps(
		props: SpinningWheelMountProps & {
			prizes: Array<Prize>
			claimedPrizeId: string | null
		}
	) {
		this.root = props.root
		this.prizes = props.prizes
		this.wheelColors = {
			...this.defaultWheelColors,
			...(props.wheelColors ?? {}),
		}
		this.claimedPrizeId = props.claimedPrizeId
	}

	clear() {
		this.element?.remove()
		this.element = undefined
		this.prizes = []
		this.claimedPrizeId = null
	}

	createElement(markup: string) {
		const element = createElement(markup)
		if (!isHtmlElement(element)) {
			this.clear()
			return null
		}

		this.element = element
		this.renderPrizes()
		if (this.claimedPrizeId !== null) {
			this.renderClaimedPrize(this.claimedPrizeId)
		}
		this.fitWheelIntoRoot()

		return element
	}

	private renderPrizes() {
		if (this.element === undefined) {
			return
		}
		const prizesListElement = this.element.querySelector(
			".spinning-wheel__prizes"
		)
		if (!isHtmlElement(prizesListElement)) {
			return
		}

		let prizesCount = 0
		this.prizes.forEach((prize) => {
			const prizeElement = this.createPrizeElement(prize, prizesCount)
			if (prizeElement === null) {
				return
			}
			prizesListElement.appendChild(prizeElement)
			prizesCount++
		})

		this.setWheelCSSProperties()
	}

	renderClaimedPrize(prizeId: Prize["id"]) {
		const prize = this.prizes.find((prize) => prize.id === prizeId)
		if (prize === undefined) {
			return
		}

		const resultElement = this.element?.querySelector(`.spinning-wheel__result`)
		if (!isHtmlElement(resultElement)) {
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
		if (isHtmlElement(button)) {
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

	fitWheelIntoRoot() {
		if (this.element === undefined || this.root === undefined) {
			return
		}

		this.element.style.setProperty("--wheel-size", "")
		this.element.style.setProperty("--root-size", "")

		const rootStyles = getComputedStyle(this.root)
		const rootPaddingLeft = parseFloat(rootStyles.paddingLeft)
		const rootPaddingRight = parseFloat(rootStyles.paddingRight)
		const rootPaddingTop = parseFloat(rootStyles.paddingTop)
		const rootPaddingBottom = parseFloat(rootStyles.paddingBottom)
		const rootBorderLeftWidth = parseFloat(rootStyles.borderLeftWidth)
		const rootBorderRightWidth = parseFloat(rootStyles.borderRightWidth)
		const rootBorderTopWidth = parseFloat(rootStyles.borderTopWidth)
		const rootBorderBottomWidth = parseFloat(rootStyles.borderBottomWidth)

		const rootInnerWidth =
			this.root.clientWidth -
			rootPaddingLeft -
			rootPaddingRight -
			rootBorderLeftWidth -
			rootBorderRightWidth
		const rootInnerHeight =
			this.root.clientHeight -
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
}
