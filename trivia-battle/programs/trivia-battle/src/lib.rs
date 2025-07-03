use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("7ZAriVE481w9CGmpeHwFVztJ1oUiLFvFzUPNuVutvxKA");

#[program]
pub mod trivia_battle {
    use super::*;

    pub fn create_game(ctx: Context<CreateGame>, entry_fee: u64, correct_answers: [u8; 10]) -> Result<()> {
        let game = &mut ctx.accounts.game;
        game.entry_fee = entry_fee;
        game.game_master = ctx.accounts.game_master.key();
        game.state = GameState::Waiting;
        game.correct_answers = correct_answers;
        game.current_question = 0;
        game.player1_score = 0;
        game.player2_score = 0;
        game.player1_deposited = false;
        game.player2_deposited = false;
        game.prize_pool = 0;
        
        let (vault_pda, _) = Pubkey::find_program_address(
            &[b"vault", game.key().as_ref()],
            ctx.program_id
        );
        game.vault = vault_pda;
        Ok(())
    }

    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        
        if game.player1 == Pubkey::default() {
            game.player1 = ctx.accounts.player.key();
        } else {
            require!(game.player2 == Pubkey::default(), ErrorCode::GameFull);
            game.player2 = ctx.accounts.player.key();
        }
        Ok(())
    }

    pub fn deposit_tokens(ctx: Context<DepositTokens>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = ctx.accounts.player.key();
        
        require!(
            ctx.accounts.player_token_account.amount >= game.entry_fee,
            ErrorCode::InsufficientFunds
        );

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.player_token_account.to_account_info(),
                    to: ctx.accounts.game_vault.to_account_info(),
                    authority: ctx.accounts.player.to_account_info(),
                },
            ),
            game.entry_fee,
        )?;

        if player == game.player1 {
            game.player1_deposited = true;
        } else if player == game.player2 {
            game.player2_deposited = true;
        }

        if game.player1_deposited && game.player2_deposited {
            game.state = GameState::Active;
            game.prize_pool = 2 * game.entry_fee;
        }
        
        Ok(())
    }

    pub fn submit_answer(ctx: Context<SubmitAnswer>, answer_index: u8) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = ctx.accounts.player.key();
        
        require!(game.state == GameState::Active, ErrorCode::GameNotActive);
        require!(
            player == game.player1 || player == game.player2,
            ErrorCode::UnauthorizedPlayer
        );
        
        if answer_index == game.correct_answers[game.current_question as usize] {
            if player == game.player1 {
                game.player1_score += 1;
            } else {
                game.player2_score += 1;
            }
        }
        Ok(())
    }

    pub fn next_question(ctx: Context<NextQuestion>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(game.state == GameState::Active, ErrorCode::GameNotActive);
        
        game.current_question += 1;
        if game.current_question >= 10 {
            game.state = GameState::Completed;
        }
        Ok(())
    }

    pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(game.state == GameState::Completed, ErrorCode::GameNotCompleted);
        
        if game.player1_score == game.player2_score {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.game_vault.to_account_info(),
                        to: ctx.accounts.player1_token_account.to_account_info(),
                        authority: ctx.accounts.game_master.to_account_info(),
                    },
                ),
                game.entry_fee,
            )?;
            
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.game_vault.to_account_info(),
                        to: ctx.accounts.player2_token_account.to_account_info(),
                        authority: ctx.accounts.game_master.to_account_info(),
                    },
                ),
                game.entry_fee,
            )?;
        } else {
            let winner = if game.player1_score > game.player2_score {
                game.player1
            } else {
                game.player2
            };
            
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.game_vault.to_account_info(),
                        to: ctx.accounts.winner_token_account.to_account_info(),
                        authority: ctx.accounts.game_master.to_account_info(),
                    },
                ),
                game.prize_pool,
            )?;
        }
        
        game.state = GameState::Claimed;
        Ok(())
    }
}

#[account]
pub struct Game {
    pub game_master: Pubkey,
    pub player1: Pubkey,
    pub player2: Pubkey,
    pub entry_fee: u64,
    pub prize_pool: u64,
    pub vault: Pubkey,
    pub current_question: u8,
    pub player1_score: u8,
    pub player2_score: u8,
    pub correct_answers: [u8; 10],
    pub state: GameState,
    pub player1_deposited: bool,
    pub player2_deposited: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GameState {
    Waiting,
    Active,
    Completed,
    Claimed,
}

#[derive(Accounts)]
pub struct CreateGame<'info> {
    #[account(init, payer = game_master, space = 8 + 32*4 + 8*2 + 32 + 1*3 + 10 + 1 + 1*2)]
    pub game: Account<'info, Game>,
    #[account(mut)]
    pub game_master: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct DepositTokens<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,
    #[account(mut, address = game.vault)]
    pub game_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SubmitAnswer<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct NextQuestion<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    #[account(address = game.game_master)]
    pub game_master: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    #[account(address = game.game_master)]
    pub game_master: Signer<'info>,
    #[account(mut, address = game.vault)]
    pub game_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub winner_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub player1_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub player2_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Game not completed")]
    GameNotCompleted,
    #[msg("Game not active")]
    GameNotActive,
    #[msg("Game full")]
    GameFull,
    #[msg("Unauthorized player")]
    UnauthorizedPlayer,
    #[msg("Insufficient funds")]
    InsufficientFunds,
}