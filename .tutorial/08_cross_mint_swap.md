# Cross Mint Swap

As long as you are not using test mints, you will be able to transfer funds from one mint to the other.

This is made possible by the Lightning Network.

To transfer funds, we `melt` tokens from the mint that has our ecash and pay an invoice to the mint that we are swapping to and `mint` tokens to our wallet in the new mint.

## Caveat

Cannot transfer funds across units within the same mint due to the way that the mint handles 'internal invoices'. This is **not** a limitation of the Cashu protocol, but rather a limitation of the mint.

## Transfer Funds

Let's implement the `crossMintSwap` function in [useCashuWallet.jsx](../src/hooks/useCashuWallet.jsx).

### Set the wallet to swap from

This wil be our active wallet.

Note the error message that we are throwing if the units are different.

```js
/* mint to swap from (our active wallet) */
const from = wallet;

if (from.keys.unit !== to.keys.unit) {
  // TODO: if units are different, convert the proofs to the `to` unit
  throw new Error(
    "It is possible to swap between units but that requires us to fetch the exchange rate to convert the amounts, so we will not do that"
  );
}
```

### Validation

```js
/* make sure proofs are ALL from the `from` wallet */
const proofIds = new Set(proofs.map((p) => p.id));
if (proofIds.size > 1) {
  throw new Error("make sure proofs are all from the same keyset");
} else if (proofs[0].id !== from.keys.id) {
  throw new Error(
    `Keyset ID ${from.keys.id} does not match proof's id ${proofs[0].id}`
  );
}
```

### Calculate amount we _have_ to swap

```js
/* add up all the proofs */
const totalProofAmount = proofs.reduce((acc, p) => (acc += p.amount), 0);
console.log("## Amount to swap:", totalProofAmount);
```

### Initialize Variables

Also start the `while` loop block

```js
/* set max so we don't go into an infinite loop */
const maxAttempts = 5;
let attempts = 0;

let amountToMint = totalProofAmount;
let meltQuote;
let mintQuote;

/* loop until we find a valid melt quote */
while (attempts <= maxAttempts) {
  attempts++;
  console.log("===============================\nAttempt #", attempts);
}
```

### Find Quotes that match

We do not know what the fee is going to be ahead of time, so we must loop until the melt quote `amount` and `fee_reserve` are less than or equal to the amount we have to swap.

Inside the `while` loop:

#### Get invoice to mint

```js
/* request a quote to mint tokens */
mintQuote = await to.createMintQuote(amountToMint);

/* `request` is the invoice we need to pay in order to mint ecash */
const invoice = mintQuote.request;
```

#### Get melt quote with that invoice

```js
/* use the mint quote to get a melt quote */
meltQuote = await from.createMeltQuote(invoice);
```

#### Check the amounts and exit or try again

If the quote amounts work out, we can exit the loop and move on to minting the tokens. Otherwise, we will subtract the difference between what we have and what we need, and try again.

```js
/* need to give the amount to melt along with a fee for the lightning payment */
const amountRequiredToMelt = meltQuote.amount + meltQuote.fee_reserve;

if (amountRequiredToMelt <= totalProofAmount) {
  /* exit the loop bc we found a valid melt quote */
  amountToMint = amountRequiredToMelt;
  break;
}

 /* subtract the difference between what we have and what we need, then try again */
const difference = amountRequiredToMelt - totalProofAmount;
amountToMint = amountToMint - difference;
```

### Mint the tokens

This will look familiar to receiving a lightning payment, but instead of the user paying the invoice, the mint will pay the invoice.

Here we are outside of the loop now:

```js
if (amountToMint > totalProofAmount || !mintQuote || !meltQuote) {
  /* loop exited because attempts > maxAttempts or failed to get quotes */
  throw new Error(`Could not find a valid melt quote`);
}

/* the mint may over estimate the lightning fee. If they implement NUT08, we get change */
const { isPaid, change } = await from.meltTokens(meltQuote, proofs);

if (!isPaid) {
  throw new Error("melt faild");
} else {
  /* havent minted yet, but proofs are spent so remove them  */
  removeProofs(proofs);
}

const { proofs: newProofs } = await to.mintTokens(
  amountToMint - meltQuote.fee_reserve,
  mintQuote.quote
);

const totalMinted = newProofs.reduce((acc, p) => (acc += p.amount), 0);

/* store what we minted and change */
addProofs([...newProofs, ...change]);

return totalMinted;
```
