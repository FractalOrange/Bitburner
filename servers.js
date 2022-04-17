/** @param {NS} ns **/
export async function main(ns) {

	var servers = ["home"]

	// This is more efficient code for finding servers, not required for backdoor but needs to be copied.

	for (let i = 0; i < servers.length; i++) {
		let newServersArray = ns.scan(servers[i])
		for (let j = 0; j < newServersArray.length; j++) {
			if (ns.getServer(newServersArray[j]).purchasedByPlayer == false && "home" != newServersArray[j]
				& !servers.includes(newServersArray[j])) {
				servers.push(newServersArray[j])
				if (ns.ls(newServersArray[j], ".lit").length > 0) {
					await ns.scp(ns.ls(newServersArray[j], ".lit"), newServersArray[j], "n00dles")
				}
			}
		}
	}


	servers = servers.sort(ns.getServerRequiredHackingLevel)
	servers.shift()
	await ns.write("servers.txt",servers,"w")
	var serversbyport = [[],[],[],[],[],[]]
	for(let i = 0; i < servers.length ; i++){
		var currentserver = servers[i]
		serversbyport[ns.getServerNumPortsRequired(currentserver)].push(currentserver)
	}
	for(let i = 0; i < 6; i++){
	await ns.write("serverswith" + i +"ports.txt",serversbyport[i],"w")
	}


}