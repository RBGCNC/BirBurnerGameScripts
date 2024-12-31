/** @param {NS} ns */
export async function main(ns) {
   const target = ns.args[0];
   if (!target) {
       ns.tprint("ERROR: No target specified for weaken operation.");
       return;
   }

   while (ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target)) {
       ns.print(`[WEAKEN] Target: ${target}, Current Security: ${ns.getServerSecurityLevel(target).toFixed(2)}`);
       await ns.weaken(target);
   }
   ns.print(`[WEAKEN] Completed for ${target}. Security is at minimum.`);
}


