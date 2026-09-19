export type WheelId = string

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
	prizes: Array<Prize>
	wheelColors?: WheelColors
}

export type Prize = {
	id: string
	name: string
	image: string
}

export type WheelColors = {
	hueStart?: number
	hueEnd?: number
	saturation?: number
	lightness?: number
}
