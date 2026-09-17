import markup from "./spinningWheel.html?raw"
import "./styles/spinningWheel.css"
import { Renderer } from "./renderer"

export type SpinningWheelProps = {
	root: HTMLElement
	prizes: Array<Prize>
	wheelColors?: WheelColors
}

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

export class SpinningWheel {
	protected root: SpinningWheelProps["root"]
	private prizes: SpinningWheelProps["prizes"]

	private renderer: Renderer
	private resizeTimerId: number | null = null

	constructor(props: SpinningWheelProps) {
		const { root, prizes, wheelColors } = props
		this.root = root
		this.prizes = prizes

		this.renderer = new Renderer({
			root: this.root,
			prizes: this.prizes,
			wheelColors: wheelColors ?? {},
		})
		const element = this.renderer.createElement(markup)
		if (element === null) {
			return
		}

		this.root.appendChild(element)
		this.root.style.setProperty("overflow", "hidden")

		this.renderer.renderPrizes()
		this.renderer.fitWheelIntoRoot()
		this.setListeners()
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
			this.renderer.fitWheelIntoRoot()
		}, 100)
	}
}
