const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log("\n🚀 Starting OWS Guardian Interactive Demo...\n");

// 1. Clear the simulator log file (so it doesn’t start with old data)
const logPath = path.join(__dirname, 'simulator-logs.jsonl');
if (fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, '');
    console.log("✅ Previous simulator logs cleared.");
}

// 2. Start the Next.js development server
console.log("🌐 Starting Next.js Frontend...");
const nextServer = spawn('npm', ['run', 'dev'], { 
    stdio: 'inherit',
    shell: true 
});

// 3. Start the agent simulator
console.log("🤖 Initializing Agent Operations Simulator...");
const simulator = spawn('node', ['agent-simulator.js'], { 
    stdio: 'inherit',
    shell: true 
});

// Catch shutdown signals and safely shut down both
process.on('SIGINT', () => {
    console.log("\n🛑 Shutting down OWS Guardian...");
    nextServer.kill();
    simulator.kill();
    process.exit(0);
});