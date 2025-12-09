"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
    return (
        <header className="relative sm:bottom-7 w-full flex justify-between items-center border-b-2 border-gray-300 pb-7">
            <h1 className="text-xl">Liquidity Network</h1>
            <div className="flex gap-3">
                <a
                    href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                    className="border-b-3 px-2 border-gray-700 hover:border-gray-500 hover:text-gray-500"
                >
                    Faucets
                </a>
            </div>
            <ConnectButton />
        </header>
    );
}
