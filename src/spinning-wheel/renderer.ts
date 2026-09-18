import { createElement, isHtmlElement } from "./helpers"
import { Prize, SpinningWheelMountProps } from "./types"

export class Renderer {
	private root?: SpinningWheelMountProps["root"]
	private prizes: SpinningWheelMountProps["prizes"] = []
	private wheelColors?: SpinningWheelMountProps["wheelColors"]

	private element?: HTMLElement

	setProps(props: SpinningWheelMountProps) {
		this.root = props.root
		this.prizes = props.prizes
		this.wheelColors = props.wheelColors
	}

	clear() {
		this.element?.remove()
		this.element = undefined
	}

	createElement(markup: string) {
		const element = createElement(markup)
		if (!isHtmlElement(element)) {
			return null
		}

		this.element = element
		this.renderPrizes()
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

		const segmentsCount = Math.max(prizesCount, 2)
		const wheelProperties = this.calculateWheelProperties(segmentsCount)
		for (const [key, value] of Object.entries(wheelProperties)) {
			this.element?.style.setProperty(key, value)
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

	private calculateWheelProperties(segmentsCount: number) {
		const sectorAngle = 360 / segmentsCount
		const halfAngle = sectorAngle / 2

		const outerRadius = 48
		const fit = 0.94
		const halfAngleRad = (halfAngle * Math.PI) / 180

		const cotHalf = 1 / Math.tan(halfAngleRad)
		const A = cotHalf + 2
		const denom = Math.sqrt(1 + A * A)

		const iconSize = (2 * outerRadius * fit) / denom
		const innerRadius = (iconSize * cotHalf) / 2

		const xOffset = 50
		const yOffset = (innerRadius / iconSize + 1) * 100

		const gradient = this.getGradient(segmentsCount)

		return {
			"--icon-size": `${iconSize}%`,
			"--sector-angle": `${sectorAngle}deg`,
			"--x-offset": `${xOffset}%`,
			"--y-offset": `${yOffset}%`,
			"--wheel-gradient": gradient,
		}
	}

	private getGradient(segmentsCount: number) {
		const {
			hueStart = 0,
			hueEnd = 360,
			saturation = 100,
			lightness = 50,
		} = this.wheelColors ?? {}

		const angleStep = 360 / segmentsCount
		const hueRange = hueEnd - hueStart
		const stops = []

		for (let i = 0; i < segmentsCount; i++) {
			const cyclesRepeat = segmentsCount <= 2 ? 1 : 2
			const cyclePos = ((i * cyclesRepeat) / segmentsCount) % 1
			const hue = hueStart + cyclePos * hueRange

			const color = `hsl(${hue}deg ${saturation}% ${lightness}%)`
			stops.push(`${color} ${i * angleStep}deg ${(i + 1) * angleStep}deg`)
		}

		const angle = 360 / segmentsCount / 2

		return `conic-gradient(from ${angle}deg, ${stops.join(", ")})`
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
