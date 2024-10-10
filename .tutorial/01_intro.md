# Building a Custodial Lightning Wallet the Right Way

## Motivation

Traditional Lightning wallets present developers and users with a challenging dilemma:

1. Non-custodial wallets: Offer security and privacy but are complex to develop and use.
2. Custodial wallets: Provide simplicity but compromise on privacy and force you into using a centralized service that holds your funds.

Cashu emerges as a solution to this problem, allowing developers to create user-friendly Lightning-enabled applications without sacrificing privacy or dealing with excessive complexity.

I claim that building a custodial Lightning wallet using ecash is the _right_ way to go (and one of the most exciting use cases for Cashu), but not necessarily that NextJS and the way I have gone about building this workshop is the _best_ way to build such a wallet.

### PlebDevs

I mostly taught myself how to code with the motivation of contributing to the the world of Bitcoin and Lightning development. This is a great community to be a part of if you want to start going down that path, and Cashu has a much lower barrier to entry than things like onchain development.

[PlebDevs](https://plebdevs.com/) is a community of bitcoin plebs trying to figure out how to be a dev. Check out the YouTube channel for more workshops like this.

My goal with this workshop is to show you that anyone can start building on bitcoin and write the code to actually move bitcoin around. If you are new to this, its not going to be easy, but don't be afraid to ask your friendly-neighborhood-LLM (ie. Claude or ChatGPT) for help.

## Conceptual prerequisites

There are no prerequisites for this workshop. Anyone with some motivation and persistence should be able to follow along.

However, there are some nice to haves that I will cover briefly:

### The NUTs https://github.com/CashuBTC/nuts

- The cashu spec
- NUT04 - swapping tokens
- NUT05 - minting tokens
- NUT06 - melting tokens

### Cashu mint/melt flow

#### Minting - create ecash

1. Wallet requests to mint tokens and gets an invoice

```json
{
  "quote": <str>,
  "request": <str>,
  "state": <str_enum[STATE]>,
  "expiry": <int>
}
```

2. Wallet user pays invoice
3. Once invoice is paid, then wallet sends `BlindedMessages` to the mint, and receives `BlindedSignatures`
4. Wallet creates `Proofs` and stores them

#### Melting - burn ecash and pay lightning invoice

1. Wallet gives mint an invoice to pay
2. Mint returns a quote

```json
{
  "quote": <str>,
  "amount": <int>,
  "fee_reserve": <int>,
  "state": <str_enum[STATE]>,
  "expiry": <int>,
  "payment_preimage": <str|null>
}
```

3. Wallet sends `Proofs` to the mint according to the quote
4. Mint validates the proofs and pays the invoice

### React/Next.JS

- React is a popular JavaScript library for building user interfaces, allowing developers to create interactive web applications
- Next.js is a framework built on top of React that provides additional features like server-side rendering and simplified routing, making it easier to build complex web applications

### React Hooks

React Hooks are functions that allow you to use state and other React features in functional components. They provide a way to reuse stateful logic without changing your component hierarchy. Here's a brief explanation of some hooks we will be using:

#### useState

- Allows functional components to manage local state
- Returns a stateful value and a function to update it

#### useEffect

- Performs side effects in functional components (e.g., data fetching, subscriptions)
- Runs after every render by default, but can be customized to run only when certain values change

#### useCallback

- Returns a memoized version of a callback function
- Useful for optimizing performance by preventing unnecessary re-renders of child components

#### useMemo

- Memoizes the result of a computation
- Helps optimize expensive calculations by caching the result and only recomputing when dependencies change

#### useContext

- Allows components to consume values from a React context without prop drilling
- Provides a way to share data that can be considered "global" for a tree of React components

### jsdoc

JSDoc is a markup language used to add documentation comments to JavaScript code, which can be used to generate API documentation and provide type information to IDEs.

Example:

```javascript
/**
 * Adds two numbers together.
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @returns {number} The sum of the two numbers.
 */
function add(a, b) {
  return a + b;
}
```

This code will generate the following documentation:

```
Adds two numbers together.

Parameters:
a - The first number.
b - The second number.

Returns:
The sum of the two numbers.
```

I chose to write the code for this workshop in JavaScript for simplicity, but using JSDoc allows for variables to be assigned types. This is just a nice-to-have mostly because of IDE support that allows us to see the types of variables and functions.

### Terminology

#### proof vs token

A [proof](https://github.com/cashubtc/nuts/blob/main/00.md#proof) is the secret and unblinded signature (`(x,C)`) for a single amount.

```json
{
  "amount": int,
  "id": hex_str,
  "secret": str,
  "C": hex_str,
}
```

A [token](https://github.com/cashubtc/nuts/blob/main/00.md#serialization-of-tokens) is a set of proofs along with metadata about the proofs that are encoded into a human readable string.

```md
cashuAeyJ0b2tlbiI6W3sibWludCI6Imh0dHBzOi8vODMzMy5zcGFjZTozMzM4IiwicHJvb2ZzIjpbeyJhbW91bnQiOjIsImlkIjoiMDA5YTFmMjkzMjUzZTQxZSIsInNlY3JldCI6IjQwNzkxNWJjMjEyYmU2MWE3N2UzZTZkMmFlYjRjNzI3OTgwYmRhNTFjZDA2YTZhZmMyOWUyODYxNzY4YTc4MzciLCJDIjoiMDJiYzkwOTc5OTdkODFhZmIyY2M3MzQ2YjVlNDM0NWE5MzQ2YmQyYTUwNmViNzk1ODU5OGE3MmYwY2Y4NTE2M2VhIn0seyJhbW91bnQiOjgsImlkIjoiMDA5YTFmMjkzMjUzZTQxZSIsInNlY3JldCI6ImZlMTUxMDkzMTRlNjFkNzc1NmIwZjhlZTBmMjNhNjI0YWNhYTNmNGUwNDJmNjE0MzNjNzI4YzcwNTdiOTMxYmUiLCJDIjoiMDI5ZThlNTA1MGI4OTBhN2Q2YzA5NjhkYjE2YmMxZDVkNWZhMDQwZWExZGUyODRmNmVjNjlkNjEyOTlmNjcxMDU5In1dfV0sInVuaXQiOiJzYXQiLCJtZW1vIjoiVGhhbmsgeW91LiJ9
```

## Agenda and Goals

- Initialize a Next.JS project
- Review the boilerplate code
- Add Cashu mints with specified units
- Mint ecash
- Melt ecash
- Transfer funds from one wallet to another
- Offline send

By the end of this workshop, you will:

1. Have built an ecash wallet that is fully interoperable with the lightning network
2. Understand how ecash is minted and melted
3. Have a framework for building your own Cashu wallet

Throughout the tutorial, we'll use [cashu-ts](https://github.com/CashuBTC/cashu-ts) which abstracts much of the Cashu protocol into a few simple functions.
