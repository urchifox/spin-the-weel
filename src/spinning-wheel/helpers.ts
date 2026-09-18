export function isHtmlElement(element: unknown): element is HTMLElement {
	return element instanceof HTMLElement
}

export function createElement(markup: string) {
	const template = document.createElement("template")
	template.innerHTML = markup.trim()
	const element = template.content.firstElementChild
	return element
}

export function getRandomInteger({ min, max }: { min: number; max: number }) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

export function wait(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms)
	})
}
