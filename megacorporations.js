// I think this is obselete now we have sleeves.

/** @param {NS} ns **/
export async function main(ns) {

	// We input whether or not to focus on tasks, and whether or not we have the bladeburner's simulacrum to know
	// whether or not we should wait for bladeburner actions.
	let focus = ns.args[0]
	let simulacrumBool = ns.args[1]

	// Corps with unique augments related to hacking
	let hackCorps = ["OmniTek Incorporated", "NWO", "ECorp"]

	// Corps with unique augments related to rep gain
	let repCorps = ["Bachman & Associates", "OmniTek Incorporated", "NWO", "ECorp"]

	// All corps
	let megaCorps = [ "OmniTek Incorporated", "Bachman & Associates", "NWO", "Clarke Incorporated", "KuaiGong International", "Blade Industries", "ECorp", "MegaCorp", 
	"Four Sigma", "Fulcrum Technologies"]



	let factionRep = 200 * 1000
	
	for (let corp of megaCorps){
		if (corp == "Fulcrum Technologies"){
			factionRep = 250 * 1000
		}
		// Make sure we're not in the faction already
		while(ns.getCompanyRep(corp) < factionRep
        && ns.getPlayer().factions.includes(corp) == false 
        && ns.checkFactionInvitations().includes(corp) == false){
            if (corp == "FulcrumTechnologies"
            && (ns.getPlayer().factions.includes("Fulcrum Secret Technologies") == true 
            || ns.checkFactionInvitations().includes("Fulcrum Secret Technologies") == true)){
                continue
            }
			// Make sure we're not doing anything, including bladeburner.
			if (ns.isBusy() == false
				&& (ns.bladeburner.getCurrentAction().type == 'Idle'
				|| simulacrumBool)){
				
				// Now we actually work for the company for that field.
				ns.applyToCompany(corp, bestJob(corp))
				ns.workForCompany(corp, focus)
				await ns.sleep(10 * 1000)
				if (ns.getPlayer().workType == "Working for Company"){
					ns.stopAction()
				}
			}
			await ns.sleep(10)
		}
	}

    // This function figures out the best 
    function bestJob(corp) {
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
            ns.workForCompany(corp, false)
            // The strict inequality allows us to not over-write good fields with fields where we can't apply 
            // for any job and so end up working the same old job under the name of a different field.
            // Since we always apply to IT first, and we can always get an IT job if we can get any, we know that
            // there's no risk of the first rep gain actually representing something from a previous loop which would
            // happen if we failed to get an IT job.
            if (ns.getPlayer().workRepGainRate > bestRepGain){
                bestField = field
                bestRepGain = ns.getPlayer().workRepGainRate
            }
        }
        return bestField
    }


}