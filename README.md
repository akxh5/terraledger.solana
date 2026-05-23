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

## Verification

To manually check if the IDL is in sync:
```bash
npm run validate:idl --prefix app
```
