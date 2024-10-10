# Add a Wallet

Before we can send and receive payments, we will need to add a mint and initialize a `CashuWallet`.

Let's start by checking out [index.js](../src/pages/index.js).

Here you will see everything that is imported from [useWalletManager.js](../src/hooks/useWalletManager.jsx) that we need.

You will also notice we import `lookupMint` from [utils/cashu](../src/utils/cashu.ts) which will help us find the the units that mint supports.

## Find a mint

You can use a testmint (https://nofees.testnut.cashu.space, https://testnut.cashu.space) to test out the app or head to [Bitcoin Mints](https://bitcoinmints.com/) to find a mint.

## Get mint's supported units

Lets start by implementing `lookupMint`.

Copy the following into the function body of `lookupMint`:

```js
/* create new instance of mint */
const mint = new CashuMint(url);

/* GET /v1/info */
const mintInfo = await mint.getInfo();
console.log("Mint info:", mintInfo);

/* GET /v1/keysets */
const keysets = await mint.getKeySets();

/* get unique units mint supports */
const units = Array.from(new Set(keysets.keysets.map((k) => k.unit)));
console.log("Supported units:", units);

return { units };
```

This uses the `CashuMint` class to GET the mint's info and keysets, then it gets the unique units that the mint supports.

Now when we enter a mint url and click "Search", we should see the units that the mint supports.

## Add a wallet

Next, we need to actually add the wallet. This will be done in the `useWalletManager` hook in the `addWallet` function.

All of the following code needs to go **inside** the `addWallet` function.

### Initialize `CashuMint`

```js
console.log("Adding wallet:", url, unit);
const mint = new CashuMint(url);
```

### Find keyset for the unit we chose

```js
console.log("Fetching keys...");
const keysets = await mint.getKeySets();
const keysetForUnit = keysets.keysets.find(
  (keyset) => keyset.unit === unit && /^[0-9A-Fa-f]+$/.test(keyset.id)
);
if (!keysetForUnit) {
  throw new Error(`No keyset found for unit ${unit}`);
}
```

### Get the public keys

```js
console.log("Found keyset:", keysetForUnit);
const keysResponse = await mint.getKeys(keysetForUnit.id);
const keys = keysResponse.keysets.find((k) => k.id === keysetForUnit.id);
```

### Initialize `CashuWallet`

```js
const walletOptions = {
  unit,
  keys,
  mnemonicOrSeed: undefined,
};
console.log("Creating wallet:", walletOptions);
const wallet = new CashuWallet(mint, walletOptions);
```

### Update state

```js
setWallets((wallets) => new Map([...wallets, [keysetForUnit.id, wallet]]));
addWalletToLocalStorage(url, keysetForUnit.id, unit, keys);
if (activeWallet === null) {
  setActiveWallet(wallet, keysetForUnit.id);
}
```

## Review

Here is the full `addWallet` function:

```js
const addWallet = async (url, unit = "sat") => {
  console.log("Adding wallet:", url, unit);

  console.log("Fetching keys...");
  const mint = new CashuMint(url);
  const keysets = await mint.getKeySets();
  const keysetForUnit = keysets.keysets.find(
    (keyset) => keyset.unit === unit && /^[0-9A-Fa-f]+$/.test(keyset.id)
  );
  if (!keysetForUnit) {
    throw new Error(`No keyset found for unit ${unit}`);
  }
  console.log("Found keyset:", keysetForUnit);
  const keysResponse = await mint.getKeys(keysetForUnit.id);
  const keys = keysResponse.keysets.find((k) => k.id === keysetForUnit.id);
  const walletOptions = {
    unit,
    keys,
    mnemonicOrSeed: undefined,
  };
  console.log("Creating wallet:", walletOptions);
  const wallet = new CashuWallet(mint, walletOptions);
  setWallets((wallets) => new Map([...wallets, [keysetForUnit.id, wallet]]));
  addWalletToLocalStorage(url, keysetForUnit.id, unit, keys);
  if (activeWallet === null) {
    setActiveWallet(wallet, keysetForUnit.id);
  }
};
```

We start by fetching all of the mint's keysets, then we find the keyset that matches the unit we want to use. Finally, we initialize a `CashuWallet` with the keyset and unit and update our state so that the wallet is available to the rest of the app.

Next, we need to initialize the wallets on load otherwise they will disappear when we navigate away from the page.
