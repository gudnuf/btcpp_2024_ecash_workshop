import React, { createContext, useContext, useState, useEffect } from "react";
import { CashuMint, CashuWallet } from "@cashu/cashu-ts";

/**
 * @typedef {Object} WalletContextType
 * @property {Map<string, CashuWallet>} wallets - Map of wallet keysetIds to CashuWallet instances
 * @property {boolean} isLoading - Indicates if wallets are still loading
 * @property {(url: string, unit?: string) => Promise<void>} addWallet - Function to add a new wallet
 * @property {CashuWallet | null} activeWallet - Currently active wallet
 * @property {(wallet: CashuWallet, keysetId: string) => void} setActiveWallet - Function to set the active wallet
 */

/** @type {React.Context<WalletContextType | undefined>} */
const WalletContext = createContext(undefined);

const addWalletToLocalStorage = (url, keysetId, unit, keys) => {
  const mintUrls = JSON.parse(localStorage.getItem("mintUrls") || "[]");
  mintUrls.push(url);
  localStorage.setItem("mintUrls", JSON.stringify(mintUrls));
  localStorage.setItem(url, JSON.stringify({ url, keysetId, unit, keys }));
};

const setActiveWalletInLocalStorage = (keysetId) => {
  console.log("Setting active wallet to keysetId:", keysetId);
  if (keysetId) {
    localStorage.setItem("activeWalletKeysetId", keysetId);
  } else {
    console.warn("Attempted to set undefined keysetId as active wallet");
  }
};

export const WalletProvider = ({ children }) => {
  const [wallets, setWallets] = useState(new Map());
  const [activeWallet, setActiveWalletState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /* initialize wallets from mint data in localStorage */
    const load = async () => {
      const mintUrls = JSON.parse(localStorage.getItem("mintUrls") || "[]");

      console.log("Loading wallets for mint urls:", mintUrls);

      /** @type {Array<{url: string, keysetId: string, unit: string, keys: object}>} */
      const walletsToInitialize = mintUrls.flatMap((url) => {
        const mintData = JSON.parse(localStorage.getItem(url));

        if (!mintData) {
          console.warn(`Mint data for ${url} not found`);
          return [];
        }

        return { ...mintData, url };
      });

      const walletsTemp = new Map();
      const mintKeysets = new Map();

      for await (const walletData of walletsToInitialize) {
        const mint = new CashuMint(walletData.url);

        let keysets;
        if (!mintKeysets.has(walletData.url)) {
          keysets = await mint.getKeySets();
          mintKeysets.set(walletData.url, keysets);
        } else {
          keysets = mintKeysets.get(walletData.url);
        }

        const keyset = keysets.keysets.find(
          (keyset) => keyset.id === walletData.keysetId
        );

        if (!keyset) {
          console.warn(`Keyset ${walletData.keysetId} not found`);
        }
        if (keyset.active !== true) {
          console.warn(
            `Keyset ${walletData.keysetId} is no longer active, you should rotate to the new keyset`
          );
        }

        const wallet = new CashuWallet(mint, {
          keys: {
            unit: walletData.unit,
            id: walletData.keysetId,
            keys: walletData.keys,
          },
        });

        walletsTemp.set(walletData.keysetId, wallet);
      }

      setWallets(walletsTemp);
      console.log("Wallets loaded:", walletsTemp);

      /* Set active wallet from local storage */
      const activeWalletKeysetId = localStorage.getItem("activeWalletKeysetId");
      console.log("Active wallet keyset id:", activeWalletKeysetId);

      if (activeWalletKeysetId && walletsTemp.has(activeWalletKeysetId)) {
        setActiveWallet(
          walletsTemp.get(activeWalletKeysetId),
          activeWalletKeysetId
        );
      } else if (walletsTemp.size > 0) {
        const firstWallet = walletsTemp.entries().next().value;
        setActiveWallet(firstWallet[1], firstWallet[0]);
      }
    };
    load().then(() => setIsLoading(false));
  }, []);

  const addWallet = async (url, unit = "sat") => {
    console.log("Adding wallet:", url, unit);

    console.log("Fetching keys...");
    const mint = new CashuMint(url);
    const keysets = await mint.getKeySets();
    const keysetForUnit = keysets.keysets.find(
      (keyset) => keyset.unit === unit
    );
    if (!keysetForUnit) {
      throw new Error(`No keyset found for unit ${unit}`);
    }
    console.log("Found keyset:", keysetForUnit);
    const keysResponse = await mint.getKeys(keysetForUnit.id);
    const keys = keysResponse.keysets.find(
      (k) => k.id === keysetForUnit.id
    ).keys;
    const walletOptions = {
      unit,
      keys,
      mnemonicOrSeed: undefined,
    };
    console.log("Creating wallet:", walletOptions);
    const wallet = new CashuWallet(mint, walletOptions);
    setWallets((wallets) => new Map([...wallets, [keysetForUnit.id, wallet]]));
    addWalletToLocalStorage(url, keysetForUnit.id, unit, keys);
    if (activeWallet === null) {
      setActiveWallet(wallet, keysetForUnit.id);
    }
  };

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

  /** @type {WalletContextType} */
  const value = {
    wallets,
    isLoading,
    addWallet,
    activeWallet,
    setActiveWallet,
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
