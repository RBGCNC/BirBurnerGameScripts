// Version: 1.1
// Purpose: Kills all running scripts on each server in the whitelist.
// Filename: net.ka.js

export async function main(ns) {
   const whitelistFile = "whitelist.txt"; // Whitelist file name
   const whitelist = loadWhitelist();

   ns.tail(); // Open the tail window for real-time log monitoring

   // Helper: Load the whitelist from a file
   function loadWhitelist() {
       if (!ns.fileExists(whitelistFile)) {
           ns.tprint(`[ERROR] Whitelist file '${whitelistFile}' not found.`);
           return [];
       }
       const content = ns.read(whitelistFile).trim();
       return content.length ? content.split(",") : [];
   }

   // Process each server in the whitelist
   for (const server of whitelist) {
       if (server === "home") continue; // Avoid killing scripts on home server
       try {
           ns.killall(server); // Kill all scripts on the server
           ns.print(`[INFO] All scripts killed on '${server}'.`);
       } catch (err) {
           ns.print(`[ERROR] Failed to kill scripts on '${server}': ${err.message}`);
       }
   }

   ns.print(`[SUCCESS] killall executed on all whitelisted servers.`);
}

/*
Changelog:
- v1.0: Initial script to kill all running scripts on servers in the whitelist.
- v1.1: Added `ns.tail()` for real-time log monitoring. Changed filename to net.ka.js.
*/

