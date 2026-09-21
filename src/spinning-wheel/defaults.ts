import { GeneratedSegmentsColors, SpinOptions, WheelColors } from "./types"

export { default as defaultPointerImage } from "./images/pointer.png"

export const defaultWheelColors = {
	mainColor: "rgb(252 216 30)",
	textColor: "rgb(255 255 255)",
	textShadowColor: "rgb(99 10 3)",
	insetShadowColor: "rgb(240 120 2)",
	dropShadowColor: "rgb(0 0 0 / 20%)",
} satisfies Readonly<Required<WheelColors>>

export const defaultSegmentsColors = {
	hueStart: 0,
	hueEnd: 360,
	saturation: 100,
	lightness: 50,
	colorsRepeat: 1,
} satisfies Readonly<Required<GeneratedSegmentsColors>>

export const defaultSpinOptions = {
	windupDeg: -33,
	windupMs: 500,
	minTurns: 3,
	maxTurns: 5,
	minSpinMs: 5000,
	maxSpinMs: 7000,
	pauseAfterSpinMs: 1000,
} satisfies Readonly<Required<SpinOptions>>

export const defaultButtonText = "Spin!"
