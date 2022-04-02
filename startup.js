// Currently this will work if we have at least 128Gb on home. (I think). - will buy up to 256 to get everything to work.

// Make a training script that deals with best training options?

// I think we should take out traveltoCity in training bit now that 

/** @param {NS} ns **/
export async function main(ns) {
	// Check for important augmentations that affect what actions we focus on.
	let neuroreceptorBool = ns.getOwnedAugmentations().includes("Neuroreceptor Management Implant")
	let simulacrumBool = ns.getOwnedAugmentations().includes("The Blade's Simulacrum")
	// This tells the script if we want to just do the extras
	let doExtras = false
	// This is true or false depending on if you want to focus on actions. By default it is true if we have
	// the NMI augmentation.
	let focus = !neuroreceptorBool
	// Comment in or out the next line of code as a kill switch to turn focus off
	// focus = false

	// Set the threshold for base level of stats
	let statThreshold = 100
		
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

	// Run the programs to manage hacknet servers and spend the hashes.
	ns.run("hacknetmanager.js", 1, 8)
	ns.run("hashmanager.js")

	// Run the stock data script to slowly farm money
	if (ns.getPlayer().hasTixApiAccess){
		if (ns.getPlayer().has4SDataTixApi){
			ns.run("basicstocks.js")
		}
	}

	if (ns.getPlayer().hasCorporation == true
	&& ns.getServerMaxRam("home") >= 2048) {
		ns.run("corporation.js")
	}

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
		// Set a condition to break if we are not trained.
		let isTrained = true
		// Stop all current actions to let the script work.
		ns.stopAction()

		// Run scripts we need but cant until we have room
		if (ns.getServerMaxRam("home") >= 256){
			ns.run("purchaseservers.js")
			ns.run("sleeves.js")
		}

		// Upgrade home ram if we can afford it. If we're at high ram, run costly scripts.
		if (ns.getServerMaxRam("home") < 512){
			ns.upgradeHomeRam()
		} else {
			ns.run("megacorporations.js",1 ,!neuroreceptorBool , simulacrumBool)
		}
		
		// Buy tor if we can afford it
		if (ns.getPlayer().tor == false) {
			ns.purchaseTor()
		}
		


		// If we need port opening programs, buy or make them. Need to adjust business to account 
		// for bladeburner actions

		// Set up a condition for having all needed programs, and one for all extras. It starts as true
		// but a single flaw gives false.
		let allPrograms = true
		let allExtras = true

		// Check to see if you have the program. If we have it, open ports.
		if (ns.fileExists("bruteSSH.exe", "home") == false) {
			allPrograms = false
			// Buy it if possible. If you can't buy it and you're not busy, make it.
			if (ns.purchaseProgram("bruteSSH.exe") == false && ns.isBusy() == false){
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
			if (ns.purchaseProgram("FTPCrack.exe") == false && ns.isBusy() == false){
				ns.createProgram("FTPCrack.exe", focus)
			}
		} else if(ns.fileExists("FTPCrack.exe", "home") == true){
			for (var i = 0; i < servers2Port.length; ++i) {
				var serv = servers2Port[i];
				await serverAccess(serv)
			}
		}

		// Farm stats up to the threshold * level multipliers so stats scale with augmentations by doing crime.
		// Also make sure to meet karma and murder requirements.
		// This happens first since it earns money for other stuff.
		// It's still faster than the first time since there are also exp multipliers that we ignore.
		// The conditionals are formatted so that we guarantee karma and murder requirements, and continue farming
		// stats slowly unless we hit a money threshold
		if ((ns.getPlayer().strength < statThreshold 
		|| ns.getPlayer().defense < statThreshold 
		|| ns.getPlayer().dexterity < statThreshold 
		|| ns.getPlayer().agility < statThreshold)
		&& ns.getPlayer().money < 100 * 1000
		|| ns.getPlayer().numPeopleKilled < 30
		|| ns.heart.break() > -54000) {
			isTrained = false
			for (let i = 0; i < 10; i++){
				ns.tail("startup.js","home")
				await ns.sleep(ns.commitCrime("homicide"))
				await ns.sleep(50)
			}
		}

		// If we've met everything but the stat requirements and have the money, go to the gym instead.
		if (ns.getPlayer().money > 50 * 1000 
		&&(ns.getPlayer().strength < statThreshold 
		|| ns.getPlayer().defense < statThreshold 
		|| ns.getPlayer().dexterity < statThreshold 
		|| ns.getPlayer().agility < statThreshold)){
			isTrained = false
			if (ns.getPlayer().money > 200 * 1000){
				ns.travelToCity("Sector-12")
			}
			if (ns.getPlayer().strength < statThreshold){
				ns.gymWorkout("Powerhouse Gym", "strength", focus)
				await ns.sleep(10 * 1000)
			}
			if (ns.getPlayer().defense < statThreshold ){
				ns.gymWorkout("Powerhouse Gym", "defense", focus)
				await ns.sleep(10 * 1000)
			}
			if (ns.getPlayer().dexterity < statThreshold ){
				ns.gymWorkout("Powerhouse Gym", "dexterity", focus)
				await ns.sleep(10 * 1000)
			}
			if (ns.getPlayer().agility < statThreshold ){
				ns.gymWorkout("Powerhouse Gym", "agility", focus)
				await ns.sleep(10 * 1000)
			}
		}
		
		if (isTrained == true){
			// Run bladeburner script when we can join the division and have enough server space, and try to join the 
			// faction too. It doesn't matter if we don't join the faction at the earliest possible opportunity.
			if (ns.getServerMaxRam("home") >= 512){
				ns.bladeburner.joinBladeburnerDivision()
				ns.bladeburner.joinBladeburnerFaction()
				ns.run('bladeburner.js', 1, simulacrumBool)
			}
			// If isTrained is true we no longer change cities, and likely now meet money requirements for the appropriate factions.
            if (ns.getServerMaxRam("home") >= 256){
                ns.run("factions.js")
            }
		}

		// Get the other hacking programs we want
		if (ns.fileExists("relaySMTP.exe", "home") == false
		&& ns.fileExists("FTPCrack.exe", "home") == true) {
			allPrograms = false
			if (ns.purchaseProgram("relaySMTP.exe") == false && ns.isBusy() == false
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
			if (ns.purchaseProgram("HTTPWorm.exe") == false && ns.isBusy() == false
			&& ns.getPlayer().hacking > 1000){
				ns.createProgram("HTTPWorm.exe", focus)
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
			if (ns.purchaseProgram("SQLInject.exe") == false && ns.isBusy() == false 
			&& ns.getPlayer().hacking > 2000){
				ns.createProgram("SQLInject.exe", focus)
			}
		} else if(ns.fileExists("SQLInject.exe", "home") == true){
				for (var i = 0; i < servers5Port.length; ++i) {
					var serv = servers5Port[i];
					await serverAccess(serv)
				}
		}	

		// Look for the non-essential programs if there's nothing else to do and we meet hacking requirements
		// for it to be worth doing
		if (ns.fileExists("autolink.exe", "home") == false && ns.isBusy() == false) {
			allExtras = false
			if (ns.isBusy() == false && ns.getPlayer().hacking > 200){
				ns.createProgram("autolink.exe", focus)
			}
		}	
		if (ns.fileExists("deepscanv1.exe", "home") == false) {
			allExtras = false
			if (ns.isBusy() == false && ns.getPlayer().hacking > 200){
				ns.createProgram("deepscanv1.exe", focus)
			}
		}
		if (ns.fileExists("serverprofiler.exe", "home") == false) {
			allExtras = false
			if (ns.isBusy() == false && ns.getPlayer().hacking > 1000){
				ns.createProgram("serverprofiler.exe", focus)
			}
		}
		if (ns.fileExists("deepscanv2.exe", "home") == false) {
			allExtras = false
			if (ns.isBusy() == false && ns.getPlayer().hacking > 1000){
				ns.createProgram("deepscanv2.exe", focus)
			}
		}

		//Check for all requirements being met
		if (allPrograms == true 
		&& (doExtras == false || allExtras == true)
		&& ns.getServerMaxRam("home") >= 512
		&& isTrained == true){
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
		await ns.sleep("hack.js", "home", serv)
	}
}