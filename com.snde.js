// Version: 1.2 - MVP with Dynamic Weaken/Grow Thread Allocation and .txt File Handling
// Purpose: Combines seek, nuke, and deploy logic with dynamic script scaling.
// Filename: com.snde.js

export async function main(ns) {
   // Configurable Variables
   const minRamThreshold = 32; // Minimum RAM in GB for server deployment
   const maxRamUsage = 0.75;   // Use 75% of server's RAM for scripts
   const scriptMultiplier = 0.5; // Multiplier for Weaken/Grow threads
   const scriptsToDeploy = ["rem.com.hwgw.js", "rem.com.weaken.js", "rem.com.grow.js"];
   const blacklistFile = "blacklist.txt";
   const whitelistFile = "whitelist.txt";
   const deployLogFile = "deploy_log.txt";

   // Helper: Load a list from a file
   function loadList(file) {
       if (!ns.fileExists(file)) return [];
       const content = ns.read(file).trim();
       return content.length ? content.split(",") : [];
   }

   // Helper: Save a list to a file
   function saveList(file, list) {
       ns.write(file, list.join(","), "w");
   }

   // Helper: Log deployment results
   function logDeployment(server, status, message) {
       ns.write(deployLogFile, `${server},${status},${message}\n`, "a");
   }

   // Initialize files
   ns.write(deployLogFile, `Server,Status,Message\n`, "w"); // Initialize deployment log
   const blacklist = loadList(blacklistFile);
   const whitelist = loadList(whitelistFile);

   // Scan the network
   async function scanNetwork() {
       const scannedServers = [];
       const queue = ["home"];
       while (queue.length > 0) {
           const server = queue.pop();
           if (!scannedServers.includes(server)) {
               scannedServers.push(server);
               queue.push(...ns.scan(server));
           }
       }
       return scannedServers;
   }

   // Main Logic
   const allServers = await scanNetwork();

   for (const server of allServers) {
       if (server === "home" || blacklist.includes(server)) continue;

       // Gather server information
       const hasRoot = ns.hasRootAccess(server);
       const maxRam = ns.getServerMaxRam(server);
       const usedRam = ns.getServerUsedRam(server);
       const usableRam = maxRam * maxRamUsage;
       const scriptRamHWGW = ns.getScriptRam(scriptsToDeploy[0]);
       const scriptRamWeaken = ns.getScriptRam(scriptsToDeploy[1]);
       const scriptRamGrow = ns.getScriptRam(scriptsToDeploy[2]);

       // Calculate threads
       const totalThreads = Math.floor(usableRam / (scriptRamWeaken + scriptRamGrow));
       const weakenThreads = Math.floor(totalThreads * scriptMultiplier);
       const growThreads = totalThreads - weakenThreads;

       // Blacklist servers with insufficient RAM
       if (maxRam < minRamThreshold) {
           blacklist.push(server);
           saveList(blacklistFile, blacklist);
           logDeployment(server, "BLACKLISTED", "Insufficient RAM");
           continue;
       }

       // Attempt to gain root access
       if (!hasRoot) {
           try {
               if (ns.fileExists("BruteSSH.exe")) ns.brutessh(server);
               if (ns.fileExists("FTPCrack.exe")) ns.ftpcrack(server);
               if (ns.fileExists("relaySMTP.exe")) ns.relaysmtp(server);
               if (ns.fileExists("HTTPWorm.exe")) ns.httpworm(server);
               if (ns.fileExists("SQLInject.exe")) ns.sqlinject(server);
               ns.nuke(server);
           } catch (err) {
               logDeployment(server, "FAILED", `Failed to nuke: ${err.message}`);
               continue;
           }
       }

       // Deploy scripts
       try {
           const copied = await ns.scp(scriptsToDeploy, server, "home");
           if (!copied) {
               logDeployment(server, "FAILED", "Failed to copy scripts");
               continue;
           }
       } catch (err) {
           logDeployment(server, "FAILED", `Script copy error: ${err.message}`);
           continue;
       }

       // Launch HWGW orchestrator script
       try {
           ns.exec(scriptsToDeploy[0], server, 1); // Static single thread for HWGW
           if (weakenThreads > 0) {
               ns.exec(scriptsToDeploy[1], server, weakenThreads); // Dynamic weaken
           }
           if (growThreads > 0) {
               ns.exec(scriptsToDeploy[2], server, growThreads); // Dynamic grow
           }
           whitelist.push(server);
           saveList(whitelistFile, whitelist);
           logDeployment(server, "SUCCESS", `Launched HWGW(1), Weaken(${weakenThreads}), Grow(${growThreads})`);
       } catch (err) {
           logDeployment(server, "FAILED", `Execution error: ${err.message}`);
       }
   }

   // Final Summary
   ns.tprint(`Deployment complete. Logs saved to ${deployLogFile}.`);
}

/*
Changelog:
- v1.0: Initial script combining seek, nuke, and deploy functionality.
- v1.1: Added dynamic weaken/grow thread allocation with scriptMultiplier variable.
- v1.2: Updated to use .txt files for blacklist, whitelist, and deployment logs. Improved logging and error handling.
- v1.3 (Planned): Add automatic removal of unreachable servers and further optimizations.
*/

