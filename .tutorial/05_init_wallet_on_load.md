# Initialize wallets on Load

Each time the app loads, we will pull from local storage and initialize the `CashuWallet` class for each keyset that is stored.

Then, we check to make sure that the keysets are active, and if not we _should_ rotate to the new keyset, but for this workshop we will just give a warning.

If the mint cannot be reached, we will also give a warning and then initialize the wallet with the stored keyset so that the wallet can be used in offline mode.

## Initialize wallets on load in [useWalletManager.js](../src/hooks/useWalletManager.jsx)

Here you will see a `useEffect` hook with a `load` function that is called when the component mounts.

Add all of the following code to the `load` function:

### Load mint urls from local storage

```js
const mintUrls = JSON.parse(localStorage.getItem("mintUrls") || "[]");
console.log("Loading wallets for mint urls:", mintUrls);
```

### Get wallet data for each mint

Note the JSDoc here (/\*_ @type ... _/). If it looks scary, just ignore it. All that it does is add type annotations to the variables.

```js
/** @type {Array<{url: string, keysetId: string, unit: string, keys: MintKeys}>} */
const walletsToInitialize = mintUrls.flatMap((url) => {
  const mintData = JSON.parse(localStorage.getItem(url) || "{}");

  if (!mintData.keysets || mintData.keysets.length === 0) {
    console.warn(`No keysets found for ${url}`);
    return [];
  }

  return mintData.keysets.map((keyset) => ({
    ...keyset,
    url,
  }));
});
```

### Initialize wallets

In this loop we are building two maps:

- `mintKeysets` will store the keysets for each mint so that we only have to fetch them once
- `walletsTemp` will store the `CashuWallet` instances for each keyset

Note the try/catch that still adds the wallet even if we cannot fetch the keysets.

```js
const walletsTemp = new Map();
const mintKeysets = new Map();

for await (const walletData of walletsToInitialize) {
  const mint = new CashuMint(walletData.url);

  let keysets;
  if (!mintKeysets.has(walletData.url)) {
    try {
      keysets = await mint.getKeySets();
      mintKeysets.set(walletData.url, keysets);
    } catch (error) {
      console.warn(
        `Failed to fetch keysets for ${walletData.url}. Using local data.`
      );
      keysets = { keysets: [{ id: walletData.keysetId, active: true }] };
    }
  } else {
    keysets = mintKeysets.get(walletData.url);
  }

  const keyset = keysets.keysets.find(
    (keyset) => keyset.id === walletData.keysetId
  );

  if (!keyset) {
    console.warn(`Keyset ${walletData.keysetId} not found`);
  }
  if (keyset && keyset.active !== true) {
    console.warn(
      `Keyset ${walletData.keysetId} is no longer active, you should rotate to the new keyset`
    );
  }

  const wallet = new CashuWallet(mint, {
    keys: {
      unit: walletData.unit,
      id: walletData.keysetId,
      keys: walletData.keys,
    },
  });

  walletsTemp.set(walletData.keysetId, wallet);
}
```

### Update state

This final bit of code takes all the work we did and puts it into our state so that the wallets are available to the rest of the app.

```js
setWallets(walletsTemp);
console.log("Wallets loaded:", walletsTemp);

/* Set active wallet from local storage */
const activeWalletKeysetId = localStorage.getItem("activeWalletKeysetId");
console.log("Active wallet keyset id:", activeWalletKeysetId);

if (activeWalletKeysetId && walletsTemp.has(activeWalletKeysetId)) {
  setActiveWallet(walletsTemp.get(activeWalletKeysetId), activeWalletKeysetId);
} else if (walletsTemp.size > 0) {
  const firstWallet = walletsTemp.entries().next().value;
  setActiveWallet(firstWallet[1], firstWallet[0]);
}
```

## Review

Here is the full contents of the `useEffect` hook:

```js
useEffect(() => {
  /* initialize wallets from mint data in localStorage */
  const load = async () => {
    const mintUrls = JSON.parse(localStorage.getItem("mintUrls") || "[]");

    console.log("Loading wallets for mint urls:", mintUrls);

    /** @type {Array<{url: string, keysetId: string, unit: string, keys: MintKeys}>} */
    const walletsToInitialize = mintUrls.flatMap((url) => {
      const mintData = JSON.parse(localStorage.getItem(url) || "{}");

      if (!mintData.keysets || mintData.keysets.length === 0) {
        console.warn(`No keysets found for ${url}`);
        return [];
      }

      return mintData.keysets.map((keyset) => ({
        ...keyset,
        url,
      }));
    });

    const walletsTemp = new Map();
    const mintKeysets = new Map();

    for await (const walletData of walletsToInitialize) {
      const mint = new CashuMint(walletData.url);

      let keysets;
      if (!mintKeysets.has(walletData.url)) {
        try {
          keysets = await mint.getKeySets();
          mintKeysets.set(walletData.url, keysets);
        } catch (error) {
          console.warn(
            `Failed to fetch keysets for ${walletData.url}. Using local data.`
          );
          keysets = { keysets: [{ id: walletData.keysetId, active: true }] };
        }
      } else {
        keysets = mintKeysets.get(walletData.url);
      }

      const keyset = keysets.keysets.find(
        (keyset) => keyset.id === walletData.keysetId
      );

      if (!keyset) {
        console.warn(`Keyset ${walletData.keysetId} not found`);
      }
      if (keyset && keyset.active !== true) {
        console.warn(
          `Keyset ${walletData.keysetId} is no longer active, you should rotate to the new keyset`
        );
      }

      const wallet = new CashuWallet(mint, {
        keys: {
          unit: walletData.unit,
          id: walletData.keysetId,
          keys: walletData.keys,
        },
      });

      walletsTemp.set(walletData.keysetId, wallet);
    }

    setWallets(walletsTemp);
    console.log("Wallets loaded:", walletsTemp);

    /* Set active wallet from local storage */
    const activeWalletKeysetId = localStorage.getItem("activeWalletKeysetId");
    console.log("Active wallet keyset id:", activeWalletKeysetId);

    if (activeWalletKeysetId && walletsTemp.has(activeWalletKeysetId)) {
      setActiveWallet(
        walletsTemp.get(activeWalletKeysetId),
        activeWalletKeysetId
      );
    } else if (walletsTemp.size > 0) {
      const firstWallet = walletsTemp.entries().next().value;
      setActiveWallet(firstWallet[1], firstWallet[0]);
    }
  };
  load().then(() => setIsLoading(false));

  const pendingMintQuotes = JSON.parse(
    localStorage.getItem("pendingMintQuotes") || "[]"
  );
  setPendingMintQuotes(pendingMintQuotes);
}, []);
```

Basically, we take all the data that was added to local storage from `addWallet` and initialize all the wallets that we already added.

Next, we will receive our first lightning payment and mint tokens.
