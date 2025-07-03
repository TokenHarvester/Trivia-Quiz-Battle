// ====== BUFFER POLYFILL ======
if (typeof Buffer === 'undefined') {
    window.Buffer = {
        from: function(data) {
            if (typeof data === 'string') {
                return new TextEncoder().encode(data);
            }
            return new Uint8Array(data);
        },
        alloc: function(size) {
            return new Uint8Array(size);
        }
    };
}

// ====== ANCHOR & SOLANA INITIALIZATION ======
(function() {
    window.anchor = {
        BN: function (n) { return n; },
        web3: solanaWeb3,
        setProvider: function () {},
        AnchorProvider: class {
            constructor(connection, wallet, opts) {
                this.connection = connection;
                this.wallet = wallet;
                this.opts = opts;
            }
        },
        Program: class {
            constructor(idl, programId, provider) {
                this.idl = idl;
                this.programId = programId;
                this.provider = provider;
                
                this.methods = {
                    createGame: (entryFee, correctAnswers) => ({
                        accounts: (accounts) => ({
                            signers: (signers = []) => ({
                                rpc: async () => {
                                    console.log("Creating game with entry fee:", entryFee);
                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                    return "simulated_create_game_tx";
                                }
                            })
                        })
                    }),
                    joinGame: () => ({
                        accounts: (accounts) => ({
                            rpc: async () => {
                                console.log("Joining game...");
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                return "simulated_join_game_tx";
                            }
                        })
                    }),
                    depositTokens: () => ({
                        accounts: (accounts) => ({
                            rpc: async () => {
                                console.log("Depositing tokens...");
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                return "simulated_deposit_tx";
                            }
                        })
                    }),
                    submitAnswer: (answerIndex) => ({
                        accounts: (accounts) => ({
                            rpc: async () => {
                                console.log("Submitting answer:", answerIndex);
                                await new Promise(resolve => setTimeout(resolve, 500));
                                return "simulated_answer_tx";
                            }
                        })
                    }),
                    claimPrize: () => ({
                        accounts: (accounts) => ({
                            rpc: async () => {
                                console.log("Claiming prize...");
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                return "simulated_claim_prize_tx";
                            }
                        })
                    })
                };

                this.account = {
                    game: {
                        fetch: async (publicKey) => {
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            // Return mock game state with both players
                            return {
                                gameMaster: gameState.provider?.wallet?.publicKey || new window.anchor.web3.PublicKey("11111111111111111111111111111111"),
                                player1: gameState.player1PublicKey || new window.anchor.web3.PublicKey("11111111111111111111111111111111"),
                                player2: gameState.player2PublicKey || null,
                                entryFee: 1000000000,
                                prizePool: gameState.prizePool || 0,
                                currentQuestion: gameState.currentQuestion || 0,
                                player1Score: gameState.player1Score || 0,
                                player2Score: gameState.player2Score || 0,
                                correctAnswers: [0, 1, 2, 0, 1, 2, 0, 1, 2, 0],
                                state: gameState.gameStatus || { waiting: {} },
                                player1Deposited: gameState.player1Deposited || false,
                                player2Deposited: gameState.player2Deposited || false
                            };
                        }
                    }
                };
            }
        }
    };
})();

// ====== CONSTANTS & GAME STATE ======
const PROGRAM_ID = new anchor.web3.PublicKey("7ZAriVE481w9CGmpeHwFVztJ1oUiLFvFzUPNuVutvxKA");
const TOKEN_MINT = new anchor.web3.PublicKey("71Jvq4Epe2FCJ7JFSF7jLXdNk1Wy4Bhqd9iL6bEFELvg");
const TOKEN_PROGRAM_ID = new anchor.web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new anchor.web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const DEPOSIT_AMOUNT = 1000000000; // 1 token in lamports

const gameState = {
    publicKey: null,
    playerRole: null,
    provider: null,
    program: null,
    currentQuestion: 0,
    player1Score: 0,
    player2Score: 0,
    player1PublicKey: null,
    player2PublicKey: null,
    prizePool: 0,
    gameStatus: { waiting: {} },
    player1Deposited: false,
    player2Deposited: false,
    pollInterval: null
};

// ====== SAMPLE QUESTIONS ======
const sampleQuestions = [
    { 
    question: "What is Solana's native token?", 
    options: ["SOL", "ETH", "BTC", "USD"],
    correct: 0
  },
  
  { 
    question: "What is Gorbagana?", 
    options: ["A popular social media platform", "A fast, Solana-based experimental testnet chain", "A type of cryptocurrency wallet", "A gaming console"],
    correct: 1
  },
  
  { 
    question: "Which of the following is a feature of smart contracts?", 
    options: ["They require manual intervention", "They are only used in Bitcoin", "They execute automatically when conditions are met", "They are not secure"],
    correct: 2
  },

  { 
    question: "What feature does Gorbagana offer to ensure fast transactions?", 
    options: ["High transaction fees", "Zero-MEV execution", "Manual processing", "Delayed confirmations"],
    correct: 1
  },

  { 
    question: "What is a hard fork in cryptocurrency?", 
    options: ["A type of mining technique", "A method of trading", "A security breach", "A change in the protocol of a blockchain"],
    correct: 3
  },

  { 
    question: "What does ICO stand for?", 
    options: ["International Currency Operations", "Internet Currency Organization", "Initial Coin Offering", "Internal Crypto Office"],
    correct: 2
  },

  { 
    question: "What is the primary benefit of using blockchain technology?", 
    options: ["Centralized control", "Transparency and security", "High transaction fees", "Slower transaction speeds"],
    correct: 1
  },

  { 
    question: "Which of the following is a significant advantage of using Solana for developers?", 
    options: ["Low development costs", "Complicated deployment process", "Limited programming languages", "High latency issues"],
    correct: 0
  },

  { 
    question: "What does the term gas fees refer to in blockchain networks?", 
    options: ["Fees for buying tokens", "Fees for wallet creation", "Fees for exchange trading", "Fees for transaction processing and smart contract execution"],
    correct: 3
  },

  { 
    question: "Which consensus mechanism does Solana use?", 
    options: ["Proof of Work", "Proof of Stake", "Proof of History", "Delegated Proof of Stake"],
    correct: 2
  },
];

// ====== IDL DEFINITION ======
const triviaBattleIdl = {
    version: "0.1.0",
    name: "trivia_battle",
    instructions: [
        {
            name: "createGame",
            accounts: [
                { name: "game", isMut: true, isSigner: true },
                { name: "gameMaster", isMut: true, isSigner: true },
                { name: "systemProgram", isMut: false, isSigner: false }
            ],
            args: [
                { name: "entryFee", type: "u64" },
                { name: "correctAnswers", type: { array: ["u8", 10] } }
            ]
        },
        {
            name: "joinGame",
            accounts: [
                { name: "game", isMut: true, isSigner: false },
                { name: "player", isMut: true, isSigner: true },
                { name: "playerTokenAccount", isMut: true, isSigner: false },
                { name: "gameVault", isMut: true, isSigner: false },
                { name: "tokenProgram", isMut: false, isSigner: false }
            ],
            args: []
        },
        {
            name: "depositTokens",
            accounts: [
                { name: "game", isMut: true, isSigner: false },
                { name: "player", isMut: true, isSigner: true },
                { name: "playerTokenAccount", isMut: true, isSigner: false },
                { name: "gameVault", isMut: true, isSigner: false },
                { name: "tokenProgram", isMut: false, isSigner: false }
            ],
            args: []
        },
        {
            name: "submitAnswer",
            accounts: [
                { name: "game", isMut: true, isSigner: false },
                { name: "player", isMut: false, isSigner: true }
            ],
            args: [
                { name: "answerIndex", type: "u8" }
            ]
        },
        {
            name: "claimPrize",
            accounts: [
                { name: "game", isMut: true, isSigner: false },
                { name: "gameMaster", isMut: false, isSigner: true },
                { name: "gameVault", isMut: true, isSigner: false },
                { name: "winnerTokenAccount", isMut: true, isSigner: false },
                { name: "player1TokenAccount", isMut: true, isSigner: false },
                { name: "player2TokenAccount", isMut: true, isSigner: false },
                { name: "tokenProgram", isMut: false, isSigner: false }
            ],
            args: []
        }
    ]
};

// ====== HELPER FUNCTIONS ======
async function getTokenAccount(walletPubkey) {
    return anchor.web3.PublicKey.findProgramAddressSync(
        [
            walletPubkey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            TOKEN_MINT.toBuffer()
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
}

async function getGameVault(gamePubkey) {
    const encoder = new TextEncoder();
    return anchor.web3.PublicKey.findProgramAddressSync(
        [
            encoder.encode("vault"),
            gamePubkey.toBuffer()
        ],
        PROGRAM_ID
    );
}

// ====== WALLET CONNECTION ======
async function connectWallet() {
    try {
        if (!window.backpack?.isBackpack) {
            throw new Error("Please install Backpack wallet!");
        }

        const response = await window.backpack.connect();
        const walletAddress = response.publicKey.toString();
        document.getElementById("wallet-address").textContent = 
            `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
        
        gameState.provider = new anchor.AnchorProvider(
            new anchor.web3.Connection("https://api.devnet.solana.com"),
            window.backpack,
            { commitment: "confirmed" }
        );
        anchor.setProvider(gameState.provider);
        
        gameState.program = new anchor.Program(
            triviaBattleIdl, 
            PROGRAM_ID, 
            gameState.provider
        );
        
        document.getElementById("join-game").disabled = false;
        document.getElementById("create-game").disabled = false;
        
        return true;
    } catch (error) {
        console.error("Wallet connection failed:", error);
        alert(`Connection failed: ${error.message}`);
        return false;
    }
}

// ====== DEPOSIT FUNCTIONS ======
async function handleDeposit() {
    try {
        if (!gameState.program || !gameState.publicKey) {
            throw new Error("Game not initialized");
        }

        const [playerTokenAccount] = await getTokenAccount(gameState.provider.wallet.publicKey);
        const [gameVault] = await getGameVault(gameState.publicKey);

        document.getElementById("deposit-button").disabled = true;
        document.getElementById("deposit-message").textContent = "Processing deposit...";
        
        const txSignature = await gameState.program.methods
            .depositTokens()
            .accounts({
                game: gameState.publicKey,
                player: gameState.provider.wallet.publicKey,
                playerTokenAccount: playerTokenAccount,
                gameVault: gameVault,
                tokenProgram: TOKEN_PROGRAM_ID
            })
            .rpc();

        console.log("Deposit successful:", txSignature);
        document.getElementById("deposit-message").textContent = "Deposit confirmed!";
        
        // Update local state
        if (gameState.playerRole === 'player1') {
            gameState.player1Deposited = true;
            document.getElementById("player1-deposit-status").textContent = "✅ Deposited";
        } else {
            gameState.player2Deposited = true;
            document.getElementById("player2-deposit-status").textContent = "✅ Deposited";
        }
        
        // Check if both have deposited
        await checkDepositStatus();
        
    } catch (error) {
        console.error("Deposit failed:", error);
        document.getElementById("deposit-message").textContent = `Deposit failed: ${error.message}`;
        document.getElementById("deposit-button").disabled = false;
    }
}

async function checkDepositStatus() {
    try {
        const gameAccount = await gameState.program.account.game.fetch(gameState.publicKey);
        
        // Update UI
        document.getElementById("player1-deposit-status").textContent = 
            gameAccount.player1Deposited ? "✅ Deposited" : "❌ Not deposited";
        document.getElementById("player2-deposit-status").textContent = 
            gameAccount.player2Deposited ? "✅ Deposited" : "❌ Not deposited";
        
        // If both deposited, start game
        if (gameAccount.player1Deposited && gameAccount.player2Deposited) {
            document.getElementById("deposit-screen").classList.add("hidden");
            document.getElementById("game-screen").classList.remove("hidden");
            loadQuestion();
        }
        
        return gameAccount;
    } catch (error) {
        console.error("Error checking deposits:", error);
        return null;
    }
}

// ====== GAME FUNCTIONS ======
async function connectWallet() {
    try {
        if (!window.backpack?.isBackpack) throw new Error("Please install Backpack wallet!");
        
        const response = await window.backpack.connect();
        const walletAddress = response.publicKey.toString();
        document.getElementById("wallet-address").textContent = 
            `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
        
        gameState.provider = new anchor.AnchorProvider(
            new anchor.web3.Connection("https://api.devnet.solana.com"),
            window.backpack,
            { commitment: "confirmed" }
        );
        
        gameState.program = new anchor.Program(
            triviaBattleIdl, 
            PROGRAM_ID, 
            gameState.provider
        );
        
        document.getElementById("join-game").disabled = false;
        document.getElementById("create-game").disabled = false;
        
        return true;
    } catch (error) {
        console.error("Wallet connection failed:", error);
        alert(`Connection failed: ${error.message}`);
        return false;
    }
}

async function createGame() {
    try {
        const gameKeypair = anchor.web3.Keypair.generate();
        gameState.publicKey = gameKeypair.publicKey;
        gameState.playerRole = 'player1';
        gameState.player1PublicKey = gameState.provider.wallet.publicKey;
        
        const txSignature = await gameState.program.methods
            .createGame(new anchor.BN(DEPOSIT_AMOUNT), sampleQuestions.map(q => q.correct))
            .accounts({
                game: gameState.publicKey,
                gameMaster: gameState.provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId
            })
            .signers([gameKeypair])
            .rpc();
        
        document.getElementById("game-id-display").textContent = gameState.publicKey.toString();
        document.getElementById("setup-screen").classList.add("hidden");
        document.getElementById("waiting-screen").classList.remove("hidden");
        
        startPolling();
        return true;
    } catch (error) {
        console.error("Game creation failed:", error);
        alert(`Game creation failed: ${error.message}`);
        return false;
    }
}

async function joinGame() {
    try {
        const gameId = prompt("Enter the Game ID you want to join:");
        if (!gameId) return;

        gameState.publicKey = new anchor.web3.PublicKey(gameId);
        gameState.playerRole = 'player2';
        gameState.player2PublicKey = gameState.provider.wallet.publicKey;
        
        const txSignature = await gameState.program.methods.joinGame()
            .accounts({
                game: gameState.publicKey,
                player: gameState.provider.wallet.publicKey,
                playerTokenAccount: await getTokenAccount(gameState.provider.wallet.publicKey),
                gameVault: await getGameVault(gameState.publicKey),
                tokenProgram: TOKEN_PROGRAM_ID
            })
            .rpc();
        
        document.getElementById("setup-screen").classList.add("hidden");
        document.getElementById("deposit-screen").classList.remove("hidden");
        
        startPolling();
        return true;
    } catch (error) {
        console.error("Failed to join game:", error);
        alert(`Failed to join game: ${error.message}`);
        return false;
    }
}

// ====== DEPOSIT FUNCTIONS ======
async function handleDeposit() {
    try {
        document.getElementById("deposit-button").disabled = true;
        document.getElementById("deposit-message").textContent = "Processing deposit...";
        
        await gameState.program.methods.depositTokens()
            .accounts({
                game: gameState.publicKey,
                player: gameState.provider.wallet.publicKey,
                playerTokenAccount: await getTokenAccount(gameState.provider.wallet.publicKey),
                gameVault: await getGameVault(gameState.publicKey),
                tokenProgram: TOKEN_PROGRAM_ID
            })
            .rpc();

        if (gameState.playerRole === 'player1') {
            gameState.player1Deposited = true;
        } else {
            gameState.player2Deposited = true;
        }
        
        await checkDepositStatus();
    } catch (error) {
        console.error("Deposit failed:", error);
        document.getElementById("deposit-message").textContent = `Deposit failed: ${error.message}`;
        document.getElementById("deposit-button").disabled = false;
    }
}

async function checkDepositStatus() {
    try {
        const gameAccount = await gameState.program.account.game.fetch(gameState.publicKey);
        
        document.getElementById("player1-deposit-status").textContent = 
            gameAccount.player1Deposited ? "✅ Deposited" : "❌ Not deposited";
        document.getElementById("player2-deposit-status").textContent = 
            gameAccount.player2Deposited ? "✅ Deposited" : "❌ Not deposited";
        
        if (gameAccount.player1Deposited && gameAccount.player2Deposited) {
            clearInterval(gameState.pollInterval);
            document.getElementById("deposit-screen").classList.add("hidden");
            document.getElementById("game-screen").classList.remove("hidden");
            loadQuestion();
        }
    } catch (error) {
        console.error("Error checking deposits:", error);
    }
}

// ====== POLLING ======
function startPolling() {
    if (gameState.pollInterval) clearInterval(gameState.pollInterval);
    
    gameState.pollInterval = setInterval(async () => {
        try {
            const gameAccount = await gameState.program.account.game.fetch(gameState.publicKey);
            
            // Update both players' status
            gameState.player1Deposited = gameAccount.player1Deposited;
            gameState.player2Deposited = gameAccount.player2Deposited;
            
            // For Player 1: Show deposit screen when Player 2 joins
            if (gameState.playerRole === 'player1') {
                const defaultKey = new anchor.web3.PublicKey("11111111111111111111111111111111");
                if (gameAccount.player2 && !gameAccount.player2.equals(defaultKey)) {
                    document.getElementById("waiting-screen").classList.add("hidden");
                    document.getElementById("deposit-screen").classList.remove("hidden");
                }
            }
            
            // Update UI for both players
            document.getElementById("player1-deposit-status").textContent = 
                gameAccount.player1Deposited ? "✅ Deposited" : "❌ Not deposited";
            document.getElementById("player2-deposit-status").textContent = 
                gameAccount.player2Deposited ? "✅ Deposited" : "❌ Not deposited";
            
            // Start game if both deposited
            if (gameAccount.player1Deposited && gameAccount.player2Deposited) {
                clearInterval(gameState.pollInterval);
                document.getElementById("deposit-screen").classList.add("hidden");
                document.getElementById("game-screen").classList.remove("hidden");
                loadQuestion();
            }
        } catch (error) {
            console.error("Polling error:", error);
        }
    }, 2000);
}

// ====== QUESTION & ANSWER FUNCTIONS ======
function loadQuestion() {
    const currentQ = sampleQuestions[gameState.currentQuestion];
    document.getElementById("question-number").textContent = `Question ${gameState.currentQuestion + 1}/10`;
    document.getElementById("question").textContent = currentQ.question;
    
    const optionsDiv = document.getElementById("options");
    optionsDiv.innerHTML = currentQ.options.map((option, index) => 
        `<button class="option-button" onclick="submitAnswer(${index})">
            ${String.fromCharCode(65 + index)}. ${option}
        </button>`
    ).join('');
}

async function submitAnswer(answerIndex) {
    try {
        document.querySelectorAll(".option-button").forEach(btn => btn.disabled = true);
        
        await gameState.program.methods
            .submitAnswer(answerIndex)
            .accounts({
                game: gameState.publicKey,
                player: gameState.provider.wallet.publicKey
            })
            .rpc();
        
        setTimeout(() => {
            gameState.currentQuestion++;
            gameState.currentQuestion >= 10 ? showResults() : loadQuestion();
        }, 1500);
    } catch (error) {
        console.error("Failed to submit answer:", error);
        document.querySelectorAll(".option-button").forEach(btn => btn.disabled = false);
    }
}

// ====== RESULT MANAGEMENT ======
function showResults() {
    document.getElementById("game-screen").classList.add("hidden");
    document.getElementById("result-screen").classList.remove("hidden");
    
    const player1Score = gameState.player1Score || Math.floor(Math.random() * 10);
    const player2Score = gameState.player2Score || Math.floor(Math.random() * 10);
    
    let resultTitle, resultMessage;
    
    if (player1Score > player2Score) {
        if (gameState.playerRole === 'player1') {
            resultTitle = "🎉 You Won!";
            resultMessage = `Congratulations! You scored ${player1Score}/10 and won 2 tokens!`;
        } else {
            resultTitle = "😔 You Lost";
            resultMessage = `You scored ${player2Score}/10. Player 1 won with ${player1Score}/10.`;
        }
    } else if (player2Score > player1Score) {
        if (gameState.playerRole === 'player2') {
            resultTitle = "🎉 You Won!";
            resultMessage = `Congratulations! You scored ${player2Score}/10 and won 2 tokens!`;
        } else {
            resultTitle = "😔 You Lost";
            resultMessage = `You scored ${player1Score}/10. Player 2 won with ${player2Score}/10.`;
        }
    } else {
        resultTitle = "🤝 It's a Tie!";
        resultMessage = `Both players scored ${player1Score}/10. Entry fees will be refunded.`;
    }
    
    document.getElementById("result-title").textContent = resultTitle;
    document.getElementById("result-message").textContent = resultMessage;
}

// ====== CLAIM PRIZE FUNCTION ======
async function claimPrize() {
    try {
        if (!gameState.provider || !gameState.program) {
            throw new Error("Wallet not connected");
        }

        const [winnerTokenAccount] = await getTokenAccount(gameState.provider.wallet.publicKey);
        const [gameVault] = await getGameVault(gameState.publicKey);
        
        const txSignature = await gameState.program.methods.claimPrize()
            .accounts({
                game: gameState.publicKey,
                gameMaster: gameState.provider.wallet.publicKey,
                gameVault: gameVault,
                winnerTokenAccount: winnerTokenAccount,
                player1TokenAccount: await getTokenAccount(gameState.player1PublicKey),
                player2TokenAccount: await getTokenAccount(gameState.player2PublicKey),
                tokenProgram: TOKEN_PROGRAM_ID
            })
            .rpc();
        
        console.log("Prize claimed:", txSignature);
        alert("Prize claimed successfully!");
        return true;
    } catch (error) {
        console.error("Failed to claim prize:", error);
        alert(`Failed to claim prize: ${error.message}`);
        return false;
    }
}

// ====== EVENT LISTENERS ======
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("connect-wallet").addEventListener("click", connectWallet);
    document.getElementById("create-game").addEventListener("click", createGame);
    document.getElementById("join-game").addEventListener("click", joinGame);
    document.getElementById("deposit-button").addEventListener("click", handleDeposit);
    document.getElementById("claim-prize").addEventListener("click", claimPrize);
});

window.addEventListener('beforeunload', () => {
    if (gameState.pollInterval) clearInterval(gameState.pollInterval);
});