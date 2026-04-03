const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const AGENT_TOKEN = "ows_key_92ad4b50566bee68b23bf12a3141d85aebb83978907cff46f593a4a75bcca831"; 
const WALLET_NAME = "guardian-treasury";
const targetNetworks = ["eip155:11155111", "eip155:1"];
const dummyTransactionPayload = "0x02f87101830186a08080843b9aca0080808080";
const logFile = path.join(__dirname, 'simulator-logs.jsonl');

console.log("Initializing Agent Operations...");

if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

setInterval(() => {
    const randomNetwork = targetNetworks[Math.floor(Math.random() * targetNetworks.length)];
    const command = `OWS_PASSPHRASE="${AGENT_TOKEN}" ows sign tx --wallet ${WALLET_NAME} --chain ${randomNetwork} --tx ${dummyTransactionPayload}`;

    exec(command, (error, stdout, stderr) => {
        let status = "AUTHORIZED";
        
        if (error) {
            // Convert the output to lowercase to catch all possible cases
            const errorOutput = (stderr || error.message || "").toLowerCase();
            
            // Only treat it as BLOCKED if it's a Policy Denied or Kill Switch (key revoked) error
            if (errorOutput.includes("policy denied") || errorOutput.includes("policy_denied") || errorOutput.includes("not found") || errorOutput.includes("invalid") || errorOutput.includes("api_key")) {
                status = "BLOCKED";
            } else {
                console.log("System Error (Ignored):", stderr);
                return; // Don’t hit the dashboard — this is a real and unrelated system error
            }
        }

        const logEntry = {
            timestamp: new Date().toISOString().slice(11, 19) + " UTC",
            operation: "SIGN_TRANSACTION",
            chain_id: randomNetwork,
            status: status,
            txHash: status === "AUTHORIZED" ? "0x" + Math.random().toString(16).slice(2, 64).padEnd(64, '0') : null,
            payload: dummyTransactionPayload,
            risk: status === "BLOCKED" ? "CRITICAL" : "LOW"
        };

        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
        console.log(`[${status}] on ${randomNetwork}`);
    });
}, 5000);