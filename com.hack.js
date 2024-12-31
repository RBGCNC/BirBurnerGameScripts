/** @param {NS} ns */
export async function main(ns) {
   const target = ns.args[0];
   if (!target) {
       ns.tprint("ERROR: No target specified for hack operation.");
       return;
   }

   const stolenMoney = await ns.hack(target);
   ns.tprint(`[HACK] Target: ${target}, Money Stolen: ${ns.nFormat(stolenMoney, "$0.000a")}`);
}


