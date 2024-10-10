# Receive Lightning Payment

Receiving a Lightning payment is how we get some funds into our wallet. The bitcoin will go to the mint, and the mint will give us ecash.

## The UI

Let's start by checking out the [receive](../src/pages/wallet/receive.jsx) page.

Here, the UI is all built out.

You will notice there are two main things going on in the `handleReceiveSubmit` function:

1. We call `receiveLightningPayment` from [useCashuWallet.jsx](../src/hooks/useCashuWallet.jsx) that will return the invoice that needs to be paid to mint that amount of ecash.
2. The invoice is then passed into the QR code so that the user can pay it.

## Mint ecash!

Head to [useCashuWallet.jsx](../src/hooks/useCashuWallet.jsx).

Here you will see that this hook takes a `CashuWallet` as an argument. This is going to be the wallet used by the hook.

### Fetch a mint quote

```js
const mintQuote = await wallet.createMintQuote(amount);
const invoice = mintQuote.request;
const quoteId = mintQuote.quote;

addPendingMintQuote(mintQuote);

console.log("Mint quote:", mintQuote);
```

### Poll for invoice payment

This is a big one! We create a function for this so that the invoice can be returned while polling continues in the background.

1. Check the status of the mint quote
2. If the quote is paid, mint tokens and call the success callback
3. If the quote is issued, stop polling
4. If the quote is unpaid, continue polling

```js
/* poll for invoice payment */
const startPolling = () => {
  const interval = setInterval(async () => {
    try {
      /* check mint quote status */
      const quote = await wallet.checkMintQuote(quoteId);
      console.log("Quote status:", quote);
      if (quote.state === MintQuoteState.PAID) {
        /* mint tokens */
        const { proofs } = await wallet.mintTokens(amount, quoteId);
        addProofs(proofs); /* store created proofs */
        clearInterval(interval); /* stop polling */
        handleSuccess(); /* call success callback */
        removePendingMintQuote(quoteId);
      } else if (quote.state === MintQuoteState.ISSUED) {
        /* shouldn't happen, but just in case */
        console.warn("Mint quote issued");
        clearInterval(interval); /* stop polling */
        removePendingMintQuote(quoteId);
      } else if (quote.state === MintQuoteState.UNPAID) {
        console.log("Waiting for payment...", mintQuote);
      } else {
        console.warn("Unknown mint quote state:", quote.state);
      }
    } catch (error) {
      console.error("Error while polling for payment:", error);
    }
  }, 5000); // Poll every 5 seconds
  setPollInterval(interval);
};
```

Notice that we are adding the `mintQuote` to the `pendingMintQuotes` array so that if the polling stops (refresh, tab change, catastrophic error, etc.), the money is not lost.

If something like that happens, we would be able to use the `quoteId` to mint tokens when the incoice is paid.

### Start polling and return invoice

```js
startPolling();
return invoice;
```

## Review

Now we can mint ecash!!

Here is the full `receiveLightningPayment` function:

```js
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

  addPendingMintQuote(mintQuote);

  console.log("Mint quote:", mintQuote);

  // TODO: we should store the mint quote until we have minted tokens
  // because the invoice might get paid, but if we stop polling (refresh etc.), we will
  // not be able to mint tokens

  /* poll for invoice payment */
  const startPolling = () => {
    const interval = setInterval(async () => {
      try {
        /* check mint quote status */
        const quote = await wallet.checkMintQuote(quoteId);
        console.log("Quote status:", quote);
        if (quote.state === MintQuoteState.PAID) {
          /* mint tokens */
          const { proofs } = await wallet.mintTokens(amount, quoteId);
          addProofs(proofs); /* store created proofs */
          clearInterval(interval); /* stop polling */
          handleSuccess(); /* call success callback */
          removePendingMintQuote(quoteId);
        } else if (quote.state === MintQuoteState.ISSUED) {
          /* shouldn't happen, but just in case */
          console.warn("Mint quote issued");
          clearInterval(interval); /* stop polling */
          removePendingMintQuote(quoteId);
        } else if (quote.state === MintQuoteState.UNPAID) {
          console.log("Waiting for payment...", mintQuote);
        } else {
          console.warn("Unknown mint quote state:", quote.state);
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
```

Next, lets pay a lightning invoice with the ecash in our wallet!
