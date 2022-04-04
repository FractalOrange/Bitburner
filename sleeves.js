// I actually think mathematically it doesn't make sense to recover shock, since it recovers naturally at
// half the recovery rate.
// Suppose you're at 40% shock. You can recover for an hour and then work for an hour at 100% efficiency,
// or you can work for two hours at 60-100% efficiency (80% average). Isn't the latter just better?

// How do we determine which sleeve does what? 

/** @param {NS} ns **/

export async function main(ns) {

    // Set the threshold for farming stats
    let statThreshold = 50
    let playerStatThreshold = 100

    // variable to decide if we want to farm karma for gangs.
    let farmGang = true
    let combatGangs = ["Slum Snakes", "Speakers for the Dead", "The Dark Army", "The Syndicate", "Tetrads"]

    // Set the minimum number of augments available for ascending a sleeve, and the amount of money we're willing to spend on each augment.
    let minSleeveAugments = 3
    let augmentCostThreshold 

    // All corps
	let megaCorps = [ "OmniTek Incorporated", "Bachman & Associates", "NWO", "Clarke Incorporated", "KuaiGong International", "Blade Industries", "ECorp", "MegaCorp", 
	"Four Sigma", "Fulcrum Technologies"]

	let factionRep = 200 * 1000

    // We make a list of the different possible types of work we can do for a faction
	let workTypes = ["Hacking Contracts", "Security Work", "Field Work"]

    while (true == true){
        await ns.sleep(1000)
        // Run through the list of sleeves
        for (let i = 0; i < ns.sleeve.getNumSleeves(); i++){
            // First check for available augments and purchase them. We set the augmentCostThreshold based on current money
            if (ns.sleeve.getSleeveStats(i).shock == 0){
                augmentCostThreshold = ns.getPlayer().money * 0.01
                // Set up an array to store augments we want to buy. There's no price increase, but we want to make sure we hit the min threshold.
                let augmentsToBuy = []
                for (let augment of ns.sleeve.getSleevePurchasableAugs(i)){
                    if (augment.cost < augmentCostThreshold){
                        augmentsToBuy.push(augment)
                    }
                }
                if (augmentsToBuy.length >= minSleeveAugments){
                    for (let augment of augmentsToBuy){
                        ns.sleeve.purchaseSleeveAug(i, augment.name)
                    }
                }
            }
            // Make sure we're synched first
            if (ns.sleeve.getSleeveStats(i).sync < 100){
                ns.sleeve.setToSynchronize(i)
                continue
            }

            // Reach a basic level of stats for each sleeve, and use sleeves to farm stats for the player as needed.
            // Do the combat stats first to help train main body if needed
            if (ns.sleeve.getSleeveStats(i).strength < statThreshold
            || ns.getPlayer().strength < playerStatThreshold){
                if (ns.sleeve.getTask(i).gymStatType == "strength"){
                    continue
                }
                ns.sleeve.travel(i, "Sector-12")
                ns.sleeve.setToGymWorkout(i, "Powerhouse Gym", "strength")
                continue
            }
            if (ns.sleeve.getSleeveStats(i).defense < statThreshold
            || ns.getPlayer().defense < playerStatThreshold){
                if (ns.sleeve.getTask(i).gymStatType == "defense"){
                    continue
                }
                ns.sleeve.travel(i, "Sector-12")
                ns.sleeve.setToGymWorkout(i, "Powerhouse Gym", "defense")
                continue
            }
            if (ns.sleeve.getSleeveStats(i).dexterity < statThreshold
            || ns.getPlayer().dexterity < playerStatThreshold){
                if (ns.sleeve.getTask(i).gymStatType == "dexterity"){
                    continue
                }
                ns.sleeve.travel(i, "Sector-12")
                ns.sleeve.setToGymWorkout(i, "Powerhouse Gym", "dexterity")
                continue
            }
            if (ns.sleeve.getSleeveStats(i).agility < statThreshold
            || ns.getPlayer().agility < playerStatThreshold){
                if (ns.sleeve.getTask(i).gymStatType == "agility"){
                    continue
                }
                ns.sleeve.travel(i, "Sector-12")
                ns.sleeve.setToGymWorkout(i, "Powerhouse Gym", "agility")
                continue
            }
            // Do non combat stats afterwards and don't bother using sleeves to train the main body.
            if (ns.sleeve.getSleeveStats(i).hacking < statThreshold){
                if (ns.sleeve.getTask(i).task == "Class"
                && ns.sleeve.getInformation(i).earningsForTask.workHackExpGain > 0){
                    continue
                }
                ns.sleeve.travel(i, "Volhaven")
                ns.sleeve.setToUniversityCourse(i, "ZB Institute of Technology", "Algorithms")
                continue
            }
            if (ns.sleeve.getSleeveStats(i).charisma < statThreshold){
                if (ns.sleeve.getTask(i).task == "Class"
                && ns.sleeve.getInformation(i).earningsForTask.workChaExpGain > 0){
                    continue
                }
                ns.sleeve.travel(i, "Volhaven")
                ns.sleeve.setToUniversityCourse(i, "ZB Institute of Technology", "Leadership")
                continue
            }

            // Farm gang requirements
            if (ns.heart.break() > -54000
            && farmGang == true){
                if (ns.sleeve.getTask(i).task == "Crime"
                && ns.sleeve.getTask(i).crime == "Homicide"){
                    continue
                } else {
                    ns.sleeve.setToCommitCrime(i, "homicide")
                    continue
                }
            } else if (ns.gang.inGang() == false) {
                for (let faction of ns.getPlayer().factions) {
                    if (combatGangs.includes(faction)){
                        if (ns.gang.createGang(faction)) {
                            run("gangs.js")
                            run("gangwarfare.js")
                            break
                        }
                    }
                }
            }

            // Once basic tasks required for run are met, reduce shock.
            if (ns.sleeve.getSleeveStats(i).shock > 0) {
                ns.sleeve.setToShockRecovery(i)
                continue
            }

            //Now look at factions

            // If we're already working for a faction, stop if we've been doing it for more than 1 minute, otherwise skip to the next sleeve.
            if (ns.sleeve.getTask(i).task == "Faction"){
                if (ns.sleeve.getInformation(i).timeWorked > 60 * 1000){
                    ns.sleeve.setToCommitCrime(i, "homicide")
                } else {
                    continue
                }
            }
            while (ns.getPortHandle(3).empty() == false){
                let faction = ns.peek(3)
                // If we can't work for the faction on this sleeve (e.g. because it's being worked by another one), look at the next one.
                let beingWorked= false
                for (let j = 0; j < ns.sleeve.getNumSleeves(); j++){
                    if (ns.sleeve.getTask(j).location == faction){
                        beingWorked = true
                        break
                    }
                }
                if (beingWorked == true){
                    ns.readPort(3)
                    continue
                }
                let bestType = await bestSleeveWork(i, faction)
                // If the faction can no longer be worked for, go look at the next one.
                if (ns.sleeve.setToFactionWork(i, faction, bestType) == false){
                    ns.readPort(3)
                    continue
                } else {
                    break
                }
            }
            // If all the factions we actually want to work for are being worked for, work for the ones that we're buying augments from
            // next ascension.
            while (ns.getPortHandle(4).empty() == false){
                let faction = ns.peek(4)
                // If we can't work for the faction on this sleeve (e.g. because it's being worked by another one), look at the next one.
                if (ns.sleeve.setToFactionWork(i, faction, workTypes[0]) == false
                && ns.sleeve.setToFactionWork(i, faction, workTypes[1]) == false
                && ns.sleeve.setToFactionWork(i, faction, workTypes[2]) == false){
                    ns.readPort(4)
                    continue
                }
                let bestType = await bestSleeveWork(i, faction)
                // If the faction can no longer be worked for, go look at the next one.
                if (ns.sleeve.setToFactionWork(i, faction, bestType) == false){
                    ns.readPort(4)
                    continue
                } else {
                    break
                }
            }
            // If we're working for a faction after this section, repeat the loop
            if (ns.sleeve.getTask(i).task == "Faction"){
                continue
            }

            // Now work for companies.

            // First make sure we're not already working. 
            if (ns.sleeve.getTask(i).task == "Company"){
                if (ns.getCompanyRep(ns.sleeve.getTask(i).location) > factionRep){
                    ns.sleeve.setToCommitCrime(i, "heist")
                }
                continue
            }
            for (let corp of megaCorps){
                // First make sure we're not already working for this company on a sleeve
                let beingWorked= false
                for (let j = 0; j < ns.sleeve.getNumSleeves(); j++){
                    if (ns.sleeve.getTask(j).location == corp){
                        beingWorked = true
                        break
                    }
                }
                if (beingWorked == true){
                    continue
                }
                if (corp == "Fulcrum Technologies"){
                    factionRep = 250 * 1000
                } else {
                    factionRep = 200 * 1000
                }
                // Make sure we're not in the faction already
                if(ns.getCompanyRep(corp) < factionRep
                && ns.getPlayer().factions.includes(corp) == false 
                && ns.checkFactionInvitations().includes(corp) == false){
                    if (corp == "FulcrumTechnologies"
                    && (ns.getPlayer().factions.includes("Fulcrum Secret Technologies") == true 
                    || ns.checkFactionInvitations().includes("Fulcrum Secret Technologies") == true)){
                        continue
                    }
                    // Make the main body apply to the job that's best for the sleeve
                    let bestJob = await bestSleeveJob(i,corp)
                    ns.applyToCompany(corp, bestJob)
                    // If we successfully start working for the company, break the loop
                    if (ns.sleeve.setToCompanyWork(i, corp)){
                        break
                    }
                }
            }
            // If we're working for a company after this section, repeat the loop
            if (ns.sleeve.getTask(i).task == "Company"){
                continue
            }

          
            // Then farm heists if nothing else to do and we're not doing it already.
            if (ns.sleeve.getTask(i).crime != "Homicide"){
                ns.sleeve.setToCommitCrime(i, "Homicide")
            }
        }
    }


    // This function figures out the best job position for a given sleeve to work for a given company
    async function bestSleeveJob(sleeveNum, corp) {
        // We list in this order because this is likely the order we meet the requirements for
    	let fields = ["IT", "Software", "Security", "Business"]
        // Figure out best field to work in by finding the one with the highest rep gain.
        let bestField = "Business"
        let bestRepGain = 0
        for (let field of fields){
            // This can fail if you can't apply for this job, or if you can't be promoted. Of the megacorps, all
            // of them have all positions, except fulcrum which lacks security. 

            // Apply for the best job we can get in the field
            while (ns.applyToCompany(corp,field) == true){
            }
            if (ns.sleeve.setToCompanyWork(sleeveNum, corp)){
                // Confusingly, workRepGain is actually a rate (the rep per cycle) rather than a cumulative amount.
                await ns.sleep(100)
                // The strict inequality allows us to not over-write good fields with fields where we can't apply 
                // for any job and so end up working the same old job under the name of a different field.
                // Since we always apply to IT first, and we can always get an IT job if we can get any, we know that
                // there's no risk of the first rep gain actually representing something from a previous loop which would
                // happen if we failed to get an IT job.
                if (ns.sleeve.getInformation(sleeveNum).workRepGain > bestRepGain){
                    bestField = field
                    bestRepGain = ns.sleeve.getInformation(sleeveNum).workRepGain
                }
            }
        }
        return bestField
    }

    // // This function figures out the best crime for sleeves
	// 	let possibleCrimes = ["shoplift", "rob store", "mug someone", "larceny", "deal drugs", "bond forgery",
	// 	"traffick illegal arms", "homicide", "grand theft auto", "kidnap and ransom", "assassinate", "heist"]
	// 	let bestProfit = 0
	// 	let bestCrime = "none"
	// 	for (let i = 0; i < possibleCrimes.length; i++){
	// 		let currentCrime = possibleCrimes[i]
	// 		let stats = ns.getCrimeStats(currentCrime)
	// 		let profit = stats.money * ns.getCrimeChance(currentCrime) / stats.time
	// 		if (profit > bestProfit){
	// 			bestProfit = profit
	// 			bestCrime = currentCrime
	// 		} 
	// 	}
	// 	if (ns.isBusy() == false) {
	// 		await ns.sleep(ns.commitCrime(bestCrime))
	// 	}


    // This function figures out the best type of work for a given sleep to work for a given faction
    async function bestSleeveWork(sleeveNum, faction) {
        let workTypes = ["Hacking Contracts", "Security Work", "Field Work"]
        let bestType = "Hacking contracts"
        let bestRepGain = 0
        for (let type of workTypes){
            // There's no idle command for sleeves, so just set to homicide. This makes sure that the repgain
            // correctly registers as 0
            if (ns.sleeve.setToFactionWork(sleeveNum, faction, type)){
                // Confusingly, workRepGain is actually a rate (the rep per cycle) rather than a cumulative amount.
                await ns.sleep(100)
                if (ns.sleeve.getInformation(sleeveNum).timeWorked > 0
                    && ns.sleeve.getInformation(sleeveNum).workRepGain){
                    bestType = type
                    bestRepGain = ns.sleeve.getInformation(sleeveNum).workRepGain
                }
            }
        }
        return bestType
    }
}