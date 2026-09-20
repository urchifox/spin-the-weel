import { Renderer } from "./renderer"
import { Prize } from "./types"

export class Spinner {
	private readonly renderer: Renderer

	private spinAnimation?: Animation
	private spinResult: {
		prizeIndex: number
		prize: Prize
	} | null = null

	constructor(props: { renderer: Renderer }) {
		this.renderer = props.renderer
	}

	clear() {
		this.spinAnimation?.cancel()
		this.spinAnimation = undefined
		this.spinResult = null
	}

	spin({ prize, prizeIndex }: { prize: Prize; prizeIndex: number }) {
		if (this.spinResult !== null) {
			console.warn("SpinningWheel is already spinning")
			return null
		}

		this.spinResult = {
			prizeIndex,
			prize,
		}

		return this.playSpin()
	}

	private async playSpin() {
		if (this.spinResult === null) {
			return
		}

		this.spinAnimation?.cancel()
		const animation = this.renderer.animateSpin(this.spinResult.prizeIndex)
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

		await this.renderer.animateSpinResult(this.spinResult)
		this.spinResult = null
	}
}
