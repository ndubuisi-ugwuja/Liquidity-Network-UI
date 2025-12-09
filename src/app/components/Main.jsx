"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import { useAccount, useWalletClient } from "wagmi";
import { contractAddresses, IWeth_abi, IERC20_abi, IPool_abi } from "../constants";

export default function Main() {
    // Connect account
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);

    // Contract addresses
    const wethAddress = contractAddresses.wethTokenAddress;
    const aWethAddress = contractAddresses.aWethTokenAddress;
    const poolAddress = contractAddresses.poolAddress;
    const usdcAddress = contractAddresses.usdcTokenAddress;
    const usdcDeptAddress = contractAddresses.usdcDeptTokenAddress;
    const linkAddress = contractAddresses.linkTokenAddress;
    const linkDeptAddress = contractAddresses.linkDeptTokenAddress;

    // Variables for connected account balances
    const [ethBalance, setEthBalance] = useState("0");
    const [wethBalance, setWethBalance] = useState("0");
    const [aWethBalance, setAWethBalance] = useState("0");
    const [linkDeptBalance, setLinkDeptBalance] = useState("0");
    const [usdcDeptBalance, setUsdcDeptBalance] = useState("0");

    // User data variables
    const [userTotalColletaral, setUserTotalColletaral] = useState("0");
    const [userTotalDept, setUserTotalDept] = useState("0");
    const [userAvailableBorrows, setUserAvailableBorrows] = useState("0");
    const [userHealthFactor, setUserHealthFactor] = useState("0");

    // ETH deposit variables
    const [amountEth, setAmountEth] = useState("");
    const [stepEth, setStepEth] = useState("idle");
    const [showFormEth, setShowFormEth] = useState(false);

    // WETH deposit variables
    const [amountWeth, setAmountWeth] = useState("");
    const [stepWeth, setStepWeth] = useState("idle");
    const [showFormWeth, setShowFormWeth] = useState(false);

    // WETH withdrawal variables
    const [amountWithraw, setAmountWithraw] = useState("");
    const [stepWithraw, setStepWithraw] = useState("idle");
    const [showFormWithraw, setShowFormWithraw] = useState(false);

    // USDC borrow variables
    const [amountBorrowUsdc, setAmountBorrowUsdc] = useState("");
    const [stepBorrowUsdc, setStepBorrowUsdc] = useState("idle");
    const [showFormBorrowUsdc, setShowFormBorrowUsdc] = useState(false);

    // USDC repay variables
    const [amountRepayUsdc, setAmountRepayUsdc] = useState("");
    const [stepRepayUsdc, setStepRepayUsdc] = useState("idle");
    const [showFormRepayUsdc, setShowFormRepayUsdc] = useState(false);

    // LINK borrow variables
    const [amountBorrowLink, setAmountBorrowLink] = useState("");
    const [stepBorrowLink, setStepBorrowLink] = useState("idle");
    const [showFormBorrowLink, setShowFormBorrowLink] = useState(false);

    // LINK repay variables
    const [amountRepayLink, setAmountRepayLink] = useState("");
    const [stepRepayLink, setStepRepayLink] = useState("idle");
    const [showFormRepayLink, setShowFormRepayLink] = useState(false);

    // Get signer from RainbowKit/Wagmi connector
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

    // Fetch balances (ETH & WETH)
    const fetchBalances = async () => {
        if (!provider || !address) return;

        try {
            const ethBal = await provider.getBalance(address);
            setEthBalance(ethers.formatEther(ethBal));

            const aWethContract = new ethers.Contract(aWethAddress, IERC20_abi.abi, provider);
            const aWethBal = await aWethContract.balanceOf(address);
            setAWethBalance(ethers.formatEther(aWethBal));

            const wethContract = new ethers.Contract(wethAddress, IERC20_abi.abi, provider);
            const wethBal = await wethContract.balanceOf(address);
            setWethBalance(ethers.formatEther(wethBal));

            const linkContract = new ethers.Contract(linkDeptAddress, IERC20_abi.abi, provider);
            const linkDeptBal = await linkContract.balanceOf(address);
            setLinkDeptBalance(ethers.formatEther(linkDeptBal));

            const usdcContract = new ethers.Contract(usdcDeptAddress, IERC20_abi.abi, provider);
            const usdcDeptBal = await usdcContract.balanceOf(address);
            setUsdcDeptBalance(ethers.formatEther(usdcDeptBal));
        } catch (err) {
            console.error("Error fetching balances:", err);
        }
    };

    useEffect(() => {
        fetchBalances();
    }, [provider, address]);

    // Fetch user data
    const fetchUserData = async () => {
        if (!provider || !address) return;

        try {
            const pool = new ethers.Contract(poolAddress, IPool_abi.abi, provider);
            const userData = await pool.getUserAccountData(address);

            setUserTotalColletaral(ethers.formatUnits(userData.totalCollateralBase, 8));
            setUserTotalDept(ethers.formatUnits(userData.totalDebtBase, 8));
            setUserAvailableBorrows(ethers.formatUnits(userData.availableBorrowsBase, 8));
            setUserHealthFactor(ethers.formatUnits(userData.healthFactor, 18));
        } catch (err) {
            console.error("Error fetching user data:", err);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [provider, address]);

    // Supply ETH
    const handleSupplyEth = async () => {
        if (!signer) return toast.error("Wallet not connected");
        if (!amountEth) return toast.error("Enter an amount");

        const weiAmount = ethers.parseEther(amountEth);

        try {
            // Wrap ETH into WETH
            setStepEth("depositing");
            toast.loading("Wrapping ETH into WETH...");
            const weth = new ethers.Contract(wethAddress, IWeth_abi.abi, signer);
            const tx1 = await weth.deposit({ value: weiAmount });
            await tx1.wait();
            toast.dismiss();
            toast.success("ETH wrapped");

            // Approve Aave pool
            setStepEth("approving");
            toast.loading("Approving Aave Pool...");
            const approveTx = await weth.approve(poolAddress, weiAmount);
            await approveTx.wait();
            toast.dismiss();
            toast.success("Approval successful");

            // Supply to Aave
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

    // Supply WETH
    const handleSupplyWeth = async () => {
        if (!signer) return toast.error("Wallet not connected");
        if (!amountWeth) return toast.error("Enter an amount");

        const weiAmount = ethers.parseEther(amountWeth);

        try {
            // Approve Aave pool
            setStepWeth("approving");
            toast.loading("Approving Aave Pool...");
            const weth = new ethers.Contract(wethAddress, IWeth_abi.abi, signer);
            const approveTx = await weth.approve(poolAddress, weiAmount);
            await approveTx.wait();
            toast.dismiss();
            toast.success("Approval successful");

            // Supply to Aave
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

    // Withdraw WETH
    const handleWithraw = async () => {
        if (!signer) return toast.error("Wallet not connected");
        if (!amountWithraw) return toast.error("Enter an amount");

        const weiAmount = ethers.parseEther(amountWithraw);

        // Withdraw
        try {
            setStepWithraw("withdrawing");
            toast.loading("Withdrawing WETH...");
            const pool = new ethers.Contract(poolAddress, IPool_abi.abi, signer);
            const withdrawTx = await pool.withdraw(wethAddress, weiAmount, address);
            await withdrawTx.wait(1);
            toast.dismiss();
            toast.success("Withrawal successful");

            setStepWithraw("idle");
            setAmountWithraw("");
            fetchBalances();
            fetchUserData();
        } catch (err) {
            console.log("Withrawal failed:", err);
            toast.dismiss();
            toast.error("Transaction failed");
            setStepWithraw("idle");
        }
    };

    // Borrow USDC
    const handleBorrowUsdc = async () => {
        if (!signer) return toast.error("Wallet not connected");
        if (!amountBorrowUsdc) return toast.error("Enter an amount");

        const usdcAmount = ethers.parseUnits(amountBorrowUsdc, 6);

        // Borrow
        try {
            setStepBorrowUsdc("borrowing");
            toast.loading("Borrowing USDC...");
            const pool = new ethers.Contract(poolAddress, IPool_abi.abi, signer);
            const borrowTx = await pool.borrow(usdcAddress, usdcAmount, 2, 0, address);
            await borrowTx.wait(1);
            toast.dismiss();
            toast.success("Borrow successful");

            // Automatically import USDC into your wallet
            if (window.ethereum) {
                try {
                    await window.ethereum.request({
                        method: "wallet_watchAsset",
                        params: {
                            type: "ERC20",
                            options: {
                                address: usdcAddress,
                                symbol: "USDC",
                                decimals: 6,
                            },
                        },
                    });
                    toast.success("USDC added to your wallet");
                } catch (err) {
                    toast.error("Could not add USDC to wallet");
                }
            }

            setStepBorrowUsdc("idle");
            setAmountBorrowUsdc("");
            fetchBalances();
            fetchUserData();
        } catch (err) {
            console.log("Borrow failed:", err);
            toast.dismiss();
            toast.error("USDC is depleted, borrow other assets!");
            setStepBorrowUsdc("idle");
        }
    };

    // Repay USDC
    const handleRepayUsdc = async () => {
        if (!signer) return toast.error("Wallet not connected");
        if (!amountRepayUsdc) return toast.error("Enter an amount");

        const usdcAmount = ethers.parseUnits(amountRepayUsdc, 6);

        // Repay
        try {
            // Approve repay
            setStepRepayUsdc("approving");
            toast.loading("Approving Aave Pool...");
            const usdc = new ethers.Contract(usdcAddress, IERC20_abi.abi, signer);
            const approveTx = await usdc.approve(poolAddress, usdcAmount);
            await approveTx.wait(1);
            toast.dismiss();
            toast.success("Approval successful");

            // Repay
            setStepRepayUsdc("repaying");
            toast.loading("Repaying USDC...");
            const pool = new ethers.Contract(poolAddress, IPool_abi.abi, signer);
            const repayTx = await pool.repay(usdcAddress, usdcAmount, 2, address);
            await repayTx.wait(1);
            toast.dismiss();
            toast.success("Repay successful");

            setStepRepayUsdc("idle");
            setAmountRepayUsdc("");
            fetchBalances();
            fetchUserData();
        } catch (err) {
            console.log("Repay failed:", err);
            toast.dismiss();
            toast.error("Transaction failed");
            setStepRepayUsdc("idle");
        }
    };

    // Borrow LINK
    const handleBorrowLink = async () => {
        if (!signer) return toast.error("Wallet not connected");
        if (!amountBorrowLink) return toast.error("Enter an amount");

        const linkAmount = ethers.parseEther(amountBorrowLink);

        // Borrow
        try {
            setStepBorrowLink("borrowing");
            toast.loading("Borrowing LINK...");
            const pool = new ethers.Contract(poolAddress, IPool_abi.abi, signer);
            const borrowTx = await pool.borrow(linkAddress, linkAmount, 2, 0, address);
            await borrowTx.wait(1);
            toast.dismiss();
            toast.success("Borrow successful");

            // Automatically import LINK into your wallet
            if (window.ethereum) {
                try {
                    await window.ethereum.request({
                        method: "wallet_watchAsset",
                        params: {
                            type: "ERC20",
                            options: {
                                address: linkAddress,
                                symbol: "LINK",
                                decimals: 18,
                            },
                        },
                    });
                    toast.success("LINK added to your wallet");
                } catch (err) {
                    toast.error("Could not add LINK to wallet");
                }
            }

            setStepBorrowLink("idle");
            setAmountBorrowLink("");
            fetchBalances();
            fetchUserData();
        } catch (err) {
            console.log("Borrow failed:", err);
            toast.dismiss();
            toast.error("LINK is depleted, borrow other assets!");
            setStepBorrowLink("idle");
        }
    };

    // Repay LINK
    const handleRepayLink = async () => {
        if (!signer) return toast.error("Wallet not connected");
        if (!amountRepayLink) return toast.error("Enter an amount");

        const linkAmount = ethers.parseEther(amountRepayLink);

        // Repay
        try {
            // Approve repay
            setStepRepayLink("approving");
            toast.loading("Approving Aave Pool...");
            const link = new ethers.Contract(linkAddress, IERC20_abi.abi, signer);
            const approveTx = await link.approve(poolAddress, linkAmount);
            await approveTx.wait(1);
            toast.dismiss();
            toast.success("Approval successful");

            // Repay
            setStepRepayLink("repaying");
            toast.loading("Repaying LINK...");
            const pool = new ethers.Contract(poolAddress, IPool_abi.abi, signer);
            const repayTx = await pool.repay(linkAddress, linkAmount, 2, address);
            await repayTx.wait(1);
            toast.dismiss();
            toast.success("Repay successful!");

            setStepRepayLink("idle");
            setAmountRepayLink("");
            fetchBalances();
            fetchUserData();
        } catch (err) {
            console.log("Repay failed:", err);
            toast.dismiss();
            toast.error("Transaction failed");
            setStepRepayLink("idle");
        }
    };

    return (
        <div className="flex-col mt-3">
            <div className="relative bottom-12">
                <div className="flex gap-1 items-center">
                    <img src="/eth-blue.png" alt="Eth logo" width={28} />
                    <p className="text-2xl font-semibold">Ethereum Market</p>
                </div>
                <div className="flex gap-5 pt-3">
                    <div>
                        <p className="text-gray-700">Net worth</p>
                        <p className="font-semibold text-xl">
                            $
                            {userTotalColletaral ? Number(userTotalColletaral - userTotalDept).toFixed(2) : "0.00"}{" "}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-700">Health factor</p>
                        <p className="font-semibold text-xl">
                            {userTotalDept > 0.5 ? Number(userHealthFactor).toFixed(2) : "∞"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative bottom-3 flex flex-col sm:flex-row gap-8">
                <section className="border-1 border-gray-300 rounded-lg w-[540px] h-[400px]">
                    <div className="pt-7 pl-10 pr-10">
                        <p className="font-semibold text-center text-lg">Your supplies</p>
                        <div className="flex justify-between items-center pt-5 pb-6 border-b-1  border-gray-300">
                            <div className="">
                                <img src="weth.png" alt="Eth logo" width={25} className="inline-block" />
                                <span className="inline-block align-middle text-sm font-semibold ml-2">WETH</span>
                            </div>
                            <div className="flex-col justify-items-center">
                                <p>{aWethBalance ? Number(aWethBalance).toFixed(4) : "0.0000"}</p>
                                <p className="text-gray-500 text-sm">${Number(userTotalColletaral).toFixed(2)}</p>
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
                                        <h2 className="text-lg font-semibold mb-2">Withraw WETH</h2>

                                        <input
                                            placeholder="Enter WETH amount"
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
                                <p>{ethBalance ? Number(ethBalance).toFixed(4) : "0.0000"}</p>
                                <p className="text-gray-500 text-sm">${Number(ethBalance * 4000).toFixed(2)}</p>
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
                                <p>{wethBalance ? Number(wethBalance).toFixed(4) : "0.0000"}</p>
                                <p className="text-gray-500 text-sm">${Number(wethBalance * 4000).toFixed(2)}</p>
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
                                            placeholder="Enter WETH amount"
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
                <section className="border-1 border-gray-300 rounded-lg w-[540px] h-[400px]">
                    <div className="pt-7 pl-10 pr-10">
                        <p className="font-semibold text-center text-lg">Your borrows</p>
                        <div className="flex justify-between items-center pt-5">
                            <div className="">
                                <img src="usdc.png" alt="USDC logo" width={25} className="inline-block" />
                                <span className="inline-block align-middle text-sm font-semibold ml-2">USDC</span>
                            </div>
                            <div className="flex-col items-center justify-items-center">
                                <p>{usdcDeptBalance ? Number(usdcDeptBalance * 1e12).toFixed(4) : "0.0000"}</p>
                                <p className="text-gray-500 text-sm">
                                    ${usdcDeptBalance ? Number(usdcDeptBalance * 1e12).toFixed(2) : "0.00"}
                                </p>
                            </div>
                            {!showFormRepayUsdc && (
                                <button
                                    onClick={() => setShowFormRepayUsdc(true)}
                                    className="w-22 h-8 bg-blue-950 text-white transition hover:bg-gray-500 rounded-lg"
                                >
                                    Repay
                                </button>
                            )}

                            {/* The section only shows after button is clicked */}
                            {showFormRepayUsdc && (
                                <div className="fixed inset-0 flex items-center justify-center backdrop-blur-[3px]">
                                    <div className="p-6 rounded-2xl shadow-md bg-white max-w-sm w-full">
                                        <h2 className="text-lg font-semibold mb-2">Repay USDC</h2>

                                        <input
                                            placeholder="Enter USDC amount"
                                            value={amountRepayUsdc}
                                            onChange={(e) => setAmountRepayUsdc(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-950"
                                        />

                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleRepayUsdc}
                                                disabled={!amountRepayUsdc || stepRepayUsdc !== "idle"}
                                                className="w-22 h-8 bg-blue-950 transition hover:bg-gray-500  text-white rounded-lg shadow disabled:opacity-50"
                                            >
                                                {stepRepayUsdc === "approving" && "Approving..."}
                                                {stepRepayUsdc === "repaying" && "Repaying..."}
                                                {stepRepayUsdc === "idle" && "Repay"}
                                            </button>

                                            <button
                                                onClick={() => setShowFormRepayUsdc(false)}
                                                className="w-22 h-8 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-center pt-3 pb-6 border-b-1  border-gray-300">
                            <div className="">
                                <img src="link.png" alt="Eth logo" width={25} className="inline-block" />
                                <span className="inline-block align-middle text-sm font-semibold ml-2">LINK</span>
                            </div>
                            <div className="flex-col justify-items-center">
                                <p>{linkDeptBalance ? Number(linkDeptBalance).toFixed(4) : "0.0000"}</p>
                                <p className="text-gray-500 text-sm">${Number(linkDeptBalance * 30).toFixed(2)}</p>
                            </div>
                            {/* Trigger button */}
                            {!showFormRepayLink && (
                                <button
                                    onClick={() => setShowFormRepayLink(true)}
                                    className="w-22 h-8 bg-blue-950 text-white transition hover:bg-gray-500 rounded-lg"
                                >
                                    Repay
                                </button>
                            )}

                            {/* The section only shows after button is clicked */}
                            {showFormRepayLink && (
                                <div className="fixed inset-0 flex items-center justify-center backdrop-blur-[3px]">
                                    <div className="p-6 rounded-2xl shadow-md bg-white max-w-sm w-full">
                                        <h2 className="text-lg font-semibold mb-2">Repay LINK</h2>

                                        <input
                                            placeholder="Enter LINK amount"
                                            value={amountRepayLink}
                                            onChange={(e) => setAmountRepayLink(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-950"
                                        />

                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleRepayLink}
                                                disabled={!amountRepayLink || stepRepayLink !== "idle"}
                                                className="w-22 h-8 bg-blue-950 transition hover:bg-gray-500  text-white rounded-lg shadow disabled:opacity-50"
                                            >
                                                {stepRepayLink === "approving" && "Approving..."}
                                                {stepRepayLink === "repaying" && "Repaying..."}
                                                {stepRepayLink === "idle" && "Repay"}
                                            </button>

                                            <button
                                                onClick={() => setShowFormRepayLink(false)}
                                                className="w-22 h-8 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="font-semibold text-center text-lg pt-5">Assets to borrow</p>
                        <div className="flex justify-between items-center pt-5">
                            <div className="">
                                <img src="usdc.png" alt="Eth logo" width={25} className="inline-block" />
                                <span className="inline-block align-middle text-sm font-semibold ml-2">USDC</span>
                            </div>
                            <div className="flex-col items-center justify-items-center">
                                <p>{Number(userAvailableBorrows).toFixed(4)}</p>
                                <p className="text-gray-500 text-sm">${Number(userAvailableBorrows).toFixed(2)}</p>
                            </div>
                            {/* Trigger button */}
                            {!showFormBorrowUsdc && (
                                <button
                                    onClick={() => setShowFormBorrowUsdc(true)}
                                    className="w-22 h-8 bg-blue-950 text-white transition hover:bg-gray-500 rounded-lg"
                                >
                                    Borrow
                                </button>
                            )}

                            {/* The section only shows after button is clicked */}
                            {showFormBorrowUsdc && (
                                <div className="fixed inset-0 flex items-center justify-center backdrop-blur-[3px]">
                                    <div className="p-6 rounded-2xl shadow-md bg-white max-w-sm w-full">
                                        <h2 className="text-lg font-semibold mb-2">Borrow USDC</h2>

                                        <input
                                            placeholder="Enter USDC amount"
                                            value={amountBorrowUsdc}
                                            onChange={(e) => setAmountBorrowUsdc(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-950"
                                        />

                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleBorrowUsdc}
                                                disabled={!amountBorrowUsdc || stepBorrowUsdc !== "idle"}
                                                className="w-22 h-8 bg-blue-950 transition hover:bg-gray-500  text-white rounded-lg shadow disabled:opacity-50"
                                            >
                                                {stepBorrowUsdc === "borrowing" && "Borrowing..."}
                                                {stepBorrowUsdc === "idle" && "Borrow"}
                                            </button>

                                            <button
                                                onClick={() => setShowFormBorrowUsdc(false)}
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
                                <p>{Number(userAvailableBorrows / 30).toFixed(4)}</p>
                                <p className="text-gray-500 text-sm">${Number(userAvailableBorrows).toFixed(2)}</p>
                            </div>
                            {/* Trigger button */}
                            {!showFormBorrowLink && (
                                <button
                                    onClick={() => setShowFormBorrowLink(true)}
                                    className="w-22 h-8 bg-blue-950 text-white transition hover:bg-gray-500 rounded-lg"
                                >
                                    Borrow
                                </button>
                            )}

                            {/* The section only shows after button is clicked */}
                            {showFormBorrowLink && (
                                <div className="fixed inset-0 flex items-center justify-center backdrop-blur-[3px]">
                                    <div className="p-6 rounded-2xl shadow-md bg-white max-w-sm w-full">
                                        <h2 className="text-lg font-semibold mb-2">Borrow LINK</h2>

                                        <input
                                            placeholder="Enter LINK amount"
                                            value={amountBorrowLink}
                                            onChange={(e) => setAmountBorrowLink(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-950"
                                        />

                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleBorrowLink}
                                                disabled={!amountBorrowLink || stepBorrowLink !== "idle"}
                                                className="w-22 h-8 bg-blue-950 transition hover:bg-gray-500  text-white rounded-lg shadow disabled:opacity-50"
                                            >
                                                {stepBorrowLink === "borrowing" && "Borrowing..."}
                                                {stepBorrowLink === "idle" && "Borrow"}
                                            </button>

                                            <button
                                                onClick={() => setShowFormBorrowLink(false)}
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
