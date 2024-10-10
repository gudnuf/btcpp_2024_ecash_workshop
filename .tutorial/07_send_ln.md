# Send a Lightning Payment

Now that we have an ecash balance, we can have the mint pay an invoice for us by melting the ecash.

### Melt quote

First, request a melt quote for the invoice to be paid

```js
const meltQuote = await wallet.createMeltQuote(invoice);
```

### Calculate total amount of proofs

```js
/* mint will reserve a fee for the lightning payment */
const amount = meltQuote.amount + meltQuote.fee_reserve;
```

### Get proofs to send

```js
/* this just reads from local storage, but does not delete */
const proofsToSend = getProofsByAmount(amount, wallet.keys.id);

if (!proofsToSend) {
  throw new InsufficientBalanceError(balance, amount);
}
```

### Melt the proofs

```js
const { change, isPaid, preimage } = await wallet.meltTokens(
  meltQuote,
  proofsToSend
);
```

### Finalize the transaction on our side

```js
if (isPaid) {
  console.log("Payment was successful", preimage);
  /* delete proofs we pulled from local storage */
  removeProofs(proofsToSend);

  addProofs(change);
} else {
  console.log("Payment failed");
}
```

## Review

The user input a lightning invoice to be paid, and then the mint melted our ecash in excchange for paying the invoice.

Here is the full `sendLightningPayment` function:

```js
/**
 * Use locally stored proofs to pay an invoice
 * @param {string} invoice - lightning invoice to pay
 */
const sendLightningPayment = async (invoice) => {
  const meltQuote = await wallet.createMeltQuote(invoice);

  /* mint will reserve a fee for the lightning payment */
  const amount = meltQuote.amount + meltQuote.fee_reserve;

  /* this just reads from local storage, but does not delete */
  const proofsToSend = getProofsByAmount(amount, wallet.keys.id);

  if (!proofsToSend) {
    throw new InsufficientBalanceError(balance, amount);
  }

  const { change, isPaid, preimage } = await wallet.meltTokens(
    meltQuote,
    proofsToSend
  );

  if (isPaid) {
    console.log("Payment was successful", preimage);
    /* delete proofs we pulled from local storage */
    removeProofs(proofsToSend);

    addProofs(change);
  } else {
    console.log("Payment failed");
  }
};
```
