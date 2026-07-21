# Bouquet

Turn your [Interceptor](https://github.com/DarkFlorist/TheInterceptor) simulations into MEV bundles.

[https://bouquet.dark.florist/](https://bouquet.dark.florist/)

## Install

```bash
npm run vendor
```

## Building

```bash
# Styles via Tailwind
npm run styles

# Preact App
npm run build
```

## EIP-7702 rescue bundles

Bouquet can import EIP-7702 transactions from The Interceptor's simulation-stack protocol version 1.0.1. When an authorization clears a delegation by targeting the zero address, Bouquet enters rescue mode and orders the atomic bundle as follows:

1. Sponsored delegation-clearing transaction
2. Funding transaction
3. Asset sweep transactions

Rescue bundles are restricted to relay mode so funding is never broadcast separately through the public mempool. Imported authorization signatures are preserved; when an authorization is unsigned, Bouquet requests the authority's private key and signs it locally.

Run `npm test` to compile the app and execute the rescue ordering, protocol import, signature, and nonce tests.

## Dev

Run `watch` to live rebuilds the Preact app.
You will need to also need to serve the output and rebuild Tailwind classes when needed.

```bash
npm run watch
```

## Preview

Runs http-server on built files.

```bash
npm run serve
```
