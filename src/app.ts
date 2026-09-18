import { mockPrizes } from "./mock-prizes"
import { SpinningWheel } from "./spinning-wheel"
import "./styles/index.css"

const root = document.querySelector("#app")

if (root !== null && root instanceof HTMLElement) {
	const spinningWheel = new SpinningWheel()
	spinningWheel.mount({
		root,
		prizes: mockPrizes,
		wheelColors: { hueStart: 210, hueEnd: 300, saturation: 85, lightness: 60 },
	})
}
