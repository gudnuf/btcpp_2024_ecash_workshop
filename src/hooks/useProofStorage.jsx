import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

const ProofContext = createContext(undefined);

/* key used to identify the proofs in localStorage */
const STORAGE_KEY = "proofs";

class DuplicateProofError extends Error {
  constructor(secret) {
    super(`Proof with secret ${secret} already exists`);
    this.name = "DuplicateProofError";
  }
}

class ProofNotFoundError extends Error {
  constructor(secret) {
    super(`Proof with secret ${secret} not found`);
    this.name = "ProofNotFoundError";
  }
}

/* get proofs from localStorage */
const getStoredProofs = () => {
  try {
    const storedProofs = localStorage.getItem(STORAGE_KEY);
    return storedProofs ? JSON.parse(storedProofs) : [];
  } catch (error) {
    console.error("Error reading proofs from localStorage:", error);
    return [];
  }
};

/* rewrite all proofs in localStorage */
const setStoredProofs = (proofs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(proofs));
  } catch (error) {
    console.error("Error writing proofs to localStorage:", error);
  }
};

/* providers wrap the app and provide a single state */
export const ProofProvider = ({ children }) => {
  const [proofs, setProofs] = useState([]); /* all proofs */
  const [isLoading, setIsLoading] = useState(true);
  const [lockedBalance, setLockedBalance] =
    useState(null); /* stops the balance from changing during transactions */

  /* load proofs from localStorage on mount */
  useEffect(() => {
    const load = async () => {
      const proofs = getStoredProofs();
      setProofs(proofs);
    };
    load().then(() => setIsLoading(false));
  }, []);

  /* calculate total balance and balance for each wallet when proofs change */
  const { balance, balanceByWallet } = useMemo(() => {
    let totalBalance = 0;
    const newBalanceByWallet = {};

    proofs.forEach((proof) => {
      totalBalance += proof.amount;
      newBalanceByWallet[proof.id] =
        (newBalanceByWallet[proof.id] || 0) + proof.amount;
    });

    return {
      balance: lockedBalance !== null ? lockedBalance : totalBalance,
      balanceByWallet: newBalanceByWallet,
    };
  }, [proofs, lockedBalance]);

  /* set the locked balance to the current balance */
  const lockBalance = useCallback(() => {
    setLockedBalance(balance);
  }, [balance]);

  /* set the locked balance to null to unlock */
  const unlockBalance = () => {
    setLockedBalance(null);
  };

  /**
   * Add proofs to localStorage
   * @param {Proof[]} newProofs - proofs to add
   */
  const addProofs = (newProofs) => {
    const currentProofs = getStoredProofs();
    const existingSecrets = new Set(currentProofs.map((p) => p.secret));
    const proofsToAdd = newProofs.filter((proof) => {
      if (existingSecrets.has(proof.secret)) {
        throw new DuplicateProofError(proof.secret);
      }
      return true;
    });
    const updatedProofs = [...currentProofs, ...proofsToAdd];
    setStoredProofs(updatedProofs);
    setProofs(updatedProofs);
  };

  /* once proofs are spent, remove them  */
  const removeProofs = (proofsToRemove) => {
    const currentProofs = getStoredProofs();
    const existingSecrets = new Set(currentProofs.map((p) => p.secret));
    proofsToRemove.forEach((proof) => {
      if (!existingSecrets.has(proof.secret)) {
        throw new ProofNotFoundError(proof.secret);
      }
    });
    const proofsToKeep = currentProofs.filter(
      (proof) => !proofsToRemove.some((p) => p.secret === proof.secret)
    );
    setStoredProofs(proofsToKeep);
    setProofs(proofsToKeep);
  };

  /* only get the needed proofs for the given amount */
  const getProofsByAmount = (amount, keysetId) => {
    const currentProofs = getStoredProofs();
    const result = [];
    let sum = 0;

    for (const proof of currentProofs) {
      if (sum >= amount) break;
      if (keysetId && proof.id !== keysetId) continue;
      result.push(proof);
      sum += proof.amount;
    }

    return result.length > 0 && sum >= amount ? result : null;
  };

  /* find all proofs with id === keysetId */
  const getAllProofsByKeysetId = useCallback(
    (keysetId) => {
      return proofs.filter((proof) => proof.id === keysetId);
    },
    [proofs]
  );

  /* delets all proofs */
  const clearProofs = () => {
    setProofs([]);
    setStoredProofs([]);
  };

  /* values we can use in the app */
  const value = {
    balance,
    addProofs,
    removeProofs,
    getProofsByAmount,
    clearProofs,
    isLoading,
    getAllProofsByKeysetId,
    balanceByWallet,
    lockBalance,
    unlockBalance,
  };

  return (
    <ProofContext.Provider value={value}>{children}</ProofContext.Provider>
  );
};

export const useProofStorage = () => {
  const context = useContext(ProofContext);
  if (context === undefined) {
    throw new Error("useProofStorage must be used within a ProofProvider");
  }
  return context;
};
