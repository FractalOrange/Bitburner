//adjust rep farming for gang faction

/** @param {NS} ns **/
export async function main(ns) {

    let stats = ["hack", "str", "def", "dex", "agi", "cha"]
    let gangFactions = ["Slum Snakes", "Speakers for the Dead", "The Black Hand", "The Dark Army", "The Syndicate", "NiteSec", "Tetrads"]
    let myGang = ns.gang.getGangInformation().faction
    let otherGangs = Array.from(gangFactions)
    otherGangs.splice(gangFactions.indexOf(myGang), 1)

    while(true == true){

        // Make sure gangwarfare is running
        ns.run("gangwarfare.js")

        // First recuit someone if possible
        let memberNumber = 0
        while (ns.gang.canRecruitMember() == true){
            ns.gang.recruitMember("Steve-" + memberNumber)
            memberNumber ++
        }
    
        // Decide who to ascend
        for (let member of ns.gang.getMemberNames()){
            // Make sure we're not already too wanted
            if (ns.gang.getGangInformation().wantedPenalty > 0.95
            && ns.gang.getMemberInformation(member).earnedRespect <= ns.gang.getGangInformation().respect / 2){
                // If the product of all ascension multipliers is at least 2, ascend.
                let ascensionMult = ascensionMultiplier(member)
                if (ascensionMult >= 2) {
                    ns.gang.ascendMember(member)
                }
            }
        }

        // Buy equipment
        for (let equipment of ns.gang.getEquipmentNames()) {
            // Buy equipment that is 1/100th of a % of our money, or augments are less than 1/10% of our money
            if (ns.gang.getEquipmentCost(equipment) < 0.0001 * ns.getPlayer().money
            || ns.gang.getEquipmentCost(equipment) < 0.001 * ns.getPlayer().money && ns.gang.getEquipmentType(equipment) == "Augmentation"){
                for (let member of ns.gang.getMemberNames()) {
                    ns.gang.purchaseEquipment(member, equipment)
                }
            }
        }
            
        // Any remaining members do the task that earns the most respect per second while also earning money
        // This makes sure when we max out we end up on human trafficking
        for(let member of ns.gang.getMemberNames()){
            ns.gang.setMemberTask(member, bestTask(member))
            // Need to wait to let the gang interface update the numbers so the next members best choice can be chosen
            // properly. This is particularly true for vigilante justice
            await ns.sleep(2000)
        }

        // If rep is low, make sure we train our weakest member
        if (ns.gang.getGangInformation().respect < 100_000){
            let members = ns.gang.getMemberNames()
            if (ns.gang.getGangInformation().isHacking == true) {
                members.sort((a,b) => (ns.gang.getMemberInformation(a).hack-ns.gang.getMemberInformation(b).hack))
                ns.gang.setMemberTask(members[0],"Train Hacking")
            } else {
                members.sort((a,b) => (ns.gang.getMemberInformation(a).str-ns.gang.getMemberInformation(b).str))
                ns.gang.setMemberTask(members[0],"Train Combat")
            }
        }

        // Decide whether or not to go to war
        // Territory clash chance is applied to each gang individually
        // Terrotory exchange is proportioanl to log_50(power ratio), so it's better
        // to be a bit better than a few gangs, than way better than one.
        // If product of power rations to the power of probability of winning is greater than 1, 
        // go to war.
        let warCondition = 1
        for (let opponent of otherGangs) {
            if (ns.gang.getOtherGangInformation()[opponent]["territory"] > 0) {
                warCondition *= (ns.gang.getGangInformation()["power"])/(ns.gang.getOtherGangInformation()[opponent]["power"])
            }
        }
        if (warCondition > 1){
            ns.gang.setTerritoryWarfare(true)
        } else {
            ns.gang.setTerritoryWarfare(false)
        }
        await ns.sleep(10000)
    }


    // This function takes the product of all ascension multipliers
    function ascensionMultiplier(member) {
        if (ns.gang.getAscensionResult(member) == undefined){
            return 0
        }
        let mult = ns.gang.getAscensionResult(member).hack
        * ns.gang.getAscensionResult(member).str
        * ns.gang.getAscensionResult(member).def
        * ns.gang.getAscensionResult(member).dex
        * ns.gang.getAscensionResult(member).agi
        * ns.gang.getAscensionResult(member).cha
        return mult
    }

    // This function finds the best task to work for a given member
    function bestTask(member){
        // If wanted penalty is too high (definition of high varies with respect) and the wanted level would be increasing
        // if we weren't doing the current action, do vigilante justice instead.
        // This stops us swapping off of justice early and stops us from continuing doing work that boosts wanted too much.
        if ((ns.gang.getGangInformation().wantedPenalty < 0.95 && ns.gang.getGangInformation().respect > 20
        || ns.gang.getGangInformation().wantedPenalty < 0.45)
        && Math.max(ns.gang.getGangInformation().wantedLevelGainRate - ns.gang.getMemberInformation(member).wantedLevelGain, ns.gang.getGangInformation().wantedLevelGainRate) > 0) {
            return "Vigilante Justice"
        }
        // Rush to 1M respect and then farm money
        let bestTask = ""
        let bestRespect = 0
        for (let task of ns.gang.getTaskNames()) {
            let taskStats = ns.gang.getTaskStats(task)
            let statWeights = 0
            for (let stat of stats) {
                statWeights += taskStats[stat + "Weight"] * ns.gang.getMemberInformation(member)[stat] / 100
            }
            // Maximise respect for tasks that raise respect faster than wanted. If total respect is more than 1_000_000,
            // then we only look at tasks that raise money
            if (statWeights > taskStats["difficulty"] * 4 
                && (taskStats["baseMoney"] > 0 || ns.gang.getGangInformation().respect < 1_000_000)) {
                ns.gang.setMemberTask(member, task)
                if (ns.gang.getMemberInformation(member)["respectGain"] > bestRespect
                && ns.gang.getMemberInformation(member)["respectGain"] > ns.gang.getMemberInformation(member)["wantedLevelGain"]){
                    bestTask = task
                }
            }
        }
        if (bestTask == "") {
            if (ns.gang.getGangInformation().isHacking){
                bestTask = "Train Hacking"
            } else {
                bestTask = "Train Combat"
            }
        } 
        return bestTask
    }

    
    }