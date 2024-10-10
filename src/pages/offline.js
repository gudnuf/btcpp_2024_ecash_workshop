import { useProofStorage } from "@/hooks/useProofStorage";
import { useWalletManager } from "@/hooks/useWalletManager";
import { getDecodedToken, getEncodedToken } from "@cashu/cashu-ts";
import { useState } from "react";
const Offline = () => {
  const { activeWallet } = useWalletManager();
  const { getAllProofsByKeysetId, removeProofs } = useProofStorage();
  const [token, setToken] = useState();

  const handleSendAll = () => {
    const proofs = getAllProofsByKeysetId(activeWallet.keys.id);

    if (proofs.length === 0) {
      throw new Error("No proofs in this mint :/");
    }

    const token = getEncodedToken({
      token: [{ mint: activeWallet.mint.mintUrl, proofs }],
      unit: activeWallet.keys.unit,
    });

    setToken(token);
  };

  const handleCopyAndDelete = () => {
    if (token) {
      navigator.clipboard
        .writeText(token)
        .then(() => {
          alert("Token copied to clipboard!");
          const proofsToRemove = getDecodedToken(token).token[0].proofs;
          removeProofs(proofsToRemove);
        })
        .catch((err) => console.error("Failed to copy token: ", err));
      setToken(null);
    }
  };

  return (
    <>
      <button onClick={handleSendAll}>Send All Offline</button>
      {token && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg overflow-auto flex flex-col items-center space-y-4">
          <p className="font-mono text-sm break-all whitespace-pre-wrap text-black">
            {token}
          </p>
          <button className="bg-red-500" onClick={handleCopyAndDelete}>
            Copy and Delete Proofs
          </button>
        </div>
      )}
    </>
  );
};

export default Offline;
