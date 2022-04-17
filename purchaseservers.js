/** @param {NS} ns **/
export async function main(ns) {
	var moneyPercent = 0.10
	var i = ns.getPurchasedServers().length
	var ram = 8
	while (moneyPercent * ns.getServerMoneyAvailable("home") > 25 * ns.getPurchasedServerCost(ram * 2)) {
		ram = ram * 2
	}
	while (i < ns.getPurchasedServerLimit()) {
		// Iterate through powers that we can afford to find the most expensive one available to buy
		if (ns.purchaseServer("pserv-" + i, ram) != ''){
			i++
		}
		await ns.sleep(100)
	}

	ns.spawn("updateservers.js", 1)
}