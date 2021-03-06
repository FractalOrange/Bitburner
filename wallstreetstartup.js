// Modified startup for wallstreet

/** @param {NS} ns **/
export async function main(ns) {

	// Check for important augmentations that affect what actions we focus on. Still check for simulacrum bool even though it's always
	// false since we need it to be listed for factionwork to go properly.
	let neuroreceptorBool = ns.getOwnedAugmentations().includes("Neuroreceptor Management Implant")
	let simulacrumBool = false
	let focus = !neuroreceptorBool
		
	// First run the program to get a list of all servers and make sure it completes
	ns.run("servers.js")
	while (ns.isRunning("servers.js", "home") == true) {
		await ns.sleep(1000)
	}

	// Run the program to manage hacking
	ns.run("newdecider.js")

	// If we own a gang, run the gang manager
	if (ns.gang.inGang() == true) {
		ns.run("gangs.js")
		ns.run("gangwarfare.js")
	}

	// Run the contract solving program
	ns.run("contracts.js")

	// Run the stock data script to slowly farm money and wait for the first round of investment.
	ns.run("findstocks.js")
	ns.run("buystocks.js")
	await ns.sleep(60 * 1000)

	var servers0Port = ns.read("serverswith0ports.txt").split(",")
	var servers1Port = ns.read("serverswith1ports.txt").split(",")
	var servers2Port = ns.read("serverswith2ports.txt").split(",")
	var servers3Port = ns.read("serverswith3ports.txt").split(",")
	var servers4Port = ns.read("serverswith4ports.txt").split(",")
	var servers5Port = ns.read("serverswith5ports.txt").split(",")

	for (var i = 0; i < servers0Port.length; ++i) {
		var serv = servers0Port[i];
		await serverAccess(serv)
	}

	// Set up a loop to look at all needed things and to do them. Things will be completed from top to bottom
	// and the script WILL interupt all current actions.
	let finished = false
	while (finished == false){
		// Stop all current actions to let the script work.
		// ns.stopAction()

		// Run scripts we need but cant run until we have room
		if (ns.getServerMaxRam("home") >= 256){
			ns.run("sleeves.js")
			ns.run("factions.js")
			ns.run("purchaseservers.js")
		}

		// Upgrade home ram if we can afford it. If we're at high ram, run costly scripts.
		if (ns.getServerMaxRam("home") < 512
		&& ns.getPlayer().money > 10 * ns.getUpgradeHomeRamCost()){
			ns.upgradeHomeRam()
		} else {
			ns.run("megacorporations.js", 1, focus, simulacrumBool)
		}

		// Buy tor if we can afford it
		if (ns.getPlayer().tor == false) {
			ns.purchaseTor()
		}

		// If we need port opening programs, buy or make them.

		// Set up a condition for having all needed programs. It starts as true
		// but a single flaw gives false.
		let allPrograms = true

		// Check to see if you have the program. If we have it, open ports.
		if (ns.fileExists("bruteSSH.exe", "home") == false) {
			allPrograms = false
			// Buy it if possible. If you can't buy it and you're not busy, make it.
			if (ns.isBusy() == false){
				ns.createProgram("bruteSSH.exe", focus)
			}
		} else {
			for (var i = 0; i < servers1Port.length; ++i) {
				var serv = servers1Port[i];
				await serverAccess(serv)
			}
		}
		if (ns.fileExists("FTPCrack.exe", "home") == false
		&& ns.fileExists("bruteSSH.exe","home") == true) {
			allPrograms = false
			if (ns.purchaseProgram("FTPCrack.exe") == false 
			&& ns.isBusy() == false){
				ns.createProgram("FTPCrack.exe", focus)
			}
		} else if(ns.fileExists("FTPCrack.exe", "home") == true){
			for (var i = 0; i < servers2Port.length; ++i) {
				var serv = servers2Port[i];
				await serverAccess(serv)
			}
		}
		if (ns.fileExists("relaySMTP.exe", "home") == false
		&& ns.fileExists("FTPCrack.exe", "home") == true) {
			allPrograms = false
			if (ns.purchaseProgram("relaySMTP.exe") == false 
			&& ns.isBusy() == false
			&& ns.getPlayer().hacking > 500){
				ns.createProgram("relaySMTP.exe", focus)
			}
		} else if(ns.fileExists("relaySMTP.exe", "home") == true) {
			for (var i = 0; i < servers3Port.length; ++i) {
				var serv = servers3Port[i];
				await serverAccess(serv)
			}
		}	
		if (ns.fileExists("HTTPWorm.exe", "home") == false
		&& ns.fileExists("relaySMTP.exe", "home") == true) {
			allPrograms = false
			if (ns.isBusy() == false
			&& ns.getPlayer().hacking > 1000){
				ns.createProgram("HTTPWorm.exe", focus)
			}
			if (ns.getPlayer().money > 500_000_000){
				ns.purchaseProgram("HTTPWorm.exe")
			}
		} else if(ns.fileExists("HTTPWorm.exe", "home") == true){
			for (var i = 0; i < servers4Port.length; ++i) {
				var serv = servers4Port[i];
				await serverAccess(serv)
			}
		}
		if (ns.fileExists("SQLInject.exe", "home") == false 
		&& ns.fileExists("HTTPWorm.exe", "home") == true) {
			allPrograms = false
			if (ns.isBusy() == false 
			&& ns.getPlayer().hacking > 2000){
				ns.createProgram("SQLInject.exe", focus)
			}
			if (ns.getPlayer().money > 5_000_000_000){
				ns.purchaseProgram("SQLInject.exe")
			}
		} else if(ns.fileExists("SQLInject.exe", "home") == true){
				for (var i = 0; i < servers5Port.length; ++i) {
					var serv = servers5Port[i];
					await serverAccess(serv)
				}
		}	

		//Check for all requirements being met
		if (allPrograms == true 
		&& ns.getServerMaxRam("home") >= 512
		&& ns.getPlayer().has4SDataTixApi){
			finished = true
		}

		// Wait for the current action to be worked on for 30 seconds before moving on.
		await ns.sleep(30 * 1000)
	}

	// Once the startup is finished run the ascension manager. There's no need to do it earlier since it pulls
	// focus and it works better at higher hacking levels anyway.
	ns.run("factionwork.js", 1, !neuroreceptorBool, simulacrumBool)
	ns.spawn("augmentbuyer.js")

	// Set up a function to open all possible ports, nuke the server and run the breakin script on it.
	async function serverAccess(serv) {
		if (ns.fileExists("brutessh.exe", "home")) {
			ns.brutessh(serv)
		}
		if (ns.fileExists("ftpcrack.exe", "home")) {
			ns.ftpcrack(serv)
		}
		if (ns.fileExists("relaysmtp.exe", "home")) {
			ns.relaysmtp(serv)
		}
		if (ns.fileExists("sqlinject.exe", "home")) {
			ns.sqlinject(serv)
		}
		if (ns.fileExists("httpworm.exe", "home")) {
			ns.httpworm(serv)
		}
		ns.nuke(serv)
		await ns.scp("servers.txt", "home", serv)
		await ns.scp("weaken.js", "home", serv)
		await ns.scp("grow.js", "home", serv)
		await ns.scp("hack.js", "home", serv)
	}
}