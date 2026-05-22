# TerraLedger On-Chain Programs

This workspace contains the Solana smart contracts for the TerraLedger protocol, built using the Anchor framework.

## Prerequisites

- **Rust:** `1.75.0+`
- **Solana CLI:** `1.18.0+`
- **Anchor CLI:** `0.31.1`
- **Node.js:** `18.0+`
- **Yarn:** `1.22+`

## Project Structure

- `programs/terraledger`: The core logic for land registration, ownership transfers, and dispute management.
- `programs/squads-mock`: A mock implementation of Squads V4 for local integration testing.
- `tests/`: Comprehensive TypeScript integration tests for all protocol flows.

## Getting Started

1. **Build the programs:**
   ```bash
   anchor build
   ```

2. **Run tests (Localnet):**
   ```bash
   anchor test
   ```

3. **Deploy to Devnet:**
   ```bash
   # Ensure your wallet is configured for devnet and has SOL
   solana config set --url devnet
   anchor deploy --provider.cluster devnet
   ```

## Protocol Details

- **Program ID:** `FXfyLUSeLn8pZrUTPjN7iGqjqRBwLRiHz2XKhnoDriQM`
- **Governance:** Privileged actions are secured by Squads V4 multisig vault transactions.
- **Documentation:** See the project root README for a full architectural overview.

## Integration with Frontend

The frontend in `terraledger-genesis-v2` expects the IDL and types from this workspace. 

After making changes to the Rust program, run:
```bash
anchor build && yarn sync:idl
```
to keep the frontend IDL in sync. The `postbuild` script also triggers this automatically when running builds through npm. Never edit the IDL in the frontend folder manually.
