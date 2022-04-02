
// This script spends hashes appropriately. We set up values for each of the upgrade options so we buy them
// when it's worth doing so and sell hashes when it's not.

/** @param {NS} ns **/
export async function main(ns) {
	// Hash to money conversion rate
	let conversion = 1000000 / 4
	
	while ( true == true){
		// Put in the value of each potential upgrade, to make sure we're only investing in things when
		// the investment is worth it. The min sets an upper bound and the max sets a lower bound
		let contractValue = Math.min(Math.max(100_000_000, 0.01 * ns.getPlayer().money), 1_000_000_000)
		let bladeBurnerValue = Math.min(Math.max(10_000_000, 0.001 * ns.getPlayer().money), 1_000_000_000)
		let corpValue = Math.min(Math.max(10_000_000, 0.01 * ns.getPlayer().money), 1_000_000_000)
		let gymValue = Math.max(1_000_000, 0.01 * ns.getPlayer().money)
		// Spend money on these whenever possible
		if (ns.hacknet.hashCost("Generate Coding Contract") * conversion < contractValue){
			ns.hacknet.spendHashes("Generate Coding Contract")
		}
        // If we're in the gym, invest in it. 
		if (ns.getPlayer().location == "Powerhouse Gym"){
            // If we're early in a run, get the first 5 upgrades to speed up training.
            if (ns.getPlayer().playtimeSinceLastBitnode < 24 * 60 * 60 * 1000
            && ns.hacknet.getHashUpgradeLevel("Improve Gym Training") < 5){
                ns.hacknet.spendHashes("Improve Gym Training")
            } else if (ns.hacknet.hashCost("Improve Gym Training") * conversion < gymValue){
				ns.hacknet.spendHashes("Improve Gym Training")
			}
		}
		if (ns.getPlayer().factions.includes("Bladeburners")){
            // If we're on our fisrst few ascensions of the node, get bladeburner rank to speed things up.
            if (ns.getPlayer().playtimeSinceLastBitnode < 24 * 60 * 60 * 1000){
                if (ns.hacknet.getHashUpgradeLevel("Exchange for Bladeburner Rank") < 5){
                    ns.hacknet.spendHashes("Exchange for Bladeburner Rank")
                }
                if (ns.hacknet.getHashUpgradeLevel("Exchange for Bladeburner SP") < 5){
                    ns.hacknet.spendHashes("Exchange for Bladeburner SP")
                }
            }
			if (ns.hacknet.hashCost("Exchange for Bladeburner Rank") * conversion < bladeBurnerValue){
				ns.hacknet.spendHashes("Exchange for Bladeburner Rank")
			}
			if (ns.hacknet.hashCost("Exchange for Bladeburner SP") * conversion < bladeBurnerValue){
				ns.hacknet.spendHashes("Exchange for Bladeburner SP")
			}
			
		}
		if(ns.getPlayer().hasCorporation){
			if (ns.hacknet.hashCost("Exchange for Corporation Research") * conversion < corpValue){
				ns.hacknet.spendHashes("Exchange for Corporation Research")
			}
			//I don't think funds are worth it
			// ns.hacknet.spendHashes("Sell for Corporation Funds")
		}
		
		// If we have nothing else to buy, sell the hashes for money.
		while (ns.hacknet.numHashes() / ns.hacknet.hashCapacity() >= 0.9){
			ns.hacknet.spendHashes("Sell for Money")
		}
		await ns.sleep(100)
	}
}