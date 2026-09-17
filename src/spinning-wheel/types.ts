export type SpinningWheelMountProps = {
	root: HTMLElement
	prizes: Array<Prize>
	wheelColors?: WheelColors
}

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
