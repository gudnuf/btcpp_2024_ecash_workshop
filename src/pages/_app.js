import "@/styles/globals.css";
import { useMemo } from "react";
import { ProofProvider } from "@/hooks/useProofStorage";
import { WalletProvider } from "@/hooks/useWalletManager";
import Link from "next/link";
import { useRouter } from "next/router";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import HomeIcon from "@mui/icons-material/Home";
import SendIcon from "@mui/icons-material/Send";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import OfflineIcon from "@mui/icons-material/SignalWifiStatusbarConnectedNoInternet4TwoTone";
import { useWalletManager } from "@/hooks/useWalletManager";
import { useProofStorage } from "@/hooks/useProofStorage";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  const navItems = [
    { href: "/", icon: <HomeIcon /> },
    { href: "/wallet/send", icon: <SendIcon /> },
    { href: "/wallet/receive", icon: <CallReceivedIcon /> },
    { href: "/wallet/transfer", icon: <AutorenewIcon /> },
    { href: "/offline", icon: <OfflineIcon /> },
  ];

  return (
    <WalletProvider>
      <ProofProvider>
        <div className="flex min-h-screen">
          <nav className="w-16 bg-gray-800 flex flex-col items-center py-4">
            {navItems.map((item) => (
              <Link href={item.href} key={item.href}>
                <div
                  className={`p-2 mb-4 rounded-full ${
                    router.pathname === item.href
                      ? "bg-blue-500 text-white"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {item.icon}
                </div>
              </Link>
            ))}
          </nav>
          <div className="flex-grow flex flex-col">
            <ActiveWalletInfo />
            <div className="flex-grow flex items-start justify-center">
              <div className="container mx-auto px-4 flex flex-col space-y-8">
                <Component {...pageProps} />
              </div>
            </div>
          </div>
        </div>
      </ProofProvider>
    </WalletProvider>
  );
}
const ActiveWalletInfo = () => {
  const { activeWallet } = useWalletManager();
  const { balance, balanceByWallet } = useProofStorage();

  const balanceToDisplay = useMemo(() => {
    const keysetId = activeWallet?.keys.id;
    if (!keysetId) return balance;
    return balanceByWallet[keysetId] || 0;
  }, [balance, balanceByWallet, activeWallet]);

  if (!activeWallet) {
    return null;
  }

  return (
    <div className="w-full py-4 text-center">
      <h1>Balance: {balanceToDisplay}</h1>
      {activeWallet?.mint.mintUrl} - {activeWallet?.keys.unit}
    </div>
  );
};
