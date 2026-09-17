import markup from "./spinningWheel.html?raw"
import "./styles/spinningWheel.css"
import { Component, ComponentProps } from "../component"
import { createElement, isHtmlElement } from "../helpers/dom"

export type SpinningWheelProps = {
	prizes: Array<Prize>
	wheelColors?: WheelColors
} & Omit<ComponentProps, "markup">

export type Prize = {
	id: string
	name: string
	image: string
	callback: () => unknown
}

export type WheelColors = {
	hueStart?: number
	hueEnd?: number
	saturation?: number
	lightness?: number
}

export class SpinningWheel extends Component {
	private prizes: SpinningWheelProps["prizes"]
	private wheelColors: SpinningWheelProps["wheelColors"]

	private resizeTimerId: number | null = null

	constructor(props: SpinningWheelProps) {
		const { root, prizes, wheelColors } = props
		super({
			root,
			markup,
		})
		this.root.style.setProperty("overflow", "hidden")
		this.prizes = prizes
		this.wheelColors = wheelColors
		this.renderPrizes()
		this.fitWheelIntoRoot()
		this.setListeners()
	}

	private renderPrizes() {
		const prizesListElement = this.element?.querySelector(
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
		this.element?.style.setProperty("--prizes-count", `${segmentsCount}`)
		this.element?.style.setProperty(
			"--wheel-gradient",
			this.getGradient(segmentsCount)
		)
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

	private setListeners() {
		window.addEventListener("resize", () => {
			this.onWindowResize()
		})
	}

	private onWindowResize() {
		if (this.resizeTimerId !== null) {
			clearTimeout(this.resizeTimerId)
		}

		this.resizeTimerId = setTimeout(() => {
			this.fitWheelIntoRoot()
		}, 100)
	}

	private fitWheelIntoRoot() {
		if (this.element === undefined) {
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
