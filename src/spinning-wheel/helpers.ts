export function isHtmlElement(element: unknown): element is HTMLElement {
	return element instanceof HTMLElement
}

export function createElement(markup: string) {
	const template = document.createElement("template")
	template.innerHTML = markup.trim()
	const element = template.content.firstElementChild
	return element
}
