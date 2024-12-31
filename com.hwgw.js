/** @param {NS} ns */
export async function main(ns) {
   // ================================
   // Configuration
   // Set THREADS = 1 To prep for use on early game runs
   // This file requires com.hack.js, com.weaken.js, and com.
   // ================================
   const PLAYER_HACKING_LEVEL = ns.getHackingLevel();
   const HACK_SCRIPT = "com.hack.js";
   const GROW_SCRIPT = "com.grow.js";
   const WEAKEN_SCRIPT = "com.weaken.js";
   const THREADS = 1; // Threads per operation
   const HACK_THRESHOLD = 0.70; // Minimum success chance to attempt hacking
   const MAX_MONEY_THRESHOLD = 0.95; // Consider server "maxed" if >= 95% of max money

   // Build the initial list of attackable servers
   let targets = getAttackableServers(ns, PLAYER_HACKING_LEVEL);

   if (targets.length === 0) {
       ns.tprint("No eligible targets found. Check your hacking level or network setup.");
       return;
   }

   ns.tprint(`Target list built: ${targets.join(", ")}`);

   // ================================
   // Main Loop
   // ================================
   while (true) {
       // Sort servers by hack success chance (descending)
       targets.sort((a, b) => calculateChanceToHack(ns, b) - calculateChanceToHack(ns, a));

       for (const target of targets) {
           const chanceToHack = calculateChanceToHack(ns, target);
           const moneyAvailable = ns.getServerMoneyAvailable(target);
           const moneyMax = ns.getServerMaxMoney(target);
           const securityLevel = ns.getServerSecurityLevel(target);
           const minSecurity = ns.getServerMinSecurityLevel(target);

           ns.print(`[INFO] Target: ${target}, Chance: ${(chanceToHack * 100).toFixed(2)}%, Money: ${(moneyAvailable / moneyMax * 100).toFixed(2)}%, Security: ${securityLevel.toFixed(2)}`);

           // Determine the action to take
           if (securityLevel > minSecurity + 5) {
               ns.print(`[ACTION] Launching weaken on ${target}`);
               ns.exec(WEAKEN_SCRIPT, "home", THREADS, target);
           } else if (moneyAvailable < moneyMax * MAX_MONEY_THRESHOLD) {
               ns.print(`[ACTION] Launching grow on ${target}`);
               ns.exec(GROW_SCRIPT, "home", THREADS, target);
           } else if (chanceToHack >= HACK_THRESHOLD) {
               ns.print(`[ACTION] Launching hack on ${target}`);
               ns.exec(HACK_SCRIPT, "home", THREADS, target);
           } else {
               ns.print(`[INFO] No action required for ${target}`);
           }

           // Pause between processing targets
           await ns.sleep(1000);
       }

       // Refresh target list periodically
       if (Math.random() < 0.1) {
           ns.tprint("[INFO] Refreshing target list...");
           targets = getAttackableServers(ns, ns.getHackingLevel());
       }
   }
}

// ================================
// Helper Functions
// ================================

/**
* Calculate the chance to hack a server
* @param {NS} ns
* @param {string} target
* @returns {number} Chance to hack (0 to 1)
*/
function calculateChanceToHack(ns, target) {
   const hackingLevel = ns.getHackingLevel();
   const requiredHackingLevel = ns.getServerRequiredHackingLevel(target);
   const securityLevel = ns.getServerSecurityLevel(target);

   return Math.max(
       0,
       Math.min(
           1,
           (hackingLevel - requiredHackingLevel + 1) /
           (2.5 * requiredHackingLevel * securityLevel)
       )
   );
}

/**
* Build a list of attackable servers
* @param {NS} ns
* @param {number} hackingLevel
* @returns {string[]} List of server names
*/
function getAttackableServers(ns, hackingLevel) {
   const visited = new Set();
   const stack = ["home"];
   const targets = [];

   while (stack.length > 0) {
       const current = stack.pop();

       if (!visited.has(current)) {
           visited.add(current);

           if (
               ns.hasRootAccess(current) &&
               ns.getServerRequiredHackingLevel(current) <= hackingLevel &&
               ns.getServerMaxMoney(current) > 0
           ) {
               targets.push(current);
           }

           stack.push(...ns.scan(current));
       }
   }

   return targets;
}

