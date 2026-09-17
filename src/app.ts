import { prizes } from "./prizes/prizes"
import { SpinningWheel } from "./spinning-wheel"
import "./styles/index.css"

const root = document.querySelector("#app")

if (root !== null && root instanceof HTMLElement) {
	new SpinningWheel({
		root,
		prizes,
		wheelColors: { hueStart: 210, hueEnd: 300, saturation: 85, lightness: 60 },
	})
}
