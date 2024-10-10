import { CashuWallet, MintQuoteState, Proof } from "@cashu/cashu-ts";
import { useState, useEffect } from "react";
import { useProofStorage } from "./useProofStorage";
import { useWalletManager } from "./useWalletManager";

class InsufficientBalanceError extends Error {
  constructor(balance, amount) {
    super(`Insufficient balance: ${balance} sats, required: ${amount} sats`);
    this.name = "InsufficientBalanceError";
  }
}

/**
 * @param {CashuWallet} wallet
 */
const useCashuWallet = (wallet) => {
  const { addProofs, removeProofs, getProofsByAmount, balance } =
    useProofStorage();
  const { addPendingMintQuote, removePendingMintQuote } = useWalletManager();

  const [pollInterval, setPollInterval] = useState(null);

  /* stop polling when component is unmounted (not rendered) */
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  /**
   * Generate an invoice from the mint, and mint tokens when the invoice gets paid
   * @param {number} amount - amount to receive in sats
   * @param {() => void} handleSuccess - function to call when payment is successful
   * @returns {Promise<string>} invoice - and continues to poll until invoice is paid
   */
  const receiveLightningPayment = async (amount, handleSuccess) => {};

  /**
   * Use locally stored proofs to pay an invoice
   * @param {string} invoice - lightning invoice to pay
   */
  const sendLightningPayment = async (invoice) => {};

  /**
   * Swap proofs from one wallet to another
   * @param {CashuWallet} to - wallet to swap proofs to
   * @param {Array<Proof>} proofs - proofs to swap
   * @returns {Promise<number>} totalMinted - amount we were able to mint to the `to` mint
   */
  const crossMintSwap = async (to, proofs) => {};

  return { receiveLightningPayment, sendLightningPayment, crossMintSwap };
};

export default useCashuWallet;
