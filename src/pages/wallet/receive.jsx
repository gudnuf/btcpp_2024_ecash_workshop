import { useState } from "react";
import { QRCode } from "react-qrcode";
import useCashuWallet from "@/hooks/useCashuWallet";
import { useWalletManager } from "@/hooks/useWalletManager";

const Receive = () => {
  const { activeWallet, pendingMintQuotes } = useWalletManager();
  const { receiveLightningPayment } = useCashuWallet(activeWallet);

  const [receiveAmount, setReceiveAmount] = useState("");
  const [showQrCode, setShowQrCode] = useState(null);

  const handleReceiveSubmit = async () => {
    /* success callback that will be called if the invoice is paid */
    const handleSuccess = () => {
      setShowQrCode(null);
      setReceiveAmount("");
    };

    const invoiceToPay = await receiveLightningPayment(
      receiveAmount,
      handleSuccess
    );

    console.log("Invoice to pay:", invoiceToPay);

    setShowQrCode({ title: "Lightning Invoice", value: invoiceToPay });
  };

  const handleCopyInvoice = () => {
    if (showQrCode) {
      navigator.clipboard
        .writeText(showQrCode.value)
        .then(() => alert("Invoice copied to clipboard!"))
        .catch((err) => console.error("Failed to copy invoice: ", err));
    }
  };

  return (
    <>
      <h2>Receive</h2>
      <div className="flex flex-col space-y-4">
        <div className="input-container">
          <input
            type="text"
            placeholder="Enter amount"
            value={receiveAmount}
            onChange={(e) => setReceiveAmount(e.target.value)}
          />
          <button onClick={handleReceiveSubmit}>Generate Invoice</button>
        </div>
        {pendingMintQuotes.length > 0 && (
          <div className="flex flex-col space-y-2">
            <h3>Pending Mint Quotes</h3>
            {pendingMintQuotes.map((quote) => (
              <div key={quote.quote} className="flex flex-col space-y-2">
                <p>
                  {quote.quote} - {quote.state}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showQrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2 text-black">
              {showQrCode.title}
            </h3>
            <QRCode value={showQrCode.value} />
            <div className="mt-4 flex justify-between">
              <button
                onClick={handleCopyInvoice}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Copy Invoice
              </button>
              <button
                onClick={() => setShowQrCode(null)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Receive;
