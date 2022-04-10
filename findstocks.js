

/** @param {NS} ns **/
export async function main(ns) {

    // prices update every 6 seconds ()
    // 75 ticks (price updates) per stock market cycle
    // each SMC, each stock as a 45% chance to flip second order forcast.
    // 

    // Look for price changes and record increases and decreases for all stocks
    // Look at a fixed number of recent changes and set a threshold for telling if a stock has gone up or down.
    // Track which stocks we're listing as up and which as down, update that each tick.
    // Note the number of changes each tick, and set a threshold for realising that the market has flipped (why though?)
    // If we have 3 consistent predictions about cycles, assume that's correct and just update every 75 ticks or so.

    // Make a list of stocks that should be short and long and let another script buy and sell them.
    
    while(ns.getPlayer().hasTixApiAccess == false) {
        await ns.sleep (60 * 1000)
    }
    ns.run("buystocks.js")

    let stocks = []
    for (let i = 0; i < ns.stock.getSymbols().length; i++){
        let nextStock = ns.stock.getSymbols()[i]
        let stock = stockInfo(nextStock)
        stocks.push(stock)
    }

    while(ns.getPlayer().has4SDataTixApi == false) {
        // Wait until prices change
        while (stocks[0].price == ns.stock.getPrice(stocks[0].name)) {
            await ns.sleep(50)
        }
        // Update the stock objects
        for (let stock of stocks) {
            stock.changes.pop()
            stock.changes.unshift(ns.stock.getPrice(stock.name) - stock.price)
            stock.price = ns.stock.getPrice(stock.name)

            // If we have at least 10 data points, look for the direction of the stock.
            if (stock.changes[9] != 0){
                // Computer the number of increases - the number of decreases
                stock.certainty = stock.changes.map(x => Math.sign(x)).reduce((x,y) => x + y)
                // If the number of increases or decreases is more than 8, assign the stock as increasing or decreasing
                stock.direction = Math.sign(stock.certainty)
            }
            // Store the current estimate
            stock.estimates.pop()
            stock.estimates.unshift(stock.certainty)
            // Compare the most recent estimate to the oldest estimate to determine if the stock if flipped
            if (stock.estimates[0] * stock.estimates[9] < 0
                && Math.abs(stock.estimates[0]) >= 4 && Math.abs(stock.estimates[9]) >= 4) {
                stock.flipped = 1
            } else {
                stock.flipped = 0
            }
        }

        // Count global information e.g. for identifying market cycles
        let totalUp = 0
        let totalDown = 0
        for (let stock of stocks) {
            if (stock.direction == 1) {
                totalUp++
            }
            if (stock.direction == -1) {
                totalDown++
            }
        }
        let totalFlips = stocks.map(x => x.flipped).reduce((x,y) => x + y)

        let increasingStocks = []
        let decreasingStocks = []

        // Sort stocks from highest to lowest certainty
        stocks.sort((a,b) => b.certainty - a.certainty)
        for (let i = 0; i < stocks.length; i++){
            if (stocks[i].certainty > 0){
                increasingStocks.push([stocks[i].name, stocks[i].certainty])
            }
        }
        stocks.reverse()
        for (let i = 0; i < stocks.length; i++){
            if (stocks[i].certainty < 0){
                decreasingStocks.push([stocks[i].name, stocks[i].certainty])
            }
        }
        // Write to ports multiple times to make sure all the reading scripts can see them.
        for (let i = 0; i < 40; i++) {
            ns.clearPort(9)
            ns.clearPort(10)
            ns.clearPort(11)
            ns.clearPort(12)
            for (let entry of increasingStocks) {
                await ns.writePort(9, entry[0])
                await ns.writePort(10, entry[1])
            }
            for (let entry of decreasingStocks) {
                await ns.writePort(11, entry[0])
                await ns.writePort(12, entry[1])
            }
            await ns.sleep(50)
        }
    }

    // Once we have the 4S data, move on to an easier loop.

    while (true == true) {
        // Wait until prices change
        while (stocks[0].price == ns.stock.getPrice(stocks[0].name)) {
            await ns.sleep(50)
        }
        // Update the stock objects
        for (let stock of stocks) {
            stock.price = ns.stock.getPrice(stock.name)

            // Update certainty and direction
            stock.certainty = ns.stock.getForecast(stock.name) - 0.5
            stock.direction = Math.sign(stock.certainty)
    
            // Store the current estimate
            stock.estimates.pop()
            stock.estimates.unshift(stock.certainty)
        }

        // Count global information e.g. for identifying market cycles
        let totalFlips = stocks.map(x => x.flipped).reduce((x,y) => x + y)

        let increasingStocks = []
        let decreasingStocks = []

        // Sort stocks from highest to lowest certainty
        stocks.sort((a,b) => b.certainty - a.certainty)
        for (let i = 0; i < stocks.length; i++){
            if (stocks[i].certainty > 0){
                increasingStocks.push([stocks[i].name, stocks[i].certainty])
            }
        }
        stocks.reverse()
        for (let i = 0; i < stocks.length; i++){
            if (stocks[i].certainty < 0){
                decreasingStocks.push([stocks[i].name, stocks[i].certainty])
            }
        }
        // Write to ports multiple times to make sure all the reading scripts can see them.
        for (let i = 0; i < 40; i++) {
            ns.clearPort(9)
            ns.clearPort(10)
            ns.clearPort(11)
            ns.clearPort(12)
            for (let entry of increasingStocks) {
                await ns.writePort(9, entry[0])
                await ns.writePort(10, entry[1])
            }
            for (let entry of decreasingStocks) {
                await ns.writePort(11, entry[0])
                await ns.writePort(12, entry[1])
            }
            await ns.sleep(50)
        }
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