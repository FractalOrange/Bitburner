

/** @param {NS} ns **/
export async function main(ns) {

    while (true == true){
        let stocks = []
        for (let i = 0; i < ns.stock.getSymbols().length; i++){
            let nextStock = ns.stock.getSymbols()[i]
            let stock = stockInfo(nextStock)
            stocks.push(stock)
        }

        let longStocks = []
        let longCertainties = []
        let shortStocks = []
        let shortCertainties = []

        let totalInvestment = 0.2 * ns.getPlayer().money
    
        // Wait until we can get the relevant info from the other scripts
        while (ns.getPortHandle(9).empty() == true) {
            await ns.sleep(10)
        }
        while (ns.getPortHandle(9).empty() == false) {
            longStocks.push(ns.readPort(9))
            longCertainties.push(ns.readPort(10))
        }
        while (ns.getPortHandle(11).empty() == false) {
            shortStocks.push(ns.readPort(11))
            shortCertainties.push(ns.readPort(12))
        }

        // First update positions
        for (let stock of stocks) {
            if (stock.longShares > 0 && shortStocks.includes(stock.name)) {
                ns.stock.sell(stock.name, stock.longShares)
            }
            if (stock.shortShares> 0 && longStocks.includes(stock.name)) {
                ns.stock.sellShort(stock.name, stock.shortShares)
            }
        }

        // Then set new positions
        let currentInvestment = 0
        for (let stock of stocks) {
            currentInvestment += stock.investment
        }
        // Now run through all stocks we think are changing, from most to least certain
        let length = "Long"
        while (true == true) {
            // Decide if we should look at a long or a short stock
            if (longCertainties.length == 0) {
                if (shortCertainties.length == 0) {
                    break
                } else {
                    length = "Short"
                }
            } else if (shortCertainties.length == 0) {
                length = "Long"
            } else if (longCertainties[0] >= -shortCertainties[0]) {
                length = "Long"
            } else {
                length = "Short"
            }

            // Now buy the stock if appropriate
            if (length == "Long") {
                let stock = longStocks.shift()
                longCertainties.shift()
                if (currentInvestment + ns.stock.getPurchaseCost(stock, 1000, "Long") <= totalInvestment) {
                    let newStocks = 1000
                    while (currentInvestment + ns.stock.getPurchaseCost(stock, newStocks, "Long") <= totalInvestment
                    && ns.stock.getPosition(stock)[0] + newStocks + 1000 <= ns.stock.getMaxShares(stock)){
                        newStocks += 1000
                    }
                    // Update currentInvestment. Can't easily update position in the object, so we
                    // re-compute the objects each loop.
                    currentInvestment += ns.stock.getPurchaseCost(stock, newStocks, "Long")
                    ns.stock.buy(stock, newStocks)
                }
            }
            if (length == "Short") {
                let stock = shortStocks.shift()
                shortCertainties.shift()
                if (currentInvestment + ns.stock.getPurchaseCost(stock, 1000, "Short") <= totalInvestment) {
                    // let newStocks = 1000
                    // while (currentInvestment + ns.stock.getPurchaseCost(stock, newStocks, "Short") <= totalInvestment
                    // && ns.stock.getPosition(stock)[2] + newStocks + 1000 <=ns.stock.getMaxShares(stock)){
                    //     newStocks += 1000
                    // }
                    // // Update currentInvestment. Can't easily update position in the object, so we
                    // // re-compute the objects each loop.
                    // currentInvestment += ns.stock.getPurchaseCost(stock, newStocks, "Short")
                    // ns.stock.short(stock, newStocks)
                }
            }
        }
        await ns.sleep(60 * 1000)
    }


    
    function stockInfo(stockName) {
        let s = Object.create({})
        s.name = stockName
        s.price = ns.stock.getPrice(stockName)
        // This records the value of the last 10 price changes
        s.changes = new Array(10).fill(0)
        // The direction is 1 if the stock is increasing, -1 if it is decreasing, and 0 if we're unsure.
        // The certainty represents how sure we are of our direction.
        s.direction = 0
        s.certainty = 0
        // This records our estimates of direction over time.
        s.estimates = new Array(10).fill(0)
        // This records if the stock flipped 10 stocks ago
        s.flipped = 0
        // Record how many long or short shares we own, as well as the total investment
        // in this stock.
        s.longShares = ns.stock.getPosition(stockName)[0]
        s.shortShares = ns.stock.getPosition(stockName)[2]
        s.investment = ns.stock.getPosition(stockName)[0] * ns.stock.getPosition(stockName)[1] + ns.stock.getPosition(stockName)[2] * ns.stock.getPosition(stockName)[3]
        return s
    }

}