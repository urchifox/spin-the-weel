import { getRandomInteger } from "./helpers"

export class Geometry {
	private readonly outerRadius = 48
	private readonly fit = 0.94

	getSectorsGeometry(segmentsCount: number) {
		const sectorAngle = 360 / segmentsCount
		const halfAngle = sectorAngle / 2

		const halfAngleRad = (halfAngle * Math.PI) / 180

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
		segmentsCount,
		hueStart,
		hueEnd,
	}: {
		segmentsCount: number
		hueStart: number
		hueEnd: number
	}) {
		const sectorAngle = 360 / segmentsCount
		const hueRange = hueEnd - hueStart
		const gradientSteps: Array<{
			hue: number
			startAngle: number
			endAngle: number
		}> = []
		const cyclesRepeat = segmentsCount <= 2 ? 1 : 2

		for (let i = 0; i < segmentsCount; i++) {
			const cyclePos = ((i * cyclesRepeat) / segmentsCount) % 1
			const hue = hueStart + cyclePos * hueRange
			gradientSteps.push({
				hue,
				startAngle: i * sectorAngle,
				endAngle: (i + 1) * sectorAngle,
			})
		}

		const startAngle = sectorAngle / 2

		return {
			startAngle,
			gradientSteps,
		}
	}

	getRandomAngleForSegmentIndex({
		segmentsCount,
		segmentIndex,
	}: {
		segmentsCount: number
		segmentIndex: number
	}) {
		const segmentAngle = 360 / segmentsCount
		const segmentOffset = segmentAngle / 2
		const segmentStart = segmentIndex * segmentAngle - segmentOffset
		const segmentEnd = segmentStart + segmentAngle

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
		segmentsCount,
		segmentIndex,
		wheelAngle,
	}: {
		segmentsCount: number
		segmentIndex: number
		wheelAngle: number
	}) {
		const sectorAngle = (360 / segmentsCount) * segmentIndex
		// Shortest path to 0deg so the reveal does not spin the long way
		const angle = ((((wheelAngle + sectorAngle) % 360) + 540) % 360) - 180
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
