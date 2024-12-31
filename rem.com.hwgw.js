/** @param {NS} ns */
export async function main(ns) {
   const RAM_LIMIT = 0.75; // Max RAM usage
   const TARGET_LIST = []; // Local list of valid targets
   const BLACKLIST = ["home", "darkweb", "n00dles"]; // Servers to ignore

   // Build the target list
   function scanNetwork(server) {
       const servers = ns.scan(server);
       for (const s of servers) {
           if (!TARGET_LIST.includes(s) && !BLACKLIST.includes(s)) {
               TARGET_LIST.push(s);
               scanNetwork(s);
           }
       }
   }
   scanNetwork(ns.getHostname());

   // Filter the list for valid targets
   const validTargets = TARGET_LIST.filter(server => {
       return (
           ns.hasRootAccess(server) &&
           ns.getServerMaxMoney(server) > 0 &&
           ns.getServerMaxRam(server) > 0
       );
   });

   if (validTargets.length === 0) {
       ns.tprint("[WARN] No valid targets found. Exiting.");
       return;
   }

   // Main loop
   while (true) {
       for (const target of validTargets) {
           const maxMoney = ns.getServerMaxMoney(target);
           const currentMoney = ns.getServerMoneyAvailable(target);
           const securityLevel = ns.getServerSecurityLevel(target);
           const minSecurity = ns.getServerMinSecurityLevel(target);

           // Decide action: Weaken, Grow, or Hack
           if (securityLevel > minSecurity + 5) {
               // Weaken the server
               ns.print(`[INFO] Weakening ${target} (Security: ${securityLevel})`);
               const weakenThreads = Math.floor(
                   (ns.getServerMaxRam(ns.getHostname()) * RAM_LIMIT) /
                       ns.getScriptRam("rem.com.weaken.js")
               );
               if (weakenThreads > 0) {
                   ns.exec("rem.com.weaken.js", ns.getHostname(), weakenThreads, target);
               } else {
                   ns.print(`[WARN] Not enough RAM to weaken ${target}`);
               }
           } else if (currentMoney < maxMoney * 0.95) {
               // Grow the server
               ns.print(
                   `[INFO] Growing ${target} (Money: ${(
                       (currentMoney / maxMoney) *
                       100
                   ).toFixed(2)}%)`
               );
               const growThreads = Math.floor(
                   (ns.getServerMaxRam(ns.getHostname()) * RAM_LIMIT) /
                       ns.getScriptRam("rem.com.grow.js")
               );
               if (growThreads > 0) {
                   ns.exec("rem.com.grow.js", ns.getHostname(), growThreads, target);
               } else {
                   ns.print(`[WARN] Not enough RAM to grow ${target}`);
               }
           } else {
               // Hack action intentionally skipped in this script
               ns.print(`[INFO] Skipping hack on ${target}.`);
           }

           await ns.sleep(1000); // Pause between actions
       }
   }
}

