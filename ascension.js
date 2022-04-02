// Could separate the buying augmentations script from the installation script for RAM conservation reasons.

// Maybe change the min augments as a % of available augments?

// Rather than a max number of augments, could just auto-ascend when the total hacking skill bonus will more than double
// Or set some other ascension criteria.

// Could also take ascension benefits to rep farming into account when looking at whether or not to postpone farming
// for a particular augment.

// Could refine the tempBannedAugment behaviour

// Maybe find out what the final cost of the augments to buy is so I know how much money is leftover to do
// things like spend on donations.

// Could actually compare times to farm remaining rep and include some kind of augmentation startup time to account for
// the need to get back to the point where we can farm rep to make things more accurate. As it stands, it is almost always 
// computed to be quicker to ascend than to farm when the amount of favor is currently low, but I wonder if this is the case 
// with startup lag taken into account

// We list all available augments from lowest to highest rep requirement, and then figure out which of these 
// we can afford buying from most to least expensive. We then find the most efficient faction for farm the rep for
// for each of the augments and farm these from longest to shortest time remaining. While farming we check if it would
// be quicker to farm the remaining faction at the current favor level, or to ascend and farm it there.
// Once all rep is farmed, we buy the augments, then spend any money leftover on bladeburner augments, neuroflux augments,
// and home PC upgrades in that order.

/** @param {NS} ns **/
export async function main(ns) {
	// Whether or not to focus on rep gain.
	let focus = true
	// If we have Neuroreceptor Management Implant, turn off focus for simplicity
	if (ns.getOwnedAugmentations().includes("Neuroreceptor Management Implant") == true){
		focus = false
	}
	// Set the minimum number of augments required to ascend
	let minAugments = 5
	if (ns.getOwnedAugmentations().length > 80){
		minAugments = 5
	}
	let maxAugments = 2 * minAugments
	
	// Set up some time to not farm rep, this lets us level skills and bladeburner to increase rep farm speed.
	let otherActionTime = 15 * 60 * 1000
	let ascensionRepeats = 15

	// Set how long to wait to ascend with buying fewer than the minAugments because the rest are farmed faster next time
	let startupTime = 2 * 60 * 60 * 1000



	// Store a list of desired augments or augments you don't want to buy automatically. We also have the 
	// tempBannedAugments as a place to put augments we don't want to consider for one iteration of the loop
	// but will want to consider after that (for example, augments where it would be faster to farm in the next
	// ascension. Even though that's true, we may eventually reach a point where it's not.)
	let suggestedAugments = []
	let bannedAugments = ns.getOwnedAugmentations(true)
	let tempBannedAugments = []
	
	// This is the loop condition until we can ascend
	let readyToAscend = false
	// This will be the array of augments we wish to buy
	let augmentsToBuy = []
	// Get a list of available augments from all joined factions
	let availableAugments = []
	// Get a list of bladeburner augments we meet rep requirements for
	let bladeburnerAugments = []
	
	while (readyToAscend == false){
		// We want to run 1 full loop of bladeburner, then spend the same amount of time on rep farming.
		// Only need to interrupt if we don't have the simulacrum.
		if (ns.getOwnedAugmentations().includes("The Blade's Simulacrum") == false){
			// We use port 1 to check bladeburner status. When it's empty that means we're running, when it has something
			// in it that means we have completed a loop
			ns.clearPort(1)
			ns.scriptKill("bladeburner.js","home")
			ns.run("bladeburner.js", 1, false)
			// Find the start of running bladeburner to compute the time it runs for
			var startTime = Date.now()
			while(ns.getPortHandle(1).empty() == true){
				await ns.sleep(30 * 1000)
			}
			var endTime = Date.now()
			var runTime = endTime-startTime
		}
		while (Date.now() < endTime + runTime){		
			// Reset augmentsToBuy so it is recalculated every turn in the loop
			augmentsToBuy = []
			// Create a list of all available non-bladeburner augments.
			for (let faction of ns.getPlayer().factions){
				// Add bladeburner augments last
				if (faction == "Bladeburners"){
					continue
				}
				for (let augment of ns.getAugmentationsFromFaction(faction)){
					// Only add if it isn't banned and it hasn't already been added.
					if (availableAugments.includes(augment) == false
					&& bannedAugments.includes(augment) == false
					&& tempBannedAugments.includes(augment) == false){
						// Make sure we meet requirements. If there's a requirement we don't own, make the condition false.
						let meetsRequirements = true
						for (let requirements of ns.getAugmentationPrereq(augment)){
							if (ns.getOwnedAugmentations(true).includes(requirements) == false){
								meetsRequirements = false
							}
						}
						if (meetsRequirements == true){
							availableAugments.push(augment)
						} else {
							bannedAugments.push(augment)
						}
					}
				}
			}
			// Now we make a separate array of bladeburner augments. Since their rep can't be easily farmed and their 
			// cost to rep ratio is much higher, we need to make sure we're not putting in a bunch of really expensive but 
			// low rep bladeburner augmentsthat will clog up the augmentsToBuy.
			for (let augment of ns.getAugmentationsFromFaction("Bladeburners")){
				// Only add if it isn't banned, hasn't already been added, and is cheaper than the most expensive 
				// non-bladeburner augment.
				if (bladeburnerAugments.includes(augment) == false
				&& bannedAugments.includes(augment) == false
				&& tempBannedAugments.includes(augment) == false){
					// Make sure we meet augment requirements. If there's a requirement we don't own, make the condition false.
					let meetsRequirements = true
					for (let requirements of ns.getAugmentationPrereq(augment)){
						if (ns.getOwnedAugmentations(true).includes(requirements) == false){
							meetsRequirements = false
						}
					}
					// Make sure we meet rep requirements since we can't farm bladeburner rep easily.
					if (ns.getAugmentationRepReq(augment) > ns.getFactionRep("Bladeburners")){
						meetsRequirements = false
					}
					if (meetsRequirements == true){
						bladeburnerAugments.push(augment)
					} else {
						bannedAugments.push(augment)
					}
				}
			}
			// Now we reset the tempBannedAugments to allow them to be considered next iteration
			tempBannedAugments = []


			// Sort augments from least to most rep
			availableAugments.sort((a,b) => ns.getAugmentationRepReq(a) - ns.getAugmentationRepReq(b))
			// Sort bladeburner augments from cheapest to most expensive
			bladeburnerAugments.sort((a,b) => ns.getAugmentationPrice(a) - ns.getAugmentationPrice(b))

			// Set maxAugments equal to the larger of all available augments and least minAugments + 1
			maxAugments = Math.max(minAugments + 1, Math.floor(availableAugments.length / 2))

			// Find the number of augments we can buy based on the current amount of 
			// money, buying from lowest to highest rep requirement.

			// We add augments from availableAugments to augmentsToBuy one at a time and re-calculate the cost each time
			// since we're adding them from least to most rep requirement, nothing to do with cost. If at any point a bladeburner
			// augment is cheaper than our currently most expensive augment, we add that in too.
			var potentialAugments = []
			let chooseBladeburner

			for (let i = 0; i < availableAugments.length; i++){
				// If we reach the max number of augments, stop looking for more (strict inequality to account for 
				// neurogovernor) 
				if (augmentsToBuy.length > maxAugments){
					break
				}
				// First decide if we should add a bladeburner or regular augment. We add a bladeburner augment if it is
				// cheaper than the next augment being considered
				if (bladeburnerAugments.length > 0
				&& ns.getAugmentationPrice(availableAugments[i]) 
				>= ns.getAugmentationPrice(bladeburnerAugments[0])){
					var newAugment = bladeburnerAugments[0]
					chooseBladeburner = true
				} else {
					var newAugment = availableAugments[i]
					chooseBladeburner = false
				}
				// Use the potentialAugments array to calculate the new total cost with the next augment added in.
				// Sort from most to least expensive to calculate the cost, and use potentialCost to store the value.
				potentialAugments = augmentsToBuy.concat([newAugment]).sort(
					(a,b) => ns.getAugmentationPrice(a) - ns.getAugmentationPrice(b))
				let potentialCost = 0
				// We buy from most to least expensive, so the least expensive ones will be doubled the most.
				for (let j = 0; j < potentialAugments.length; j++){
					potentialCost = 1.9 * potentialCost + ns.getAugmentationPrice(potentialAugments[j])
				}
				// If the new potentialCost with new augment is too high, break and keep the current set of potentialAugments.
				// If not and it was a regular augment, consider the next one. If it was a  bladeburner augment, add the augment 
				// to the augmentsToBuy and remove it from the bladeburner list, while also re-visiting the current point in
				// the availableAugment array to make sure nothing gets skipped.
				if (potentialCost > ns.getPlayer().money){
					continue
				} else if (chooseBladeburner == true){
					augmentsToBuy.push(bladeburnerAugments.shift())
					i --
				} else if (chooseBladeburner == false) {
					augmentsToBuy.push(newAugment)
				}
			}
			// Now we add any bladeburner augments that we can afford to the list of augments to buy, even if they're not a
			// cheap option
			potentialAugments = []
			for (let i = 0; i < bladeburnerAugments.length; i++){
				let newAugment = bladeburnerAugments[0]
				// Use the potentialAugments array to calculate the new total cost with the next augment added in.
				// Sort from most to least expensive to calculate the cost, and use potentialCost to store the value.
				potentialAugments = augmentsToBuy.concat([newAugment]).sort(
					(a,b) => ns.getAugmentationPrice(a) - ns.getAugmentationPrice(b))
				let potentialCost = 0
				// We buy from most to least expensive, so the least expensive ones will be doubled the most.
				for (let j = 0; j < potentialAugments.length; j++){
					potentialCost = 1.9 * potentialCost + ns.getAugmentationPrice(potentialAugments[j])
				}
				// If the new potentialCost with new augment is too high, break and keep the current set of potentialAugments.
				// If not and it was a regular augment, consider the next one. If it was a  bladeburner augment, add the augment 
				// to the augmentsToBuy and remove it from the bladeburner list, while also re-visiting the current point in
				// the availableAugment array to make sure nothing gets skipped.
				if (potentialCost > ns.getPlayer().money){
					break
				} else {
					augmentsToBuy.push(bladeburnerAugments.shift())
					i --
				}
			}

			// If we don't have enough available augments, wait
			if (augmentsToBuy.length == 0){
				// If we already own more than the min number of augments and we cant find more, just skip
				if(ns.getOwnedAugmentations(true).length - ns.getOwnedAugmentations(false).length >= minAugments){
					break
				}
				await ns.sleep(60 * 1000)
				continue
			}

			// Add neuroFlux to the start of the augmentsToBuy array to ensure we can afford it if we try to ascend without 
			// any augments
			augmentsToBuy.unshift("NeuroFlux Governor")
			// Farm required reputation. We go from highest cost to lowest to try to minimise the number of factions needed for 
			// augments that can be found in multiple places
			for (let i = augmentsToBuy.length; i > 0; i--){
				let augment = augmentsToBuy[i-1]
				let augmentFactions = []
				// Check each faction we belong to for the specific augment
				for (let faction of ns.getPlayer().factions){
					if (ns.getAugmentationsFromFaction(faction).includes(augment)){
						augmentFactions.push(faction)
					}
				}
				// Sort factions from quickest to longest rep farming time by dividing the remaining reputation
				// by the faction favor bonus
				augmentFactions.sort((a,b) => 
				((ns.getAugmentationRepReq(augment) - ns.getFactionRep(a)) / (1 + ns.getFactionFavor(a)/100) 
				-(ns.getAugmentationRepReq(augment) - ns.getFactionRep(b)) / (1 + ns.getFactionFavor(b)/100)))
				var highestRepFaction = augmentFactions[0]

				// Sort factions from highest to lowest favor to check for donation status
				augmentFactions.sort((a,b) => ns.getFactionFavor(b) - ns.getFactionFavor(a))
				let highestFavorFaction = augmentFactions[0]
				
				// If rep for a proper augment is too low, work for quickest to farm faction until we can afford the augmentation.
				// We only continue farming rep if farming the required rep at the current rate is faster than
				// ascending and farming the whole amount at the new rate.
				if ( i > 1 && ns.getFactionRep(highestRepFaction) < ns.getAugmentationRepReq(augment)){
					// If we can donate to the highest favor faction, and the donation cost is less than 10% of current money,
					// just do that.
					if (ns.getFactionFavor(highestFavorFaction) >= 
					ns.getFavorToDonate(highestFavorFaction) * ns.getBitNodeMultipliers().RepToDonateToFaction
					&& (ns.getAugmentationRepReq(augment) - ns.getFactionRep(highestFavorFaction)) * 10**6 
					/ ns.getPlayer().faction_rep_mult < 0.1 * ns.getPlayer().money){
						ns.donateToFaction(highestFavorFaction, (ns.getAugmentationRepReq(augment) - ns.getFactionRep(highestFavorFaction)) 
						* 10**6 / ns.getPlayer().faction_rep_mult)
						continue
					}

					// If I can ascend and pay for the rep cost next time round with 10% of the current money, take the augment
					// off the current list as in the next code block. (Don't remove neuroflux)
					if (ns.getFactionFavor(highestFavorFaction) + ns.getFactionFavorGain(highestFavorFaction) >=
					ns.getFavorToDonate(highestFavorFaction) * ns.getBitNodeMultipliers().RepToDonateToFaction
					&& ns.getAugmentationRepReq(augment) * 10**6 / ns.getPlayer().faction_rep_mult < 0.1 * ns.getPlayer().money){
						augmentsToBuy.splice(i-1, 1)
						availableAugments.splice(availableAugments.indexOf(augment),1)
						tempBannedAugments.push(augment)
						// Re-start the loop through available augments to make sure we recognise when we are finished looking
						// at augments
						i = augmentsToBuy.length + 1
						// We can start working for the faction without a fixed time, in case we end up with no augments we 
						// can actually work on.
						// We figure out which workType is the best, and then work on that one.
						let bestType = "Hacking Contracts"
						let bestRepGain = 0
						for (let type of workTypes){
							// Stop action to make sure if the faction doesn't offer that work type, the rep gain for it
							// correctly registers 0
							ns.stopAction()
							ns.workForFaction(highestRepFaction, type, focus)
							if (ns.getPlayer().workRepGainRate > bestRepGain){
								bestType = type
								bestRepGain = ns.getPlayer().workRepGainRate
							}
						}
						ns.workForFaction(highestRepFaction, bestType, focus)
						continue
					}
					
					// If it's faster to ascend, we remove the augment from the ones we're buying, remove it
					// from the list of available augments, and ban it out. We farm rep for it anyway (Don't remove neuroflux)
					if ((ns.getAugmentationRepReq(augment) - ns.getFactionRep(highestRepFaction)) / (1 + ns.getFactionFavor(highestRepFaction)/100)
					> ns.getAugmentationRepReq(augment) / (1 + (ns.getFactionFavor(highestRepFaction) + ns.getFactionFavorGain(highestRepFaction))/100)){
						augmentsToBuy.splice(i-1, 1)
						availableAugments.splice(availableAugments.indexOf(augment),1)
						tempBannedAugments.push(augment)
						// Re-start the loop through available augments to make sure we recognise when we are finished looking
						// at augments
						i = augmentsToBuy.length + 1
						// We can start working for the faction without a fixed time, in case we end up with no augments we 
						// can actually work on.
						// We figure out which workType is the best, and then work on that one.
						let bestType = "Hacking Contracts"
						let bestRepGain = 0
						for (let type of workTypes){
							// Stop action to make sure if the faction doesn't offer that work type, the rep gain for it
							// correctly registers 0
							ns.stopAction()
							ns.workForFaction(highestRepFaction, type, focus)
							if (ns.getPlayer().workRepGainRate > bestRepGain){
								bestType = type
								bestRepGain = ns.getPlayer().workRepGainRate
							}
						}
						ns.workForFaction(highestRepFaction, bestType, focus)
						continue
					}

					// We figure out which workType is the best, and then work on that one.
					let bestType = "Hacking Contracts"
					let bestRepGain = 0
					for (let type of workTypes){
						// Stop action to make sure if the faction doesn't offer that work type, the rep gain for it
						// correctly registers 0
						ns.stopAction()
						ns.workForFaction(highestRepFaction, type, focus)
						if (ns.getPlayer().workRepGainRate > bestRepGain){
							bestType = type
							bestRepGain = ns.getPlayer().workRepGainRate
						}
					}
					ns.workForFaction(highestRepFaction, bestType, focus)

					// We farm rep for this long, then break to re-calculate the augments we can afford.
					await ns.sleep(60 * 1000)
					break
				}
				// If we have the rep for the cheapest proper augment and either the min number of augments, or
				// the min number of augments including the ones that are farmed more efficiently next time, and we've
				// been waiting more than an hour since the last augmentation to allow for things to settle, then we ascend.
				if (i == 2 
				&& (augmentsToBuy.length - 1 >= minAugments 
				|| (augmentsToBuy.length - 1 >= 1 && augmentsToBuy.length - 1 + tempBannedAugments.length >= minAugments 
				&& ns.getTimeSinceLastAug() > startupTime ))){
					readyToAscend = true
					break
				}

				// We have to deal with the case that all the proper augments are better off being farmed next time around and
				// we're ready to ascend.
				// In this case we want to just buy neuroflux, so we have to cancel ascension if we can't buy neuroflux or donate
				// to reach it. In this case we should probably farm it as well.
				if (i == 1
				&& augmentsToBuy.length == 1
				&& readyToAscend == true
				&& ns.getFactionRep(highestRepFaction) < ns.getAugmentationRepReq(augment)){
					// If we could afford to donate and buy it, do the donation. If not, cancel ascension.
					if (ns.getFactionFavor(highestFavorFaction) >= 
					ns.getFavorToDonate(highestFavorFaction) * ns.getBitNodeMultipliers().RepToDonateToFaction
					&& (ns.getAugmentationRepReq(augment) - ns.getFactionRep(highestFavorFaction)) * 10**6 
					/ ns.getPlayer().faction_rep_mult + ns.getAugmentationPrice(augment) < ns.getPlayer().money){
						ns.donateToFaction(highestFavorFaction, (ns.getAugmentationRepReq(augment) - ns.getFactionRep(highestFavorFaction)) 
						* 10**6 / ns.getPlayer().faction_rep_mult)
					} else {
						readyToAscend == false
						// We figure out which workType is the best, and then work on that one.
						let bestType = "Hacking Contracts"
						let bestRepGain = 0
						for (let type of workTypes){
							// Stop action to make sure if the faction doesn't offer that work type, the rep gain for it
							// correctly registers 0
							ns.stopAction()
							ns.workForFaction(highestRepFaction, type, focus)
							if (ns.getPlayer().workRepGainRate > bestRepGain){
								bestType = type
								bestRepGain = ns.getPlayer().workRepGainRate
							}
						}
						ns.workForFaction(highestRepFaction, bestType, focus)
						// We farm rep for this long, then break to re-calculate the augments we can afford.
						await ns.sleep(60 * 1000)
						break
					}
				}
			} 
			// If we're stuck waiting for something, re-run the loop every 10 seconds
			await ns.sleep(10 * 1000)
			if (ns.getPlayer().workType == "Working for Faction"){
				ns.stopAction()
			}
			// If we're ready to ascend, don't need to repeat the other iterations of the loop.
			if (readyToAscend == true){
				break
			}
		}
	}

	// If we're within 5% of the favour required to donate to a faction, farm that remaining favour
	for (let faction of ns.getPlayer().factions){
		if(faction == "Bladeburners"){
			continue
		}
		if(ns.getFactionFavor(faction) + ns.getFactionFavorGain(faction) 
		> 0.95 * 150 * ns.getBitNodeMultipliers().RepToDonateToFaction){
			ns.tprint("Farming a leetle more reputation to hit donation limit.")
			while(ns.getFactionFavor(faction) + ns.getFactionFavorGain(faction) 
			< 150 * ns.getBitNodeMultipliers().RepToDonateToFaction){
				// We figure out which workType is the best, and then work on that one.
				let bestType = "Hacking Contracts"
				let bestRepGain = 0
				for (let type of workTypes){
					// Stop action to make sure if the faction doesn't offer that work type, the rep gain for it
					// correctly registers 0
					ns.stopAction()
					ns.workForFaction(faction, type, focus)
					if (ns.getPlayer().workRepGainRate > bestRepGain){
						bestType = type
						bestRepGain = ns.getPlayer().workRepGainRate
					}
				}
				ns.workForFaction(faction, bestType, focus)
				await ns.sleep(60 * 1000)
			}
		}
	}

	// Sell off all stocks for extra money - add 7.5GB
	if (ns.getPlayer().hasTixApiAccess == true){
		ns.scriptKill("basicstocks.js", "home")
		for (let sym of ns.stock.getSymbols()){
			ns.stock.sell(sym, ns.stock.getPosition(sym)[0])
		}
	}
	// Spend all hashes - add 4 gb
	while (ns.hacknet.spendHashes("Sell for Money"))

	// Buy all augments on the list from most to least expensive
	augmentsToBuy.sort((a,b) => (ns.getAugmentationPrice(a) - ns.getAugmentationPrice(b)))
	for (let i = augmentsToBuy.length; i > 0; i--){
		let augment = augmentsToBuy[i-1]
		let augmentFactions = []
		// Check each faction we belong to for the specific augment
		for (let faction of ns.getPlayer().factions){
			if (ns.getAugmentationsFromFaction(faction).includes(augment)){
				augmentFactions.push(faction)
			}
		}
		// Sort factions from most to least rep
		augmentFactions.sort((a,b) => (ns.getFactionRep(b)-ns.getFactionRep(a)))
		let highestRepFaction = augmentFactions[0]
		ns.purchaseAugmentation(highestRepFaction, augment)
	}

	// Buy any other augments that got left off the list for whatever reason.
	availableAugments.sort((a,b) => (ns.getAugmentationPrice(a) - ns.getAugmentationPrice(b)))
	for (let i = availableAugments.length; i > 0; i--){
		let augment = availableAugments[i-1]
		let augmentFactions = []
		// Check each faction we belong to for the specific augment
		for (let faction of ns.getPlayer().factions){
			if (ns.getAugmentationsFromFaction(faction).includes(augment)){
				augmentFactions.push(faction)
			}
		}
		// Sort factions from most to least rep
		augmentFactions.sort((a,b) => (ns.getFactionRep(b)-ns.getFactionRep(a)))
		let highestRepFaction = augmentFactions[0]
		ns.purchaseAugmentation(highestRepFaction, augment)
	}
	

	// Buy any spare neuroflux
	// Consider all possible factions we are a member of or have been invited to, and find the highest rep one.
	let allFactions = ns.getPlayer().factions.concat(ns.checkFactionInvitations()).sort(
		(a,b) => ns.getFactionRep(b)-ns.getFactionRep(a))
	highestRepFaction = allFactions[0]
	if (highestRepFaction == "Bladeburners"){
		highestRepFaction = allFactions[1]
	}
	// Also find the faction with the highest favor in case we need to donate.
	let highestFavorFaction = allFactions.sort((a,b) => (ns.getFactionFavor(b)-ns.getFactionFavor(a)))[0]
	if (highestFavorFaction == "Bladeburners"){
		highestFavorFaction = allFactions.sort((a,b) => (ns.getFactionFavor(b)-ns.getFactionFavor(a)))[1]
	}
	ns.joinFaction(highestFavorFaction)
	
	// Buy all affordable neuroflux. If we don't have the rep, we donate.
	while (ns.getAugmentationPrice("NeuroFlux Governor") < ns.getPlayer().money){
		if (ns.getAugmentationRepReq("NeuroFlux Governor") > ns.getFactionRep(highestRepFaction)){
			if (ns.donateToFaction(highestFavorFaction, 
			(ns.getAugmentationRepReq("NeuroFlux Governor") - ns.getFactionRep(highestFavorFaction)) * 10**6 
			/ ns.getPlayer().faction_rep_mult) ){
				ns.purchaseAugmentation(highestFavorFaction, "NeuroFlux Governor")
			} else {
				break
			}
		} else {
			ns.purchaseAugmentation(highestRepFaction, "NeuroFlux Governor")
		}
		await ns.sleep(1000)
	}
	
	// Upgrade ram and cores if leftover money
	while (ns.upgradeHomeRam()){
		await ns.sleep(1000)
	}
	while (ns.upgradeHomeCores()){
		await ns.sleep(1000)
	}

	// Stop action before ascending to avoid bug
	ns.scriptKill("megacorporations.js","home")
	ns.stopAction()
	await ns.sleep(1000)
	// Install augments and run startup
	ns.installAugmentations("startup.js")
}