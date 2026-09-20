import { mockPrizes } from "../mock-prizes"
import { Authorizer, Prize, WheelId } from "../spinning-wheel/types"

type WheelInfo = {
	prizes: Array<Prize>
	claimedPrizeId: Prize["id"] | null
}

const defaultWheelInfo: WheelInfo = {
	prizes: mockPrizes,
	claimedPrizeId: null,
}

export class MockServerAdapter implements Authorizer {
	private wheelsMap = new Map<WheelId, WheelInfo>()

	private getWheelInfo(id: WheelId) {
		const wheelInfo = this.wheelsMap.get(id)
		if (wheelInfo === undefined) {
			const newWheelInfo = { ...defaultWheelInfo }
			this.wheelsMap.set(id, newWheelInfo)
			return newWheelInfo
		}

		return wheelInfo
	}

	getInitialInfo(id: WheelId) {
		const { prizes, claimedPrizeId } = this.getWheelInfo(id)

		return Promise.resolve({
			status: "success" as const,
			claimedPrizeId: claimedPrizeId,
			prizes: [...prizes],
		})
	}

	requestSpin(id: WheelId) {
		const wheelInfo = this.getWheelInfo(id)
		const { prizes, claimedPrizeId } = wheelInfo
		const wasSpun = claimedPrizeId !== null

		const prizeId =
			claimedPrizeId ?? prizes[Math.floor(Math.random() * prizes.length)].id
		if (prizeId === undefined) {
			return Promise.resolve({
				status: "error" as const,
				error: "No prizes available",
			})
		}

		if (!wasSpun) {
			wheelInfo.claimedPrizeId = prizeId
		}

		return Promise.resolve({
			status: "success" as const,
			wasSpun: wasSpun,
			prizeId: prizeId,
		})
	}
}
