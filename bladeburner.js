// Stat gain is just proportional to time spent

// Could get rid of getskillpoints by doing something clever.

// Time is proportional to difficulty.

// We need to consider the ratio of reward multiplier per level and time multiplier per level to find which
// things are actually best. From looking at the documentation it appears that the actions do get strictly better going
// down the page. That said, this doesn't take the time taken to reach a particular point into account, or the starting 
// positions. The starting position won't matter eventually, but it could be the case that even though equally levelled
// contracts could have A better than B, A and B would never be equally levelled, and the level advantadge of the shorter,
// but less profitable action would give an actual advantage. We really need to look at rate of change of money/second, 
// i.e. money/second^2. This means we have to divide by the time factor twice.

// For ops this give assassination closely followed by tracking as being the best, for contracts it gives retirement,
// closely followed by bounty hunter.

// Maybe deal with how time is spent on money, rank, and working. Could make these global variables to make
// it easier to tweak. Could also use ratios. Could also use a timer to record time spent burning blades, 
// and then make the time spent working equal to some proportion of that.

// We should remove all checks on number of contracts available until we're carrying the task out. If we run out, 
// then we should incite violence

/** @param {NS} ns **/
export async function main(ns) {

	// Argument tells us whether or not we have the bladeburner's simulacrum
	let simulacrumBool = ns.args[0]

    // Set a variable to decide if we want to break out of the bitnode or not
    let breakBitnode = false

    // Set a variable to decide if we want to farm money with contracts or not
    let farmMoney = false

	let cities = ["Sector-12", "Aevum", "Volhaven", "Chongqing", "New Tokyo", "Ishima"]

	let contracts = ns.bladeburner.getContractNames()
	let operations = ns.bladeburner.getOperationNames()

	// Set threshold for chaos
	let chaosThresh = 50
	// Set time for various actions to allow for easier tweaking.
	let bladeTime = 15 * 60 * 1000

	// Set a lower limit on population of a place for us to do activities there.
	let popLimit = 100000000

	while (true == true) {

        // Put a control switch here for turning off bladeburner if we can break the bitnode and don't want to. At this point, why even continue?
        // ANSWER: stat training.
        // We might continue for cash, but it doesn't make that much money compared to other sources.
        // if (ns.bladeburner.getActionEstimatedSuccessChance('blackOp', "Operation Daedalus")[0] > 0.5) {
        //     await ns.writePort(1,1)
        //     ns.exit()
        //     break
        // }

		// Skill section
		// First max overclock
		while(ns.bladeburner.upgradeSkill("Overclock")){}
		// Then max reaper and evasive system since these scale best even after we have 100% success rate. After that
		// We just level up other skills from cheapest to most expensive.
		let prioritySkills = ["Evasive System", "Reaper"].sort((a,b) => 
			ns.bladeburner.getSkillUpgradeCost(a) - ns.bladeburner.getSkillUpgradeCost(b))
		let skills = ns.bladeburner.getSkillNames().sort((a, b) =>
			ns.bladeburner.getSkillUpgradeCost(a) - ns.bladeburner.getSkillUpgradeCost(b))	
		// Make sure we can afford the priority skills, and they're not more than twice as expensive as the others.
		while (ns.bladeburner.getSkillPoints() > ns.bladeburner.getSkillUpgradeCost(prioritySkills[0])
		&& ns.bladeburner.getSkillUpgradeCost(prioritySkills[0]) < 2 * ns.bladeburner.getSkillUpgradeCost(skills[0])) {
			ns.bladeburner.upgradeSkill(prioritySkills[0])
			prioritySkills.sort((a,b) =>
			ns.bladeburner.getSkillUpgradeCost(a) - ns.bladeburner.getSkillUpgradeCost(b))
		}
		// Now get the rest of the skills
		while (ns.bladeburner.getSkillPoints() > ns.bladeburner.getSkillUpgradeCost(skills[0])) {
			// Don't upgrade Cyber's Edge if we're good on stamina
			if (skills[0] == "Cyber's Edge"){
				if (ns.bladeburner.getStamina()[1] > 500){
					skills.shift()
					continue
				}
			}
			// Sometimes we get overclocked once it's maxed, if so we need to skip it.
			if (skills[0] == "Overclock"){
				skills.shift()
				continue
			}
			ns.bladeburner.upgradeSkill(skills[0])
			skills = ns.bladeburner.getSkillNames().sort((a, b) =>
				ns.bladeburner.getSkillUpgradeCost(a) - ns.bladeburner.getSkillUpgradeCost(b))
		}

		// Confusingly, bladeburner actions started through the API don't seem to interrupt work actions, even though
		// they do when you click them. It can be made to work if we only work for around 100ms or less in the loop, 
		// but adding this kill switch makes things cleaner.
		if (ns.getPlayer().workType == "Working for Company"
		&& simulacrumBool == false){
			ns.stopAction()
		}
		// First we check each city for chaos over the threshold and reduce it if it is. This doesn't
		// cost stamina
		for (let city of cities){
			if (ns.bladeburner.getCityChaos(city) > chaosThresh){
				while (ns.bladeburner.getCityChaos(city) > 0.9 * chaosThresh){
					await reduceChaos(city, simulacrumBool)
				}
			}
		}
		// Make sure our population estimates are accurate
		for (let city of cities) {
			while (await improveEstimate(city, simulacrumBool) > 0){}
		}
		// Then make sure we have the stamina for actual activities.
		if (ns.bladeburner.getStamina()[0] / ns.bladeburner.getStamina()[1] < 0.55) {
			while (ns.bladeburner.getStamina()[0] / ns.bladeburner.getStamina()[1] < 0.8){
				if (ns.bladeburner.startAction('General', 'Hyperbolic Regeneration Chamber')){
					await ns.sleep(ns.bladeburner.getActionTime('General', 'Hyperbolic Regeneration Chamber') + 50)
				}
			}
		}

        // First check for black ops and do any that have over 50% success rate.
		// We don't check rank requirements since it just won't start if we don't meet them and they cost 6gb.
		for (let op of ns.bladeburner.getBlackOpNames()) {
            // Don't break the bitnode if we don't want to.
            if (op == "Operation Daedalus" && breakBitnode == false){
                break
            }
			if (ns.getPlayer().workType == "Working for Company"
			&& simulacrumBool == false){
				ns.stopAction()
			}
			for (let city of cities){
				ns.bladeburner.switchCity(city)
				if (ns.bladeburner.getCityEstimatedPopulation(city) < popLimit){
					continue
				}
				if (ns.bladeburner.getActionEstimatedSuccessChance('blackOp', op)[0] > 0.5) {
					while(ns.bladeburner.startAction('blackOp', op)){
						// Wait 10 extra seconds in case we destroy the node.
						await ns.sleep(ns.bladeburner.getActionTime('blackop', op) + 10 * 1000)
						if (ns.getPlayer().workType == "Working for Company"
						&& simulacrumBool == false){
							ns.stopAction()
						}
					}
				}
			}
		}

		// Profit section
		// First we figure out the estimated profit per second of each contract, and then store the best one as profitContract
		let profitContract = ''
		let profitCity = ''
		let maxProfit = 0
		for (let i = 0; i < contracts.length; i++) {
			let contract = contracts[i]
			let contractProfit = 0
			let maxCity = ''
			// If we don't have contracts remaining, skip
			if (ns.bladeburner.getActionCountRemaining("contract", contract) < 10){
				continue
			}
			for (let city of cities) {
				ns.bladeburner.switchCity(city)
				let successChance = ns.bladeburner.getActionEstimatedSuccessChance("contract", contract)
				// skip work in cities that have 0 population
				if (ns.bladeburner.getCityEstimatedPopulation(city) < popLimit){
					continue
				}
				let cityProfit = (((successChance[0] + successChance[1]) / 2)
					* moneyMult(contract, ns.bladeburner.getActionMaxLevel("contract", contract))
					/ ns.bladeburner.getActionTime("contract", contract))
				if (cityProfit > contractProfit) {
					contractProfit = cityProfit
					maxCity = city
				}
			}
			if (contractProfit > maxProfit) {
				profitContract = contract
				profitCity = maxCity
				maxProfit = contractProfit
			}
		}
		// Regardless of anything else, if we can easily do retirements, we should do that since it scales the best.
		if (ns.bladeburner.getActionCountRemaining("contract", "Retirement") > 10){
			for (let city of cities) {
				ns.bladeburner.switchCity(city)
				// skip work in cities that have 0 population
				if (ns.bladeburner.getCityEstimatedPopulation(city) < popLimit){
					continue
				}
				let successChance = ns.bladeburner.getActionEstimatedSuccessChance("contract", "Retirement")
				if (successChance[0] > 0.50) {
					profitContract = "Retirement"
					profitCity = city
					maxProfit = (((successChance[0] + successChance[1]) / 2)
					* moneyMult("Retirement", ns.bladeburner.getActionMaxLevel("contract", "Retirement"))
					/ ns.bladeburner.getActionTime("contract", "Retirement"))
					break
				}
			}
		}
		// Figure out the rank gain of the contract, to set a minimum level of rank gain for operations.
		let rankThresh = 0
		if (maxProfit == 0){
			rankThresh = 0
		} else {
			rankThresh = ns.bladeburner.getActionRepGain("contract", profitContract) 
			/ ns.bladeburner.getActionTime("contract", profitContract)
		}

		// Rank up section
		// First we figure out the estimated rank per second of each contract, and then store the best one as rankContract
		let rankOperation = ''
		let rankCity = ''
		let maxRank = 0
		for (let i = 0; i < operations.length; i++) {
			let operation = operations[i]
			let operationRank = 0
			let maxCity = ''
			if (ns.bladeburner.getActionCountRemaining("operation", operation) < 10){
				continue
			}
			for (let city of cities) {
				ns.bladeburner.switchCity(city)
				// If we're looking at raiding, make sure we have communities
				if (operation == "Raid" && ns.bladeburner.getCityCommunities(city) < 10) {
					continue
				}
				let successChance = ns.bladeburner.getActionEstimatedSuccessChance("operation", operation)
				// skip work in cities that have 0 population
				if (ns.bladeburner.getCityEstimatedPopulation(city) < popLimit){
					continue
				}
                // If we fail the op we lose slightly less than 10% of the reward
				let cityRank = (((successChance[0] + successChance[1]) / 2)
					* ns.bladeburner.getActionRepGain("operation", operation, ns.bladeburner.getActionMaxLevel("operation", operation))
					- (1 - (successChance[0] + successChance[1]) / 2)
                    * ns.bladeburner.getActionRepGain("operation", operation, ns.bladeburner.getActionMaxLevel("operation", operation)) / 10)
                    / ns.bladeburner.getActionTime("operation", operation)
				if (cityRank > operationRank) {
					operationRank = cityRank
					maxCity = city
				}
			}
			if (operationRank > maxRank) {
				rankOperation = operation
				rankCity = maxCity
				maxRank = operationRank
			}
		}
		// Regardless of anything else, if we can profitably do assassination, we should do that since it scales the best.
		if (ns.bladeburner.getActionCountRemaining("operation", "Assassination") > 10){
			for (let city of cities) {
				ns.bladeburner.switchCity(city)
				// skip work in cities that have 0 population
				if (ns.bladeburner.getCityEstimatedPopulation(city) < popLimit){
					continue
				}
				let successChance = ns.bladeburner.getActionEstimatedSuccessChance("operation", "Assassination")
				if (successChance[0] > 0.1) {
					rankOperation = "Assassination"
					rankCity = city
					maxRank = (((successChance[0] + successChance[1]) / 2)
					* ns.bladeburner.getActionRepGain("operation", "Assassination")
					/ ns.bladeburner.getActionTime("operation", "Assassination"))
					break
				}
			}
		}
		// Stamina checkpoint
		if (ns.bladeburner.getStamina()[0] / ns.bladeburner.getStamina()[1] < 0.5) {
			await ns.writePort(1,1)
			continue
		}
		
        // If we make more rank doing operations than contracts, do operations for bladeTime. Otherwise,
        // do contracts. We interrupt if stamina drops too low.
		if (maxRank > rankThresh
			&& rankCity != ''){
			ns.bladeburner.switchCity(rankCity)
			let operationRepeats = Math.min(Math.floor(bladeTime / ns.bladeburner.getActionTime('operation', rankOperation)),
             ns.bladeburner.getActionCountRemaining("operation", rankOperation))
			for (let i = 0; i < operationRepeats; i ++){
                if (ns.bladeburner.getCityChaos(rankCity) > 1.5 * chaosThresh){
                    break
                }
                if (ns.getPlayer().workType == "Working for Company"
                && simulacrumBool == false){
                    ns.stopAction()
                }
                if (ns.bladeburner.getStamina()[0] / ns.bladeburner.getStamina()[1] < 0.5) {
                    await ns.writePort(1,1)
                    break
                }
				if (ns.bladeburner.startAction('operation', rankOperation)){
					await ns.sleep(ns.bladeburner.getActionTime('operation', rankOperation) + 50)
				}
			}
		} 
		// Farm money if we can't farm rank
        if ((maxRank < rankThresh || farmMoney == true)
		&& profitCity != '') {
			let contractRepeats = Math.min(Math.floor(bladeTime / ns.bladeburner.getActionTime('contract', profitContract)), 
            ns.bladeburner.getActionCountRemaining("contract", profitContract))
			ns.bladeburner.switchCity(profitCity)
			for (let i = 0; i < contractRepeats; i++) {
                if (ns.bladeburner.getCityChaos(profitCity) > 1.5 * chaosThresh){
                    break
                }
                if (ns.getPlayer().workType == "Working for Company"
                && simulacrumBool == false){
                    ns.stopAction()
                }
                if (ns.bladeburner.getStamina()[0] / ns.bladeburner.getStamina()[1] < 0.5) {
                    await ns.writePort(1,1)
                    break
                }
				if(ns.bladeburner.startAction('contract', profitContract)){
					await ns.sleep(ns.bladeburner.getActionTime('contract', profitContract) + 50)
				}
			}
        }

		ns.bladeburner.stopBladeburnerAction()
		// Write to port 1 to let other scripts know we've finished a loop.
		await ns.writePort(1,1)
	}


	// This function works out the multiplier for a contract at level n
	function moneyMult(contract, n) {
		let levelMult = [1.041, 1.085, 1.065]
		return Math.pow(levelMult[contracts.indexOf(contract)], n - 1)
	}

	// This function does one iteration of population analysis
	async function improveEstimate(city, simulacrumBool){
		ns.bladeburner.switchCity(city)
		if (ns.getPlayer().workType == "Working for Company"
		&& simulacrumBool == false){
			ns.stopAction()
		}
		let startPop = ns.bladeburner.getCityEstimatedPopulation(city)
		// Do undercover ops if we can
		if (ns.bladeburner.getActionEstimatedSuccessChance("Operation", "Undercover Operation")[0] > 0.5
		&& ns.bladeburner.getActionCountRemaining("Operation", "Undercover Operation") > 10){
			// Need to make sure we succeed, so do that by comparing rank before and after.
			let startRank = ns.bladeburner.getRank()
			if (ns.bladeburner.startAction("Operation", "Undercover Operation")){
				await ns.sleep(ns.bladeburner.getActionTime("Operation", "Undercover Operation") + 50)
			}
			// If we've lost rank, try again.
			if (ns.bladeburner.getRank() <= startRank){
				await improveEstimate(city)
			}
			return Math.abs(startPop - ns.bladeburner.getCityEstimatedPopulation(city))
		}
		// Do Investigations if we can
		if (ns.bladeburner.getActionEstimatedSuccessChance("Operation", "Investigation")[0] > 0.5
		&& ns.bladeburner.getActionCountRemaining("Operation", "Investigation") > 10){
			let startRank = ns.bladeburner.getRank()
			if (ns.bladeburner.startAction("Operation", "Investigation")){
				await ns.sleep(ns.bladeburner.getActionTime("Operation", "Investigation") + 50)
			}
			if (ns.bladeburner.getRank() <= startRank){
				await improveEstimate(city)
			}
			return Math.abs(startPop - ns.bladeburner.getCityEstimatedPopulation(city))
		} else {
			// If nothing else, do Field Analysis 
			if (ns.bladeburner.startAction("General", "Field Analysis")) {
				await ns.sleep(ns.bladeburner.getActionTime("General", "Field analysis"))	
			}
			return Math.abs(startPop - ns.bladeburner.getCityEstimatedPopulation(city))
		}
	}

	// This function does one iteration of chaos reduction
	async function reduceChaos(city, simulacrumBool){
        if (ns.getPlayer().workType == "Working for Company"
        && simulacrumBool == false){
            ns.stopAction()
        }
		ns.bladeburner.switchCity(city)
		// Stealth retirement reduces chaos by 1-3 % and has other benefits, so do this over diplomacy if possible.
		if (ns.bladeburner.getActionCountRemaining("operation", "Stealth Retirement Operation") > 5
		&& ns.bladeburner.getCityEstimatedPopulation(city) > popLimit){
			// Find the highest level of stealth that guarantees success
			let successLevel = 0
			for (let i = 1; i <= ns.bladeburner.getActionMaxLevel("operation", "Stealth Retirement Operation"); i++){
				// Check to see if this level of SRO has better than even success. If not, break the loop.
				ns.bladeburner.setActionLevel("operation", "Stealth Retirement Operation", i)
				if (ns.bladeburner.getActionEstimatedSuccessChance("operation", "Stealth Retirement Operation")[0] < 0.5){
					break
				} else {
					successLevel = i
				}
			}
			// If we can ensure a likely successful SRO, do it.
			if (successLevel > 0){
				ns.bladeburner.setActionLevel("operation", "Stealth Retirement Operation", successLevel)
				if (ns.bladeburner.startAction("operation", "Stealth Retirement Operation")){
					await ns.sleep(ns.bladeburner.getActionTime("operation", "Stealth Retirement Operation") + 50)
					return
				}
			}
		}
		// If SRO doesn't work out, just do diplomacy.
		if (ns.bladeburner.startAction('General','Diplomacy')){
			await ns.sleep(ns.bladeburner.getActionTime('General', 'Diplomacy') + 50)
			return
		}
	}
}