import { Renderer } from "./renderer"
import { Prize, SpinResult } from "./types"

export class Spinner {
	private readonly renderer: Renderer

	private prizes: Array<Prize> = []
	private spinAnimation?: Animation
	private spinResult: {
		prizeIndex: number
		prize: Prize
	} | null = null

	constructor(props: { renderer: Renderer }) {
		this.renderer = props.renderer
	}

	setProps(props: { prizes: Array<Prize> }) {
		this.prizes = props.prizes
	}

	clear() {
		this.prizes = []
		this.spinAnimation?.cancel()
		this.spinAnimation = undefined
		this.spinResult = null
	}

	spin(prizeId: Prize["id"]): SpinResult | null {
		if (this.spinResult !== null) {
			console.warn("SpinningWheel is already spinning")
			return null
		}

		const prize = this.prizes.find((prize) => prize.id === prizeId)
		if (prize === undefined) {
			return null
		}

		const prizeIndex = this.prizes.indexOf(prize)
		if (prizeIndex === -1) {
			return null
		}

		this.spinResult = {
			prizeIndex,
			prize,
		}

		return {
			prize,
			animationPromise: this.playSpin(),
		}
	}

	private async playSpin() {
		if (this.spinResult === null) {
			return
		}

		this.spinAnimation?.cancel()
		const animation = this.renderer.getSpinningAnimation(
			this.spinResult.prizeIndex
		)
		this.spinAnimation = animation

		let wasCanceled = false
		try {
			await animation?.finished
		} catch {
			wasCanceled = true
		}

		if (this.spinAnimation === animation) {
			this.spinAnimation = undefined
		}

		if (wasCanceled) {
			return
		}

		await this.renderer.animateResult(this.spinResult)
		this.spinResult = null
	}
}
