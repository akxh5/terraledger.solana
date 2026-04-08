use anchor_lang::prelude::*;

declare_id!("6sdbh1c8NgDWZZcM6KkWqkKTMtHu7pHnu24xu3y2UUoe");

#[program]
pub mod terraledger {
    use super::*;

    pub fn register_land(
        ctx: Context<RegisterLand>,
        land_id: String,
        metadata_hash: String,
    ) -> Result<()> {
        let land_account = &mut ctx.accounts.land_account;
        
        // Comprehensive input validation
        require!(!land_id.is_empty(), TerraledgerError::EmptyLandId);
        require!(land_id.len() <= 32, TerraledgerError::LandIdTooLong);
        require!(!metadata_hash.is_empty(), TerraledgerError::InvalidMetadataHash);
        require!(metadata_hash.len() <= 64, TerraledgerError::MetadataHashTooLong);

        land_account.owner = ctx.accounts.owner.key();
        land_account.land_id = land_id.clone();
        land_account.metadata_hash = metadata_hash;
        
        // Set timestamps
        let timestamp = Clock::get()?.unix_timestamp;
        land_account.registered_at = timestamp;
        land_account.last_transfer_at = None;
        land_account.bump = ctx.bumps.land_account;

        // Include timestamp in event
        emit!(LandRegistered {
            land_id,
            owner: land_account.owner,
            timestamp,
        });

        Ok(())
    }

    pub fn transfer_ownership(ctx: Context<TransferOwnership>, new_owner: Pubkey) -> Result<()> {
        let land_account = &mut ctx.accounts.land_account;

        let old_owner = land_account.owner;
        land_account.owner = new_owner;
        
        let timestamp = Clock::get()?.unix_timestamp;
        land_account.last_transfer_at = Some(timestamp);

        // Include timestamp in event
        emit!(OwnershipTransferred {
            land_id: land_account.land_id.clone(),
            old_owner,
            new_owner,
            timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(land_id: String)]
pub struct RegisterLand<'info> {
    #[account(
        init,
        payer = owner,
        // Replaced tight calculation with safe 200-byte buffer + 8-byte discriminator
        space = 8 + 200, 
        seeds = [b"land", land_id.as_bytes()],
        bump
    )]
    pub land_account: Account<'info, LandAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferOwnership<'info> {
    #[account(
        mut,
        // Ownership security check
        has_one = owner @ TerraledgerError::Unauthorized,
        seeds = [b"land", land_account.land_id.as_bytes()],
        bump = land_account.bump
    )]
    pub land_account: Account<'info, LandAccount>,
    pub owner: Signer<'info>,
}

#[account]
pub struct LandAccount {
    pub owner: Pubkey,
    pub land_id: String,
    pub metadata_hash: String,
    pub registered_at: i64,
    pub last_transfer_at: Option<i64>,
    pub bump: u8,
}

#[event]
pub struct LandRegistered {
    pub land_id: String,
    pub owner: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct OwnershipTransferred {
    pub land_id: String,
    pub old_owner: Pubkey,
    pub new_owner: Pubkey,
    pub timestamp: i64,
}

#[error_code]
pub enum TerraledgerError {
    #[msg("Land ID cannot be empty.")]
    EmptyLandId,
    #[msg("Land ID is too long (max 32 chars).")]
    LandIdTooLong,
    #[msg("Metadata hash is too long (max 64 chars).")]
    MetadataHashTooLong,
    #[msg("You are not the owner of this land piece.")]
    Unauthorized,
    #[msg("Metadata hash cannot be empty.")]
    InvalidMetadataHash,
    #[msg("The provided Land ID does not match the registered account.")]
    InvalidLandId,
}
