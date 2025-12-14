# DeFi Liquidity Network UI

A decentralized web application that allows users to supply, withdraw, borrow, and repay assets such as ETH, WETH, USDC, and LINK through Aave Protocol v3 smart contracts.
This project is built with Next.js (React 18) and leverages ethers.js, wagmi, and RainbowKit for seamless wallet connectivity and blockchain interaction.

## 🚀 Overview

**This project** demonstrates how to build **a full DeFi frontend** that interfaces with **on-chain lending protocols** in a secure and modular way.

Users can:

- Connect their wallet (via RainbowKit / Wagmi / Viem)
- Supply **ETH** and **WETH** as collateral
- Earn interests on supplied collateral
- Withdraw assets safely back to their wallet
- Borrow against supplied collateral
- Repay borrowed assets
- View detailed account health and analytics

## 🛠️ Tech Stack

| Layer                 | Technologies                                      |
| --------------------- | ------------------------------------------------- |
| **Frontend**          | Next.js, TailwindCSS                              |
| **Blockchain SDKs**   | Wagmi, Viem, Ethers.js, RainbowKit                |
| **Smart Contracts**   | Aave V3 Protocol (Sepolia Network)                |
| **Utilities**         | react-hot-toast for notifications                 |
| **Wallets Supported** | MetaMask, Coinbase Wallet, WalletConnect, Rainbow |

## ⚙️ Features

- Connect wallet using RainbowKit
- Supply ETH to Aave Pool
- Supply WETH (wrapped ETH)
- Withdraw supplied assets
- Borrow USDC or LINK using WETH collateral
- Repay borrowed assets in full or in part
- Real-time user dashboard (collateral, health factor)
- Fetches and displays token balances dynamically for the connected wallet

### Clone the repository

```bash
git clone https://github.com/ndubuisi-ugwuja/Liquidity-Network-UI.git
cd Liquidity-Network-UI
```

### Install dependencies

```bash
yarn install
```

### Run the development server

```bash
yarn dev
```

## ⚡️ Future Improvements

- Add support for multiple collateral assets
- Responsive UI improvements
- Integrate live token price feeds via Chainlink
- Persistent user session state

## 💻 Author

### Ndubuisi Ugwuja

[LinkedIn ↗](https://www.linkedin.com/in/ndubuisi-ugwuja-763135289/)

## 🪙 License

### This project is licensed under the MIT License
