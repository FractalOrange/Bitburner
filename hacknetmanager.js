// Note: All upgrades become less efficient as the number of upgrades increases. Each successive one is worse value
// for money than the last.

// Should add a condition to not wait if the upgrade cost to optimal is super cheap.

// Should set up a counter to buy up to the maxCost of upgrades and then wait an hour.

// Should refactor the upgrade section to buy cheapest first to make sure we get value for money. Now we only buy one
// upgrade of each thing per node, but we will still be unbalanced since on later visits, the first node will be more upgraded 
// and will still be upgraded first.

// We fix a payback time and work out which upgrades will pay for themselves in that amount of time. This produces an "optimal"
// server upgraded to the point where no further upgrades will pay for themselves in the time period. We then check each server
// to see if it is at the optimum level, and try to upgrade if not. We then wait for the time period to allow the upgrades to 
// pay for themselves. If all servers are optimal, we increase the time period (currently doubling) and run the check again. We 
// also set a limit for a small amount of money, and if upgrading all servers' cache is less than this, we do it. We buy a new server
// and upgrade it to optimal if the purchase cost is less than the total cost of upgrading to optimal.
/** @param {NS} ns **/
export async function main(ns) {

	// The amount of time we expect upgrades to pay for themselves in. We have to do this in seconds since hashrate
	// is always measured in seconds. If there are no available upgrades that would pay for themselves at the end of
	// the loop, we double the payback time.
	var paybackTime = ns.args[0] * 60

    // Set up the base node. This array stores level, number of ram upgrades, number of cores, cache level. Note that the actual 
    // ram available is 2 ** (ramLevel - 1)
    let optimalNode = [1, 1, 1, 1]

    // Initialise variables to track the total cost of an optimal surver, and the cost to upgrade one from the 
    // previous level of optimal.
    let optimalCost = 0
    let updateCost = 0
    // Set up a variable designed to determine if we are spending all of our money on upgrades, or just part of it.
    // Really we only want to be spending all of our money on upgrades while startup is running. It's false by default 
    // to be conservative with money.
    let spendAll = false

	while (true == true){
		// Set up the base increase to compare to, measured in hash rate per dollar. We only buy upgrades that are 
        // at least this effective. This particular value is the hash rate per cost required to pay for itself in the payback 
        // time when converting hashes to money using the sell for money upgrade. As long as the hash rate increase per cost 
        // is less than this number, the upgrade pays for itself inthe time period. 
        // (mutliply by the hash cost for money and divide by the amount of money given, 
		// and the time allowed to farm for the hashes.)
		let upgradeBenchmark = 4 / (1000000 * paybackTime)


        // Update optimalNode
        while (true == true){
            // Sell stocks to upgrade
            for (let stock of ns.stock.getSymbols()) {
                ns.stock.sell(stock, ns.stock.getPosition(stock)[0])
                ns.stock.sellShort(stock, ns.stock.getPosition(stock)[2])
            }
            // Figure out how much money we have for good upgrades, and how much money we have for side upgrades
            var maxCost = 0.1 * Math.min(ns.getPlayer().money, Number.MAX_SAFE_INTEGER)
            var extraMoney = 0.01 * Math.min(ns.getPlayer().money, Number.MAX_SAFE_INTEGER)
            // For level, ram, cores, figure out if the increase in hash rate per dollar beats the benchmark, and if so
            // increase the counter.
            if (ns.getBitNodeMultipliers().HacknetNodeMoney * (ns.formulas.hacknetServers.hashGainRate(optimalNode[0] + 1, 0, 2 ** (optimalNode[1] - 1), optimalNode[2], ns.getPlayer().hacknet_node_money_mult)
            - ns.formulas.hacknetServers.hashGainRate(optimalNode[0], 0, 2 ** (optimalNode[1] - 1), optimalNode[2], ns.getPlayer().hacknet_node_money_mult))
            / ns.formulas.hacknetServers.levelUpgradeCost(optimalNode[0], 1, ns.getPlayer().hacknet_node_level_cost_mult)
            > upgradeBenchmark){
                optimalNode[0] ++
                continue
            }
            if (ns.getBitNodeMultipliers().HacknetNodeMoney * (ns.formulas.hacknetServers.hashGainRate(optimalNode[0], 0, 2 ** (optimalNode[1]), optimalNode[2], ns.getPlayer().hacknet_node_money_mult)
            - ns.formulas.hacknetServers.hashGainRate(optimalNode[0], 0, 2 ** (optimalNode[1] - 1), optimalNode[2], ns.getPlayer().hacknet_node_money_mult))
            / ns.formulas.hacknetServers.ramUpgradeCost(2 ** (optimalNode[1] - 1), 1, ns.getPlayer().hacknet_node_ram_cost_mult)
            > upgradeBenchmark){
                optimalNode[1] ++
                continue
            }
            if (ns.getBitNodeMultipliers().HacknetNodeMoney * (ns.formulas.hacknetServers.hashGainRate(optimalNode[0], 0, 2 ** (optimalNode[1] - 1), optimalNode[2] + 1, ns.getPlayer().hacknet_node_money_mult)
            - ns.formulas.hacknetServers.hashGainRate(optimalNode[0], 0, 2 ** (optimalNode[1] - 1), optimalNode[2], ns.getPlayer().hacknet_node_money_mult))
            / ns.formulas.hacknetServers.coreUpgradeCost(optimalNode[2], 1, ns.getPlayer().hacknet_node_core_cost_mult)
            > upgradeBenchmark){
                optimalNode[2] ++
                continue
            }
            // Check if upgrading cache on all servers is less than our extraMoney cost, and if so increase the counter.
            if (ns.formulas.hacknetServers.cacheUpgradeCost(optimalNode[3]) * ns.hacknet.numNodes() < extraMoney){
                optimalNode[3] ++
            }
            // If we run through a loop without anything being a worthwhile upgrade, we break the loop.
            break
        }

        updateCost = ns.formulas.hacknetServers.levelUpgradeCost(1, optimalNode[0] - 1, ns.getPlayer().hacknet_node_level_cost_mult)
        + ns.formulas.hacknetServers.ramUpgradeCost(1, optimalNode[1] - 1, ns.getPlayer().hacknet_node_ram_cost_mult)
        + ns.formulas.hacknetServers.coreUpgradeCost(1, optimalNode[2] - 1, ns.getPlayer().hacknet_node_core_cost_mult)
        - optimalCost

        optimalCost = ns.formulas.hacknetServers.levelUpgradeCost(1, optimalNode[0] - 1, ns.getPlayer().hacknet_node_level_cost_mult)
        + ns.formulas.hacknetServers.ramUpgradeCost(1, optimalNode[1] - 1, ns.getPlayer().hacknet_node_ram_cost_mult)
        + ns.formulas.hacknetServers.coreUpgradeCost(1, optimalNode[2] - 1, ns.getPlayer().hacknet_node_core_cost_mult)
        
        // Set up an inner loop to upgrade the servers. We return to the main loop when we need to update the optimalServer.
        // This helps avoid re-calculating the optimal server and messing around with the update and optimalCosts.
        while (true == true){
            // Figure out if we're spending all our money or not. Right now we only spend all our money during the 
            // startup process. i.e. until we get the final program. We want to make sure we don't accidentally spend
            // all our money when re-running startup after a reset, so need to find a permanent measure of "being in
            // the startup process".
            if (ns.fileExists("SQLinject.exe") == false){
                spendAll = true
            } else {
                spendAll = false
            }
           
            // update the money we can spend
            if (spendAll == true){
                maxCost = Math.min(ns.getPlayer().money, Number.MAX_SAFE_INTEGER)
            } else {
                maxCost = 0.1 * Math.min(ns.getPlayer().money, Number.MAX_SAFE_INTEGER)
            }
            extraMoney = 0.05 * Math.min(ns.getPlayer().money, Number.MAX_SAFE_INTEGER)
            var moneySpent = 0
             
            // While the price of a new node is less than the optimalCost (so it will pay itself back in
            // two payback time periods), buying it wouldn't put us over the maxCost
            while (ns.hacknet.getPurchaseNodeCost() < Math.min(optimalCost) && moneySpent + ns.hacknet.getPurchaseNodeCost() < maxCost
            || ns.hacknet.numNodes() == 0){
                moneySpent = moneySpent + ns.hacknet.getPurchaseNodeCost()
                ns.hacknet.purchaseNode()
                await ns.sleep(100)
            }
            
            // Upgrade all our nodes to optimal or as best we can
            // Run through the loop as long as we spend something at each step (otherwise everything is upgraded, or 
            // we've reached the max moneySpent). We set spentSomething to false at the start of the loop and change
            // it if we spend something.
            let spentSomething = true
            while(spentSomething == true){
                spentSomething = false
                // Run through each node, and upgrade each component by 1 level if possible. This allows us to see more nodes 
                // rather than just maxing out the first node.
                for (let i = 0; i < ns.hacknet.numNodes(); i++){
                    // Upgrade level if less than optimal and we can
                    if (ns.hacknet.getNodeStats(i).level < optimalNode[0] 
                    && moneySpent + ns.hacknet.getLevelUpgradeCost(i,1) < maxCost){
                        moneySpent = moneySpent + ns.hacknet.getLevelUpgradeCost(i,1)
                        ns.hacknet.upgradeLevel(i,1)
                        spentSomething = true
                    }
                    // Upgrade ram level if less than optimal and we can
                    if (ns.hacknet.getNodeStats(i).ram < 2 ** (optimalNode[1] -1) 
                    && moneySpent + ns.hacknet.getRamUpgradeCost(i,1) < maxCost){
                        moneySpent = moneySpent + ns.hacknet.getRamUpgradeCost(i,1)
                        ns.hacknet.upgradeRam(i,1)
                        spentSomething = true
                    }
                    // Upgrade cores if less than optimal and we can
                    if (ns.hacknet.getNodeStats(i).cores < optimalNode[2] 
                    && moneySpent + ns.hacknet.getCoreUpgradeCost(i,1) < maxCost){
                        moneySpent = moneySpent + ns.hacknet.getCoreUpgradeCost(i,1)
                        ns.hacknet.upgradeCore(i,1)
                        spentSomething = true
                    }
                    // Upgrade cache if less than optimal and we can. We only upgrade the cache if it was super cheap,
                    // so don't need to put any additional checks here.
                    if (ns.hacknet.getNodeStats(i).cache < optimalNode[3] && ns.hacknet.upgradeCache(i,1)){
                        spentSomething = true
                    }
                }
            }

            // If some server isn't optimal, we wait 2 minutes and repeat the loop if we're grinding, and wait the
            // payback time if not. If all servers are optimal, break the upgrade loop. It's important to wait a while
            // since we need to make sure excess money is spent on startup.js before on this.
            // Maybe we should wait the payback time here?
            let upgradesNeeded = false
            // If we have no servers, we certainly need upgrades
            if (ns.hacknet.numNodes() == 0){
                upgradesNeeded = true
            }
            for (let i = 0; i <ns.hacknet.numNodes(); i++){
                // Get info on the node
                let node = ns.hacknet.getNodeStats(i)
                if (node.level < optimalNode[0]
                || node.ram < 2 ** (optimalNode[1] - 1)
                || node.cores < optimalNode[2]
                || node.cache < optimalNode[3]){
                    upgradesNeeded = true
                    break
                }
            }
            if (upgradesNeeded == true){
                if (spendAll == true){
                    await ns.sleep (2 * 60 * 1000)
                } else {
                    await ns.sleep(paybackTime * 1000)
                }
                continue
            } else {
                break
            }
            
        }

        // Once everything is upgraded, double payback time for next round, and wait for this round unless the 
        // upgrades were extremely cheap.
        if (moneySpent > extraMoney
            || paybackTime == 2**30 / 1000){
            await ns.sleep(paybackTime * 1000)
        }
        paybackTime = Math.min(paybackTime * 2, 2**30 / 1000)
        await ns.sleep(10)
	}
}