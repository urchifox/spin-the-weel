import { SegmentsColors, WheelSpinOptions } from "./types"

export const defaultSegmentsColors = {
	hueStart: 0,
	hueEnd: 360,
	saturation: 100,
	lightness: 50,
	colorsRepeat: 1,
} satisfies Readonly<Required<SegmentsColors>>

export const defaultWheelSpinOptions = {
	windupDeg: -33,
	windupMs: 500,
	minTurns: 3,
	maxTurns: 5,
	minSpinMs: 5000,
	maxSpinMs: 7000,
	pauseAfterSpinMs: 1000,
} satisfies Readonly<Required<WheelSpinOptions>>

export const defaultButtonText = "Spin!"
