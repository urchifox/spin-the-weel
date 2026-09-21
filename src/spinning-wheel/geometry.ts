import { getRandomInteger } from "./helpers"

export class Geometry {
	private readonly fullWheelAngle = 360
	private readonly halfWheelAngle = this.fullWheelAngle / 2

	private readonly minSegmentsCount = 2
	private segmentsCount = this.minSegmentsCount
	private sectorAngle = this.fullWheelAngle / this.segmentsCount
	private halfSectorAngle = this.sectorAngle / 2

	private readonly outerRadius = 48
	private readonly fit = 0.94

	setProps({ segmentsCount }: { segmentsCount: number }) {
		this.segmentsCount = Math.max(this.minSegmentsCount, segmentsCount)
		this.sectorAngle = this.fullWheelAngle / this.segmentsCount
		this.halfSectorAngle = this.sectorAngle / 2
	}

	clear() {
		this.setProps({ segmentsCount: this.minSegmentsCount })
	}

	getSectorsGeometry() {
		const sectorAngle = this.sectorAngle

		const halfAngleRad = (this.halfSectorAngle * Math.PI) / this.halfWheelAngle
		const cotHalf = 1 / Math.tan(halfAngleRad)
		const A = cotHalf + 2
		const denom = Math.sqrt(1 + A * A)
		const iconSize = (2 * this.outerRadius * this.fit) / denom
		const innerRadius = (iconSize * cotHalf) / 2
		const xOffset = 50
		const yOffset = (innerRadius / iconSize + 1) * 100

		return {
			iconSize,
			sectorAngle,
			xOffset,
			yOffset,
		}
	}

	getGradientInfo({
		hueStart,
		hueEnd,
		colorsRepeat,
	}: {
		hueStart: number
		hueEnd: number
		colorsRepeat: number
	}) {
		const hueRange = hueEnd - hueStart
		const gradientSteps: Array<{
			hue: number
			startAngle: number
			endAngle: number
		}> = []

		for (let i = 0; i < this.segmentsCount; i++) {
			const cyclePos = ((i * colorsRepeat) / this.segmentsCount) % 1
			const hue = hueStart + cyclePos * hueRange
			gradientSteps.push({
				hue,
				startAngle: i * this.sectorAngle,
				endAngle: (i + 1) * this.sectorAngle,
			})
		}

		const startAngle = this.halfSectorAngle

		return {
			startAngle,
			gradientSteps,
		}
	}

	getRandomAngleForSegmentIndex(segmentIndex: number) {
		const segmentStart = segmentIndex * this.sectorAngle - this.halfSectorAngle
		const segmentEnd = segmentStart + this.sectorAngle

		const angle =
			360 -
			getRandomInteger({
				min: segmentStart + 1,
				max: segmentEnd - 1,
			})

		const normalizedAngle = ((angle % 360) + 360) % 360
		return normalizedAngle
	}

	getAngleOfPrize({
		segmentIndex,
		wheelAngle,
	}: {
		segmentIndex: number
		wheelAngle: number
	}) {
		// Shortest value to 0deg
		const angle =
			((((wheelAngle + this.sectorAngle * segmentIndex) % 360) + 540) % 360) -
			180
		return angle
	}

	getPrizeOffset({
		prizeRect,
		wheelRect,
	}: {
		prizeRect: {
			top: number
			left: number
			width: number
			height: number
		}
		wheelRect: {
			top: number
			left: number
			width: number
			height: number
		}
	}) {
		const dx =
			prizeRect.left +
			prizeRect.width / 2 -
			(wheelRect.left + wheelRect.width / 2)
		const dy =
			prizeRect.top +
			prizeRect.height / 2 -
			(wheelRect.top + wheelRect.height / 2)

		return {
			dx,
			dy,
		}
	}
}
