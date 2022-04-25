/** @param {NS} ns **/

export async function main(ns) {


    while(true == true){
        var serversarray = ns.read("servers.txt").split(",")
    
        for (let i = 0; i < serversarray.length; i++) {
            let server = serversarray[i]
            let contracts = ns.ls(server, ".cct")
            serversarray[i] = [server, contracts]
        }
        // This gives a list of servers with contacts listed next to them.
        // ns.tprint(serversarray)
    
        let length = serversarray.length
        for(let serverNum = 0; serverNum < length; serverNum++){
            let server = serversarray[serverNum][0]
            let serverContracts = serversarray[serverNum][1]
            for(let contractNum = 0; contractNum < serverContracts.length; contractNum++){
                let contract = serverContracts[contractNum]
                let contractDetails = [server,contract,ns.codingcontract.getContractType(contract,server),ns.codingcontract.getContractType(contract,server),ns.codingcontract.getData(contract, server)]
                let answer = 0
                // Now make a bunch of conditionals to solve the contracts based on the type.
                if(contractDetails[3] == "Minimum Path Sum in a Triangle"){
                    let triangle = contractDetails[4]
                    let minPath = []
                    let size = triangle.length
                    for(let j = size-1; j >= 0; j--){
                        let nextPath = []
                        if(j == size-1){
                            nextPath = triangle[j]
                            minPath.unshift(nextPath)
                            continue
                        }
                        for(let k = 0; k <= j; k++){
                            nextPath.push(Math.min(minPath[0][k],minPath[0][k+1])+triangle[j][k])
                        }
                        minPath.unshift(nextPath)
                    }
                    answer = minPath[0][0]
                }
    
                else if(contractDetails[3] == "Merge Overlapping Intervals" ){
                    let intervals = contractDetails[4].sort((a,b)=>(a[1]-b[1]))
                    intervals = intervals.sort((a,b)=>(a[0]-b[0]))
                    answer = []
                    let currentInterval = intervals[0]
                    let isDone = false
    
                    while(isDone == false){
                        for(let i = 0; i < intervals.length; i++){
                            if(intervals[i][0] <= currentInterval[1] && currentInterval[1] < intervals[i][1]){
                                currentInterval[1] = intervals[i][1]
                            }
                        }
                        answer.push(currentInterval)
                        
                        
                        for(let i = 0; i < intervals.length; i++){
                            if(intervals[i][0] > currentInterval[1]){
                                currentInterval = intervals[i]
                                break
                            }
                            if(i == intervals.length-1){
                                isDone = true
                            }
                        }
                        await ns.sleep(100)
                    }
    
                }
    
                else if(contractDetails[3] == "Unique Paths in a Grid I"){
                    let dimensions = contractDetails[4]
                    function factorial(n){
                        let fact = 1
                        for(let i = 1; i <= n; i++){
                            fact = fact * i
                        }
                        return fact
                    }
                    answer = factorial(dimensions[0]+dimensions[1]-2)/(factorial(dimensions[0]-1) * factorial(dimensions[1]-1))
                }
    
                else if(contractDetails[3] == "Unique Paths in a Grid II"){
    
                    // Recursively start from botoom right and see how many paths to the bototm right by
                    // adding together the number of paths from the next two positions in the grid
                    let grid = contractDetails[4]
                    let answerGrid = []
                    for(let i = grid.length-1; i >= 0; i--){
                        let newRow = []
                        for(let j = grid[i].length-1; j >= 0; j--){
    
                            if(grid[i][j] == 1){
                                newRow.unshift(0)
                                continue
                            }
    
                            if(i == grid.length-1 & j == grid[i].length-1){
                                newRow.unshift(1)
                                continue
                            }
    
                            if(i == grid.length - 1){
                                newRow.unshift(newRow.slice(0,1)[0])
                                continue
                            }
    
                            if(j == grid[i].length -1){
                                newRow.unshift(answerGrid[0].slice(j,j+1)[0])
                                continue
                            }
    
                            newRow.unshift(newRow.slice(0,1)[0] + answerGrid[0].slice(j,j+1)[0])
    
                        }
                        answerGrid.unshift(newRow.slice())
                    }
                    answer = answerGrid[0][0]
                }
    
                else if(contractDetails[3] =="Find All Valid Math Expressions"){
                    let digits = contractDetails[4][0].split("").map(x => Number(x))
                    let target = contractDetails[4][1]
                    let operations = ['+', '-', '*']
                    answer = []
                    // Look for all possible ways to split the digits into pieces. We look at each possible number of pieces separately
                    for (let k = 1; k < digits.length + 1; k++){
                        // If we only have 1 piece and it works, add it to answers.
                        if (k == 1){
                            if (digits[0] == target){
                                answer.push(digits)
                                continue
                            } else {
                                continue
                            }		
                        }
                        // This is the ways to breakdown the digits into k pieces
                        let breakdowns = fancynumsplit(digits.length, k, digits.length)
                        // We look at each possible collection of symbols for this breakdown
                        let operationCombinations = arrangements(operations,k-1)
                        for (let split of breakdowns){
                            // Compute the pieces of this particular breakdown
                            let isValid = true
                            // Check each fragment for validity and add it in to the answer if it is.
                            // We want to keep track which digit our fragment starts at
                            let position = 0
                            // We keep track of the fragments as we go and combine them at the end
                            var fragments = new Array(k).fill(0)
                            for (let i = 0; i < k; i++){
                                let fragment = 0
                                // Compute the value of the fragment
                                for (let j = 0; j < split[i]; j++){
                                    fragment = fragment * 10 + digits[position+j]
                                }
                                // Check for invalidity
                                if (digits[position] == 0 && split[i] > 1){
                                    isValid = false
                                }
                                // Add the fragment to list of fragments 
                                fragments[i] = fragment
                                // Increase the position for the next fragment
                                position = position + split[i]
                            }
                            // If one of the fragments is invalid, continue to the next step.
                            if (isValid == false){	
                                continue
                            }
                            for (let i = 0; i < operationCombinations.length; i++){
                                let operationComb = operationCombinations[i]
                                // Now we check to see if the combination meets the condition, and if it does we compute the string and
                                // add it to the answers
                                if (operate(fragments, operationComb) == target){
                                    let string = fragments[0]
                                    for (let i = 1; i < k; i++){
                                        string = string + operationComb[i-1] + fragments[i]
                                    }
                                    answer.push(string)
                                }
                            }
                        }
                    }
                }
                // Doesn't work yet RIP
                else if (contractDetails[3] == "Sanitize Parentheses in Expression"){
                    // ns.toast("Parenthesis question RIP", "warning", 5000)
                    // continue
    
                    // Create a function (reverseArray) to reverse arrays
                    let array = contractDetails[4].split("")
    
                    // Create a function (fixParentheses) to recursively solve the problem.
    
                    let answersString = fixParentheses(array) 
                    // Convert each array of strings into a single string
                    for(let i = 0; i < answersString.length; i++){
                        answersString[i] = answersString[i].join("")
                    }
                    let answersSet = new Set(answersString)
                    answer = Array.from(answersSet)
                    
                    // ns.tprint(answer)
                    // ns.exit()
                    // await ns.sleep(1000)
                }
                    
                else if (contractDetails[3] == "Subarray with Maximum Sum"){
                    // ns.toast("Subarray with Maximum Sum - go have a look", "warning", 5000)
                    // continue
                    // ns.tprint(contractDetails[4])
                    let array = contractDetails[4]
                    let arrayLength = array.length
                    let compressedArray = [0]
                    let partialMax = []
    
                    // CompressedArray adds up all positives in a row and all negatives in a row. Also reverses the array
                    // for no real reason
                    for(let i = 0; i < arrayLength; i++){
                        // Check if current part of the new array and the current place in the old array have the same sign
                        // (or one is 0)
                        if(compressedArray[0]*array[0] >= 0){
                            compressedArray[0] = compressedArray[0]+array.shift()
                        } else {
                            compressedArray.unshift(array.shift())
                        }
                    }
                    // ns.tprint(compressedArray)
                    // Now we combine a sequence of +, -, + where the - is smaller than both +
                    for(let i = 0; i < compressedArray.length; i++){
                        // ns.tprint(compressedArray)
                        if(compressedArray[i] > 0){
                            if(compressedArray[i] >= -1 * compressedArray[i+1] && compressedArray[i+2] >= -1 * compressedArray[i+1]){
                                compressedArray.splice(i,3,compressedArray[i]+compressedArray[i+1]+compressedArray[i+2])
                                i = -1
                                continue
                            }
                            // Also combine -, +, - if + is smaller than both -. Record the + though, in case it was 
                            // actually the biggest
                        } else {
                            if(-1 * compressedArray[i] >= compressedArray[i+1] && -1 * compressedArray[i+2] >= compressedArray[i+1]){
                                partialMax.push(compressedArray[i+1])
                                compressedArray.splice(i,3,compressedArray[i]+compressedArray[i+1]+compressedArray[i+2])
                                i = -1
                                continue
                            }
                        }
                    }
    
                    // Now we just pick the single biggest value
                    answer = compressedArray.concat(partialMax).reduce((a,b) => Math.max(a,b))
                    // ns.tprint(compressedArray)
                    // ns.tprint(answer)
                    // ns.exit()
                    // await ns.sleep(10000)
                }
    
                else if(contractDetails[3] == "Spiralize Matrix"){
                    let matrix = contractDetails[4]
                    function spiralize(input){
                        let mat = input
    
                        if(mat.length == 0){
                            return []
                        }
    
                        // if the matrix is empty, return empty array
                        if(mat[0].length == 0){
                            return []
                        }
                        // If the matrix is 1xn or nx1 we just take the single row/column
    
                        if(mat.length == 1){
                            return mat[0]
                        }
    
                        if(mat[0].length == 1){
                            let output = []
                            for(let i = 0; i < mat.length; i++){
                                output.push(mat[i][0])
                            }
                            return output
                        }
    
                        // Otherwise, take the outer layer and recurse on the inside
                        // Take first row
                        let partial = mat.shift()
                        // Take final column
                        for(let i = 0; i < mat.length; i++){
                            partial.push(mat[i].pop())
                        }
    
                        //Take last row
                        
                        partial = partial.concat(mat.pop().reverse())
    
                        //Take first column
                        for(let i = mat.length-1; i >= 0; i--){
                            partial.push(mat[i].shift())
                        }
    
                        return partial.concat(spiralize(mat))
                    }
    
                    answer = spiralize(matrix)
                }
    
                else if (contractDetails[3] == "Algorithmic Stock Trader I"){
                    let prices = contractDetails[4]
                    // minMax is an array that records the smallest price that came before each point and the greatest
                    // price that comes after each point. The difference is the profit that could be made in a window
                    // containing this point.
                    let minMax = Array.from({length:prices.length},() => ([0,0]))
                    // The min and max are found recursively, e.g. the min at time i is the smallest of the current price
                    // and the previous min.
    
                    minMax[0][0] = prices[0]
                    minMax[prices.length-1][1] = prices[prices.length-1]
                    for(let i = 1; i < prices.length; i++){
                        minMax[i][0] = Math.min(minMax[i-1][0],prices[i])
                        minMax[prices.length-1-i][1] = Math.max(minMax[prices.length-i][1],prices[prices.length-1-i])
                    }
                    // Now sort to make biggest profit first
                    minMax.sort((a,b) => (b[1]-b[0]) - (a[1]-a[0]))
    
                    answer = minMax[0][1]-minMax[0][0]
                }
                //Doesn't work yet
                else if (contractDetails[3] == "Algorithmic Stock Trader II"){
                    //Maximise profit by buying at local mins and selling at local
                    let prices = contractDetails[4]
                    let bought = false
                    let profit = 0
                    let boughtPrice = 0
                    // Up until the final day, check next day and act appropriately
                    for(let i = 0; i < prices.length-1; i++){
                        // If no stock is owned, buy when price is about to rise
                        if(bought == false){
                            if(prices[i+1] > prices[i]){
                                bought = true
                                boughtPrice = prices[i]
                                profit = profit-boughtPrice
                            }
                        }
    
                        // If stock is owned, sell when price is about to fall
                        if(bought == true){
                            if(prices[i+1] < prices[i]){
                                bought = false
                                profit = profit + prices[i]
                            }
                        }
                    }
                    // On the last day, need to sell any remaining stock
                    if(bought == true){
                        bought = false
                        profit = profit + prices[prices.length-1]
                    }
                    answer = profit
                }
    
                // Essentially the same as IV
                else if(contractDetails[3] == "Algorithmic Stock Trader III"){
                    
                    // See end of file for "bestBuy" function.
    
                    let prices = [contractDetails[4]]
                    let transactionNum = 2
                    let transactionsMade = []
                    // ns.tprint(prices)
                    // For each transaction, we find the best single transaction from our remaining prices and the best one that comes from splitting an already made transaction.
                    // We then find which is greater, and update prices and transactionsMade appropriately.
    
                    // Need to make sure we can deal with what would happen if the number of transactions is higher than the max profit.
                    let profit = 0
                    for (let i = 1; i <= transactionNum; i++){
                        // First find the best buy from what remains
                        let newBuy = [0,[0,0]]
                        let buySection = -1
                        for (let j = 0; j < prices.length; j++){
                            let currentBuy = bestBuy(prices[j])
                            if (currentBuy[0] > newBuy[0] && prices[j].length > 1){
                                newBuy = currentBuy
                                buySection = j
                            }
                        }
    
                        // Now we find the best way to split purchases that have already been made. We also store which transaction is being split
                        let newSplit = [0,[0,0]]
                        let splitPoint = -1
                        for (let j = 0; j < transactionsMade.length; j++){
    
                            let currentSplit = bestBuy(transactionsMade[j].slice().reverse())
                            if (currentSplit[0] > newSplit[0] && transactionsMade[j].length > 1){
                                newSplit = currentSplit
                                splitPoint = j
                            }
                        }
    
                        // Given the two options, we figure out which one is better and adjust as appropriate.
                        if (newBuy[0] >= newSplit[0]){
                            // Increase the profit counter
                            profit = profit + newBuy[0]
                            // Remove the region we're buying from from prices, split it into the three pieces and put them in the right places.
                            let regionToBuy = prices.splice(buySection, 1)[0]
                            // The first piece isn't bought so goes back to prices.
                            prices.push(regionToBuy.splice(0,newBuy[1][0]))
                            // The second piece is bought so goes to transactions
                            transactionsMade.push(regionToBuy.splice(0,newBuy[1][1]-newBuy[1][0] + 1))
                            // The remnant also isn't bought so goes to prices.
                            prices.push(regionToBuy)
                        } else {
                            // Increase the profit counter
                            profit = profit + newSplit[0]
                            // Remove the transaction we're splitting from transactionsMade, split it into the three pieces and then put them in the right places
                            let transactionToSplit = transactionsMade.splice(splitPoint, 1)[0]
                            // The first piece is bought so we add it to transactionsMade
                            transactionsMade.push(transactionToSplit.splice(0, transactionToSplit.length - newSplit[1][1]))
                            // The middle piece is leftover so we add it to prices
                            prices.push(transactionToSplit.splice(0, newSplit[1][1]-newSplit[1][0] - 1))
                            // The last piece is also bought so moves to transactionsMade
                            transactionsMade.push(transactionToSplit)
                        }
                    }	
                    answer = profit	
                    // ns.tprint(prices)
                    // ns.tprint(transactionsMade)
                    // ns.tprint(answer)
                    // ns.exit()
                    // await ns.sleep(10000)
                }
                
    
                
                else if(contractDetails[3] == "Algorithmic Stock Trader IV"){
    
                    // See end of file for "bestBuy" function.
    
                    let prices = [contractDetails[4][1]]
                    let transactionNum = contractDetails[4][0]
                    let transactionsMade = []				
    
                    // For each transaction, we find the best single transaction from our remaining prices and the best one that comes from splitting an already made transaction.
                    // We then find which is greater, and update prices and transactionsMade appropriately.
    
                    // Need to make sure we can deal with what would happen if the number of transactions is higher than the max profit.
                    let profit = 0
                    for (let i = 1; i <= transactionNum; i++){
                        // First find the best buy from what remains
                        let newBuy = [0,[0,0]]
                        let buySection = -1
                        for (let j = 0; j < prices.length; j++){
                            let currentBuy = bestBuy(prices[j])
                            // Also check to make sure the sequence is long enough to make sense
                            if (currentBuy[0] > newBuy[0] && prices[j].length > 1){
                                newBuy = currentBuy
                                buySection = j
                            }
                        }
    
                        // Now we find the best way to split purchases that have already been made. We also store which transaction is being split
                        let newSplit = [0,[0,0]]
                        let splitPoint = -1
                        for (let j = 0; j < transactionsMade.length; j++){
    
                            let currentSplit = bestBuy(transactionsMade[j].slice().reverse())
                            // Also check to make sure the sequence is long enough to make sense
                            if (currentSplit[0] > newSplit[0] && transactionsMade[j].length > 1){
                                newSplit = currentSplit
                                splitPoint = j
                            }
                        }
    
                        // Given the two options, we figure out which one is better and adjust as appropriate.
                        if (newBuy[0] >= newSplit[0]){
                            // Increase the profit counter
                            profit = profit + newBuy[0]
                            // Remove the region we're buying from from prices, split it into the three pieces and put them in the right places.
                            let regionToBuy = prices.splice(buySection, 1)[0]
                            // The first piece isn't bought so goes back to prices.
                            prices.push(regionToBuy.splice(0,newBuy[1][0]))
                            // The second piece is bought so goes to transactions
                            transactionsMade.push(regionToBuy.splice(0,newBuy[1][1]-newBuy[1][0] + 1))
                            // The remnant also isn't bought so goes to prices.
                            prices.push(regionToBuy)
                        } else {
                            // Increase the profit counter
                            profit = profit + newSplit[0]
                            // Remove the transaction we're splitting from transactionsMade, split it into the three pieces and then put them in the right places
                            let transactionToSplit = transactionsMade.splice(splitPoint, 1)[0]
                            // The first piece is bought so we add it to transactionsMade
                            transactionsMade.push(transactionToSplit.splice(0, transactionToSplit.length - newSplit[1][1]))
                            // The middle piece is leftover so we add it to prices
                            prices.push(transactionToSplit.splice(0, newSplit[1][1]-newSplit[1][0] - 1))
                            // The last piece is also bought so moves to transactionsMade
                            transactionsMade.push(transactionToSplit)
                        }					
                    }		
                    answer = profit
                }
    
                else if(contractDetails[3] == "Array Jumping Game"){
                    let array = contractDetails[4]
                    let length = array.length
                    let reach = array[0]
                    answer = 0
                    // reach determines how far we can go. For everything in range, check to see if the jump could take us 
                    // out of range and so extend the reach
                    for(let i = 0; i <= reach; i++){
                        if(reach >= length){
                            answer = 1
                            break
                        }
                        if(i + array[i] > reach){
                            reach = i + array[i]
                            i = -1
                            continue
                        }
                    }
    
                }
    
                else if(contractDetails[3] == "Find Largest Prime Factor"){
                    let number = contractDetails[4]
    
                    function isPrime(n){
                        for(let i = 2; i <= Math.sqrt(n); i++){
                            if(n % i == 0){
                                return false
                            }
                        }
                        return true
                    }
    
                    let maxPrimeFact = 0
                    for(let i = 2; i <= number; i++){
                        if(number % i == 0 && isPrime(i) == true){
                            maxPrimeFact = i
                        }
                    }
    
                    answer = maxPrimeFact
    
                }
    
                else if(contractDetails[3] == "Total Ways to Sum"){
                    let number = contractDetails[4]
    
                    // Find number of ways to write n as a sum of numbers, each of max value m
                    function numSum(n, m){
                        if(n == 0){
                            return 1
                        }
                        if(n == 1){
                            return 1
                        }
    
                        let runningTotal = 0
                        
                        for(let i = Math.min(m,n); i >= 1; i--){
                            runningTotal = runningTotal + numSum(n-i, i)
                        }
                        return runningTotal
                    }
                    answer = numSum(number,number-1)
                } 
                
                else if(contractDetails[3] == "Generate IP Addresses"){
                    // Turn the numbers into an array
                    let numbers = contractDetails[4].split("").map(Number)
    
                    // Create a function that returns an array that contains all ways to split a number n into
                    // a sum of k numbers between 1 and 3.
                    function numsplit(n, k){
                        // Can't split numbers less than 1
                        if (n < 1){
                            return []
                        }
                        // Can't split a number into 0 pieces
                        if (k == 0){
                            return []
                        }
                        // Can only write 1,2,3 as 1 piece
                        if (k == 1){
                            if (0 < n && n < 4){
                                return [n]
                            } else {
                                return []
                            }
                        } else {
                            let answers = []
                            for (let i = 1; i <= 3; i++){
                                let nextSteps = numsplit(n-i, k-1)
                                for (let split of nextSteps){
                                    answers.push([i].concat(split))
                                }
                            }
                            return answers
                        }
                    }
                    answer = []
                    // For each way to split up the numbers, check if that's a valid IP address
                    for (let split of numsplit(numbers.length,4)){
                        let isValid = true
                        let newAddress =''
                        // Check each octet for validity and add it in to the answer if it is.
                        // We want to keep track which digit our octet starts at
                        let position = 0
                        for (let i = 0; i < 4; i++){
                            let octet = 0
                            // Compute the value of the octet
                            for (let j = 0; j < split[i]; j++){
                                octet = octet * 10 + numbers[position+j]
                            }
                            // Check for invalidity
                            if (octet > 255 
                            || (numbers[position] == 0 && split[i] > 1)){
                                isValid = false
                            }
                            // Add the octet to the newAddress
                            newAddress = newAddress + octet + "."
                            // Increase the position for the next octet
                            position = position + split[i]
                        }
    
                        if (isValid == true){
                            answer.push(newAddress.slice(0, -1))
                        }
                    }
                }
                else{
                    ns.toast("New contract type ("+ contractDetails[2] +") at " + contractDetails[0] + "!", "warning", 5000)
                    continue
                }
                let report = ns.codingcontract.attempt(answer, contract, server, { returnReward: true })
                if(report === ""){
                    report = ["You done messed up" + " " + contractDetails[0] + " " + contractDetails[2]]
                }
                ns.toast(report, "success", 5000)
            }
        }
        await ns.sleep(60000)
    }
    
        // This is a function that takes an array of prices and outputs the highest profit from a single transaction, along with
        // the indices of where you should buy and sell
        function bestBuy(prices) {
            // minMax is an array that records the smallest price that came before each point (and the index) and the greatest
            // price that comes after each point (and the index). The difference is the profit that could be made in a window
            // containing this point.
            let minMax = Array.from({length:prices.length},() => ([0,0,0,0]))
            // The min and max are found recursively, e.g. the min at time i is the smallest of the current price
            // and the previous min.
    
            minMax[0] = [prices[0],0,0,0]
            minMax[prices.length-1] = [0,0,prices[prices.length-1], prices.length-1]
            for(let j = 1; j < prices.length; j++){
                // Find the cheapest thing to the left of the jth point, and the index.
                if (prices[j] <= minMax[j-1][0]){
                    minMax[j][0] = prices[j]
                    minMax[j][1] = j
                } else {
                    minMax[j][0] = minMax[j-1][0]
                    minMax[j][1] = minMax[j-1][1]
                }
    
                if (prices[prices.length-1-j] >= minMax[prices.length-j][2]){
                    minMax[prices.length-1-j][2] = prices[prices.length-1-j]
                    minMax[prices.length-1-j][3] = prices.length-1-j
                } else {
                    minMax[prices.length-1-j][2] = minMax[prices.length-j][2]
                    minMax[prices.length-1-j][3] = minMax[prices.length-j][3]
                }
            }
    
    
            // Now figure out the best price and the corresponding start and end points
            let bestPrice = 0
            let bestIndex = [0,0]
            for (let j = 0; j < prices.length; j++){
                let currentPrice = minMax[j][2]-minMax[j][0]
                if (currentPrice > bestPrice){
                    bestPrice = currentPrice
                    bestIndex = [minMax[j][1],minMax[j][3]]
                }
            }
            // We now have the bestPrice and bestIndex for a single purchase.
            return([bestPrice, bestIndex])
        }
    
        // Create a function that returns an array that contains all ways to split a number n into
        // a sum of k numbers between 1 and m.
        function fancynumsplit(n, k, m){
            // Can't split numbers less than 1
            if (n < 1){
                return []
            }
            // Can't split a number into 0 pieces
            if (k == 0){
                return []
            }
            // Can only write numbers up to m as 1 piece
            if (k == 1){
                if (0 < n && n < m + 1){
                    return [n]
                } else {
                    return []
                }
            } else {
                let answers = []
                for (let i = 1; i <= m; i++){
                    let nextSteps = fancynumsplit(n-i, k-1, m)
                    for (let split of nextSteps){
                        answers.push([i].concat(split))
                    }
                }
                return answers
            }
        }
        
        // A function that recursively computes all possible ways to make a list of size n out of copies of
        // given inputs
        function arrangements(symbols, n){
            let output = []
            // if (n == 0){
            // 	return []
            // }
            if (n == 1){
                for (let symbol of symbols){
                    output.push([symbol])
                }  
                return output      
            } else {
                let nextArrangements = arrangements(symbols,n-1)
                for (let arrangement of nextArrangements){
                    for (let symbol of symbols){
                        output.push([symbol].concat(arrangement))
                    }
                }
                return output
            }
        }
    
        // A function that takes a collection of numbers and operations and outputs the answer
        function operate(numbers, operations){
            let nums = numbers.slice()
            let ops = operations.slice()
            // If we just have one thing, return the thing
            if (nums.length == 1){
                return nums[0]
            }
            // Do all the multiplications first
            for (let i = 0; i < nums.length; i++){
                if (ops[i] == '*'){
                    nums.splice(i,2,nums[i] * nums[i+1])
                    ops.splice(i,1)
                    return operate(nums,ops)
                } 
            }
            if (ops[0] == '+'){
                nums.splice(0,2, nums[0] + nums[1])
                ops.splice(0,1)
                return operate(nums,ops)
            }
            if (ops[0] == '-'){
                nums.splice(0,2, nums[0] - nums[1])
                ops.splice(0,1)
                return operate(nums,ops)
            }
        }
        function reverseArray(input){
            let reversed = []
            let length = input.length
            for(let i = length-1; i >= 0; i--){
                if(input[i] == ")"){
                    reversed.push("(")
                }
                else if(input[i] == "("){
                    reversed.push(")")
                }
                else {
                    reversed.push(input[i])
                }
            }
            return reversed
        }
        function fixParentheses(input){
            let array = input
            let numLeft = 0
            let numRight = 0
            let partial = []
            let length = input.length
            if(length == 0){
                return [[]]
            }
            for(let i = 0; i < length; i++){
                // ns.tprint(array)
                // check what the next element on the list is, increment the correct counter, and move it to
                // the partial
                if(array[0]== "("){
                    numLeft++
                }
                if(array[0] == ")"){
                    numRight++
                }
                partial.push(array.shift())
    
                if(numRight > numLeft){
                    // fix the current partial, recurse on the remaining array and combine these to give a 
                    // final answer
    
                    // Come up with possible fixes to the partial (precisely 1 more right than left) and put them
                    // in the array "leftPart"
                    let leftPart = []
                    for(let j = 0; j < partial.length; j++){
                        if(partial[j] == ")"){
                            partial.splice(j,1)
                            leftPart.push(partial.slice())
                            partial.splice(j,0,")")
                        }
                    }	
                    let rightPart = fixParentheses(array)
                    let output = []
                    for(let j = 0; j < leftPart.length; j++){
                        for(let k = 0; k < rightPart.length; k++){
                            output.push(leftPart[j].concat(rightPart[k]))
                        }
                    }
                    return output
                }
    
                // If the array is empty, either it was fine all along, or it has excess left parentheses.
                // If it was fine, return it. If it has excess left parentheses, run the function on the reversed
                // array and reverse each output.
                if(array.length == 0){
                    if(numLeft == numRight){
                        return [partial]
                    }
                    let reversed = reverseArray(partial)
                    let reversedStrings = fixParentheses(reversed)
    
                    for(let j = 0; j < reversedStrings.length; j++){
                        reversedStrings[j] = reverseArray(reversedStrings[j])
                    }
                    return reversedStrings
                }
            }
        }
    }