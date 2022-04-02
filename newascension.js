
// This script tidies everything up and installs all augments after they've been bought.

// Should put in something to buy any augs for sleeves with leftover money.
/** @param {NS} ns **/
export async function main(ns) {

    let focus = ns.args[0]

    // We make a list of the different possible types of work we can do for a faction
	let workTypes = ["Hacking Contracts", "Security Work", "Field Work"]

    // Kill bladeburner script since it causes problems with farming rep
    if (ns.getOwnedAugmentations().includes("The Blade's Simulacrum") == false){
        // Also kill faction work since this instigates bladeburner.
        ns.scriptKill("factionwork.js", "home")
        ns.scriptKill("bladeburner.js", "home")
    }

    // If we're within 5% of the favour required to donate to a faction, farm that remaining favour
	for (let faction of ns.getPlayer().factions){
		if(faction == "Bladeburners"){
			continue
		}
		if(ns.getFactionFavor(faction) + ns.getFactionFavorGain(faction) 
		> 0.95 * 150 * ns.getBitNodeMultipliers().RepToDonateToFaction
		&& ns.gang.inGang() == false){
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
	while (ns.hacknet.spendHashes("Sell for Money")) {}

	// Have to account for what would happen if we joined a faction without neuroflux.
	let badFactions = []
	if (ns.gang.inGang() == true){
		badFactions = ["Bladeburners", ns.gang.getGangInformation().faction]
	} else {
		badFactions = ["Bladeburners"]
	}

    // Buy any spare neuroflux
	// Consider all possible factions we are a member of or have been invited to, and find the highest rep one.
	let allFactions = ns.getPlayer().factions.concat(ns.checkFactionInvitations()).sort(
		(a,b) => ns.getFactionRep(b)-ns.getFactionRep(a))
	let highestRepFaction = allFactions[0]
	if (badFactions.includes(highestRepFaction)){
		highestRepFaction = allFactions[1]
	}
	if (badFactions.includes(highestRepFaction)){
		highestRepFaction = allFactions[2]
	}
	// Also find the faction with the highest favor in case we need to donate.
	let highestFavorFaction = allFactions.sort((a,b) => (ns.getFactionFavor(b)-ns.getFactionFavor(a)))[0]
	if (badFactions.includes(highestFavorFaction)){
		highestFavorFaction = allFactions.sort((a,b) => (ns.getFactionFavor(b)-ns.getFactionFavor(a)))[1]
	}
	if (badFactions.includes(highestFavorFaction)){
		highestFavorFaction = allFactions.sort((a,b) => (ns.getFactionFavor(b)-ns.getFactionFavor(a)))[2]
	}
	ns.joinFaction(highestFavorFaction)
	
	// Buy all affordable neuroflux. If we don't have the rep, we donate if we can.
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

    // Buy any sleeve augments we can afford
    for (let i = 0; i < ns.sleeve.getNumSleeves(); i++){
		if (ns.sleeve.getSleeveStats(i).shock == 0){
			for (let augment of ns.sleeve.getSleevePurchasableAugs(i)){
				ns.sleeve.purchaseSleeveAug(i, augment.name)
			}
		}
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