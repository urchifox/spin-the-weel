import markup from "./spinningWheel.html?raw"
import "./styles/spinningWheel.css"
import { Renderer } from "./renderer"
import { SpinningWheelMountProps } from "./types"

export class SpinningWheel {
	private readonly renderer = new Renderer()
	private resizeTimerId: number | null = null
	private abortController?: AbortController
	private isMounted = false

	mount(props: SpinningWheelMountProps) {
		if (this.isMounted) {
			console.warn("SpinningWheel is already mounted")
			return
		}
		this.isMounted = true

		this.abortController = new AbortController()
		const { root, prizes, wheelColors } = props
		this.renderer.setProps({
			root,
			prizes,
			wheelColors,
		})

		const element = this.renderer.createElement(markup)
		if (element === null) {
			return
		}

		root.appendChild(element)
		this.renderer.renderPrizes()
		this.renderer.fitWheelIntoRoot()
		this.setListeners()
	}

	unmount() {
		if (!this.isMounted) {
			console.warn("SpinningWheel is not mounted")
			return
		}
		this.isMounted = false

		this.renderer.clear()
		if (this.resizeTimerId !== null) {
			clearTimeout(this.resizeTimerId)
			this.resizeTimerId = null
		}
		this.abortController?.abort()
		this.abortController = undefined
	}

	private setListeners() {
		window.addEventListener(
			"resize",
			() => {
				this.onWindowResize()
			},
			{ signal: this.abortController?.signal }
		)
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
