import { CashuMint, CashuWallet, MintQuoteState } from "@cashu/cashu-ts";
import { useState, useEffect } from "react";
import { useProofStorage } from "./useProofStorage";

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
  const { addProofs, getProofsByAmount, balance } = useProofStorage();

  const [pollInterval, setPollInterval] = useState(null);

  /* stop polling when component is unmounted */
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
  const receiveLightningPayment = async (amount, handleSuccess) => {
    const mintQuote = await wallet.createMintQuote(amount);
    const invoice = mintQuote.request;
    const quoteId = mintQuote.quote;

    /* poll for invoice payment */
    const startPolling = () => {
      const interval = setInterval(async () => {
        try {
          /* check mint quote status */
          const quote = await wallet.checkMintQuote(quoteId);
          if (quote.state === MintQuoteState.PAID) {
            /* mint tokens */
            const { proofs } = await wallet.mintTokens(amount, quoteId);
            addProofs(proofs); /* store created proofs */
            clearInterval(interval); /* stop polling */
            handleSuccess(); /* call success callback */
          } else {
            console.log("Waiting for payment...", mintQuote);
          }
        } catch (error) {
          console.error("Error while polling for payment:", error);
        }
      }, 5000); // Poll every 5 seconds
      setPollInterval(interval);
    };

    startPolling();
    return invoice;
  };

  /**
   * Use locally stored proofs to pay an invoice
   * @param {string} invoice - lightning invoice to pay
   */
  const sendLightningPayment = async (invoice) => {
    const meltQuote = await wallet.createMeltQuote(invoice);

    const amount = meltQuote.amount + meltQuote.fee_reserve;

    const proofsToSend = getProofsByAmount(amount, wallet.keys.id);

    if (!proofsToSend) {
      throw new InsufficientBalanceError(balance, amount);
    }

    const { change, isPaid, preimage } = await wallet.meltTokens(
      meltQuote,
      proofsToSend
    );

    addProofs(change);

    if (isPaid) {
      console.log("Payment was successful", preimage);
    } else {
      console.log("Payment failed");
    }
  };

  return { receiveLightningPayment, sendLightningPayment };
};

export default useCashuWallet;
