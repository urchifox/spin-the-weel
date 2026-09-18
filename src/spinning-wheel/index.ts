import markup from "./spinningWheel.html?raw"
import "./styles/spinningWheel.css"
import { Renderer } from "./renderer"
import { SpinningWheelMountProps } from "./types"

export class SpinningWheel {
	private readonly renderer = new Renderer()
	private resizeTimerId: number | null = null
	private resizeObserver?: ResizeObserver
	private abortController?: AbortController
	private isMounted = false

	mount(props: SpinningWheelMountProps) {
		if (this.isMounted) {
			console.warn("SpinningWheel is already mounted")
			return false
		}

		this.renderer.setProps(props)
		const element = this.renderer.createElement(markup)
		if (element === null) {
			this.renderer.clear()
			console.error("Failed to mount SpinningWheel")
			return false
		}

		const root = props.root
		root.appendChild(element)
		this.abortController = new AbortController()
		this.resizeObserver = new ResizeObserver(() =>
			requestAnimationFrame(() => {
				this.onResize()
			})
		)
		this.resizeObserver?.observe(root)
		this.setListeners()
		this.isMounted = true
		return true
	}

	unmount() {
		if (!this.isMounted) {
			console.warn("SpinningWheel is not mounted")
			return false
		}

		this.renderer.clear()
		if (this.resizeTimerId !== null) {
			clearTimeout(this.resizeTimerId)
			this.resizeTimerId = null
		}
		this.abortController?.abort()
		this.abortController = undefined
		this.resizeObserver?.disconnect()
		this.resizeObserver = undefined
		this.isMounted = false
		return true
	}

	private setListeners() {}

	private onResize() {
		if (this.resizeTimerId !== null) {
			clearTimeout(this.resizeTimerId)
		}

		this.resizeTimerId = setTimeout(() => {
			this.renderer.fitWheelIntoRoot()
		}, 100)
	}
}
