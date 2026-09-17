import markup from "./spinningWheel.html?raw"
import "./styles/spinningWheel.css"
import { Component, ComponentProps } from "../component"
import { RenderManager } from "./renderManager"

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

	private renderManager: RenderManager
	private resizeTimerId: number | null = null

	constructor(props: SpinningWheelProps) {
		const { root, prizes, wheelColors } = props
		super({
			root,
			markup,
		})
		this.root.style.setProperty("overflow", "hidden")
		this.prizes = prizes

		this.renderManager = new RenderManager({
			root: this.root,
			element: this.element ?? this.root,
			prizes: this.prizes,
			wheelColors: wheelColors ?? {},
		})

		this.renderManager.renderPrizes()
		this.renderManager.fitWheelIntoRoot()
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
			this.renderManager.fitWheelIntoRoot()
		}, 100)
	}
}
