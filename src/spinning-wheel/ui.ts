import markup from "./spinningWheel.html?raw"
import "./styles/spinningWheel.css"

import { createElement, isHtmlElement } from "./helpers"
import {
	Prize,
	ResolvedSegmentsColors,
	SegmentsColors,
	WheelColors,
} from "./types"
import { Geometry } from "./geometry"
import {
	defaultButtonText,
	defaultPointerImage,
	defaultSegmentsColors,
	defaultWheelColors,
} from "./defaults"
import { Animator } from "./animator"
import { LabelFitter } from "./labelFitter"

export class UI {
	private readonly geometry: Geometry
	private readonly animator: Animator
	private readonly labelFitter: LabelFitter

	private claimedPrize: Prize | null = null
	private segmentsColors: ResolvedSegmentsColors = defaultSegmentsColors
	private wheelColors: Required<WheelColors> = defaultWheelColors
	private pointerImage: string = defaultPointerImage
	private element?: HTMLElement

	constructor(props: {
		geometry: Geometry
		animator: Animator
		labelFitter: LabelFitter
	}) {
		this.geometry = props.geometry
		this.animator = props.animator
		this.labelFitter = props.labelFitter
	}

	clear() {
		this.element?.remove()
		this.element = undefined
		this.claimedPrize = null
		this.pointerImage = defaultPointerImage
		this.wheelColors = defaultWheelColors
		this.segmentsColors = defaultSegmentsColors
	}

	createElement(props: {
		root: HTMLElement
		prizes: Array<Prize>
		claimedPrize: Prize | null
		buttonText?: string
		pointerImage?: string
		wheelColors?: WheelColors
		segmentsColors?: SegmentsColors
	}) {
		const element = createElement(markup)
		if (!isHtmlElement(element)) {
			this.clear()
			return null
		}

		this.element = element
		this.claimedPrize = props.claimedPrize
		this.pointerImage = props.pointerImage ?? defaultPointerImage
		this.wheelColors = { ...defaultWheelColors, ...props.wheelColors }
		this.segmentsColors = resolveSegmentsColors(props.segmentsColors)

		props.root.appendChild(element)
		this.renderButton(props.buttonText)
		this.renderPrizes(props.prizes)
		this.setWheelCSSProperties()
		this.setLabelsCSSProperties(props.prizes)
		if (this.claimedPrize !== null) {
			this.renderClaimedPrize(this.claimedPrize)
		}
		this.fitWheelIntoRoot(props.root)

		return element
	}

	private renderButton(buttonText?: string) {
		const button = this.getElement<HTMLButtonElement>(".spinning-wheel__button")
		if (button === null) {
			return
		}

		button.textContent = buttonText ?? defaultButtonText
	}

	private renderPrizes(prizes: Array<Prize>) {
		const prizesListElement = this.getElement(".spinning-wheel__prizes")
		if (prizesListElement === null) {
			return
		}

		const prizeTemplate = this.getElement<HTMLTemplateElement>(
			"#spinning-wheel-prize-template"
		)
		if (prizeTemplate === null) {
			return
		}
		const prizeTemplateElement = prizeTemplate.content.firstElementChild
		if (!isHtmlElement(prizeTemplateElement)) {
			return
		}

		prizes.forEach((prize, index) => {
			const prizeElement = this.createPrizeElement({
				prize,
				index,
				prizeTemplateElement,
			})
			if (prizeElement !== null) {
				prizesListElement.appendChild(prizeElement)
			}
		})
	}

	private createPrizeElement({
		prize,
		index,
		prizeTemplateElement,
	}: {
		prize: Prize
		index: number
		prizeTemplateElement: HTMLElement
	}) {
		const prizeElement = prizeTemplateElement.cloneNode(true)
		if (!isHtmlElement(prizeElement)) {
			return null
		}

		prizeElement.dataset.id = prize.id
		prizeElement.style.setProperty("--nth", `${index}`)
		if (prize.image !== undefined) {
			prizeElement.style.setProperty(
				"--bg-image",
				`url("${CSS.escape(prize.image)}")`
			)
		} else {
			const prizeIconElement = this.getElement(
				`.spinning-wheel__prize-icon`,
				prizeElement
			)
			if (prizeIconElement !== null) {
				prizeIconElement.hidden = true
			}
		}

		const prizeLabelElement = this.getElement(
			`.spinning-wheel__prize-label`,
			prizeElement
		)
		if (prizeLabelElement !== null) {
			prizeLabelElement.textContent = prize.name
		}

		return prizeElement
	}

	private setWheelCSSProperties() {
		const { iconSize, iconTop, sectorAngle } =
			this.geometry.getSectorsGeometry()
		const gradient = this.getGradient()

		this.setCSSProperties({
			"--prize-icon-size": `${iconSize}%`,
			"--prize-icon-top": `${iconTop}%`,
			"--sector-angle": `${sectorAngle}deg`,
			"--wheel-gradient": gradient,
			"--main-color": this.wheelColors.mainColor,
			"--button-text-color": this.wheelColors.buttonTextColor,
			"--prize-text-color": this.wheelColors.prizeTextColor,
			"--prize-text-shadow-color": this.wheelColors.prizeTextShadowColor,
			"--result-text-color": this.wheelColors.resultTextColor,
			"--inset-shadow-color": this.wheelColors.insetShadowColor,
			"--drop-shadow-color": this.wheelColors.dropShadowColor,
			"--prize-icon-opacity": `${this.wheelColors.prizeIconOpacity}`,
			"--pointer-image": `url("${CSS.escape(this.pointerImage)}")`,
		})
	}

	private setLabelsCSSProperties(prizes: Array<Prize>) {
		const prizeLabelElement = this.getElement(".spinning-wheel__prize-label")
		const resultLabelElement = this.getElement(".spinning-wheel__result-label")
		if (prizeLabelElement === null || resultLabelElement === null) {
			return
		}

		const names = prizes.map((prize) => prize.name)
		const prizeFit = this.labelFitter.fit({
			texts: names,
			font: this.labelFitter.readFont(prizeLabelElement),
			getAvailableWidth: (height) => this.geometry.getLabelRect(height).width,
		})
		const labelRect = this.geometry.getLabelRect(prizeFit.height)
		const resultFit = this.labelFitter.fit({
			texts: names,
			font: this.labelFitter.readFont(resultLabelElement),
			getAvailableWidth: () => this.labelFitter.resultWidthPercent,
			maxFontRatio: this.labelFitter.resultMaxFontRatio,
		})

		this.setCSSProperties({
			"--label-line-height": `${this.labelFitter.lineHeight}`,
			"--prize-label-top": `${labelRect.top}%`,
			"--prize-label-width": `${labelRect.width}%`,
			"--prize-label-height": `${labelRect.height}%`,
			"--prize-label-font-ratio": `${prizeFit.fontRatio}`,
			"--result-label-width": `${this.labelFitter.resultWidthPercent}%`,
			"--result-label-font-ratio": `${resultFit.fontRatio}`,
		})
	}

	private setCSSProperties(properties: Record<string, string>) {
		if (this.element === undefined) {
			return
		}

		for (const [key, value] of Object.entries(properties)) {
			this.element.style.setProperty(key, value)
		}
	}

	private getGradient() {
		const { startAngle, segments } = this.geometry.getSegmentsAngles()
		const colors = this.getSegmentsColors(segments.length)
		const colorStops = segments.map(
			(segment, index) =>
				`${colors[index]} ${segment.startAngle}deg ${segment.endAngle}deg`
		)

		return `conic-gradient(from ${startAngle}deg, ${colorStops.join(", ")})`
	}

	private getSegmentsColors(segmentsCount: number) {
		const segmentsColors = this.segmentsColors
		if ("colors" in segmentsColors) {
			const { colors } = segmentsColors
			return Array.from(
				{ length: segmentsCount },
				(_, index) => colors[index % colors.length]
			)
		}

		const { hueStart, hueEnd, saturation, lightness, colorsRepeat } =
			segmentsColors
		return Array.from({ length: segmentsCount }, (_, index) => {
			const cyclePosition = ((index * colorsRepeat) / segmentsCount) % 1
			const hue = hueStart + cyclePosition * (hueEnd - hueStart)
			return `hsl(${hue}deg ${saturation}% ${lightness}%)`
		})
	}

	renderClaimedPrize(prize: Prize) {
		const resultElement = this.renderResult(prize)
		if (resultElement === null) {
			return
		}

		resultElement.classList.add("spinning-wheel__result--visible")
		resultElement.classList.add("spinning-wheel__result--revealed")
		this.element?.classList.add("spinning-wheel--result-shown")

		this.toggleButtonDisabled(true)
	}

	private renderResult(prize: Prize) {
		const resultElement = this.getElement(`.spinning-wheel__result`)
		if (resultElement === null) {
			return null
		}

		const resultIconElement = this.getElement(
			`.spinning-wheel__result-icon`,
			resultElement
		)
		if (resultIconElement !== null) {
			if (prize.image === undefined) {
				resultIconElement.hidden = true
			} else {
				resultElement.style.setProperty(
					"--bg-image",
					`url("${CSS.escape(prize.image)}")`
				)
			}
		}

		const resultLabelElement = this.getElement(
			`.spinning-wheel__result-label`,
			resultElement
		)
		if (resultLabelElement !== null) {
			resultLabelElement.textContent = prize.name
		}

		return resultElement
	}

	fitWheelIntoRoot(root: HTMLElement) {
		if (this.element === undefined) {
			return
		}

		this.element.style.setProperty("--wheel-size", "")
		this.element.style.setProperty("--root-size", "")

		const rootStyles = getComputedStyle(root)
		const rootPaddingLeft = parseFloat(rootStyles.paddingLeft)
		const rootPaddingRight = parseFloat(rootStyles.paddingRight)
		const rootPaddingTop = parseFloat(rootStyles.paddingTop)
		const rootPaddingBottom = parseFloat(rootStyles.paddingBottom)
		const rootBorderLeftWidth = parseFloat(rootStyles.borderLeftWidth)
		const rootBorderRightWidth = parseFloat(rootStyles.borderRightWidth)
		const rootBorderTopWidth = parseFloat(rootStyles.borderTopWidth)
		const rootBorderBottomWidth = parseFloat(rootStyles.borderBottomWidth)

		const rootInnerWidth =
			root.clientWidth -
			rootPaddingLeft -
			rootPaddingRight -
			rootBorderLeftWidth -
			rootBorderRightWidth
		const rootInnerHeight =
			root.clientHeight -
			rootPaddingTop -
			rootPaddingBottom -
			rootBorderTopWidth -
			rootBorderBottomWidth

		const rootSize = Math.max(0, Math.min(rootInnerWidth, rootInnerHeight))
		this.element.style.setProperty("--root-size", `${rootSize}px`)

		const elementStyles = getComputedStyle(this.element)
		const elementPaddingLeft = parseFloat(elementStyles.paddingLeft)
		const elementPaddingRight = parseFloat(elementStyles.paddingRight)
		const wheelAvailableWidth = Math.max(
			0,
			this.element.clientWidth - elementPaddingLeft - elementPaddingRight
		)

		const wheelAvailableHeight = Math.max(
			0,
			rootInnerHeight - this.element.clientHeight
		)

		const wheelSize = Math.min(wheelAvailableWidth, wheelAvailableHeight)
		this.element.style.setProperty("--wheel-size", `${wheelSize}px`)
	}

	setButtonClickHandler(
		callback: (event: Event) => void,
		signal?: AbortSignal
	) {
		const button = this.getElement(".spinning-wheel__button")
		button?.addEventListener("click", callback, {
			signal,
		})
	}

	toggleButtonDisabled(disabled: boolean) {
		const button = this.getElement<HTMLButtonElement>(".spinning-wheel__button")
		if (button !== null) {
			button.disabled = disabled
		}
	}

	animateSpin(prizeIndex: number) {
		const wheel = this.getElement(".spinning-wheel__wheel")
		if (wheel === null) {
			return
		}

		return this.animator.getSpinningAnimation({
			wheel,
			prizeIndex,
		})
	}

	animateSpinResult(spinResult: { prizeIndex: number; prize: Prize }) {
		if (this.element === undefined) {
			return
		}

		const wheel = this.getElement(".spinning-wheel__wheel")
		const { prizeIndex, prize } = spinResult
		const prizeElement = this.getElement(
			`.spinning-wheel__prize[data-id="${CSS.escape(prize.id)}"]`
		)
		const prizeLabelElement = this.getElement(
			`.spinning-wheel__prize-label`,
			prizeElement ?? undefined
		)
		const resultElement = this.renderResult(prize)
		if (
			wheel === null ||
			prizeLabelElement === null ||
			resultElement === null
		) {
			return
		}

		return this.animator.animateResult({
			element: this.element,
			wheel,
			prizeRect: prizeLabelElement.getBoundingClientRect(),
			resultElement,
			prizeIndex,
		})
	}

	private getElement<T extends HTMLElement>(
		selector?: string,
		parent?: HTMLElement
	): T | null {
		if (this.element === undefined) {
			return null
		}

		if (selector === undefined) {
			return (this.element as T) ?? null
		}

		const parentElement = parent ?? this.element

		return (parentElement.querySelector(selector) as T) ?? null
	}
}

function resolveSegmentsColors(
	segmentsColors?: SegmentsColors
): ResolvedSegmentsColors {
	if (segmentsColors !== undefined && "colors" in segmentsColors) {
		return segmentsColors.colors.length > 0
			? segmentsColors
			: defaultSegmentsColors
	}

	return { ...defaultSegmentsColors, ...segmentsColors }
}
