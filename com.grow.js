/** @param {NS} ns */
export async function main(ns) {
   const target = ns.args[0];
   if (!target) {
       ns.tprint("ERROR: No target specified for grow operation.");
       return;
   }

   while (ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target)) {
       ns.print(`[GROW] Target: ${target}, Current Money: ${ns.nFormat(ns.getServerMoneyAvailable(target), "$0.000a")}`);
       await ns.grow(target);
   }
   ns.print(`[GROW] Completed for ${target}. Money is at maximum.`);
}


