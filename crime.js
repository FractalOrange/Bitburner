/** @param {NS} ns **/
export async function main(ns) {
    let crimeTime = ns.args[0]
    let startTime = Date.now()
	ns.tail("crime.js", "home", ns.args[0])
	// Do the most profitable crime indefinitely
	while (true == true) {
        if (Date.now() > startTime + crimeTime){
            await ns.writePort(1,1)
        }
            
		// Find the most profitable crime
		let possibleCrimes = ["shoplift", "rob store", "mug someone", "larceny", "deal drugs", "bond forgery",
		"traffick illegal arms", "homicide", "grand theft auto", "kidnap and ransom", "assassinate", "heist"]
		let bestProfit = 0
		let bestCrime = "none"
		for (let i = 0; i < possibleCrimes.length; i++){
			let currentCrime = possibleCrimes[i]
			let stats = ns.getCrimeStats(currentCrime)
			let profit = stats.money * ns.getCrimeChance(currentCrime) / stats.time
			if (profit > bestProfit){
				bestProfit = profit
				bestCrime = currentCrime
			} 
		}

		if (ns.isBusy() == false) {
			await ns.sleep(ns.commitCrime(bestCrime))
		}
		await ns.sleep(50)
	}

}