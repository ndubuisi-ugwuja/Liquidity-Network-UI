# DeFi Liquidity Network UI (Under Development)

![Status](https://img.shields.io/badge/status-under--development-yellow)

This project is currently in active development 🚧  
A user interface for a decentralized liquidity platform for lending, borrowing, and staking.

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

| Category              | Technologies                       |
| --------------------- | ---------------------------------- |
| **Frontend**          | Next.js, React                     |
| **Blockchain / Web3** | Wagmi, Viem, Ethers.js, RainbowKit |
| **Smart Contracts**   | Aave V3 Protocol (Sepolia Network) |
| **Styling**           | Tailwind, React Hot Toast          |

## ⚙️ Features (Current Progress)

| Feature                                                | Status         |
| ------------------------------------------------------ | -------------- |
| Connect wallet using RainbowKit                        | ✅ Done        |
| Supply ETH to Aave Pool                                | ✅ Done        |
| Supply WETH (wrapped ETH)                              | ✅ Done        |
| Withdraw supplied assets                               | ✅ Done        |
| Borrow functionality                                   | 🔜 In progress |
| Real-time user dashboard (health factor, borrow limit) | 🔜 Coming soon |
| UI redesign and responsiveness                         | 🔜 Coming soon |

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
npm run dev
```

## 🧰 Development Notes

• Currently deployed and tested on Sepolia Testnet

• Wrapped ETH (WETH) contract interactions are handled seamlessly within the UI

• Uses toast notifications for clear transaction feedback

• Gas estimation and error handling are being optimized for production use

### PLEASE FEEL FREE TO FORK AND CONTRIBUTE
