
// This script alternates between allowing bladeburner.js to happen, and working for factions to farm rep.

/** @param {NS} ns **/
export async function main(ns) {
    
    // We input whether or not to focus on tasks, and whether or not we have the bladeburner's simulacrum to know
	// whether or not we should wait for bladeburner actions.
	let focus = ns.args[0]
	let simulacrumBool = ns.args[1]

    // Decide what proportion of the time working should be for megacorporations rather than factions
    let workProportion = 0.1

    // We make a list of the different possible types of work we can do for a faction
	let workTypes = ["Hacking Contracts", "Security Work", "Field Work"]

    // Set a stat threshold for carrying out bladeburner tasks
    let bladeburnerStatThresh = 500
    let crimeTime = 30 * 60 * 1000
    
    while (true == true){
        // We want to run 1 full loop of bladeburner, then spend the same amount of time on rep farming.
		// Only need to interrupt if we don't have the simulacrum.
        let startTime = Date.now()
		if (simulacrumBool == false){
                // We use port 1 to check bladeburner status. When it's empty that means we're running, when it has something
                // in it that means we have completed a loop
                ns.clearPort(1)
                ns.stopAction()
                ns.scriptKill("bladeburner.js","home")
                ns.scriptKill("crime.js", "home")
            if (ns.getPlayer().strength > bladeburnerStatThresh){
                ns.run("bladeburner.js", 1, false)
                // Find the start of running bladeburner to compute the time it runs for
                startTime = Date.now()
                while(ns.getPortHandle(1).empty() == true){
                    await ns.sleep(1000)
                }
                ns.scriptKill("bladeburner.js", "home")
            } else {
                ns.run("crime.js", 1, crimeTime)
                // Find the start of running bladeburner to compute the time it runs for
                startTime = Date.now()
                while(ns.getPortHandle(1).empty() == true){
                    await ns.sleep(1000)
                }
                ns.scriptKill("crime.js", "home")
            }

        // If we have the simulacrum, make sure we're running bladeburner as true.
		} else {
            ns.kill("bladeburner.js", "home", false)
            ns.run("bladeburner.js", 1, true)
        }
        let endTime = Date.now()
		let runTime = endTime-startTime
        // Make sure we run for at least 5 minutes, in case we're not doing bladeburner.
        while (Date.now() < endTime + Math.max(runTime, 5 * 60 * 1000)){	
            // If there are no factions to farm, just don't do that.
            if (ns.getPortHandle(5).empty() == true){
                break
            }
            let faction = ns.peek(5)
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
            // If we can work, do it. If not (e.g. if it's a gang faction), skip the faction.
            if (ns.workForFaction(faction, bestType, focus)){
                await ns.sleep(60 * 1000)
                ns.stopAction()
            } else {
                ns.readPort(5)
                continue
            }

        }
        // If we have a job from a megacorp, work that for workTime
        let workTime = Math.max(runTime, 5 * 60 * 1000) * workProportion
		if (ns.getPlayer().companyName != ''){
			await ns.sleep(workTime)
		}
    }
}
