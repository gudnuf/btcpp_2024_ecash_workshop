import React, { createContext, useContext, useState, useEffect } from "react";
import {
  CashuMint,
  CashuWallet,
  MintKeys,
  MintQuoteResponse,
} from "@cashu/cashu-ts";

/**
 * @typedef {Object} WalletContextType
 * @property {Map<string, CashuWallet>} wallets - Map of wallet keysetIds to CashuWallet instances
 * @property {boolean} isLoading - Indicates if wallets are still loading
 * @property {(url: string, unit?: string) => Promise<void>} addWallet - Function to add a new wallet
 * @property {CashuWallet | null} activeWallet - Currently active wallet
 * @property {(wallet: CashuWallet, keysetId: string) => void} setActiveWallet - Function to set the active wallet
 * @property {Array<MintQuoteResponse>} pendingMintQuotes
 * @property {(quote: MintQuoteResponse) => void} addPendingMintQuote
 * @property {(quoteId: string) => void} removePendingMintQuote
 */

/** @type {React.Context<WalletContextType | undefined>} */
const WalletContext = createContext(undefined);

const addWalletToLocalStorage = (url, keysetId, unit, keys) => {
  const mintUrls = JSON.parse(localStorage.getItem("mintUrls") || "[]");
  if (!mintUrls.includes(url)) {
    mintUrls.push(url);
    localStorage.setItem("mintUrls", JSON.stringify(mintUrls));
  }

  const mintData = JSON.parse(localStorage.getItem(url) || "{}");
  if (!mintData.keysets) {
    mintData.keysets = [];
  }
  mintData.keysets.push({ keysetId, unit, keys });
  localStorage.setItem(url, JSON.stringify(mintData));
};

const setActiveWalletInLocalStorage = (keysetId) => {
  console.log("Setting active wallet to keysetId:", keysetId);
  if (keysetId) {
    localStorage.setItem("activeWalletKeysetId", keysetId);
  } else {
    console.warn("Attempted to set undefined keysetId as active wallet");
  }
};

/**
 * The mints and wallets we add along with their keysets will be stored locally.
 *
 * Local Storage State Summary:
 *
 * 1. "mintUrls": JSON array of mint URLs
 *    - Stores all unique mint URLs added by the user
 *
 * 2. For each mint URL (stored using the URL as the key):
 *    - JSON object containing:
 *      {
 *        keysets: [
 *          {
 *            keysetId: string,
 *            unit: string,
 *            keys: MintKeys
 *          },
 *          ...
 *        ]
 *      }
 *    - Stores keyset information for each mint
 *
 * 3. "activeWalletKeysetId": string
 *    - Stores the keysetId of the currently active wallet
 */

export const WalletProvider = ({ children }) => {
  const [wallets, setWallets] = useState(new Map());
  const [activeWallet, setActiveWalletState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMintQuotes, setPendingMintQuotes] = useState([]);

  useEffect(() => {
    /* initialize wallets from mint data in localStorage */
    const load = async () => {};

    load().then(() => setIsLoading(false));

    const pendingMintQuotes = JSON.parse(
      localStorage.getItem("pendingMintQuotes") || "[]"
    );
    setPendingMintQuotes(pendingMintQuotes);
  }, []);

  const addWallet = async (url, unit = "sat") => {};

  const setActiveWallet = (wallet, keysetId) => {
    if (wallet && keysetId) {
      setActiveWalletState(wallet);
      setActiveWalletInLocalStorage(keysetId);
    } else {
      console.warn("Attempted to set invalid active wallet", {
        wallet,
        keysetId,
      });
    }
  };

  const addPendingMintQuote = (quote) => {
    setPendingMintQuotes((pendingMintQuotes) => {
      const newMintQuotes = [...pendingMintQuotes, quote];
      localStorage.setItem("pendingMintQuotes", JSON.stringify(newMintQuotes));
      return newMintQuotes;
    });
  };

  const removePendingMintQuote = (quoteId) => {
    setPendingMintQuotes((pendingMintQuotes) => {
      const newMintQuotes = pendingMintQuotes.filter(
        (quote) => quote.quote !== quoteId
      );
      localStorage.setItem("pendingMintQuotes", JSON.stringify(newMintQuotes));
      return newMintQuotes;
    });
  };

  /** @type {WalletContextType} */
  const value = {
    wallets,
    isLoading,
    addWallet,
    activeWallet,
    setActiveWallet,
    pendingMintQuotes,
    addPendingMintQuote,
    removePendingMintQuote,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWalletManager = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletManager must be used within a WalletProvider");
  }
  return context;
};
