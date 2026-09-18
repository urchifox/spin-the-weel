import bonusCash from "./images/bonusCash.png"
import freeSpins from "./images/freeSpins.png"
import depositMatchBonus from "./images/depositMatchBonus.png"
import mysteryReward from "./images/mysteryReward.png"

export const mockPrizes = [
	{
		id: "bonusCash",
		name: "Bonus Cash",
		image: bonusCash,
		onWin: (animationPromise: Promise<void>) => {
			console.log("Bonus Cash")
			animationPromise?.then(() => {
				console.log("Bonus Cash animation finished")
			})
		},
	},
	{
		id: "freeSpins",
		name: "Free Spins",
		image: freeSpins,
		onWin: (animationPromise: Promise<void>) => {
			console.log("Free Spins")
			animationPromise?.then(() => {
				console.log("Free Spins animation finished")
			})
		},
	},
	{
		id: "depositMatchBonus",
		name: "Deposit Match Bonus",
		image: depositMatchBonus,
		onWin: (animationPromise: Promise<void>) => {
			console.log("Deposit Match Bonus")
			animationPromise?.then(() => {
				console.log("Deposit Match Bonus animation finished")
			})
		},
	},
	{
		id: "mysteryReward",
		name: "Mystery Reward",
		image: mysteryReward,
		onWin: (animationPromise: Promise<void>) => {
			console.log("Mystery Reward")
			animationPromise?.then(() => {
				console.log("Mystery Reward animation finished")
			})
		},
	},
]
