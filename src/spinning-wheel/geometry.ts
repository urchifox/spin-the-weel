import { getRandomInteger } from "./helpers"

export class Geometry {
	private readonly fullWheelAngle = 360
	private readonly halfWheelAngle = this.fullWheelAngle / 2

	private readonly minSegmentsCount = 2
	private segmentsCount = this.minSegmentsCount
	private sectorAngle = this.fullWheelAngle / this.segmentsCount
	private halfSectorAngle = this.sectorAngle / 2

	private readonly centre = 50
	private readonly outerRadius = 48
	private readonly fit = 0.94
	private readonly labelFit = 0.9

	setProps({ segmentsCount }: { segmentsCount: number }) {
		this.segmentsCount = Math.max(this.minSegmentsCount, segmentsCount)
		this.sectorAngle = this.fullWheelAngle / this.segmentsCount
		this.halfSectorAngle = this.sectorAngle / 2
	}

	clear() {
		this.setProps({ segmentsCount: this.minSegmentsCount })
	}

	// All lengths below are percentages of the wheel size, so they survive resizes

	getSectorsGeometry() {
		const cotHalf = this.getCotHalfSector()
		const A = cotHalf + 2
		const denom = Math.sqrt(1 + A * A)
		const iconSize = (2 * this.getContentRadius()) / denom
		const innerRadius = (iconSize * cotHalf) / 2

		return {
			sectorAngle: this.sectorAngle,
			iconSize,
			iconTop: this.centre - innerRadius - iconSize,
		}
	}

	getLabelRect(height: number) {
		const cotHalf = this.getCotHalfSector()
		const squaredCotHalf = cotHalf * cotHalf
		const radius = this.getContentRadius()
		const discriminant =
			squaredCotHalf * height * height -
			(1 + squaredCotHalf) * (height * height - radius * radius)
		if (discriminant <= 0) {
			return { width: 0, height, top: this.centre }
		}

		const halfWidth =
			(Math.sqrt(discriminant) - cotHalf * height) / (1 + squaredCotHalf)
		const innerRadius = halfWidth * cotHalf

		return {
			width: 2 * halfWidth * this.labelFit,
			height,
			top: this.centre - innerRadius - height,
		}
	}

	getSegmentsAngles() {
		const segments = Array.from({ length: this.segmentsCount }, (_, index) => ({
			startAngle: index * this.sectorAngle,
			endAngle: (index + 1) * this.sectorAngle,
		}))

		// Offset so the first segment is centred under the pointer
		const startAngle = -this.halfSectorAngle

		return {
			startAngle,
			segments,
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

	private getContentRadius() {
		return this.outerRadius * this.fit
	}

	private getCotHalfSector() {
		const halfAngleRad = (this.halfSectorAngle * Math.PI) / this.halfWheelAngle
		return 1 / Math.tan(halfAngleRad)
	}
}
