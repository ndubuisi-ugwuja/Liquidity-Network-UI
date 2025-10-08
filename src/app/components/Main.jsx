"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import { useAccount, useWalletClient } from "wagmi";
import { contractAddresses, IWeth_abi, ERC20_abi, IPool_abi } from "../constants";

export default function Main() {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();

    const wethAddress = contractAddresses.wethTokenAddress;
    const aWethAddress = contractAddresses.aWethTokenAddress;
    const poolAddress = contractAddresses.poolAddress;
    const usdtAddress = contractAddresses.usdtTokenAddress;
    const linkAddress = contractAddresses.linkTokenAddress;

    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [ethBalance, setEthBalance] = useState("0");
    const [wethBalance, setWethBalance] = useState("0");
    const [aWethBalance, setAWethBalance] = useState("0");

    const [userTotalColletaral, setUserTotalColletaral] = useState("0");
    const [userTotalDept, setUserTotalDept] = useState("0");
    const [userAvailableBorrows, setUserAvailableBorrows] = useState("0");
    const [userHealthFactor, setUserHealthFactor] = useState("0");

    const [amountEth, setAmountEth] = useState("");
    const [stepEth, setStepEth] = useState("idle");
    const [showFormEth, setShowFormEth] = useState(false); // 👈 trigger state for ETH deposite

    const [amountWeth, setAmountWeth] = useState("");
    const [stepWeth, setStepWeth] = useState("idle");
    const [showFormWeth, setShowFormWeth] = useState(false); // 👈 trigger state for WETH deposite

    const [amountWithraw, setAmountWithraw] = useState("");
    const [stepWithraw, setStepWithraw] = useState("idle");
    const [showFormWithraw, setShowFormWithraw] = useState(false); // 👈 trigger state for withdrawal

    const [amountBorrowUsdt, setAmountBorrowUsdt] = useState("");
    const [stepBorrowUsdt, setStepBorrowUsdt] = useState("idle");
    const [showFormBorrowUsdt, setShowFormBorrowUsdt] = useState(false); // 👈 trigger state for USDT borrow

    // ✅ Get signer from RainbowKit/Wagmi connector
    useEffect(() => {
        const setupSigner = async () => {
            if (!walletClient || !isConnected) return;

            const ethersProvider = new ethers.BrowserProvider(walletClient.transport);
            const signer = await ethersProvider.getSigner();

            setProvider(ethersProvider);
            setSigner(signer);
        };

        setupSigner();
    }, [walletClient, isConnected]);

    // ✅ Fetch balances (ETH + WETH)
    const fetchBalances = async () => {
        if (!provider || !address) return;

        try {
            const ethBal = await provider.getBalance(address);
            setEthBalance(ethers.formatEther(ethBal));

            const aWethContract = new ethers.Contract(aWethAddress, ERC20_abi.abi, provider);
            const aWethBal = await aWethContract.balanceOf(address);
            setAWethBalance(ethers.formatEther(aWethBal));

            const wethContract = new ethers.Contract(wethAddress, ERC20_abi.abi, provider);
            const wethBal = await wethContract.balanceOf(address);
            setWethBalance(ethers.formatEther(wethBal));
        } catch (err) {
            console.error("Error fetching balances:", err);
        }
    };

    useEffect(() => {
        fetchBalances();
    }, [provider, address]);

    // ✅ Fetch user data
    const fetchUserData = async () => {
        if (!provider || !address) return;

        try {
            const pool = new ethers.Contract(poolAddress, IPool_abi.abi, provider);
            const userData = await pool.getUserAccountData(address);

            setUserTotalColletaral(ethers.formatEther(userData.totalCollateralBase));
            setUserTotalDept(ethers.formatEther(userData.totalDebtBase));
            setUserAvailableBorrows(ethers.formatEther(userData.availableBorrowsBase));
            setUserHealthFactor(ethers.formatEther(userData.healthFactor));

            console.log("User data:", {
                collateral: userData.totalCollateralBase,
                debt: userData.totalDebtBase,
                available: userData.availableBorrowsBase,
                health: userData.healthFactor,
            });
        } catch (err) {
            console.error("Error fetching user data:", err);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [provider, address]);

    // ✅ Supply logic using ethers.js
    const handleSupplyEth = async () => {
        if (!signer) return toast.error("Wallet not connected");
        if (!amountEth) return toast.error("Enter an amount");

        const weiAmount = ethers.parseEther(amountEth);

        try {
            // 1️⃣ Wrap ETH into WETH
            setStepEth("depositing");
            toast.loading("Wrapping ETH into WETH...");
            const weth = new ethers.Contract(wethAddress, IWeth_abi.abi, signer);
            const tx1 = await weth.deposit({ value: weiAmount });
            await tx1.wait();
            toast.dismiss();
            toast.success("ETH wrapped");

            // 2️⃣ Approve Aave pool
            setStepEth("approving");
            toast.loading("Approving Aave Pool...");
            const approveTx = await weth.approve(poolAddress, weiAmount);
            await approveTx.wait();
            toast.dismiss();
            toast.success("Approval successful");

            // 3️⃣ Supply to Aave
            setStepEth("supplying");
            toast.loading("Supplying to Aave...");
            const pool = new ethers.Contract(poolAddress, IPool_abi.abi, signer);
            const supplyTx = await pool.supply(wethAddress, weiAmount, address, 0);
            await supplyTx.wait();

            toast.dismiss();
            toast.success("Supplied to Aave");
            setStepEth("idle");
            setAmountEth("");
            fetchBalances();
            fetchUserData();
        } catch (err) {
            console.log("Supply failed:", err);
            toast.dismiss();
            toast.error("Transaction failed");
            setStepEth("idle");
        }
    };

    // ✅ Supply WETH
    const handleSupplyWeth = async () => {
        if (!signer) return toast.error("Wallet not connected");
        if (!amountWeth) return toast.error("Enter an amount");

        const weiAmount = ethers.parseEther(amountWeth);

        try {
            // 2️⃣ Approve Aave pool
            setStepWeth("approving");
            toast.loading("Approving Aave Pool...");
            const weth = new ethers.Contract(wethAddress, IWeth_abi.abi, signer);
            const approveTx = await weth.approve(poolAddress, weiAmount);
            await approveTx.wait();
            toast.dismiss();
            toast.success("Approval successful");

            // 3️⃣ Supply to Aave
            setStepWeth("supplying");
            toast.loading("Supplying to Aave...");
            const pool = new ethers.Contract(poolAddress, IPool_abi.abi, signer);
            const supplyTx = await pool.supply(wethAddress, weiAmount, address, 0);
            await supplyTx.wait();

            toast.dismiss();
            toast.success("Supplied to Aave");
            setStepWeth("idle");
            setAmountWeth("");
            fetchBalances();
            fetchUserData();
        } catch (err) {
            console.log("Supply failed:", err);
            toast.dismiss();
            toast.error("Transaction failed");
            setStepWeth("idle");
        }
    };

    // ✅ Withdraw logic
    const handleWithraw = async () => {
        if (!signer) return toast.error("Wallet not connected");
        if (!amountWithraw) return toast.error("Enter an amount");

        const weiAmount = ethers.parseEther(amountWithraw);

        // Withdraw
        try {
            setStepWithraw("withdrawing");
            toast.loading("Withdrawing ETH...");
            const pool = new ethers.Contract(poolAddress, IPool_abi.abi, signer);
            const withdrawTx = await pool.withdraw(wethAddress, weiAmount, address);
            await withdrawTx.wait(1);

            toast.dismiss();
            toast.success("Withrawal successful");
            setStepWithraw("idle");
            setAmountWithraw("");
            fetchBalances();
        } catch (err) {
            console.log("Withrawal failed:", err);
            toast.dismiss();
            toast.error("Transaction failed");
            setStepWithraw("idle");
        }
    };

    // ✅Borrow USDT
    const handleBorrowUsdt = async () => {
        if (!signer) return toast.error("Wallet not connected");
        if (!amountBorrowUsdt) return toast.error("Enter an amount");

        const usdtAmount = ethers.parseEther(amountBorrowUsdt);

        // Borrow
        try {
            setStepBorrowUsdt("borrowing");
            toast.loading("Borrowing USDT...");
            const pool = new ethers.Contract(poolAddress, IPool_abi.abi, signer);
            const borrowTx = await pool.borrow(usdtAddress, usdtAmount, 2, 0, address);
            await borrowTx.wait(1);

            toast.dismiss();
            toast.success("Borrow successful");
            setStepBorrowUsdt("idle");
            setAmountBorrowUsdt("");
            fetchBalances();
        } catch (err) {
            console.log("Borrow failed:", err);
            toast.dismiss();
            toast.error("Transaction failed");
            setStepBorrowUsdt("idle");
        }
    };

    return (
        <div className="flex-col">
            <div className="relative bottom-12">
                <div className="flex gap-1 items-center">
                    <img src="/eth-blue.png" alt="Eth logo" width={28} />
                    <p className="text-2xl font-semibold">Ethereum Market</p>
                </div>
                <div className="flex gap-5 pt-3">
                    <div>
                        <p className="text-gray-700">Net worth</p>
                        <p className="font-semibold text-xl">{aWethBalance ? aWethBalance : "0.0000"} WETH</p>
                    </div>
                    <div>
                        <p className="text-gray-700">Health factor</p>
                        <p className="font-semibold text-xl">0.00</p>
                    </div>
                </div>
            </div>

            <div className="relative bottom-3 flex flex-col sm:flex-row gap-8">
                <section className="border-1 border-gray-300 rounded-lg w-135 h-100">
                    <div className="pt-7 pl-10 pr-10">
                        <p className="font-semibold text-center text-lg">Your supplies</p>
                        <div className="flex justify-between items-center pt-5 pb-6 border-b-1  border-gray-300">
                            <div className="">
                                <img src="weth.png" alt="Eth logo" width={25} className="inline-block" />
                                <span className="inline-block align-middle text-sm font-semibold ml-2">WETH</span>
                            </div>
                            <div className="flex-col justify-items-center">
                                <p>{aWethBalance ? aWethBalance : "0.0000"}</p>
                                <p className="text-gray-500 text-sm">$0.00</p>
                            </div>
                            {/* Trigger button */}
                            {!showFormWithraw && (
                                <button
                                    onClick={() => setShowFormWithraw(true)}
                                    className="w-22 h-8 bg-blue-950 text-white transition hover:bg-gray-500 rounded-lg"
                                >
                                    Withdraw
                                </button>
                            )}

                            {/* The section only shows after button is clicked */}
                            {showFormWithraw && (
                                <div className="fixed inset-0 flex items-center justify-center backdrop-blur-[3px]">
                                    <div className="p-6 rounded-2xl shadow-md bg-white max-w-sm w-full">
                                        <h2 className="text-lg font-semibold mb-2">Withraw ETH</h2>

                                        <input
                                            placeholder="Enter ETH amount"
                                            value={amountWithraw}
                                            onChange={(e) => setAmountWithraw(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-950"
                                        />

                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleWithraw}
                                                disabled={!amountWithraw || stepWithraw !== "idle"}
                                                className="w-22 h-8 bg-blue-950 transition hover:bg-gray-500  text-white rounded-lg shadow disabled:opacity-50"
                                            >
                                                {stepWithraw === "withdrawing" && "Withdraw"}
                                                {stepWithraw === "idle" && "Withraw"}
                                            </button>

                                            <button
                                                onClick={() => setShowFormWithraw(false)}
                                                className="w-22 h-8 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="font-semibold text-center text-lg pt-5">Assets to supply</p>
                        <div className="flex justify-between items-center pt-5">
                            <div className="">
                                <img src="eth.png" alt="Eth logo" width={25} className="inline-block" />
                                <span className="inline-block align-middle text-sm font-semibold ml-1">ETH</span>
                            </div>
                            <div className="flex-col justify-items-center">
                                <p>{ethBalance ? ethBalance : "0.0000"}</p>
                                <p className="text-gray-500 text-sm">$0.00</p>
                            </div>

                            {/* Trigger button */}
                            {!showFormEth && (
                                <button
                                    onClick={() => setShowFormEth(true)}
                                    className="w-22 h-8 bg-blue-950 text-white transition hover:bg-gray-500 rounded-lg"
                                >
                                    Supply
                                </button>
                            )}

                            {/* The section only shows after button is clicked */}
                            {showFormEth && (
                                <div className="fixed inset-0 flex items-center justify-center backdrop-blur-[3px]">
                                    <div className="p-6 rounded-2xl shadow-md bg-white max-w-sm w-full">
                                        <h2 className="text-lg font-semibold mb-2">Supply ETH</h2>

                                        <input
                                            placeholder="Enter ETH amount"
                                            value={amountEth}
                                            onChange={(e) => setAmountEth(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-950"
                                        />

                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSupplyEth}
                                                disabled={!amountEth || stepEth !== "idle"}
                                                className="w-22 h-8 bg-blue-950 transition hover:bg-gray-500  text-white rounded-lg shadow disabled:opacity-50"
                                            >
                                                {stepEth === "depositing" && "Wrapping..."}
                                                {stepEth === "approving" && "Approving..."}
                                                {stepEth === "supplying" && "Supplying..."}
                                                {stepEth === "idle" && "Deposit"}
                                            </button>

                                            <button
                                                onClick={() => setShowFormEth(false)}
                                                className="w-22 h-8 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-center pt-3">
                            <div className="">
                                <img src="weth.png" alt="Eth logo" width={25} className="inline-block" />
                                <span className="inline-block align-middle text-sm font-semibold ml-2">WETH</span>
                            </div>
                            <div className="flex-col justify-items-center">
                                <p>{wethBalance ? wethBalance : "0.0000"}</p>
                                <p className="text-gray-500 text-sm">$0.00</p>
                            </div>

                            {/* Trigger button */}
                            {!showFormWeth && (
                                <button
                                    onClick={() => setShowFormWeth(true)}
                                    className="w-22 h-8 bg-blue-950 text-white transition hover:bg-gray-500 rounded-lg"
                                >
                                    Supply
                                </button>
                            )}

                            {/* The section only shows after button is clicked */}
                            {showFormWeth && (
                                <div className="fixed inset-0 flex items-center justify-center backdrop-blur-[3px]">
                                    <div className="p-6 rounded-2xl shadow-md bg-white max-w-sm w-full">
                                        <h2 className="text-lg font-semibold mb-2">Supply WETH</h2>

                                        <input
                                            placeholder="Enter ETH amount"
                                            value={amountWeth}
                                            onChange={(e) => setAmountWeth(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-950"
                                        />

                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSupplyWeth}
                                                disabled={!amountWeth || stepWeth !== "idle"}
                                                className="w-22 h-8 bg-blue-950 transition hover:bg-gray-500  text-white rounded-lg shadow disabled:opacity-50"
                                            >
                                                {stepWeth === "approving" && "Approving..."}
                                                {stepWeth === "supplying" && "Supplying..."}
                                                {stepWeth === "idle" && "Deposit"}
                                            </button>

                                            <button
                                                onClick={() => setShowFormWeth(false)}
                                                className="w-22 h-8 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
                <section className="border-1 border-gray-300 rounded-lg w-135 h-100">
                    <div className="pt-7 pl-10 pr-10">
                        <p className="font-semibold text-center text-lg">Your borrows</p>
                        <div className="flex justify-between items-center pt-5">
                            <div className="">
                                <img src="usdt.png" alt="Eth logo" width={25} className="inline-block" />
                                <span className="inline-block align-middle text-sm font-semibold ml-2">USDT</span>
                            </div>
                            <div className="flex-col items-center justify-items-center">
                                <p>0.00</p>
                                <p className="text-gray-500 text-sm">$0.00</p>
                            </div>
                            <button className="w-22 h-8 bg-blue-950 text-white transition hover:bg-gray-500 rounded-lg">
                                Repay
                            </button>
                        </div>
                        <div className="flex justify-between items-center pt-3 pb-6 border-b-1  border-gray-300">
                            <div className="">
                                <img src="link.png" alt="Eth logo" width={25} className="inline-block" />
                                <span className="inline-block align-middle text-sm font-semibold ml-2">LINK</span>
                            </div>
                            <div className="flex-col justify-items-center">
                                <p>0.00</p>
                                <p className="text-gray-500 text-sm">$0.00</p>
                            </div>
                            <button className="w-22 h-8 bg-blue-950 text-white transition hover:bg-gray-500 rounded-lg">
                                Repay
                            </button>
                        </div>
                        <p className="font-semibold text-center text-lg pt-5">Assets to borrow</p>
                        <div className="flex justify-between items-center pt-5">
                            <div className="">
                                <img src="usdt.png" alt="Eth logo" width={25} className="inline-block" />
                                <span className="inline-block align-middle text-sm font-semibold ml-2">USDT</span>
                            </div>
                            <div className="flex-col items-center justify-items-center">
                                <p>0.00</p>
                                <p className="text-gray-500 text-sm">$0.00</p>
                            </div>
                            {/* Trigger button */}
                            {!showFormBorrowUsdt && (
                                <button
                                    onClick={() => setShowFormBorrowUsdt(true)}
                                    className="w-22 h-8 bg-blue-950 text-white transition hover:bg-gray-500 rounded-lg"
                                >
                                    Borrow
                                </button>
                            )}

                            {/* The section only shows after button is clicked */}
                            {showFormBorrowUsdt && (
                                <div className="fixed inset-0 flex items-center justify-center backdrop-blur-[3px]">
                                    <div className="p-6 rounded-2xl shadow-md bg-white max-w-sm w-full">
                                        <h2 className="text-lg font-semibold mb-2">Borrow USDT</h2>

                                        <input
                                            placeholder="Enter USDT amount"
                                            value={amountBorrowUsdt}
                                            onChange={(e) => setAmountBorrowUsdt(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-950"
                                        />

                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleBorrowUsdt}
                                                disabled={!amountBorrowUsdt || stepBorrowUsdt !== "idle"}
                                                className="w-22 h-8 bg-blue-950 transition hover:bg-gray-500  text-white rounded-lg shadow disabled:opacity-50"
                                            >
                                                {stepBorrowUsdt === "borrowing" && "Borrowing..."}
                                                {stepBorrowUsdt === "idle" && "Borrow"}
                                            </button>

                                            <button
                                                onClick={() => setShowFormBorrowUsdt(false)}
                                                className="w-22 h-8 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-center pt-3">
                            <div className="">
                                <img src="link.png" alt="Eth logo" width={25} className="inline-block" />
                                <span className="inline-block align-middle text-sm font-semibold ml-2">LINK</span>
                            </div>
                            <div className="flex-col justify-items-center">
                                <p>0.00</p>
                                <p className="text-gray-500 text-sm">$0.00</p>
                            </div>
                            {/* Trigger button */}
                            {!showFormWithraw && (
                                <button
                                    onClick={() => setShowFormBorrowUsdt(true)}
                                    className="w-22 h-8 bg-blue-950 text-white transition hover:bg-gray-500 rounded-lg"
                                >
                                    Borrow
                                </button>
                            )}

                            {/* The section only shows after button is clicked */}
                            {showFormBorrowUsdt && (
                                <div className="fixed inset-0 flex items-center justify-center backdrop-blur-[3px]">
                                    <div className="p-6 rounded-2xl shadow-md bg-white max-w-sm w-full">
                                        <h2 className="text-lg font-semibold mb-2">Borrow Link</h2>

                                        <input
                                            placeholder="Enter Link amount"
                                            value={amountBorrowUsdt}
                                            onChange={(e) => setAmountBorrowUsdt(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-950"
                                        />

                                        <div className="flex gap-2">
                                            <button
                                                //onClick={handleBorrowUsdt}
                                                disabled={!amountBorrowUsdt || stepBorrowUsdt !== "idle"}
                                                className="w-22 h-8 bg-blue-950 transition hover:bg-gray-500  text-white rounded-lg shadow disabled:opacity-50"
                                            >
                                                {stepBorrowUsdt === "borrowing" && "Borrowing..."}
                                                {stepBorrowUsdt === "idle" && "Borrow"}
                                            </button>

                                            <button
                                                onClick={() => setShowFormBorrowUsdt(false)}
                                                className="w-22 h-8 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
