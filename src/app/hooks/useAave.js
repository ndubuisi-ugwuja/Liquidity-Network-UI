import { useReadContract } from "wagmi";
import { contractAddresses, IPool_abi, IPoolAddressesProvider_abi } from "../constants";

export function useAavePool() {
    const { providerAddress } = contractAddresses;

    // read pool address
    const { data: poolAddress } = useReadContract({
        address: providerAddress,
        abi: IPoolAddressesProvider_abi,
        functionName: "getPool",
    });

    // helper to create pool contract config for writes (we use prepare+write in components)
    return {
        poolAddress,
        poolAbi: IPool_abi,
        wethAddress: contractAddresses.wethTokenAddress,
        linkAddress: contractAddresses.linkTokenAddress,
        usdtAddress: contractAddresses.usdtTokenAddress,
    };
}
