import markup from "./spinningWheel.html?raw"
import "./styles/spinningWheel.css"
import { Renderer } from "./renderer"
import { Prize, SpinningWheelMountProps, SpinningWheelProps } from "./types"
import { Spinner } from "./spinner"
import { Geometry } from "./geometry"

export class SpinningWheel {
	private readonly id: SpinningWheelProps["id"]
	private readonly authorizer: SpinningWheelProps["authorizer"]
	private readonly onSpinComplete: SpinningWheelProps["onSpinComplete"]
	private root: SpinningWheelMountProps["root"] | null = null

	private readonly geometry = new Geometry()
	private readonly renderer = new Renderer(this.geometry)
	private readonly spinner = new Spinner({
		renderer: this.renderer,
	})

	private prizes: Array<Prize> = []
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

		this.root = props.root
		this.prizes = prizes
		this.geometry.setProps({ segmentsCount: prizes.length })
		const claimedPrize =
			claimedPrizeId === null
				? null
				: (this.getPrizeInfoById(claimedPrizeId)?.prize ?? null)
		this.renderer.setProps({
			wheelColors: props.wheelColors,
			wheelSpinOptions: props.wheelSpinOptions,
			claimedPrize,
		})
		const element = this.renderer.createElement({
			markup,
			prizes,
			root: props.root,
		})
		if (element === null) {
			console.error("Failed to mount SpinningWheel")
			this.isMounting = false
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
		this.isMounting = false
		this.isMounted = true
		return true
	}

	unmount() {
		if (!this.isMounted) {
			console.warn("SpinningWheel is not mounted")
			return false
		}

		this.geometry.clear()
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
		this.renderer.setButtonClickHandler(
			() => this.onButtonClick(),
			this.abortController?.signal
		)
	}

	private onResize() {
		if (this.resizeTimerId !== null) {
			clearTimeout(this.resizeTimerId)
		}

		this.resizeTimerId = setTimeout(() => {
			this.renderer.fitWheelIntoRoot(this.root ?? document.body)
		}, 100)
	}

	private async onButtonClick() {
		this.renderer.toggleButtonDisabled(true)

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
			this.renderer.toggleButtonDisabled(false)
			return
		}

		const prizeInfo = this.getPrizeInfoById(prizeId)
		if (prizeInfo === null) {
			console.error("Failed to get prize info by id", prizeId)
			this.renderer.toggleButtonDisabled(false)
			return
		}

		if (wasSpun) {
			console.log("SpinningWheel was already spun")
			this.renderer.renderClaimedPrize(prizeInfo.prize)
			return
		}

		const animationPromise = this.spinner.spin(prizeInfo)
		const spinResult = {
			prize: prizeInfo.prize,
			animationPromise: animationPromise ?? Promise.resolve(),
		}
		this.onSpinComplete(spinResult)
	}

	private getPrizeInfoById(prizeId: Prize["id"]) {
		const prize = this.prizes.find((prize) => prize.id === prizeId)
		if (prize === undefined) {
			return null
		}

		const prizeIndex = this.prizes.indexOf(prize)
		if (prizeIndex === -1) {
			return null
		}

		return {
			prizeIndex,
			prize,
		}
	}
}
