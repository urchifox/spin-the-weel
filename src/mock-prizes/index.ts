import bonusCash from "./images/bonusCash.png"
import freeSpins from "./images/freeSpins.png"
import depositMatchBonus from "./images/depositMatchBonus.png"
import mysteryReward from "./images/mysteryReward.png"

export const mockPrizes = [
	{
		id: "bonusCash",
		name: "Bonus Cash",
		image: bonusCash,
		callback: () => {
			console.log("Bonus Cash")
		},
	},
	{
		id: "freeSpins",
		name: "Free Spins",
		image: freeSpins,
		callback: () => {
			console.log("Free Spins")
		},
	},
	{
		id: "depositMatchBonus",
		name: "Deposit Match Bonus",
		image: depositMatchBonus,
		callback: () => {
			console.log("Deposit Match Bonus")
		},
	},
	{
		id: "mysteryReward",
		name: "Mystery Reward",
		image: mysteryReward,
		callback: () => {
			console.log("Mystery Reward")
		},
	},
]
