export type LabelFont = {
	fontStyle: string
	fontWeight: string
	fontFamily: string
}

export type LabelFit = {
	fontRatio: number
	lines: number
	height: number
}

type MeasuredText = {
	words: Array<number>
	spaceWidth: number
}

export class LabelFitter {
	readonly lineHeight = 1.25
	readonly prizeMaxFontRatio = 0.12
	readonly resultMaxFontRatio = 0.14
	readonly resultWidthPercent = 90

	private readonly referenceFontSize = 100
	private readonly estimatedCharWidth = 0.55
	private readonly widthTolerance = 0.98
	private readonly defaultMaxLines = 2
	private readonly defaultMinFontRatio = 0.02
	private readonly searchSteps = 20

	private measuringContext: CanvasRenderingContext2D | null | undefined

	readFont(element: HTMLElement): LabelFont {
		const { fontStyle, fontWeight, fontFamily } = getComputedStyle(element)
		return { fontStyle, fontWeight, fontFamily }
	}

	fit(props: {
		texts: Array<string>
		font: LabelFont
		getAvailableWidth: (height: number) => number
		maxLines?: number
		minFontRatio?: number
		maxFontRatio?: number
	}): LabelFit {
		const maxLines = props.maxLines ?? this.defaultMaxLines
		const minFontRatio = props.minFontRatio ?? this.defaultMinFontRatio
		const maxFontRatio = props.maxFontRatio ?? this.prizeMaxFontRatio
		const measuredTexts = props.texts.map((text) =>
			this.measureText(text, props.font)
		)

		const fits = (fontRatio: number, lines: number) => {
			const availableWidth = props.getAvailableWidth(
				this.getHeight(fontRatio, lines)
			)
			if (availableWidth <= 0) {
				return false
			}

			const maxWidth =
				(availableWidth * this.widthTolerance) / (fontRatio * 100)
			return measuredTexts.every(
				(text) => this.countLines(text, maxWidth) <= lines
			)
		}

		let fit = this.getFit(minFontRatio, maxLines)
		for (let lines = 1; lines <= maxLines; lines++) {
			const fontRatio = this.findFontRatio({
				lines,
				minFontRatio,
				maxFontRatio,
				fits,
			})
			if (fontRatio === null || fontRatio <= fit.fontRatio) {
				continue
			}

			fit = this.getFit(fontRatio, lines)
		}

		return fit
	}

	private findFontRatio({
		lines,
		minFontRatio,
		maxFontRatio,
		fits,
	}: {
		lines: number
		minFontRatio: number
		maxFontRatio: number
		fits: (fontRatio: number, lines: number) => boolean
	}) {
		if (!fits(minFontRatio, lines)) {
			return null
		}

		if (fits(maxFontRatio, lines)) {
			return maxFontRatio
		}

		let low = minFontRatio
		let high = maxFontRatio
		for (let step = 0; step < this.searchSteps; step++) {
			const middle = (low + high) / 2
			if (fits(middle, lines)) {
				low = middle
			} else {
				high = middle
			}
		}

		return low
	}

	private getFit(fontRatio: number, lines: number): LabelFit {
		return {
			fontRatio,
			lines,
			height: this.getHeight(fontRatio, lines),
		}
	}

	private getHeight(fontRatio: number, lines: number) {
		return lines * this.lineHeight * fontRatio * 100
	}

	private countLines(text: MeasuredText, maxWidth: number) {
		let lines = 1
		let lineWidth = 0
		for (const wordWidth of text.words) {
			if (wordWidth > maxWidth) {
				return Number.POSITIVE_INFINITY
			}

			const extendedWidth =
				lineWidth === 0 ? wordWidth : lineWidth + text.spaceWidth + wordWidth
			if (extendedWidth <= maxWidth) {
				lineWidth = extendedWidth
				continue
			}

			lines += 1
			lineWidth = wordWidth
		}

		return lines
	}

	private measureText(text: string, font: LabelFont): MeasuredText {
		const words = text.split(/\s+/).filter((word) => word.length > 0)
		const context = this.getMeasuringContext()
		if (context === null) {
			return {
				words: words.map((word) => word.length * this.estimatedCharWidth),
				spaceWidth: this.estimatedCharWidth,
			}
		}

		context.font = `${font.fontStyle} ${font.fontWeight} ${this.referenceFontSize}px ${font.fontFamily}`

		return {
			words: words.map(
				(word) => context.measureText(word).width / this.referenceFontSize
			),
			spaceWidth: context.measureText(" ").width / this.referenceFontSize,
		}
	}

	private getMeasuringContext() {
		if (this.measuringContext === undefined) {
			this.measuringContext = document.createElement("canvas").getContext("2d")
		}

		return this.measuringContext
	}
}
