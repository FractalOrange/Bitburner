// Need to figure out how to make this work without TIX

// need to add shorts and stuff

// Need to make sure we don't keep updating the max price since it means we keep buying just 1 more stock and losing 
// loads of profits to transaction fees

// Could make a tiered system of individual investments. E.g. 1-10b can invest 100m each, 10-100b can invest 1b each, make it
// discrete and use floor(log()) or something to make it work.

/** @param {NS} ns **/
export async function main(ns) {


	// First we have to buy the stuff
	while (ns.stock.purchase4SMarketData() == false || ns.stock.purchase4SMarketDataTixApi() == false){
		await ns.sleep( 5 * 60 * 1000)
	}
	// Get a list of all possible stocks
	let stocks = ns.stock.getSymbols()


	// List how many of each stock we own and much we've spent on each stock
	let investments = []
	// List how much money we've made
	let profit = []
	let totalProfit = 0
	
	// Initialise both arrays, including any positions we have before running the script
	for (let i = 0; i < stocks.length; i++){
		investments.push([ns.stock.getPosition(stocks[i])[0], 
		ns.stock.getPosition(stocks[i])[0] * ns.stock.getPosition(stocks[i])[1]])
		profit.push(0)
	}

	while (true == true){
		// Set the total amount we're willing to have invested at a given time, and how much that is for each stock.
		let totalInvestment = 0.2 * ns.getPlayer().money
		let individualInvestment = totalInvestment / stocks.length
		for (let i = 0; i < stocks.length; i++){
			// Look for stocks to invest in, must be likely to increase and buying more won't put us over the edge
			if (ns.stock.getForecast(stocks[i]) > 0.52 
			&& investments[i][1] + ns.stock.getPurchaseCost(stocks[i], 1, "Long") < individualInvestment){
				// Figure out how many new stocks we can buy
				let newStocks = 1000
				while (investments[i][1] + ns.stock.getPurchaseCost(stocks[i], newStocks, "Long") <= individualInvestment
				&& investments[i][0] + newStocks + 1000 <= ns.stock.getMaxShares(stocks[i])){
					newStocks = newStocks + 1000
				}
				// Update how many more we will buy and the cost, and then buy it.
				investments[i][0] = investments[i][0] + newStocks
				investments[i][1] = investments[i][1] + ns.stock.getPurchaseCost(stocks[i], newStocks, "Long")
				ns.stock.buy(stocks[i], newStocks)
			}

			// Look for stocks to sell. We sell anything that's definitely going down, and for stuff in between we sell if it 
			// makes us a profit.
			if (ns.stock.getForecast(stocks[i]) < 0.48 && investments[i][0] > 0){
				profit[i] = ns.stock.getSaleGain(stocks[i], investments[i][0], "Long") - investments[i][1]
				ns.stock.sell(stocks[i], investments[i][0])
				investments[i][0] = 0
				investments[i][1] = 0
			}
			if (0.48 <= ns.stock.getForecast(stocks[i]) && ns.stock.getForecast(stocks[i]) < 0.5 && investments[i][0] > 0 
			&& ns.stock.getSaleGain(stocks[i],investments[i][0], "Long") > investments[i][1]){
				profit[i] = ns.stock.getSaleGain(stocks[i], investments[i][0], "Long") - investments[i][1]
				ns.stock.sell(stocks[i], investments[i][0])
				investments[i][0] = 0
				investments[i][1] = 0
			}
		}
		for (let i = 0; i < stocks.length; i++){
			totalProfit = totalProfit + profit[i]
		}
		// ns.tprint(stocks)
		// ns.tprint(investments)
		// ns.tprint(profit)
		// ns.tprint(totalProfit)
		await ns.sleep(5 * 1000)
	}
}