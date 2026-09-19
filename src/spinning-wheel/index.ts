import markup from "./spinningWheel.html?raw"
import "./styles/spinningWheel.css"
import { Renderer } from "./renderer"
import { Prize, SpinningWheelMountProps, SpinningWheelProps } from "./types"
import { Spinner } from "./spinner"
import { isHtmlElement } from "./helpers"

export class SpinningWheel {
	private readonly id: SpinningWheelProps["id"]
	private readonly authorizer: SpinningWheelProps["authorizer"]
	private readonly onSpinComplete: SpinningWheelProps["onSpinComplete"]

	private readonly renderer = new Renderer()
	private readonly spinner = new Spinner()
	private resizeTimerId: number | null = null
	private resizeObserver?: ResizeObserver
	private abortController?: AbortController
	private isMounted = false
	private isMounting = false

	constructor(props: SpinningWheelProps) {
		this.id = props.id
		this.authorizer = props.authorizer
		this.onSpinComplete = props.onSpinComplete
	}

	async mount(props: SpinningWheelMountProps) {
		if (this.isMounted || this.isMounting) {
			console.warn("SpinningWheel is already mounted")
			return false
		}
		this.isMounting = true

		let prizes: Array<Prize> = []
		let claimedPrizeId: Prize["id"] | null = null
		try {
			const response = await this.authorizer.getInitialInfo(this.id)
			if (response.status === "error") {
				throw new Error(response.error)
			}
			claimedPrizeId = response.claimedPrizeId
			prizes = response.prizes
		} catch (error) {
			console.error("Failed to get prizes with error", error)
			this.isMounting = false
			return false
		}

		this.renderer.setProps({ ...props, prizes, claimedPrizeId })
		const element = this.renderer.createElement(markup)
		if (element === null) {
			console.error("Failed to mount SpinningWheel")
			this.isMounting = false
			return false
		}

		const root = props.root
		root.appendChild(element)
		this.spinner.setProps({ prizes, element })
		this.abortController = new AbortController()
		this.resizeObserver = new ResizeObserver(() =>
			requestAnimationFrame(() => {
				this.onResize()
			})
		)
		this.resizeObserver?.observe(root)
		this.setListeners()
		this.isMounting = false
		this.isMounted = true
		return true
	}

	unmount() {
		if (!this.isMounted) {
			console.warn("SpinningWheel is not mounted")
			return false
		}

		this.renderer.clear()
		this.spinner.clear()
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

	private setListeners() {
		const button = this.renderer.getElement(".spinning-wheel__button")
		button?.addEventListener("click", () => this.onButtonClick(), {
			signal: this.abortController?.signal,
		})
	}

	private onResize() {
		if (this.resizeTimerId !== null) {
			clearTimeout(this.resizeTimerId)
		}

		this.resizeTimerId = setTimeout(() => {
			this.renderer.fitWheelIntoRoot()
		}, 100)
	}

	private async onButtonClick() {
		const button = this.renderer.getElement<HTMLButtonElement>(
			".spinning-wheel__button"
		)
		if (!isHtmlElement(button)) {
			return
		}
		button.disabled = true

		let prizeId: Prize["id"] | null = null
		let wasSpun = false
		try {
			const response = await this.authorizer.requestSpin(this.id)
			if (response.status === "error") {
				throw new Error(response.error)
			}
			prizeId = response.prizeId
			wasSpun = response.wasSpun
		} catch (error) {
			console.error("Failed to request spin with error", error)
			button.disabled = false
			return
		}

		if (wasSpun) {
			console.log("SpinningWheel was already spun")
			this.renderer.renderClaimedPrize(prizeId)
			return
		}

		const spinResult = this.spinner.spin(prizeId)
		if (spinResult === null) {
			button.disabled = false
			return
		}
		this.onSpinComplete(spinResult)
	}
}
