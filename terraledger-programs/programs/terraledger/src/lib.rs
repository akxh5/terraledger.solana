use anchor_lang::prelude::*;

declare_id!("FXfyLUSeLn8pZrUTPjN7iGqjqRBwLRiHz2XKhnoDriQM");

// Squads Program ID (v4)
pub mod squads_multisig {
    use anchor_lang::prelude::declare_id;
    declare_id!("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");
}

// ═══════════════════════════════════════════
// PART 1 — CONSTANTS
// ═══════════════════════════════════════════

use squads_multisig_program::state::Multisig;
pub const MAX_STAKEHOLDERS: usize = 10;
pub const MAX_APPROVED_VERIFIERS: usize = 3;
pub const TOTAL_BPS: u32 = 10_000;
pub const MIN_STAKEHOLDER_BPS: u16 = 100;
pub const MIN_DISPUTE_BPS: u16 = 500;
pub const MIN_DOCUMENT_UPDATE_BPS: u16 = 2_000;
pub const MAX_PARCEL_ID_LEN: usize = 64;
pub const MAX_IPFS_HASH_LEN: usize = 64;

#[program]
pub mod terraledger {
    use super::*;

    // ──────────────────────────────────────────
    // 1. register_land
    // ──────────────────────────────────────────
    pub fn register_land(
        ctx: Context<RegisterLand>,
        parcel_id: String,
        ipfs_document: String,
        initial_stakeholders: Vec<Stakeholder>,
        initial_verifiers: Vec<Pubkey>,
        dispute_threshold_bps: u16,
    ) -> Result<()> {
        // Guards
        validate_strings(&parcel_id, &ipfs_document)?;
        require!(
            initial_verifiers.len() >= 1 && initial_verifiers.len() <= MAX_APPROVED_VERIFIERS,
            ErrorCode::InvalidVerifierList
        );
        require!(
            dispute_threshold_bps >= 100 && dispute_threshold_bps <= 2_000,
            ErrorCode::InvalidDisputeThreshold
        );
        validate_cap_table(&initial_stakeholders)?;

        // Squads validation
        let multisig_info = ctx.accounts.multisig.to_account_info();
        require!(
            multisig_info.owner == &squads_multisig::ID,
            ErrorCode::InvalidMultisigOwner
        );

        let data = multisig_info.try_borrow_data()?;
        require!(data.len() >= 74, ErrorCode::InvalidMultisigOwner); // Bounds check to prevent panic
        let threshold = u16::from_le_bytes([data[72], data[73]]);
        require!(threshold >= 1, ErrorCode::InvalidMultisigThreshold);

        let land = &mut ctx.accounts.land_account;
        land.parcel_id = parcel_id;
        land.ipfs_document = ipfs_document;
        land.registered_at = Clock::get()?.unix_timestamp;
        land.history_count = 0;
        land.stakeholders = initial_stakeholders;
        land.registrar_authority = ctx.accounts.multisig.key();
        land.approved_verifiers = initial_verifiers;
        land.status = ParcelStatus::PendingVerification;
        land.dispute_threshold_bps = dispute_threshold_bps;

        Ok(())
    }

    // ──────────────────────────────────────────
    // 2. activate_parcel
    // ──────────────────────────────────────────
    pub fn activate_parcel(ctx: Context<ActivateParcel>) -> Result<()> {
        let land = &mut ctx.accounts.land_account;

        // Guards
        require!(
            land.status == ParcelStatus::PendingVerification,
            ErrorCode::ParcelNotPending
        );
        require!(
            land.approved_verifiers.contains(&ctx.accounts.verifier.key()),
            ErrorCode::InvalidVerifier
        );
        require!(
            ctx.accounts.verifier.is_signer,
            ErrorCode::VerifierSignatureRequired
        );

        land.status = ParcelStatus::Active;
        Ok(())
    }

    // ──────────────────────────────────────────
    // 3. transfer_partial
    // ──────────────────────────────────────────
    pub fn transfer_partial(
        ctx: Context<TransferPartial>,
        recipient: Pubkey,
        shares_bps: u16,
    ) -> Result<()> {
        let land = &mut ctx.accounts.land_account;

        // Guards
        require!(land.status == ParcelStatus::Active, ErrorCode::ParcelNotActive);
        
        let sender_key = ctx.accounts.signer.key();
        let sender_idx = land
            .stakeholders
            .iter()
            .position(|s| s.owner == sender_key)
            .ok_or(ErrorCode::NotAStakeholder)?;

        require!(
            land.stakeholders[sender_idx].shares_bps >= shares_bps,
            ErrorCode::InsufficientShares
        );

        // Mutation
        land.stakeholders[sender_idx].shares_bps = land.stakeholders[sender_idx]
            .shares_bps
            .checked_sub(shares_bps)
            .ok_or(ErrorCode::ArithmeticError)?;

        if land.stakeholders[sender_idx].shares_bps == 0 {
            land.stakeholders.remove(sender_idx);
        }

        if let Some(r) = land.stakeholders.iter_mut().find(|s| s.owner == recipient) {
            r.shares_bps = r
                .shares_bps
                .checked_add(shares_bps)
                .ok_or(ErrorCode::ArithmeticError)?;
        } else {
            require!(
                land.stakeholders.len() < MAX_STAKEHOLDERS,
                ErrorCode::MaxStakeholdersReached
            );
            land.stakeholders.push(Stakeholder {
                owner: recipient,
                shares_bps,
            });
        }

        // Terminal call
        validate_cap_table(&land.stakeholders)?;
        Ok(())
    }

    // ──────────────────────────────────────────
    // 4. update_document
    // ──────────────────────────────────────────
    pub fn update_document(ctx: Context<UpdateDocument>, new_ipfs_hash: String) -> Result<()> {
        let land = &mut ctx.accounts.land_account;

        // Guards
        require!(land.status == ParcelStatus::Active, ErrorCode::ParcelNotActive);
        validate_strings(&land.parcel_id, &new_ipfs_hash)?;

        let signer_key = ctx.accounts.signer.key();
        let signer_stake = land
            .stakeholders
            .iter()
            .find(|s| s.owner == signer_key)
            .map(|s| s.shares_bps)
            .unwrap_or(0);

        require!(
            signer_stake >= MIN_DOCUMENT_UPDATE_BPS,
            ErrorCode::InsufficientStakeForDocumentUpdate
        );
        require!(
            land.approved_verifiers.contains(&ctx.accounts.verifier.key()),
            ErrorCode::InvalidVerifier
        );
        require!(
            ctx.accounts.verifier.is_signer,
            ErrorCode::VerifierSignatureRequired
        );

        // State written
        let history_entry = &mut ctx.accounts.history_entry;
        history_entry.parcel_id = land.parcel_id.clone();
        history_entry.ipfs_hash = new_ipfs_hash.clone();
        history_entry.updated_by = signer_key;
        history_entry.timestamp = Clock::get()?.unix_timestamp;
        history_entry.entry_index = land.history_count;

        land.ipfs_document = new_ipfs_hash;
        land.history_count += 1;

        Ok(())
    }

    // ──────────────────────────────────────────
    // 5. lock_parcel
    // ──────────────────────────────────────────
    pub fn lock_parcel(ctx: Context<LockParcel>) -> Result<()> {
        let land = &mut ctx.accounts.land_account;

        // Check 1: the multisig account passed matches what's stored
        require!(
            ctx.accounts.multisig.key() == land.registrar_authority,
            ErrorCode::UnauthorizedMultisig
        );

        // Check 2: verify the Squads Vault PDA is a signer
        require!(
            ctx.accounts.multisig_signer.is_signer,
            ErrorCode::MultisigApprovalRequired
        );

        require!(land.status == ParcelStatus::Active, ErrorCode::ParcelNotActive);

        land.status = ParcelStatus::Locked;
        Ok(())
    }

    // ──────────────────────────────────────────
    // 6. unlock_parcel
    // ──────────────────────────────────────────
    pub fn unlock_parcel(ctx: Context<UnlockParcel>) -> Result<()> {
        let land = &mut ctx.accounts.land_account;

        // Check 1: the multisig account passed matches what's stored
        require!(
            ctx.accounts.multisig.key() == land.registrar_authority,
            ErrorCode::UnauthorizedMultisig
        );

        // Check 2: verify the Squads Vault PDA is a signer
        require!(
            ctx.accounts.multisig_signer.is_signer,
            ErrorCode::MultisigApprovalRequired
        );

        require!(land.status == ParcelStatus::Locked, ErrorCode::ParcelNotLocked);

        land.status = ParcelStatus::Active;
        Ok(())
    }

    // ──────────────────────────────────────────
    // 7. raise_dispute
    // ──────────────────────────────────────────
    pub fn raise_dispute(ctx: Context<RaiseDispute>) -> Result<()> {
        let land = &mut ctx.accounts.land_account;

        // Guards
        require!(land.status == ParcelStatus::Active, ErrorCode::ParcelNotActive);

        let signer_key = ctx.accounts.signer.key();
        let signer_stake = land
            .stakeholders
            .iter()
            .find(|s| s.owner == signer_key)
            .map(|s| s.shares_bps)
            .unwrap_or(0);

        require!(
            signer_stake >= land.dispute_threshold_bps,
            ErrorCode::InsufficientStakeForDispute
        );

        land.status = ParcelStatus::Disputed;
        Ok(())
    }

    // ──────────────────────────────────────────
    // 8. resolve_dispute
    // ──────────────────────────────────────────
    pub fn resolve_dispute(ctx: Context<ResolveDispute>) -> Result<()> {
        let land = &mut ctx.accounts.land_account;

        // Check 1: the multisig account passed matches what's stored
        require!(
            ctx.accounts.multisig.key() == land.registrar_authority,
            ErrorCode::UnauthorizedMultisig
        );

        // Check 2: verify the Squads Vault PDA is a signer
        require!(
            ctx.accounts.multisig_signer.is_signer,
            ErrorCode::MultisigApprovalRequired
        );

        require!(
            land.status == ParcelStatus::Disputed,
            ErrorCode::ParcelNotDisputed
        );

        land.status = ParcelStatus::Active;
        Ok(())
    }

    // ──────────────────────────────────────────
    // 9. transfer_authority
    // ──────────────────────────────────────────
    pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
        let land = &mut ctx.accounts.land_account;

        // Check 1: the multisig account passed matches what's stored
        require!(
            ctx.accounts.multisig.key() == land.registrar_authority,
            ErrorCode::UnauthorizedMultisig
        );

        // Check 2: verify the Squads Vault PDA is a signer
        require!(
            ctx.accounts.multisig_signer.is_signer,
            ErrorCode::MultisigApprovalRequired
        );

        require!(
            land.status != ParcelStatus::Disputed,
            ErrorCode::AuthorityTransferBlockedDuringDispute
        );
        require!(new_authority != Pubkey::default(), ErrorCode::InvalidAuthority);

        land.registrar_authority = new_authority;
        land.approved_verifiers.clear();
        Ok(())
    }

    // ──────────────────────────────────────────
    // 10. update_verifiers
    // ──────────────────────────────────────────
    pub fn update_verifiers(ctx: Context<UpdateVerifiers>, new_verifiers: Vec<Pubkey>) -> Result<()> {
        let land = &mut ctx.accounts.land_account;

        // Check 1: the multisig account passed matches what's stored
        require!(
            ctx.accounts.multisig.key() == land.registrar_authority,
            ErrorCode::UnauthorizedMultisig
        );

        // Check 2: verify the Squads Vault PDA is a signer
        require!(
            ctx.accounts.multisig_signer.is_signer,
            ErrorCode::MultisigApprovalRequired
        );

        require!(
            land.status != ParcelStatus::Disputed,
            ErrorCode::VerifierUpdateBlockedDuringDispute
        );
        require!(
            new_verifiers.len() >= 1 && new_verifiers.len() <= MAX_APPROVED_VERIFIERS,
            ErrorCode::InvalidVerifierList
        );

        land.approved_verifiers = new_verifiers;
        Ok(())
    }
}

// ═══════════════════════════════════════════
// PART 2 — DATA STRUCTURES
// ═══════════════════════════════════════════

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum ParcelStatus {
    PendingVerification,
    Active,
    Locked,
    Disputed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Stakeholder {
    pub owner: Pubkey,   // 32 bytes
    pub shares_bps: u16, // 2 bytes
}

#[account]
#[derive(InitSpace)]
pub struct LandAccount {
    #[max_len(64)]
    pub parcel_id: String,
    #[max_len(64)]
    pub ipfs_document: String,
    pub registered_at: i64,
    pub history_count: u64,
    #[max_len(10)]
    pub stakeholders: Vec<Stakeholder>,
    pub registrar_authority: Pubkey,
    #[max_len(3)]
    pub approved_verifiers: Vec<Pubkey>,
    pub status: ParcelStatus,
    pub dispute_threshold_bps: u16,
}

// ═══════════════════════════════════════════
// PART 3 — HELPER FUNCTIONS
// ═══════════════════════════════════════════

fn validate_strings(parcel_id: &str, ipfs_document: &str) -> Result<()> {
    require!(
        parcel_id.as_bytes().len() <= MAX_PARCEL_ID_LEN,
        ErrorCode::ParcelIdTooLong
    );
    require!(
        ipfs_document.as_bytes().len() <= MAX_IPFS_HASH_LEN,
        ErrorCode::IpfsHashTooLong
    );
    Ok(())
}

fn validate_cap_table(stakeholders: &Vec<Stakeholder>) -> Result<()> {
    require!(
        stakeholders.len() <= MAX_STAKEHOLDERS,
        ErrorCode::MaxStakeholdersReached
    );
    require!(
        stakeholders.iter().all(|s| s.shares_bps >= MIN_STAKEHOLDER_BPS),
        ErrorCode::SharesBelowMinimum
    );
    let total: u32 = stakeholders.iter().map(|s| s.shares_bps as u32).sum();
    require!(total == TOTAL_BPS, ErrorCode::InvalidCapTable);
    Ok(())
}

// ═══════════════════════════════════════════
// PART 5 — ERROR CODES
// ═══════════════════════════════════════════

#[error_code]
pub enum ErrorCode {
    ParcelIdTooLong,
    IpfsHashTooLong,
    InvalidCapTable,
    NotAStakeholder,
    InsufficientShares,
    SharesBelowMinimum,
    MaxStakeholdersReached,
    Unauthorized,
    InvalidVerifier,
    VerifierSignatureRequired,
    InvalidVerifierList,
    InvalidAuthority,
    ParcelNotActive,
    ParcelNotLocked,
    ParcelNotDisputed,
    ParcelNotPending,
    ParcelIsLocked,
    ParcelIsDisputed,
    AuthorityTransferBlockedDuringDispute,
    VerifierUpdateBlockedDuringDispute,
    InsufficientStakeForDispute,
    InvalidDisputeThreshold,
    InsufficientStakeForDocumentUpdate,
    UnauthorizedMultisig,
    MultisigApprovalRequired,
    InvalidMultisigOwner,
    InvalidMultisigThreshold,
    InvalidMultisigMembers,
    UnauthorizedRegistration,
    ArithmeticError,
}

// ═══════════════════════════════════════════
// PART 6 — HISTORY PDA
// ═══════════════════════════════════════════

#[account]
pub struct HistoryEntry {
    pub parcel_id: String, // max 64 bytes
    pub ipfs_hash: String, // max 64 bytes
    pub updated_by: Pubkey,
    pub timestamp: i64,
    pub entry_index: u64,
}

pub const HISTORY_ENTRY_SIZE: usize = 8 + 4 + 64 + 4 + 64 + 32 + 8 + 8 + 16;

// ═══════════════════════════════════════════
// ACCOUNTS CONTEXTS
// ═══════════════════════════════════════════

#[derive(Accounts)]
#[instruction(parcel_id: String)]
pub struct RegisterLand<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + LandAccount::INIT_SPACE,
        seeds = [b"land", parcel_id.as_bytes()],
        bump
    )]
    pub land_account: Box<Account<'info, LandAccount>>,
    /// CHECK: Manual validation of Squads ownership and threshold
    pub multisig: UncheckedAccount<'info>,
    #[account(
        seeds = [
            b"squad",
            multisig.key().as_ref(),
            &[0u8, 0u8, 0u8, 0u8],
            b"vault"
        ],
        bump,
        seeds::program = squads_multisig::ID
    )]
    pub multisig_signer: SystemAccount<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}#[derive(Accounts)]
pub struct ActivateParcel<'info> {
    #[account(
        mut,
        seeds = [b"land", land_account.parcel_id.as_bytes()],
        bump
    )]
    pub land_account: Box<Account<'info, LandAccount>>,
    pub verifier: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferPartial<'info> {
    #[account(
        mut,
        seeds = [b"land", land_account.parcel_id.as_bytes()],
        bump
    )]
    pub land_account: Box<Account<'info, LandAccount>>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateDocument<'info> {
    #[account(
        mut,
        seeds = [b"land", land_account.parcel_id.as_bytes()],
        bump
    )]
    pub land_account: Box<Account<'info, LandAccount>>,
    #[account(
        init,
        payer = signer,
        space = HISTORY_ENTRY_SIZE,
        seeds = [b"history", land_account.parcel_id.as_bytes(), &land_account.history_count.to_le_bytes()],
        bump
    )]
    pub history_entry: Account<'info, HistoryEntry>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub verifier: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LockParcel<'info> {
    #[account(
        mut,
        seeds = [b"land", land_account.parcel_id.as_bytes()],
        bump
    )]
    pub land_account: Box<Account<'info, LandAccount>>,
    /// CHECK: Manual authority verification
    pub multisig: UncheckedAccount<'info>,
    #[account(
        seeds = [
            b"squad",
            multisig.key().as_ref(),
            &[0u8, 0u8, 0u8, 0u8],
            b"vault"
        ],
        bump,
        seeds::program = squads_multisig::ID
    )]
    pub multisig_signer: SystemAccount<'info>,
}

#[derive(Accounts)]
pub struct UnlockParcel<'info> {
    #[account(
        mut,
        seeds = [b"land", land_account.parcel_id.as_bytes()],
        bump
    )]
    pub land_account: Box<Account<'info, LandAccount>>,
    /// CHECK: Manual authority verification
    pub multisig: UncheckedAccount<'info>,
    #[account(
        seeds = [
            b"squad",
            multisig.key().as_ref(),
            &[0u8, 0u8, 0u8, 0u8],
            b"vault"
        ],
        bump,
        seeds::program = squads_multisig::ID
    )]
    pub multisig_signer: SystemAccount<'info>,
}

#[derive(Accounts)]
pub struct RaiseDispute<'info> {
    #[account(
        mut,
        seeds = [b"land", land_account.parcel_id.as_bytes()],
        bump
    )]
    pub land_account: Box<Account<'info, LandAccount>>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(
        mut,
        seeds = [b"land", land_account.parcel_id.as_bytes()],
        bump
    )]
    pub land_account: Box<Account<'info, LandAccount>>,
    /// CHECK: Manual authority verification
    pub multisig: UncheckedAccount<'info>,
    #[account(
        seeds = [
            b"squad",
            multisig.key().as_ref(),
            &[0u8, 0u8, 0u8, 0u8],
            b"vault"
        ],
        bump,
        seeds::program = squads_multisig::ID
    )]
    pub multisig_signer: SystemAccount<'info>,
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(
        mut,
        seeds = [b"land", land_account.parcel_id.as_bytes()],
        bump
    )]
    pub land_account: Box<Account<'info, LandAccount>>,
    /// CHECK: Manual authority verification
    pub multisig: UncheckedAccount<'info>,
    #[account(
        seeds = [
            b"squad",
            multisig.key().as_ref(),
            &[0u8, 0u8, 0u8, 0u8],
            b"vault"
        ],
        bump,
        seeds::program = squads_multisig::ID
    )]
    pub multisig_signer: SystemAccount<'info>,
}

#[derive(Accounts)]
pub struct UpdateVerifiers<'info> {
    #[account(
        mut,
        seeds = [b"land", land_account.parcel_id.as_bytes()],
        bump
    )]
    pub land_account: Box<Account<'info, LandAccount>>,
    /// CHECK: Manual authority verification
    pub multisig: UncheckedAccount<'info>,
    #[account(
        seeds = [
            b"squad",
            multisig.key().as_ref(),
            &[0u8, 0u8, 0u8, 0u8],
            b"vault"
        ],
        bump,
        seeds::program = squads_multisig::ID
    )]
    pub multisig_signer: SystemAccount<'info>,
}
