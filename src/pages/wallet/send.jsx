import { useState } from "react";
import useCashuWallet from "@/hooks/useCashuWallet";
import { useWalletManager } from "@/hooks/useWalletManager";

const Send = () => {
  const { activeWallet } = useWalletManager();
  const { sendLightningPayment } = useCashuWallet(activeWallet);

  const [sendInvoice, setSendInvoice] = useState("");

  const handleSendSubmit = async () => {
    // TODO: there is no confirmation that the invoice is paid
    await sendLightningPayment(sendInvoice);
  };

  return (
    <>
      <h2>Send</h2>
      <div className="flex flex-col space-y-4">
        <div className="input-container">
          <input
            type="text"
            placeholder="Enter lightning invoice"
            value={sendInvoice}
            onChange={(e) => setSendInvoice(e.target.value)}
          />
          <button onClick={handleSendSubmit}>Send Payment</button>
        </div>
      </div>
    </>
  );
};

export default Send;
