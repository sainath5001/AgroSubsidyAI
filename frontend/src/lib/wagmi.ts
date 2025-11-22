import { http, createConfig, fallback } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// Use environment variable or fallback to multiple public RPC endpoints
const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
const fallbackRpcUrls = [
  rpcUrl,
  "https://sepolia.drpc.org",
  "https://rpc.sepolia.org",
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://sepolia.gateway.tenderly.co",
].filter(Boolean) as string[];

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected({ target: "metaMask" })],
  transports: {
    [sepolia.id]: fallback(fallbackRpcUrls.map((url) => http(url))),
  },
  ssr: true,
});





