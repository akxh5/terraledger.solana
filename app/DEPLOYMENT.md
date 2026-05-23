# TerraLedger Deployment Guide

## Vercel Dashboard Configuration

To deploy the TerraLedger frontend on Vercel, set the following environment variables in your project settings:

| Key | Value |
| :--- | :--- |
| `VITE_CLUSTER` | `devnet` |
| `VITE_RPC_ENDPOINT` | `https://api.devnet.solana.com` |
| `VITE_PROGRAM_ID` | `FXfyLUSeLn8pZrUTPjN7iGqjqRBwLRiHz2XKhnoDriQM` |
| `VITE_DEMO_MODE` | `true` |

## Deployment Steps

1. Push the code to a GitHub repository.
2. Link the repository to a new project in the Vercel dashboard.
3. Vercel will automatically detect the Vite configuration.
4. Ensure the build command is `npm run build` and the output directory is `dist`.
5. Deploy.

## On-Chain Verification

The TerraLedger smart contract is deployed on Solana Devnet.
- **Program ID**: `FXfyLUSeLn8pZrUTPjN7iGqjqRBwLRiHz2XKhnoDriQM`
- **View on Explorer**: [Solana Explorer (Devnet)](https://explorer.solana.com/address/FXfyLUSeLn8pZrUTPjN7iGqjqRBwLRiHz2XKhnoDriQM?cluster=devnet)
