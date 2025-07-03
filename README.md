# 🎮💰 Trivia Quiz Battle on Gorbagana Testnet

A decentralized trivia game where players battle with knowledge to win crypto prizes!


## 🌟 Features

- 🏦 **Wallet Integration**: Connect with Backpack wallet
- 🎮 **1v1 Trivia Battles**: Challenge opponents in real-time
- 💰 **Crypto Prizes**: Win GOR tokens by answering correctly
- 🔐 **Secure Deposits**: Smart contract holds funds until game completion
- 📊 **Score Tracking**: Real-time score updates
- 🏆 **Prize Claim**: Automatic prize distribution to winners

## 📦 Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Blockchain**: Solana, Anchor Framework
- **Wallet**: Backpack
- **Token**: GOR (Gorbagana testnet token)

## 🚀 Quick Start

1. **Prerequisites**:
   - Install [Backpack wallet](https://www.backpack.app/)
   - Get testnet GOR tokens from a faucet

2. **Run Locally**:
   ```bash
   git clone https://github.com/TokenHarvester/Trivia-Quiz-Battle.git
   cd Trivia-Quiz-Battle
   # Open index.html in browser

3. **How to Play**:
   - Connect your Backpack wallet
   - Create or join a game
   - Deposit 1 GOR token
   - Answer 10 trivia questions
   - Winner claims 2 GOR prize!
  
## 🏗️ Project Structure

    ```bash
    trivia-quiz-battle/
    ├── index.html        # Main game interface
    ├── style.css         # Styling
    ├── script.js         # Game logic
    ├── contract.js       # Solana program interactions
    └── README.md         # This file
     ```

## 📜 Smart Contract Details

   Key program functions:
   - createGame() - Initialize new game
   - joinGame() - Join existing game
   - depositTokens() - Lock player funds
   - submitAnswer() - Process player responses
   - claimPrize() - Distribute winnings

## 🧩 Game Flow
   - Player 1 creates game (sets entry fee)
   - Player 2 joins with game ID
   - Both players deposit tokens
   - Answer 10 trivia questions
   - Smart contract determines winner
   - Winner claims prize pool

## 📝 Sample Questions
   The game includes 10 blockchain/Solana-themed questions like:

   - "What is Solana's native token?"
   - "Which consensus mechanism does Solana use?"
   - "What does ICO stand for?"

## 🤝 Contributing
    Contributions welcome! Please open an issue or PR for:

    - New question sets
    - UI improvements
    - Smart contract optimizations

## ⚠️ Disclaimer
This is a testnet demo. Use at your own risk with test tokens only.

## 📄 License
MIT
