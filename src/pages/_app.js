import "@/styles/globals.css";
import { ProofProvider } from "@/hooks/useProofStorage";
import { WalletProvider } from "@/hooks/useWalletManager";

export default function App({ Component, pageProps }) {
  return (
    <WalletProvider>
      <ProofProvider>
        <Component {...pageProps} />
      </ProofProvider>
    </WalletProvider>
  );
}
