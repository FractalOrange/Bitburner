// This program looks for all possible factions to join, and joins them if they have augmentations we need to buy. 
// For city factions it considers the mutually exclusive collections as a single unit and figures out which unit has 
// the most total new augments available.
// For hacking factions, the program runs a sub-routine that backdoors all possible servers. This also has other benefits.

// Should we join factions we're done with anyway for sleeves?
/** @param {NS} ns **/
export async function main(ns) {

	// Get a list of cities and break them up by regions, each region corresponding to a collection of
	// exclusive factions.
	let cities = ["Sector-12", "Aevum", "Volhaven", "Chongqing", "New Tokyo", "Ishima"]
	let americas = ["Sector-12", "Aevum"]
	let europe = ["Volhaven"]
	let eurasia = ["Chongqing", "New Tokyo", "Ishima"]
	let regions = [americas, europe, eurasia]
	// Create a list of augments we don't yet own for each region and store them in a single array.
	let regionAugments = [[],[],[]]
	for (let i = 0; i < 3; i++) {
		for (let city of regions[i]){
			for (let augment of ns.getAugmentationsFromFaction(city)){
				if (ns.getOwnedAugmentations().includes(augment) == false 
				&& regionAugments[i].includes(augment) == false){
					regionAugments[i].push(augment)
				}
			}
		}
	}
	
	// Run through each list to find the index of the longest, so we can join that regions's faction 
	// once we've been invited. We just join the first city and let the later loop do the rest.
    // We check the length is bigger than 1 to stop joining just for neuroflux
	let mostAugmentsRegion = 0
	for (let i = 0; i < 3; i++){
		if (regionAugments[i].length >= regionAugments[mostAugmentsRegion].length
            && regionAugments[i].length > 1){
			mostAugmentsRegion = i
		}
	}	
	// Make sure we have the money to travel to the city whose region has the most augments, as long
	// as there is at least one augment.
	while (ns.getPlayer().money < 200 * 1000){
		await ns.sleep (10 * 1000)
	}
	if (regionAugments[mostAugmentsRegion].length > 0){
		ns.travelToCity(regions[mostAugmentsRegion][0])
		await ns.sleep (3 * 60 * 1000)
		ns.joinFaction(regions[mostAugmentsRegion][0])
	}

    // Set up arrays for factions that we will join, and the augments they have. Defined outside the
    // loop so they don't reset.
    let factionsToJoin = []
    let factionAugments = []
	while(true == true){
		// Run backdoor to open possible hacking factions
		ns.run("backdoor.js",1)

		// Check for karma requirements to join gang
		if (ns.heart.break() <=-54000 && ns.getPlayer().inGang == false) {
			for (let faction of ns.getPlayer().factions){
				if (ns.gang.createGang(faction)) {
					ns.run("gangs.js")
					break
				}
			}
		}

		// Wait a certain amount of time, then travel to each city for 2 minutes
		await ns.sleep(1 * 60 * 1000)
		for (let city of cities){
			// Make sure we have the money to travel to the city.
			while (ns.getPlayer().money < 200 * 1000){
				await ns.sleep (10 * 1000)
			}
			ns.travelToCity(city)
			await ns.sleep(1.5 * 60 * 1000)
		}

		// Check available factions for augmentations we don't own, add to possibleAugments if they have one
		let outstandingFactions = ns.checkFactionInvitations()
		let possibleFactions = []
		for (let faction of outstandingFactions){
			// Find factions we can join and add ones with new augments to the list of possibilities.
			for (let augment of ns.getAugmentationsFromFaction(faction)){
				if (ns.getOwnedAugmentations().includes(augment) == false){
					possibleFactions.push(faction)
					break
				}
			}
		}
        // Add factions that have an augment that isn't already available from our current factions.
        possibleFactions.sort((a,b) => ns.getAugmentationsFromFaction(b) - ns.getAugmentationsFromFaction(a))
        for (let faction of possibleFactions) {
            for (let augment of ns.getAugmentationsFromFaction(faction)) {
                if (augment == "Neuroflux governor") {
                    continue
                }
                if (factionAugments.includes(augment) == false){
                    factionsToJoin.push(faction)
                }
            }
        }
		
		// Put other checks on possible factions to be joined (IDK like what)

		// Join the possible factions
		for (let faction of factionsToJoin){
			ns.joinFaction(faction)
		}
	}
}