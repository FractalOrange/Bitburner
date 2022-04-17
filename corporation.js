/** @param {NS} ns **/
export async function main(ns) {

    let cities = ["Sector-12", "Aevum", "Volhaven", "Chongqing", "New Tokyo", "Ishima"]
    let jobs = ["Operations", "Engineer", "Business", "Management", "Research & Development", "Training"]
    let materials = ["Water", "Energy", "Food", "Metal", "Plants", "Hardware", "Chemicals", "Robots", "AI Cores", "Real Estate", "Drugs"]

    // Should order these by quality
    let possibleDivisions = ["Food", "Software", "Pharmaceutical", "Computer", "Healthcare","RealEstate", "Robotics", "Tobacco", "Agriculture", "Chemical", "Energy", "Fishing", "Mining", "Utilities"]
    let productDivisions = ["Food", "Software", "Pharmaceutical", "Computer", "Healthcare","RealEstate", "Robotics", "Tobacco"]
    
    // List of global upgrades
    let upgrades = ["Smart Factories", "Wilson Analytics", "Neural Accelerators", "Project Insight", "Smart Storage", "Nuoptimal Nootropic Injector Implants", "FocusWires", "DreamSense", "Speech Processor Implants", "ABC SalesBots"]

    // Set up the research we want to buy and in what order. badResearch is for stuff I don't think makes much difference, crapResearch is for stuff
    // that I think makes no difference with the automation.
    let researches = ["Hi-Tech R&D Laboratory","uPgrade: Fulcrum", "uPgrade: Capacity.I", "uPgrade: Capacity.II", "Drones", "Drones - Assembly", "Self-Correcting Assemblers", "Overclock","Drones - Transport",  "Market-TA.I", "Market-TA.II"]
    let badResearch = ["Automatic Drug Administration", "CPH4 Injections", "Bulk Purchasing"]
    let crapResearch = ["uPgrade: Dashboard", "HRBuddy-Recruitment", "HRBuddy-Training","Sti.mu", "JoyWire", "Go-Juice", "AutoBrew", "AutoPartyManager"]
    let productResearch = ["uPgrade: Fulcrum", "uPgrade: Capacity.I", "uPgrade: Capacity.II", "uPgrade: Dashboard"]
    researches = researches.concat(badResearch.concat(crapResearch))

    
    let officePercent = 0.0001
    let productInvestment = 0.001
    let upgradePercent = 0.0001
    if (ns.getPlayer().hasCorporation == false){
        // While we have less than twice as much money as it costs to create a corp, just wait
        while (ns.getPlayer().money < 2 * 150_000_000_000) {
            await ns.sleep(5_000)
        }
    }
    ns.corporation.createCorporation("Microdynamic", true)

    let divisionsOwned = []
    for (let division of ns.corporation.getCorporation().divisions){
        divisionsOwned.push(division.name)
        possibleDivisions.splice(possibleDivisions.indexOf(division.name), 1)
    }
    
    // With initial company, buy and fully max out tobacco.
    // Buy initial upgrades

    if (ns.corporation.hasUnlockUpgrade("Smart Supply") == false) {
        ns.corporation.unlockUpgrade("Smart Supply")
    }
    if (ns.corporation.hasUnlockUpgrade("Warehouse API") == false) {
        ns.corporation.unlockUpgrade("Warehouse API")
    }


    let division = "Tobacco"
    // Buy tobacco first
    if (divisionsOwned.includes("Tobacco") == false){
        ns.corporation.expandIndustry("Tobacco", "Tobacco")
        divisionsOwned.push("Tobacco")
        for (let i = 1; i <= 3; i++) {
            ns.corporation.makeProduct(division, "Sector-12", division + i, 1_000_000, 1_000_000)
        }

        // Set up division
        for (let city of cities) {
            ns.corporation.expandCity(division, city)
            ns.corporation.purchaseWarehouse(division, city)
            ns.corporation.setSmartSupply(division, city, true)
        }

        // First time round, fill warehouse and then sell everything for a big investment bump.
        ns.toast("Go and hire everyone in Tobacco!", "info", 10 * 1000)
    }

    if (ns.corporation.getCorporation().public == false){
        while (ns.corporation.getWarehouse(division, "Sector-12").sizeUsed / ns.corporation.getWarehouse(division, "Sector-12").size < 0.9) {
            await ns.sleep (60 * 1000)
        }
        while (ns.corporation.getCorporation().state != "START"){
            await ns.sleep(10)
        }
        for (let product of ns.corporation.getDivision(division).products) {
            if (ns.corporation.getProduct(division, product).developmentProgress >= 100) {
                ns.corporation.sellProduct(division, "Sector-12", product, "MAX", "0.8 * MP", true)
            }
        }
        // Wait for 2 cycles to go by before accepting investment.
        for (let i = 0; i < 2; i++){
            while (ns.corporation.getCorporation().state != "PURCHASE"){
                await ns.sleep(10)
            }
            while (ns.corporation.getCorporation().state != "START"){
                await ns.sleep(10)
            }
        }

        while (ns.corporation.acceptInvestmentOffer()){
            await ns.sleep(10)
        }
        ns.corporation.goPublic(0)
    }


    if (ns.corporation.hasUnlockUpgrade("Office API") == false) {
        ns.corporation.unlockUpgrade("Office API")
    }

    // Do we even need to do this? Can't we just let it go by itself?
    // Buy healthcare second
    // if (divisionsOwned.includes("Healthcare") == false){
    //     ns.corporation.expandIndustry("Healthcare", "Healthcare")
    //     divisionsOwned.push("Healthcare")
    //     division = "Healthcare"
    //     for (let i = 1; i <= 3; i++) {
    //         ns.corporation.makeProduct(division, "Sector-12", division + i, 1_000_000, 1_000_000)
    //     }


    //     // Set up division
    //     for (let city of cities) {
    //         ns.corporation.expandCity(division, city)
    //         ns.corporation.purchaseWarehouse(division, city)
    //         ns.corporation.setSmartSupply(division, city, true)
    //         ns.corporation.upgradeOfficeSize(division, city, 3)
    //         while (ns.corporation.getOffice(division, city).employees.length < ns.corporation.getOffice(division, city).employees.size - 1){
    //             ns.corporation.hireEmployee(division, city)
    //         }
    //         for (let job of jobs) {
    //             ns.corporation.setAutoJobAssignment(division, city, job, 1)
    //         }
    //     }

    //     for (let product of ns.corporation.getDivision(division).products) {
    //         if (ns.corporation.getProduct(division, product).developmentProgress == 100) {
    //             ns.corporation.sellProduct(division, "Sector-12", product, "MAX", "MP", true)
    //         }
    //     }
    //     for (let material of materials) {
    //         for (let city of cities) {
    //             ns.corporation.sellMaterial(division, city, material, "MAX", "MP")
    //         }
    //     }
    // }

    while (true == true){
        // Look for new product divisions before other divisions
        for (let newDivision of possibleDivisions){
            if (ns.corporation.getExpandIndustryCost(newDivision) < ns.corporation.getCorporation().funds){
                ns.corporation.expandIndustry(newDivision, newDivision)
                divisionsOwned.push(newDivision)
                possibleDivisions.splice(possibleDivisions.indexOf(newDivision), 1)
                // Add one division at a time, to set it up properly.
                break
            }
        }

        // Global upgrades
        for (let upgrade of upgrades) {
            while (ns.corporation.getUpgradeLevelCost(upgrade) < upgradePercent * ns.corporation.getCorporation().funds) {
                ns.corporation.levelUpgrade(upgrade)
            }
        }

        // Run through the quick updates
        for (let division of divisionsOwned) {
            // Buy available research
            for (let research of researches){
                // If the research is for product divisions and the division doesn't make products, skip
                if (productResearch.includes(research) && productDivisions.includes(division) == false){
                    continue
                }
                // If we can't buy the next research, don't buy anything
                if (ns.corporation.hasResearched(division, research) == false){
                    if(ns.corporation.getResearchCost(division, research) < ns.corporation.getDivision(division).research) {
                        await ns.corporation.research(division, research)
                    } else {
                        break
                    }
                }
            }

            // Expand to each city
            for (let city of cities) {
                // Expand, buy warehouse, set smartsupply
                if (ns.corporation.getDivision(division).cities.includes(city) == false
                && ns.corporation.getExpandCityCost() < ns.corporation.getCorporation().funds){
                    ns.corporation.expandCity(division, city)
                }
                if (ns.corporation.hasWarehouse(division, city) == false
                && ns.corporation.getPurchaseWarehouseCost(division, city) < ns.corporation.getCorporation().funds){
                    ns.corporation.purchaseWarehouse(division, city)
                    ns.corporation.setSmartSupply(division, city, true)
                }  
            }

            // Create new products
            if (productDivisions.includes(division)){
                let maxProducts = 3
                if (ns.corporation.hasResearched(division, "uPgrade: Capacity.II")){
                    maxProducts += 2
                } else if (ns.corporation.hasResearched(division, "uPgrade: Capacity.I")) {
                    maxProducts +=1
                }
                while (ns.corporation.getDivision(division).products.length < maxProducts) {
                    ns.corporation.makeProduct(division, "Sector-12", division + " " + ns.corporation.getDivision(division).products.length, productInvestment * ns.corporation.getCorporation().funds, productInvestment * ns.corporation.getCorporation().funds)
                }
                // If all products are finished, discontinue the first one and make a new one
                let allFinished = true
                for (let product of ns.corporation.getDivision(division).products) {
                    if (ns.corporation.getProduct(division, product).developmentProgress < 100) {
                        allFinished = false
                        break
                    }
                }
                if (allFinished == true) {
                    let replacedProduct = ns.corporation.getDivision(division).products[0]
                    ns.corporation.discontinueProduct(division, replacedProduct)
                    ns.corporation.makeProduct(division, "Sector-12", replacedProduct, productInvestment * ns.corporation.getCorporation().funds, productInvestment * ns.corporation.getCorporation().funds)
                }
            }
            // Hire advert
            while (ns.corporation.getHireAdVertCost(division) < upgradePercent * ns.corporation.getCorporation().funds) {
                ns.corporation.hireAdVert(division)
            }
        }

        // Run through longer updates
        for (let division of divisionsOwned) {
            // Manage employees
            for (let city of cities){
                // Make sure we have 6 employees, and then hire 6 at a time.
                if (ns.corporation.getDivision(division).cities.includes(city)) {
                    if (ns.corporation.getOffice(division, city).size % 6 == 3){
                        ns.corporation.upgradeOfficeSize(division, city, 3)
                    } else { 
                        while(ns.corporation.getOfficeSizeUpgradeCost(division, city, 6) < ns.corporation.getCorporation().funds * officePercent) {
                            ns.corporation.upgradeOfficeSize(division, city, 6)
                        }
                    }
    
                    // Hire and assign workers
                    while (ns.corporation.getOffice(division, city).employees.length < ns.corporation.getOffice(division, city).size){
                       ns.corporation.hireEmployee(division, city)
                    }
                    for (let job of jobs) {
                       await ns.corporation.setAutoJobAssignment(division, city, job, ns.corporation.getOffice(division, city).size / 6)
                    }
                }
            }
            // Price products and materials
            for (let product of ns.corporation.getDivision(division).products) {
                if (ns.corporation.getProduct(division, product).developmentProgress >= 100) {
                    ns.corporation.sellProduct(division, "Sector-12", product, "MAX", "MP", true)
                    if (ns.corporation.hasResearched(division, "Market-TA.II")){
                        ns.corporation.setProductMarketTA2(division, product, true)
                    }
                }
            }
            for (let material of materials) {
                for (let city of cities) {
                    if (ns.corporation.getDivision(division).cities.includes(city)
                    && ns.corporation.hasWarehouse(division, city)) {
                        ns.corporation.sellMaterial(division, city, material, "MAX", "MP")
                        if (ns.corporation.hasResearched(division, "Market-TA.II")) {
                            ns.corporation.setMaterialMarketTA2(division, city, material, true)
                        }
                    }
                }
            }

            // If we have a full warehouse in some city during PURCHASE or SALE, upgrade the warehouse
            while (ns.corporation.getCorporation().state != "PURCHASE") {
                await ns.sleep(50)
            }
            for (let city of cities) {
                if (ns.corporation.getDivision(division).cities.includes(city)
                && ns.corporation.hasWarehouse(division, city)) {
                    while (ns.corporation.getWarehouse(division, city).sizeUsed / ns.corporation.getWarehouse(division, city).size > 0.6
                    && ns.corporation.getUpgradeWarehouseCost(division, city) < upgradePercent * ns.corporation.getCorporation().funds){
                        ns.corporation.upgradeWarehouse(division, city)
                        await ns.sleep(10)
                    }
                }
            }
            while (ns.corporation.getCorporation().state != "SALE") {
                await ns.sleep(50)
            }
            for (let city of cities) {
                if (ns.corporation.getDivision(division).cities.includes(city)
                && ns.corporation.hasWarehouse(division, city)) {
                    while (ns.corporation.getWarehouse(division, city).sizeUsed / ns.corporation.getWarehouse(division, city).size > 0.6
                    && ns.corporation.getUpgradeWarehouseCost(division, city) < upgradePercent * ns.corporation.getCorporation().funds){
                        ns.corporation.upgradeWarehouse(division, city)
                        await ns.sleep(10)
                    }
                }
            }
        }

        let numShares = ns.corporation.getCorporation().numShares
        if (ns.corporation.getCorporation().shareSaleCooldown <= 0) {
            ns.corporation.sellShares(numShares)
            ns.corporation.buyBackShares(numShares)
        }

        await ns.sleep (10 * 1000)
    }
}
