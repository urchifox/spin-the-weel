import { MockServerAdapter } from "./mock-server-adapter"
import { SpinningWheel } from "./spinning-wheel"
import {
	PredefinedSegmentsColors,
	SpinResult,
	WheelColors,
} from "./spinning-wheel/types"
import "./styles/index.css"

const root = document.querySelector("#app")
const mockServer = new MockServerAdapter()
const mockOnSpinComplete = (spinResult: SpinResult) => {
	console.log("Spin complete with prize", spinResult.prize.name)
	spinResult.animationPromise.then(() => {
		console.log("Animation complete")
	})
}
const mockSegmentsColors = {
	colors: [
		"rgb(82 155 255)",
		"rgb(151 80 246)",
		"rgb(80 111 239)",
		"rgb(189 104 250)",
	],
} satisfies PredefinedSegmentsColors
const mockWheelColors = {
	prizeIconOpacity: 0.3,
} satisfies WheelColors

const mockWheelId = "demo-wheel"

if (root !== null && root instanceof HTMLElement) {
	const spinningWheel = new SpinningWheel({
		id: mockWheelId,
		authorizer: mockServer,
		onSpinComplete: mockOnSpinComplete,
	})
	spinningWheel.mount({
		root,
		segmentsColors: mockSegmentsColors,
		wheelColors: mockWheelColors,
	})
}
