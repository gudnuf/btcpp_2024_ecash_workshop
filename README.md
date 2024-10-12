# Building a Custodial Lightning Wallet the Right Way

Make sure you have NodeJS installed. This should do something:

```bash
node -v
```
If not, install from https://nodejs.org.

Then, clone, install, and run:

```bash
git clone https://github.com/gudnuf/btcpp_2024_ecash_workshop.git
cd btcpp_2024_ecash_workshop
npm install
npm run dev
```

## Bitcoin++ Berlin, 2024 -- ecash edition

Traditional Lightning wallets offer a stark choice: complex and non-custodial or privacy-compromising and custodial. Cashu bridges this gap, enabling developers to build user-friendly Lightning-enabled apps without the usual complexities.

In this hands-on workshop, with the help of [cashu-ts](https://github.com/CashuBTC/cashu-ts) and [Replit](https://replit.com), participants will implement sending and receiving Lightning payments while exploring privacy features, offline capabilities, multi-currency support, and user-selectable custodians.
