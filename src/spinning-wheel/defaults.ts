import { WheelColors, WheelSpinOptions } from "./types"

export const defaultWheelColors = {
	hueStart: 0,
	hueEnd: 360,
	saturation: 100,
	lightness: 50,
} satisfies Readonly<Required<WheelColors>>

export const defaultWheelSpinOptions = {
	windupDeg: -33,
	windupMs: 500,
	minTurns: 3,
	maxTurns: 5,
	minSpinMs: 5000,
	maxSpinMs: 7000,
	pauseAfterSpinMs: 1000,
} satisfies Readonly<Required<WheelSpinOptions>>
