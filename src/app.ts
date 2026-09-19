import { MockServerAdapter } from "./mock-server-adapter"
import { SpinningWheel } from "./spinning-wheel"
import { SpinResult } from "./spinning-wheel/types"
import "./styles/index.css"

const root = document.querySelector("#app")
const mockServer = new MockServerAdapter()
const mockOnSpinComplete = (spinResult: SpinResult) => {
	console.log("Spin complete with prize", spinResult.prize.name)
	spinResult.animationPromise.then(() => {
		console.log("Animation complete")
	})
}
const mockWheelColors = {
	hueStart: 210,
	hueEnd: 300,
	saturation: 85,
	lightness: 60,
}
const mockWheelId = "demo-wheel"

if (root !== null && root instanceof HTMLElement) {
	const spinningWheel = new SpinningWheel({
		id: mockWheelId,
		authorizer: mockServer,
		onSpinComplete: mockOnSpinComplete,
	})
	spinningWheel.mount({ root, wheelColors: mockWheelColors })
}
