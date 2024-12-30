/** @param {NS} ns */
export async function main(ns) {
   const maxSharePer = 1.00;
   const stockBuyOver = 0.60; // Buy stocks when forecast is over this %
   const stockVolPer = 0.05; // Stocks must be under this volatility
   const moneyKeep = 100_000_000_000; // Minimum cash to keep
   const minSharePer = 5; // Minimum shares to buy
   const sellThreshold = 0.55; // Sell when forecast drops below this
   const commission = 100000; // Flat transaction fee

   while (true) {
       //ns.disableLog('disableLog');
       //ns.disableLog('sleep');
       //ns.disableLog('getServerMoneyAvailable');

       const orderedStocks = ns.stock.getSymbols().sort((a, b) =>
           Math.abs(0.5 - ns.stock.getForecast(b)) - Math.abs(0.5 - ns.stock.getForecast(a))
       );

       let currentWorth = 0;

       for (const stock of orderedStocks) {
           const position = ns.stock.getPosition(stock);
           if (position[0] > 0) {
               sellIfOutsideThreshold(stock, position);
           }
           buyPositions(stock, position);

           // Track current portfolio value
           if (position[0] > 0) {
               const longShares = position[0];
               const longPrice = position[1];
               const bidPrice = ns.stock.getBidPrice(stock);
               const profit = longShares * (bidPrice - longPrice) - (2 * commission);
               currentWorth += profit + (longShares * bidPrice);
           }
       }

       ns.print(
           `Cycle Complete - Stock Worth = ${ns.nFormat(currentWorth, '0,0')} :: Cash in hand = ${ns.nFormat(
               ns.getServerMoneyAvailable('home'),
               '0,0'
           )}`
       );

       await ns.sleep(2000);
   }

   function buyPositions(stock, position) {
       const maxShares = ns.stock.getMaxShares(stock) * maxSharePer - position[0];
       const askPrice = ns.stock.getAskPrice(stock);
       const forecast = ns.stock.getForecast(stock);
       const volPer = ns.stock.getVolatility(stock);
       let playerMoney = ns.getServerMoneyAvailable('home');

       if (forecast >= stockBuyOver && volPer <= stockVolPer) {
           if (playerMoney - moneyKeep > ns.stock.getPurchaseCost(stock, minSharePer, 'Long')) {
               let shares = Math.min((playerMoney - moneyKeep - commission) / askPrice, maxShares);
               shares = Math.max(shares, minSharePer); // Ensure minimum shares
               if (shares >= minSharePer) {
                   ns.stock.buyStock(stock, shares); // Corrected function
                   ns.print(`Bought ${shares} shares of ${stock}`);
               }
           }
       }
   }

   function sellIfOutsideThreshold(stock, position) {
       const forecast = ns.stock.getForecast(stock);
       if (forecast < sellThreshold) {
           ns.stock.sellStock(stock, position[0]); // Corrected function
           ns.print(`Sold ${position[0]} shares of ${stock} due to low forecast (${forecast.toFixed(2)})`);
       }
   }
}


