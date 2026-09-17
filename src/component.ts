import { createElement, isHtmlElement } from "./helpers/dom"

export type ComponentProps = {
	root: HTMLElement
	markup: string
}

export abstract class Component {
	protected root: ComponentProps["root"]

	protected element?: HTMLElement

	constructor(props: ComponentProps) {
		const { root, markup } = props
		this.root = root
		const element = createElement(markup)
		if (isHtmlElement(element)) {
			this.element = element
			this.root.appendChild(element)
		}
	}
}
