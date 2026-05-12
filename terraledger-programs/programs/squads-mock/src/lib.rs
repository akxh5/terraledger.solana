use anchor_lang::prelude::*;

declare_id!("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");

#[program]
pub mod squads_mock {
    use super::*;

    pub fn initialize_multisig(ctx: Context<InitializeMultisig>, threshold: u16) -> Result<()> {
        let multisig = &mut ctx.accounts.multisig;
        multisig.create_key = ctx.accounts.create_key.key();
        multisig.config_authority = ctx.accounts.config_authority.key();
        multisig.threshold = threshold;
        Ok(())
    }

    pub fn vault_noop(_ctx: Context<VaultNoop>) -> Result<()> {
        Ok(())
    }

    pub fn vault_execute<'info>(
        ctx: Context<'_, '_, '_, 'info, VaultExecute<'info>>,
        _data: Vec<u8>,
    ) -> Result<()> {
        let multisig_key = ctx.accounts.multisig.key();
        let seeds = &[
            b"squad",
            multisig_key.as_ref(),
            &[0u8, 0u8, 0u8, 0u8],
            b"vault",
            &[ctx.bumps.vault],
        ];
        let signer_seeds = &[&seeds[..]];

        let accounts: Vec<AccountMeta> = ctx.remaining_accounts
            .iter()
            .map(|acc| AccountMeta {
                pubkey: *acc.key,
                is_signer: acc.is_signer || acc.key == ctx.accounts.vault.key,
                is_writable: acc.is_writable,
            })
            .collect();

        let ix = anchor_lang::solana_program::instruction::Instruction {
            program_id: ctx.accounts.target_program.key(),
            accounts,
            data: _data,
        };

        // We need to pass ALL accounts involved in the IX to invoke_signed,
        // INCLUDING the target program itself.
        let mut account_infos = vec![ctx.accounts.target_program.to_account_info()];
        account_infos.extend(ctx.remaining_accounts.iter().map(|a| a.to_account_info()));

        anchor_lang::solana_program::program::invoke_signed(
            &ix,
            &account_infos,
            signer_seeds,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeMultisig<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 32 + 2 + 100 // discriminator + fields + padding
    )]
    pub multisig: Account<'info, MockMultisig>,
    /// CHECK: Mock data
    pub create_key: UncheckedAccount<'info>,
    /// CHECK: Mock data
    pub config_authority: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VaultNoop<'info> {
    #[account(
        seeds = [
            b"squad",
            multisig.key().as_ref(),
            &[0u8, 0u8, 0u8, 0u8],
            b"vault"
        ],
        bump
    )]
    pub vault: Signer<'info>,
    pub multisig: Account<'info, MockMultisig>,
}

#[derive(Accounts)]
pub struct VaultExecute<'info> {
    #[account(
        seeds = [
            b"squad",
            multisig.key().as_ref(),
            &[0u8, 0u8, 0u8, 0u8],
            b"vault"
        ],
        bump
    )]
    pub vault: SystemAccount<'info>,
    pub multisig: Account<'info, MockMultisig>,
    /// CHECK: The program being called
    pub target_program: UncheckedAccount<'info>,
}

#[account]
pub struct MockMultisig {
    pub create_key: Pubkey,        // 32 bytes
    pub config_authority: Pubkey,  // 32 bytes
    pub threshold: u16,            // 2 bytes
}
