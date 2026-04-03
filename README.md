# 🛡️ OWS Guardian Dashboard

> **"Datadog for Agent Wallets."**
> Fulfilling the core infrastructure needs for *Category 02: Agent Spend Governance & Identity.*

## 💡 The Vision: Killing the `.env` Vulnerability
As AI agents become first-class participants in DeFi, giving them raw private keys is a catastrophic security risk. Traditional architectures force developers to scatter keys in `.env` files or rely on centralized cloud HSMs. 

**OWS Guardian** changes the paradigm. Built entirely on top of the **Open Wallet Standard (OWS)**, Guardian acts as an impenetrable middleware. Agents never see the private key. They only receive an `ows_key_` token bound to strict **in-process cryptographic policies**. Guardian monitors, visualizes, and—when necessary—terminates these agents in real-time.

## ✨ Core Capabilities
* 🚦 **Real-Time Forensic Stream:** Monitors agent signature requests. Visualizes successful (Authorized) signatures alongside failed attempts (Blocked by Policy).
* 📜 **Native Policy Enforcement:** Fully integrated with OWS Policy Engine. If an agent goes rogue and tries to sign a Mainnet transaction when restricted to Sepolia, Guardian catches the `POLICY_DENIED` error and logs the violation.
* 🛑 **The "Kill Switch" (Hardware-Level Revocation):** A 1-click irreversible emergency protocol. Executes `ows key revoke` to physically destroy the agent's decryption capability locally. Zero key rotation required.
* 📊 **Dynamic Trust Score:** Algorithmic security scoring based on the ratio of authorized protocol operations vs. policy violations.
* 🔐 **Local-First Architecture:** No cloud dependencies. Reads directly from local `.ows` architecture.

## 🏗️ Architecture & OWS Integration
We didn't just build a UI; we deeply integrated with the core OWS specification documents:

| OWS Spec | How Guardian Uses It |
| :--- | :--- |
| **03 — Policy Engine** | Guardian's simulator relies on strict declarative rules (e.g., `{"type": "allowed_chains"}`). Unwanted Mainnet requests are actively blocked before memory decryption occurs. |
| **04 — Agent Access** | The simulator uses `OWS_PASSPHRASE` with an `ows_key_...` API token. The agent proves its capability without ever touching the mnemonic. |
| **01 — Storage Format** | The Kill Switch operates on `~/.ows/keys/` directory, purging the token's capability permanently upon dashboard command. |

## 🚀 Quick Start (Running the Demo)
To experience the OWS Guardian, you need to simulate an agent interacting with a local OWS vault.

### 1. Prerequisites (OWS Setup)
Ensure you have Node.js installed, then install the OWS core:
```bash
npm install -g @open-wallet-standard/core
```

### 2. Configure the Vault & Policy
Create a secure testing environment:
```bash
# Create the treasury wallet
ows wallet create --name "guardian-treasury"

# Create a policy file limiting the agent to Sepolia ONLY
cat > ~/.ows/policies/sepolia-only.json << 'EOF'
{
  "id": "sepolia-only",
  "name": "Strict Sepolia Access",
  "version": 1,
  "created_at": "2026-04-03T00:00:00Z",
  "rules": [
    { "type": "allowed_chains", "chain_ids": ["eip155:11155111"] }
  ],
  "action": "deny"
}
EOF

# Provision the Agent Token
ows key create --name "DeFi-Arbitrage-Bot" --wallet guardian-treasury --policy sepolia-only
```
⚠️ **IMPORTANT:** The terminal will output an `ows_key_...` token and a `Key ID`. Keep these ready.

### 3. Connect Guardian to Your Local Node
Clone this repository and open the source code:

Open `agent-simulator.js` and paste your generated token:
```javascript
const AGENT_TOKEN = "ows_key_PASTE_YOUR_GENERATED_TOKEN_HERE";
```

Open `app/api/logs/route.ts` (or your backend logic) and paste your Key ID for the Kill Switch:
```javascript
const KEY_ID = "PASTE_YOUR_KEY_ID_HERE_FOR_REVOCATION";
```

### 4. Ignite the System
We built this for zero-friction evaluation. No need to manage multiple terminals or bash scripts. Install dependencies and launch both the Next.js dashboard and the Agent Simulator simultaneously with a single command:
```bash
npm install
npm run demo
```

### 5. Witness the Guardian
Open `http://localhost:3000`.
* Watch as the agent successfully signs Sepolia transactions.
* Watch as the OWS Policy Engine drops the hammer (BLOCKED) when the agent maliciously attempts a Mainnet transaction.
* Click **EXECUTE KILL SWITCH** to instantly revoke the agent's access. Watch the simulator fail instantly, reflecting the hardware-level revocation.

## 🛠 Tech Stack
* **Frontend:** Next.js (App Router), Tailwind CSS, Recharts (Data Viz), Lucide React.
* **Backend Integration:** Node.js `child_process`, File System API (Local `.jsonl` streaming).
* **Protocol:** `@open-wallet-standard/core` CLI & Specifications.

---
*“With great AI autonomy comes the absolute necessity for cryptographic boundaries. OWS provides the boundary; Guardian provides the eyes.”*