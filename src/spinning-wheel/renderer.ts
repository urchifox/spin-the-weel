import { Prize, WheelColors } from "."
import { createElement, isHtmlElement } from "../helpers/dom"

export type RendererProps = {
	root: HTMLElement
	prizes: Array<Prize>
	wheelColors: WheelColors
}

export class Renderer {
	private root: RendererProps["root"]
	private prizes: RendererProps["prizes"]
	private wheelColors: RendererProps["wheelColors"]

	private element: HTMLElement | null = null

	constructor(props: RendererProps) {
		const { root, prizes, wheelColors } = props
		this.root = root
		this.prizes = prizes
		this.wheelColors = wheelColors
	}

	createElement(markup: string) {
		const element = createElement(markup)
		if (!isHtmlElement(element)) {
			return null
		}

		this.element = element
		return element
	}

	renderPrizes() {
		if (this.element === null) {
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
			<li class="spinning-wheel__prize" data-id="${id}">
				<span class="spinning-wheel__icon"></span>
				<span class="visually-hidden">${name}</span>
			</li>
		`
		const prizeElement = createElement(markup)
		if (!isHtmlElement(prizeElement)) {
			return null
		}

		prizeElement.style.setProperty("--nth", `${index}`)
		prizeElement.style.setProperty("--bg-image", `url(${image})`)

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
			"--prizes-count": segmentsCount.toString(),
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
		if (this.element === null) {
			return
		}

		this.element.style.setProperty("transform", "")

		const rootWidth = this.root.clientWidth
		const rootHeight = this.root.clientHeight
		const wheelWidth = this.element.clientWidth
		const wheelHeight = this.element.clientHeight

		const scale = Math.min(rootWidth / wheelWidth, rootHeight / wheelHeight)
		if (scale >= 1) {
			return
		}

		const heightDiff = rootHeight - wheelHeight
		const widthDiff = rootWidth - wheelWidth
		const translateY = Math.min(0, heightDiff / 2)
		const translateX = Math.min(0, widthDiff / 2)

		this.element.style.setProperty(
			"transform",
			`translateY(${translateY}px) translateX(${translateX}px) scale(${scale})`
		)
	}
}
