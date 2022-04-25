// Rework this to constantly look at new level all servers should be at, and look at all servers at once
// Instead of waiting for one to finish.

/** @param {NS} ns **/
export async function main(ns) {

	let moneyPercent = 0.10
	let limit = ns.getPurchasedServerLimit()
    let maxPrice = 100_000_000_000
	// Figure out what the maximum worthwhile upgrade is (total cost not more than moneyPercent of total money)
	let ram = 2

	while( true == true){
		// First figure out what we can afford.
		while (limit * ns.getPurchasedServerCost(ram * 2) < Math.min(moneyPercent * ns.getPlayer().money, maxPrice)
		&& ram * 2 < ns.getPurchasedServerMaxRam()) {
			ram = ram * 2
		}
		// Get the list of servers. If it's running weaken, dont replace it. If it isn't weakening, replace it.
		for (let server of ns.getPurchasedServers()){
			if (ns.getServerMaxRam(server) < ram){
				if (ns.scriptRunning("weaken.js", server) == true){
					continue
				} else {
					ns.killall(server)
					ns.deleteServer(server)
					ns.purchaseServer(server, ram)
				}
			}
		}
		await ns.sleep(5 * 1000)
	}

}