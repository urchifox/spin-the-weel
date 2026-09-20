import markup from "./spinningWheel.html?raw"
import "./styles/spinningWheel.css"
import { UI } from "./ui"
import { Prize, SpinningWheelMountProps, SpinningWheelProps } from "./types"
import { Spinner } from "./spinner"
import { Geometry } from "./geometry"
import { Animator } from "./animator"

export class SpinningWheel {
	private readonly id: SpinningWheelProps["id"]
	private readonly authorizer: SpinningWheelProps["authorizer"]
	private readonly onSpinComplete: SpinningWheelProps["onSpinComplete"]
	private root: SpinningWheelMountProps["root"] | null = null

	private readonly geometry = new Geometry()
	private readonly animator = new Animator(this.geometry)
	private readonly ui = new UI({
		geometry: this.geometry,
		animator: this.animator,
	})
	private readonly spinner = new Spinner({
		ui: this.ui,
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
		this.animator.setProps({
			wheelSpinOptions: props.wheelSpinOptions,
		})
		this.ui.setProps({
			wheelColors: props.wheelColors,
			claimedPrize,
		})
		const element = this.ui.createElement({
			markup,
			prizes,
			root: props.root,
		})
		if (element === null) {
			console.error("Failed to mount SpinningWheel")
			this.isMounting = false
			return false
		}

		this.abortController = new AbortController()
		this.resizeObserver = new ResizeObserver(() =>
			requestAnimationFrame(() => {
				this.onResize()
			})
		)
		this.resizeObserver?.observe(props.root)
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
		this.animator.clear()
		this.ui.clear()
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
		this.ui.setButtonClickHandler(
			() => this.onButtonClick(),
			this.abortController?.signal
		)
	}

	private onResize() {
		if (this.resizeTimerId !== null) {
			clearTimeout(this.resizeTimerId)
		}

		this.resizeTimerId = setTimeout(() => {
			this.ui.fitWheelIntoRoot(this.root ?? document.body)
		}, 100)
	}

	private async onButtonClick() {
		this.ui.toggleButtonDisabled(true)

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
			this.ui.toggleButtonDisabled(false)
			return
		}

		const prizeInfo = this.getPrizeInfoById(prizeId)
		if (prizeInfo === null) {
			console.error("Failed to get prize info by id", prizeId)
			this.ui.toggleButtonDisabled(false)
			return
		}

		if (wasSpun) {
			console.log("SpinningWheel was already spun")
			this.ui.renderClaimedPrize(prizeInfo.prize)
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
