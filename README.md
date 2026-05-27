# TerraLedger Monorepo

TerraLedger is a decentralized infrastructure layer for verifiable land ownership on the Solana blockchain.

## Project Structure

- `programs/`: Anchor-based smart contracts (Rust).
- `app/`: React-based frontend dashboard (TypeScript).
- `scripts/`: Automation and synchronization utilities.

## Development Workflow

To ensure the frontend stays in sync with the smart contract changes, follow this workflow:

1. **Make changes to the Rust program** in `programs/`.
2. **Build the programs** to generate the new IDL:
   ```bash
   cd programs
   anchor build
   ```
3. **Sync the IDL to the frontend**:
   ```bash
   # From the monorepo root
   npm run sync:idl --prefix app
   # OR from app/
   npm run sync:idl
   ```
4. **Start the frontend**:
   ```bash
   cd app
   npm run dev
   ```
   *Note: `npm run dev` and `npm run build` will automatically run the sync script.*

## IDL Management

- **Automatic Sync:** Every `anchor build` (via `postbuild`) and every frontend `dev`/`build` (via `predev`/`prebuild`) triggers the `scripts/sync-idl.js` script.
- **Validation:** A pre-commit hook runs `scripts/validate-idl-sync.js` to ensure that the committed IDL in the frontend matches the one in the programs folder.
- **Manual Sync:** If you ever need to manually sync, run `node scripts/sync-idl.js` from the root or `npm run sync:idl` in the frontend folder.

## Demo Recording Checklist

Follow these steps to ensure a perfect one-take demo:

1. **Pre-warm the Environment**:
   ```bash
   bash scripts/prewarm.sh
   ```
   Confirm all checks are green (✓).

2. **Seed Demo State**:
   ```bash
   # Ensure you have ts-node installed
   npx ts-node scripts/seed-demo.ts
   ```
   Confirm 2 parcels are seeded (New Delhi and Hyderabad).

3. **Browser Setup**:
   - Open `terraledger-solana.vercel.app` in a clean Chrome profile.
   - Set browser zoom to **110%**.
   - Connect the Demo Wallet (Phantom) using the seed phrase: 
     `terraledger demo wallet seed phrase for recording`
   - Activate **DEMO MODE** by typing `Ctrl + Shift + D` (or `Cmd + Shift + D`).

4. **Verification**:
   - Confirm **New Delhi** parcel shows as **Active** in the dashboard.
   - Confirm **Hyderabad** parcel shows in the **Verifier** queue.
   - Verify that the **Aadhaar Linked (Demo)** badge is visible.

5. **Record**:
   - Hit record and follow the demo script.
   - Do not deviate from the pre-seeded flow for maximum stability.
