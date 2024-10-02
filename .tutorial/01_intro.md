# Building a Custodial Lightning Wallet the Right Way

## Motivation

Traditional Lightning wallets present developers and users with a challenging dilemma:

1. Non-custodial wallets: Offer security and privacy but are complex to develop and use.
2. Custodial wallets: Provide simplicity but often compromise on privacy and user control.

Cashu emerges as a solution to this problem, allowing developers to create user-friendly Lightning-enabled applications without sacrificing privacy or dealing with excessive complexity.

I claim that building a custodial Lightning wallet using ecash is the _right_ way to go, but not necessarily that NextJS and the way I have gone about building this workshop is the _right_ way to build such a wallet.

### PlebDevs

I mostly taught myself how to code with the motivation of contributing the the world of Bitcoin and Lightning development. I experience imposter syndrome every day, but this is a great community to be a part of if you want to start going down that path.

[PlebDevs](https://plebdevs.com/) is a community of bitcoin plebs trying to figure out how to be a dev. Check out the YouTube channel for more workshops like this.

My goal with this workshop is to show you that anyone can start building on bitcoin and write the code to actually move bitcoin around. If you are new to this, its not going to be easy, but don't be afraid to ask your friendly-neighborhood-LLM for help.

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
2. Wallet user pays invoice
3. Once invoice is paid, then wallet sends `BlindedMessages` to the mint, and receives `BlindedSignatures`
4. Wallet creates `Proofs` and stores them

#### Melting - burn ecash and pay lightning invoice

1. Wallet gives mint an invoice to pay
2. Mint returns a quote
3. Wallet sends `Proofs` to the mint according to the quote
4. Mint validates the proofs and pays the invoice

### React/Next.JS

- React is a popular JavaScript library for building user interfaces, allowing developers to create interactive web applications
- Next.js is a framework built on top of React that provides additional features like server-side rendering and simplified routing, making it easier to build complex web applications

### React Hooks

React Hooks are functions that allow you to use state and other React features in functional components. They provide a way to reuse stateful logic without changing your component hierarchy. Here's a brief explanation of some commonly used hooks:

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

### terminology

#### proof vs token

A proof is the secret and unblinded signature (`(x,C)`) for a single amount.

A token is a set of proofs along with metadata about the proofs that are encoded into a human readable string.

## Agenda and Goals

- Initialize a Next.JS project
- Review the boilerplate code
- Mint ecash
- Melt ecash

By the end of this workshop, you will:

1. Have built an ecash wallet that is fully interoperable with the lightning network
2. Understand how ecash is minted and melted
3.

Throughout the tutorial, we'll use [cashu-ts](https://github.com/CashuBTC/cashu-ts) to simplify our implementation and focus on the key concepts and features that make a great custodial Lightning wallet.

Let's get started on this exciting journey to revolutionize Lightning wallet development!
