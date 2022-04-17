/** @param {NS} ns **/
export async function main(ns) {

    // A variable to determine if we should break the bitnode or not
    let breakBitnode = true
	let servers = ["home"]
	// This is more efficient code for finding servers, not required for backdoor but needs to be copied.

	for (let i = 0; i < servers.length; i++) {
		let newServersArray = ns.scan(servers[i])
		for (let j = 0; j < newServersArray.length; j++) {
			if (!ns.getPurchasedServers().includes(newServersArray[j]) && "home" != newServersArray[j]
				& !servers.includes(newServersArray[j])) {
				servers.push(newServersArray[j])
			}
		}
	}

	// Start at a point, go to a nearby point not visited. Keep track of the path and backdoor along the way. 
	// If there are no new places to go, ban the current spot and backtrack on the path (including deleting that
	// step)
	let path = ["home"]
	let banned = []

	while (path.length > 0) {
		let position = path[path.length - 1]
		let nextSteps = ns.scan(position)
		for (let i = 0; i < nextSteps.length; i++) {
			let possibleStep = nextSteps[i]
			// Skip possibilities that are already visited or banned
			if (banned.includes(possibleStep) == true || path.includes(possibleStep) == true) {
				// If all possibilities are already visited or banned, we need to ban the
				// current position and backtrack. If we're stuck at home, we're done.
				if (i == nextSteps.length-1) {
					if (position == "home"){
						banned.push(position)
						path.pop()
						break
					} else {
						banned.push(position)
						path.pop()
						ns.connect(path[path.length-1])
						break
					}
				}
				continue
			} else {
				// If we find somewhere new, connect to it, backdoor it if possible, and add it to the path.
				ns.connect(possibleStep)
				if(ns.getServerRequiredHackingLevel(possibleStep) <= ns.getHackingLevel() 
				&& ns.hasRootAccess(possibleStep) == true
				&& ns.getServer(possibleStep).backdoorInstalled == false){
					if (possibleStep == "w0r1d_d43m0n" 
                    && breakBitnode == false){
						ns.tprint("Ready to destroy the bitnode!")
                        path.push(possibleStep)
                        break
					}
					//ns.tprint("Installing backdoor on " + possibleStep)
					await ns.installBackdoor()
				} else {
					//ns.tprint("Can't install backdoor on " + possibleStep)
				}
				path.push(possibleStep)
				break
			}
		}
	}
}