// ====================== CONSTANTS ======================
const TOKEN_DECIMALS = 9; // 1 GORB = 1_000_000_000 lamports

// ====================== STATE ======================
window.gameState = {
    currentQuestion: 0,
    player1Score: 0,
    player2Score: 0,
    publicKey: null,
    playerRole: null,
    gameId: null,
    vaultAddress: null,
    depositStatus: { player1: false, player2: false }
};

// ====================== DEPOSIT LOGIC ======================
async function checkDeposits() {
    try {
        const game = await program.account.game.fetch(gameState.gameId);
        gameState.depositStatus = {
            player1: game.player1Deposited,
            player2: game.player2Deposited
        };
        
        if (game.state === "Active") {
            hideDepositScreen();
            startGame();
        }
        return gameState.depositStatus;
    } catch (error) {
        console.error("Deposit check failed:", error);
        return null;
    }
}

async function handleDeposit() {
    try {
        const wallet = window.backpack;
        if (!wallet) throw new Error("Backpack wallet not found");
        
        await wallet.connect();
        const depositAmount = 1 * 10 ** TOKEN_DECIMALS;
        
        const tx = await program.methods
            .depositTokens()
            .accounts({
                game: gameState.gameId,
                player: wallet.publicKey,
                playerTokenAccount: await getTokenAccount(wallet.publicKey),
                gameVault: gameState.vaultAddress,
                tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID
            })
            .rpc();
        
        console.log("Deposit TX:", tx);
        await checkDeposits();
    } catch (error) {
        console.error("Deposit failed:", error);
        alert(`Deposit error: ${error.message}`);
    }
}

// ====================== UI MANAGEMENT ======================
function showDepositScreen() {
    document.getElementById("deposit-screen").style.display = "block";
    document.getElementById("deposit-button").onclick = handleDeposit;
    updateDepositStatus();
}

function hideDepositScreen() {
    document.getElementById("deposit-screen").style.display = "none";
}

function updateDepositStatus() {
    const statusEl = document.getElementById("deposit-status");
    if (gameState.playerRole === "player1") {
        statusEl.textContent = gameState.depositStatus.player1 
            ? "✅ Your deposit confirmed" 
            : "⚠️ Waiting for your deposit";
    } else {
        statusEl.textContent = gameState.depositStatus.player2 
            ? "✅ Your deposit confirmed" 
            : "⚠️ Waiting for your deposit";
    }
}

// ====================== GAME FLOW INTEGRATION ======================
async function initializeGameAfterJoin() {
    const deposits = await checkDeposits();
    if (!deposits.player1 || !deposits.player2) {
        showDepositScreen();
    } else {
        startGame();
    }
}

// ====================== NEW HTML ELEMENTS ======================
function injectDepositHTML() {
    const depositHTML = `
        <div id="deposit-screen" class="hidden" style="text-align: center; padding: 20px;">
            <h2>💰 Lock Your Tokens</h2>
            <p>Deposit <strong>1 GORB</strong> to start the battle</p>
            <button id="deposit-button" class="action-button">Deposit Now</button>
            <p id="deposit-status" style="margin-top: 10px;"></p>
            <div id="deposit-loader" class="loader hidden"></div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', depositHTML);
}

// ====================== INITIALIZATION ======================
document.addEventListener('DOMContentLoaded', () => {
    injectDepositHTML();
});

// ====================== STYLES ======================
const style = document.createElement('style');
style.textContent = `
    #deposit-screen {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 10px;
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
        z-index: 1000;
        width: 90%;
        max-width: 400px;
    }
    .action-button {
        background: #4CAF50;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
    }
    .loader {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin: 20px auto;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);