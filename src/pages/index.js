import { useProofStorage } from "@/hooks/useProofStorage";
import useCashuWallet from "@/hooks/useCashuWallet";
import { useWalletManager } from "@/hooks/useWalletManager";
import { useState, useEffect } from "react";
import { QRCode } from "react-qrcode";

const Home = () => {
  const { balance } = useProofStorage(); /* balance of all proofs */
  const { addWallet, activeWallet } = useWalletManager();
  const { receiveLightningPayment, sendLightningPayment } =
    useCashuWallet(activeWallet);
  const [showReceiveInput, setShowReceiveInput] = useState(false);
  const [showSendInput, setShowSendInput] = useState(false);
  const [showAddWalletInput, setShowAddWalletInput] = useState(false);
  const [receiveAmount, setReceiveAmount] = useState("");
  const [sendInvoice, setSendInvoice] = useState("");
  const [addWalletUrl, setAddWalletUrl] = useState("");
  const [showQrCode, setShowQrCode] =
    useState(null); /* { title: string, value: string } */

  useEffect(() => {
    console.log("Active wallet:", activeWallet);
    console.log("Active wallet mint:", activeWallet?.mint.url);
  }, [activeWallet]);

  const handleReceiveSubmit = async () => {
    const handleSuccess = () => {
      setShowQrCode(null);
    };
    const invoiceToPay = await receiveLightningPayment(
      receiveAmount,
      handleSuccess
    );
    setShowQrCode({ title: "Lightning Invoice", value: invoiceToPay });
  };

  const handleSendSubmit = async () => {
    await sendLightningPayment(sendInvoice);
  };

  const handleAddWallet = async () => {
    await addWallet(addWalletUrl);
    setShowAddWalletInput(false);
  };

  return (
    // container for whole page
    <div className="flex flex-col items-center justify-center h-screen space-y-5">
      {/* wallet metadata */}
      <h1>Balance: {balance}</h1>
      <h2>
        Active Wallet: {activeWallet?.mint.mintUrl} {activeWallet?.keys.unit}
      </h2>
      {/* receive button */}
      <div className="flex flex-col space-y-2">
        <div>
          <button onClick={() => setShowReceiveInput(!showReceiveInput)}>
            Receive
          </button>
          {showReceiveInput && (
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Enter amount"
                value={receiveAmount}
                onChange={(e) => setReceiveAmount(e.target.value)}
                className="ml-2 p-2 border rounded"
              />
              <button onClick={handleReceiveSubmit} className="ml-2">
                Submit
              </button>
            </div>
          )}
        </div>

        {/* send button */}
        <div>
          <button onClick={() => setShowSendInput(!showSendInput)}>Send</button>
          {showSendInput && (
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Enter lightning invoice"
                value={sendInvoice}
                onChange={(e) => setSendInvoice(e.target.value)}
                className="ml-2 p-2 border rounded"
              />
              <button onClick={handleSendSubmit} className="ml-2">
                Submit
              </button>
            </div>
          )}
        </div>

        {/* add wallet button */}
        <div>
          <button onClick={() => setShowAddWalletInput(!showAddWalletInput)}>
            Add wallet
          </button>
          {showAddWalletInput && (
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Enter mint url"
                value={addWalletUrl}
                onChange={(e) => setAddWalletUrl(e.target.value)}
                className="ml-2 p-2 border rounded"
              />
              <button onClick={handleAddWallet} className="ml-2">
                Submit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* qr code modal */}
      {showQrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2">{showQrCode.title}</h3>
            <QRCode value={showQrCode.value} />
            <button
              onClick={() => setShowQrCode(null)}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
