import { useWalletManager } from "@/hooks/useWalletManager";
import { useState, useEffect } from "react";
import { lookupMint } from "@/utils/cashu";

const Home = () => {
  /* import functions from hooks */
  const { addWallet, activeWallet, wallets, setActiveWallet } =
    useWalletManager();

  /* useState to hold input values */
  const [addWalletUrl, setAddWalletUrl] = useState("");
  const [addWalletUnit, setAddWalletUnit] = useState("");

  /* useState to hold UI state */
  const [supportedUnits, setSupportedUnits] = useState([]);
  const [mintSearched, setMintSearched] = useState(false);

  /* log active wallet every time it changes */
  useEffect(() => {
    console.log("Active wallet:", activeWallet);
    console.log("Active wallet mint:", activeWallet?.mint.url);
  }, [activeWallet]);

  const handleLookupMint = async () => {
    try {
      const { units } = await lookupMint(addWalletUrl);

      /* set state for the UI */
      setSupportedUnits(units);
      setAddWalletUnit(units[0] || "");
      setMintSearched(true);
    } catch (error) {
      console.error("Error looking up mint:", error);

      setSupportedUnits([]);
      setMintSearched(false);
    }
  };

  const handleAddWallet = async () => {
    await addWallet(addWalletUrl, addWalletUnit);

    /* reset UI state */
    setMintSearched(false);
    setSupportedUnits([]);
    setAddWalletUrl("");
    setAddWalletUnit("");
  };

  const handleWalletChange = (event) => {
    /* `event` gets created when the wallet gets selected */
    const selectedWallet = wallets.get(event.target.value);
    if (selectedWallet) {
      setActiveWallet(selectedWallet, event.target.value);
    }
  };

  return (
    <>
      <h2>Manage Wallets</h2>
      <div className="flex flex-col space-y-4">
        {/* Wallet selection dropdown */}
        <div>
          <h3>Set active wallet</h3>
          <div className="input-container">
            <select
              onChange={handleWalletChange}
              value={
                activeWallet
                  ? Array.from(wallets.keys()).find(
                      (key) => wallets.get(key) === activeWallet,
                    )
                  : ""
              }
            >
              <option value="">Select a wallet</option>
              {Array.from(wallets).map(([keysetId, wallet]) => (
                <option key={keysetId} value={keysetId}>
                  {wallet.mint.mintUrl} ({wallet.keys.unit})
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* add wallet button */}
        <div>
          <h3>Add a wallet</h3>
          <div className="flex flex-col ">
            <div className="input-container">
              <input
                type="text"
                placeholder="Enter mint url"
                value={addWalletUrl}
                a
                onChange={(e) => setAddWalletUrl(e.target.value)}
              />

              {mintSearched ? (
                <>
                  <p>Select unit:</p>
                  <select
                    value={addWalletUnit}
                    onChange={(e) => setAddWalletUnit(e.target.value)}
                  >
                    {supportedUnits.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <button onClick={handleAddWallet}>Submit</button>
                </>
              ) : (
                <button onClick={handleLookupMint}>Search</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
