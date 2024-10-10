import { useState } from "react";
import { useWalletManager } from "@/hooks/useWalletManager";
import useCashuWallet from "@/hooks/useCashuWallet";
import { useProofStorage } from "@/hooks/useProofStorage";

const Transfer = () => {
  const { activeWallet, wallets, setActiveWallet } = useWalletManager();
  const { crossMintSwap } = useCashuWallet(activeWallet);
  const { getAllProofsByKeysetId, removeProofs } = useProofStorage();

  const [selectedWallet, setSelectedWallet] = useState("");

  const handleWalletChange = (event) => {
    setSelectedWallet(event.target.value);
  };

  const handleTransfer = async () => {
    if (selectedWallet === "") {
      throw new Error("no wallet was selected");
    }

    /* all proofs for this wallet */
    const proofsToSwap = getAllProofsByKeysetId(activeWallet.keys.id);

    if (proofsToSwap.length === 0) {
      throw new Error("wallet has no balance");
    }

    const walletToSwapTo = wallets.get(selectedWallet);

    const amountSwapped = await crossMintSwap(walletToSwapTo, proofsToSwap);

    console.log(`Swapped ${amountSwapped} to ${walletToSwapTo.mint.mintUrl}`);

    /* successfuly swapped, so delete these proofs */
    removeProofs(proofsToSwap);

    /* finally, set the active wallet to what we swapped to */
    setActiveWallet(walletToSwapTo, walletToSwapTo.keys.id);

    setSelectedWallet("");
  };

  return (
    <>
      <h2>Transfer</h2>
      <div className="flex flex-col space-y-2">
        <div className="input-container">
          <select onChange={handleWalletChange} value={selectedWallet}>
            <option value="">Select a wallet to transfer to</option>
            {Array.from(wallets).map(([keysetId, wallet]) => {
              /* only show wallets of same unit and different mint */
              if (
                wallet.mint.mintUrl !== activeWallet.mint.mintUrl &&
                wallet.keys.unit === activeWallet.keys.unit
              ) {
                return (
                  <option key={keysetId} value={keysetId}>
                    {wallet.mint.mintUrl} ({wallet.keys.unit})
                  </option>
                );
              }
              return null;
            })}
          </select>
          <button onClick={handleTransfer} disabled={!selectedWallet}>
            Transfer
          </button>
        </div>
      </div>
    </>
  );
};

export default Transfer;
