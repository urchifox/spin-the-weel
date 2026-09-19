import bonusCash from "./images/bonusCash.png"
import freeSpins from "./images/freeSpins.png"
import depositMatchBonus from "./images/depositMatchBonus.png"
import mysteryReward from "./images/mysteryReward.png"
import { Prize } from "../spinning-wheel/types"

export const mockPrizes = [
	{
		id: "bonusCash",
		name: "Bonus Cash",
		image: bonusCash,
	},
	{
		id: "freeSpins",
		name: "Free Spins",
		image: freeSpins,
	},
	{
		id: "depositMatchBonus",
		name: "Deposit Match Bonus",
		image: depositMatchBonus,
	},
	{
		id: "mysteryReward",
		name: "Mystery Reward",
		image: mysteryReward,
	},
] satisfies Array<Prize>
