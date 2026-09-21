export type WheelId = string

export type SpinningWheelProps = {
	id: WheelId
	authorizer: Authorizer
	onSpinComplete: (spinResult: SpinResult) => void
}

export type Authorizer = {
	getInitialInfo: (id: WheelId) => Promise<
		| {
				status: "success"
				claimedPrizeId: Prize["id"] | null
				prizes: Array<Prize>
		  }
		| { status: "error"; error: string }
	>
	requestSpin: (
		id: WheelId
	) => Promise<
		| { status: "success"; wasSpun: boolean; prizeId: Prize["id"] }
		| { status: "error"; error: string }
	>
}

export type SpinningWheelMountProps = {
	root: HTMLElement
	segmentsColors?: SegmentsColors
	spinOptions?: SpinOptions
	buttonText?: string
}

export type Prize = {
	id: string
	name: string
	image: string
}

export type SegmentsColors = {
	hueStart?: number
	hueEnd?: number
	saturation?: number
	lightness?: number
	colorsRepeat?: number
}

export type SpinOptions = {
	windupDeg?: number
	windupMs?: number
	minTurns?: number
	maxTurns?: number
	minSpinMs?: number
	maxSpinMs?: number
	pauseAfterSpinMs?: number
}

export type SpinResult = {
	prize: Prize
	animationPromise: Promise<void>
}
