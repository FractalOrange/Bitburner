// Need to figure out which continues should be breaks and which breaks should be continues, etc.

// Need to figure out when things will be too big. Maybe keep track of total amount of threads available for 
// use and limit required threads to some fraction of this. Plus could have a variable that could track
// if a "big" thing is in use.

// Need to adjust for the home server - more efficient from cores plus leave room for other scripts

// Need to record profitability - per thread and per time

// Figure out how to deal with using hacknet servers

// Stop actions that would take too high a % of our available servers

// When the script has only few servers to run on, sometimes it checks the number of threads to weaken
// inbetween different hacks or grows that are spread out over different servers finishing, so only part of the
// required weakens actually get run. Could fix it by updating weaken check to actually calculate the required
// number of threads at each step, or just waiting for all grow/hacks to finish after seing that the weakenthreads
// is positive.

/** @param {NS} ns **/
export async function main(ns) {
	// Import list of all servers sorted by hacking level. We call this twice to make two lists, one of servers
	// we can hack, the other of servers we can use to hack.
	var futureHackedServers = ns.read("servers.txt").split(",")
	var futureTargetServers = ns.read("servers.txt").split(",")

	let weakenMinutes = 20 

	let hackedServers = []
	let targetServers = []

	let weakeningServers = []
	let growingServers = []
	let hackingServers = []

	// This is the % to steal
	let hackGoal = 0.3

	let maxRamPercent = 1

	// Option to fill empty server space with the share functionality to farm rep.
	let sharing = true
	// Option to fill empty server space with the training function to max hacking skill.
	let training = false

	// Figure out amount of Ram to leave free on home in Gb
	let homeThresh = 300
	// Should take into account the scripts we want to save that are already running i.e. dont save room 
	// for scripts we're running

	// Produce an array that relates companies to stock symbols
	let conversion = ns.read("companystockconversion.txt").split(";\r\n")
	let companyStocks = []
	for (let part of conversion){
		companyStocks.push(part.split(","))
	}

	while (true == true) {
		// Get a list of which stocks are long or short to make sure we weaken and grow the right servers.
		// This might take too much time to be efficient, if so can just get positions.
		let longStocks = []
		let shortStocks = []
		if(ns.getPlayer().hasTixApiAccess){
			// Wait until we can get the relevant info from the other scripts
			while (ns.getPortHandle(9).empty() == true) {
				await ns.sleep(10)
			}
			while (ns.getPortHandle(9).empty() == false) {
				longStocks.push(ns.readPort(9))
			}
			while (ns.getPortHandle(11).empty() == false) {
				shortStocks.push(ns.readPort(11))
			}
		}

        // If we're working for a faction, share resources, otherwise train hacking.
        if (ns.getPlayer().workRepGainRate > 0){
            sharing = true
            training = false
        } else {
            sharing = false
            training = true
        }
		// ns.tprint(weakeningServers)
		// ns.tprint(growingServers)
		// ns.tprint(hackingServers)
		await ns.sleep(100)
		let ownedServers = ns.getPurchasedServers()
		// Remove all hacknet servers
		for (let server of ownedServers){
			if (ns.getServer(server).hashCapacity > 0){
				ownedServers.splice(ownedServers.indexOf(server),1)
			}
		}

		let hackLevel = ns.getHackingLevel()

		// Update possible targets by adding in those that we can now successfully hack, and then
		// ensure that they are sorted by highest growth level first.
		if (futureTargetServers.length > 0) {
			while (futureTargetServers.length > 0 && hackLevel >= ns.getServerRequiredHackingLevel(futureTargetServers[0])
				&& ns.hasRootAccess(futureTargetServers[0]) == true) {
				if (ns.getServerMaxMoney(futureTargetServers[0]) == 0) {
					futureTargetServers.shift()
					continue
				}
				targetServers.push(futureTargetServers.shift())
				targetServers.sort((a, b) => (ns.getServerMaxMoney(a) - ns.getServerGrowth(b))).reverse()
			}
		}
		// Update servers we can use by updating the servers that have been hacked and adding in any
		// servers that have been purchased.

		for (let i = 0; i < futureHackedServers.length; i++) {
			if (ns.hasRootAccess(futureHackedServers[i]) == true) {
				if (ns.getServerMaxRam(futureHackedServers[i]) == 0) {
					futureHackedServers.splice(i, 1)
				} else {
					hackedServers.push(futureHackedServers.splice(i, 1))
				}
				i--
			}
		}

		// This is an array of servers we can use to hack other servers.
		let usableServers = ownedServers.concat(hackedServers).concat(["home"])
		// We sort from highest to lowest maxRam to make spillover as small as possible.
		usableServers.sort((a,b) => ns.getServerMaxRam(b)-ns.getServerMaxRam(a))
		// Figure out the total Ram available on our usableServers, and set a threshold for the highest amount of ram we allow
		// a single operation of weaken/grow/hack to use. We then convert this into a maximum number of threads for each script.
		let availableRam = Array.from(usableServers, x =>ns.getServerMaxRam(x)).reduce( (a,b) => a + b)
		let maxWeaken = maxRamPercent * availableRam / ns.getScriptRam("weaken.js")
		let maxGrow = maxRamPercent * availableRam / ns.getScriptRam("grow.js")
		let maxHack = maxRamPercent * availableRam / ns.getScriptRam("hack.js")
		for (let i = 0; i < usableServers.length; i++) {
			await ns.scp("grow.js", "home", usableServers[i])
			await ns.scp("weaken.js", "home", usableServers[i])
			await ns.scp("hack.js", "home", usableServers[i])
			await ns.scp("sharing.js", "home", usableServers[i])
			await ns.scp("training.js", "home", usableServers[i])
		}

		// Put sharing on all free servers if wanted
		if (sharing == true) {
			for (let j = 0; j < usableServers.length; j++) {
				let server = usableServers[j]
				// ns.scriptKill("sharing.js", server)
				let availableThreads = Math.floor((ns.getServerMaxRam(server) - ns.getServerUsedRam(server))
					/ ns.getScriptRam("sharing.js", server))

				// Leave room on home
				if (server == "home") {
					availableThreads = Math.max( 0,
					Math.floor(( ns.getServerMaxRam(server) - homeThresh - ns.getServerUsedRam(server))
					/ ns.getScriptRam("sharing.js", server)))
				}
				if (availableThreads > 0) {
					ns.exec("sharing.js", server, availableThreads)
				}
			}
		} else if (training == true) {
			 for (let j = 0; j < usableServers.length; j++) {
				let server = usableServers[j]
				// ns.scriptKill("sharing.js", server)
				let availableThreads = Math.floor((ns.getServerMaxRam(server) - ns.getServerUsedRam(server))
					/ ns.getScriptRam("training.js", server))

				// Leave room on home
				if (server == "home") {
					availableThreads = Math.max( 0,
					Math.floor(( ns.getServerMaxRam(server) - homeThresh - ns.getServerUsedRam(server))
					/ ns.getScriptRam("training.js", server)))
				}
				if (availableThreads > 0) {
					ns.exec("training.js", server, availableThreads)
				}
			}
		}

		// Run through total list of servers
		for (let i = 0; i < targetServers.length; i++) {
			// Target is current server
			var target = targetServers[i]
			// Find how much money server can have, if 0 then remove it. Also skip fulcrumassets since it's worthless.
			var moneyMax = ns.getServerMaxMoney(target);
			var moneyLevel = ns.getServerMoneyAvailable(target)
			if (moneyMax == 0) {
				targetServers.splice(i, 1)
				i--
				continue
			}

			if (moneyMax == moneyLevel) {
				if (growingServers.includes(target) == true) {
					growingServers.splice(growingServers.indexOf(target), 1)
				}
			}

			let companyStock = ""
			let growStock = false
			let hackStock = false
			for (let company of companyStocks) {
				if (ns.getServer(target) == company[0]){
					companyStock = company[1]
					break
				}
			}
			for (let stock of longStocks) {
				if (stock == companyStock) {
					growStock = true
				}
			}
			for (let stock of shortStocks) {
				if (stock == companyStock) {
					hackStock = true
				}
			}

			// Find the current security level, how much this server would weaken in one iteration,
			// and how many iterations it would take us to hit the minimum level.
			var securityMin = ns.getServerMinSecurityLevel(target)
			var securityLevel = ns.getServerSecurityLevel(target)
			var weakenAmount = 0.05
			var weakenThreads = Math.ceil((securityLevel - securityMin) / weakenAmount)

			// if weakenThreads is too high, skip.
			if (weakenThreads > maxWeaken){
				continue
			}

			// If weakenThreads is already 0, that means we've just weakened the server and should now
			// grow it or hack it
			if (weakenThreads == 0) {

				//If this is 0 the server is empty and we can't do anything.
				if (moneyLevel == 0) {
					targetServers.splice(i, 1)
					i--
					continue
				}

				// If it's min security and listed as weakening, remove it from the list.
				if (weakeningServers.includes(target) == true) {
					weakeningServers.splice(weakeningServers.indexOf(target), 1)
				}

				// Find what % increase takes the current level to the max level, and how many threads that amount of growth
				// would take. 
				var moneyRatio = moneyMax / moneyLevel
				var growThreads = Math.ceil(1.1 * ns.growthAnalyze(target, moneyRatio))
				// If growThreads is too big, skip it
				if (growThreads > maxGrow){
					continue
				}

				// Check if we're at max money, and hack up to half of max money if so.
				if (moneyMax == moneyLevel) {
					// Take the server off the lists of growing and weakening servers.
					if (growingServers.includes(target) == true) {
						growingServers.splice(growingServers.indexOf(target), 1)
					}
					if (hackingServers.includes(target) == true) {
						continue
					} else {
						hackingServers.push(target)
					}

					let hackAmount = ns.hackAnalyze(target)
					let hackThreads = Math.ceil(hackGoal / hackAmount)
					// if hackThreads is too high, skip
					if (hackThreads > maxHack){
						continue
					}

					let triedEverything = false
					while (hackThreads > 0 && triedEverything == false) {
						for (let j = 0; j < usableServers.length; j++) {
							let server = usableServers[j]
							ns.scriptKill("sharing.js", server)
							ns.scriptKill("training.js", server)
							let availableThreads = Math.floor((ns.getServerMaxRam(server) - ns.getServerUsedRam(server))
								/ ns.getScriptRam("hack.js", server))

							// Leave room on home
							if (server == "home") {
								availableThreads = Math.max( 0, 
								Math.floor(( ns.getServerMaxRam(server) - homeThresh - ns.getServerUsedRam(server))
								/ ns.getScriptRam("hack.js", server)))
							}
							if (availableThreads == 0) {
								if (j == usableServers.length - 1) {
									triedEverything = true
									break
								}
								continue
							}
							if (availableThreads >= hackThreads) {

								if (ns.exec("hack.js", server, hackThreads, target, hackStock) == 0) {
									if (j == usableServers.length - 1) {
										triedEverything = true
									}
									continue
								}
								hackThreads = 0
								break
							} else {
								if (j == usableServers.length - 1) {
									triedEverything = true
								}
								if (ns.exec("hack.js", server, availableThreads, target, hackStock) == 0) {
									continue
								}
								hackThreads = hackThreads - availableThreads
								// If all servers are full, reset the loop. We don't want to get stuck on really emtpy servers
								// When we are losing out on profits.
							}
						}
					}
					if (triedEverything == true) {
						break
					}

					// Should I break after each hack?
					continue
				}

				// If the server is already being grown, skip it. If not, add it to the list and grow it.
				if (growThreads > 0) {
					if (growingServers.includes(target) == true) {
						continue
					} else {
						growingServers.push(target)
					}
				}
				let triedEverything = false
				while (growThreads > 0 && triedEverything == false) {
					for (let j = 0; j < usableServers.length; j++) {
						let server = usableServers[j]
						ns.scriptKill("sharing.js", server)
						ns.scriptKill("training.js", server)
						let availableThreads = Math.floor((ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) 
						/ ns.getScriptRam("grow.js", server))

						// Leave room on home
						if (server == "home") {
							availableThreads = Math.max(0, 
							Math.floor(( ns.getServerMaxRam(server) - homeThresh - ns.getServerUsedRam(server))
							/ ns.getScriptRam("grow.js", server)))
						}
						
						if (growThreads == 0) {
							break
						}
						if (availableThreads == 0) {
							// If all servers are full, reset the loop
							if (j == usableServers.length - 1) {
								triedEverything = true
								break
							}
							continue
						}
						if (availableThreads >= growThreads) {
							if (ns.exec("grow.js", server, growThreads, target, growStock) == 0) {
								if (j == usableServers.length - 1) {
									triedEverything = true
								}
								continue
							}
							growThreads = 0
							break
						} else {

							if (j == usableServers.length - 1) {
								triedEverything = true
							}

							if (ns.exec("grow.js", server, availableThreads, target, growStock) == 0) {
								continue
							}
							growThreads = growThreads - availableThreads
							// If all servers are full, reset the loop. We don't want to get stuck on really emtpy servers
							// When we are losing out on profits.
						}
					}
				}
				// If the servers are all full, reset to earlier servers. This will keep looping until
				// serverspace frees up and then will run from the earliest servers.
				if (triedEverything == true) {

					break
				}
				// Once the server is set to grow, look at the next server. Should I break here?
				continue
			}

			// If the server needs weakening, look through the available servers, find how many threads
			// can be run on them based on their free ram and keep running weaken on servers until enough threads
			// have been used. 

			if (ns.getWeakenTime(target) > 1000 * 60 * weakenMinutes) {
				continue
			}

			if (weakenThreads > 0) {
				// If the server is already being targeted, skip it. If not, put it on the list of weakening 
				// servers.
				if (weakeningServers.includes(target) == true) {
					continue
				} else {
					weakeningServers.push(target)
				}
				if (growingServers.includes(target) == true) {
					growingServers.splice(growingServers.indexOf(target), 1)
				}
				if (hackingServers.includes(target) == true) {
					hackingServers.splice(hackingServers.indexOf(target), 1)
				}
			}
			// Super hacky way to avoid weakenthreads problem
			await ns.sleep(500)
			var securityMin = ns.getServerMinSecurityLevel(target)
			var securityLevel = ns.getServerSecurityLevel(target)
			var weakenAmount = 0.05
			var weakenThreads = Math.ceil((securityLevel - securityMin) / weakenAmount)

			let triedEverything = false
			while (weakenThreads > 0 && triedEverything == false) {
				for (let j = 0; j < usableServers.length; j++) {
					let server = usableServers[j]
					ns.scriptKill("sharing.js", server)
					ns.scriptKill("training.js", server)
					let availableThreads = Math.floor((ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) /
						ns.getScriptRam("weaken.js"))

					// Leave room on home
					if (server == "home") {
						availableThreads = Math.max(0, 
						Math.floor(( ns.getServerMaxRam(server) - homeThresh - ns.getServerUsedRam(server))
						/ ns.getScriptRam("weaken.js", server)))
					}

					if (weakenThreads == 0) {
						break
					}
					if (availableThreads == 0) {
						// If all servers are full, reset the loop
						if (j == usableServers.length - 1) {
							triedEverything = true
							break
						}
						continue
					}
					if (availableThreads > weakenThreads) {
						if (ns.exec("weaken.js", server, weakenThreads, target) == 0) {
							if (j == usableServers.length - 1) {
								triedEverything = true
							}
							continue
						}
						weakenThreads = 0
						break
					} else if (availableThreads > 0) {

						if (j == usableServers.length - 1) {
							triedEverything = true
						}

						if (ns.exec("weaken.js", server, availableThreads, target) == 0) {
							continue
						}
						weakenThreads = weakenThreads - availableThreads
						// If all servers are full, reset the loop. We don't want to get stuck on really emtpy servers
						// When we are losing out on profits.

					}
				}
			}
			// If all the servers are full, break to easier servers. They will keep looping until the easier
			// servers are available for use.
			if (triedEverything == true) {
				weakeningServers.splice(weakeningServers.indexOf(target), 1)
				break
			}
			// Once the server is set to weaken, break to check if anything earlier is ready to grow or weaken.
			// Maybe this should just continue?
			continue
		}
	}
}