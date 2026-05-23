# TerraLedger Genesis v2

TerraLedger is a decentralized infrastructure layer for verifiable land ownership. By combining the speed and transparency of the Solana blockchain with cryptographically anchored off-chain documentation, TerraLedger provides an immutable, transparent, and multi-party-verified registry for property rights.

## Vision
To bridge the gap between traditional land registries and the digital economy, ensuring that ownership is not just a claim, but a verifiable on-chain truth.

### Key Pillars
- **Immutability:** On-chain records ensure historical integrity.
- **Verification:** Multi-party attestation through Squads multisig.
- **Liquidity:** Fractionalized ownership through stake-based transfers.
- **Transparency:** Publicly auditable state and document anchoring via IPFS.

## Core Features
- **On-Chain Property Registry:** Securely register land parcels as unique accounts on the Solana Devnet.
- **Fractional Stake Transfers:** Transfer specific percentages of property ownership to multiple stakeholders.
- **Multisig Governance:** Privileged actions (Locking, Unlocking, Dispute Resolution) are secured by Squads 2-of-3 multisig.
- **Verification Pipeline:** Automated tracking of verification status (Pending, Active, Locked, Disputed).
- **IPFS Integration:** Cryptographic linking of legal documents to on-chain property records.

## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion
- **Blockchain Interface:** @coral-xyz/anchor, @solana/web3.js
- **Multisig Framework:** @sqds/multisig (Squads Protocol)
- **State Management:** TanStack Query (React Query)
- **UI Components:** Shadcn UI, Lucide React
- **Animations:** GSAP, Framer Motion

## Getting Started

### Prerequisites
- Node.js (v18+)
- Bun or NPM
- A Solana wallet (Phantom/Solflare) with Devnet SOL

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/akxh5/terraledger.git
   cd app
   ```
2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```
3. Start the development server:
   ```bash
   bun dev
   # or
   npm run dev
   ```

## IDL Synchronization

The IDL and TypeScript types are automatically synchronized from the `programs` workspace. 

- **Never edit** `src/lib/anchor/terraledger.json` or `src/lib/anchor/terraledger.ts` manually.
- The sync runs automatically on `npm run dev` and `npm run build`.
- You can manually sync using:
  ```bash
  npm run sync:idl
  ```

## System Architecture

### 1. Land Registry (Anchor Program)
The core logic resides in a Solana program that manages `LandAccount` PDAs. Each account tracks:
- **Stakeholders:** A list of owners and their basis point (BPS) shares.
- **Status:** The current state of the parcel (Active, Locked, etc.).
- **Registrar Authority:** The multisig address responsible for administrative actions.

### 2. Multisig (Squads)
Privileged operations like `lockParcel` or `resolveDispute` cannot be executed by a single user. Instead, they require a 2-of-3 signature from the Squads multisig vault, ensuring institutional-grade security for the registry.

### 3. Frontend Dashboard
A modern, animated dashboard that allows users to:
- Register new parcels.
- Visualize stakeholder distributions with Cap Tables.
- Execute partial transfers of ownership stake.
- Monitor real-time status changes from the blockchain.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)

---
Built with ❤️ for the Solana Ecosystem by [aksh11ansh](https://medium.com/@aksh11ansh)
