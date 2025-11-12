# Uniswap Labs: Front End Interfaces

This is the **public** repository for Uniswap Labs’ front-end interfaces, including the Web App, Wallet Mobile App, and Wallet Extension. Uniswap is a protocol for decentralized exchange of Ethereum-based assets.

## Interfaces

- Web: [app.uniswap.org](https://app.uniswap.org)
- Wallet (mobile + extension): [wallet.uniswap.org](https://wallet.uniswap.org)

## Install & Apps

```bash
git clone git@github.com:Uniswap/interface.git
bun install
bun lfg
bun web start
```

### INK network configuration

The UI defaults to the Kraken INK network. Provide the RPC + contract addresses via env vars so every app (web, extension, mobile) hits the correct infrastructure:

| Purpose                | Web env var (`REACT_APP_…`)        | Native/extension env var |
| ---------------------- | ---------------------------------- | ------------------------ |
| Primary RPC endpoint   | `REACT_APP_INK_RPC_PRIMARY`        | `INK_RPC_PRIMARY`        |
| Fallback RPC endpoint  | `REACT_APP_INK_RPC_FALLBACK`       | `INK_RPC_FALLBACK`       |
| Wrapped stable address | `REACT_APP_INK_STABLECOIN_ADDRESS` | `INK_STABLECOIN_ADDRESS` |
| Default v4 hook        | `REACT_APP_INK_DEFAULT_POOL_HOOK_ADDRESS` | `INK_DEFAULT_POOL_HOOK_ADDRESS` |
| Ink token list URL     | `REACT_APP_INK_TOKEN_LIST_URL`     | `INK_TOKEN_LIST_URL`     |
| Token list fallback URL| `REACT_APP_INK_TOKEN_LIST_FALLBACK_URL` | `INK_TOKEN_LIST_FALLBACK_URL` |
| Token list default chains | `REACT_APP_TOKEN_LIST_DEFAULT_CHAIN_IDS` | `TOKEN_LIST_DEFAULT_CHAIN_IDS` |

If the token list variables are omitted, the apps load the bundled `/tokenlists/ink.velodrome.json` artifact and
autodetect Ink (`57073`) as a default chain for curated lists.

At minimum set the primary RPC to a public HTTPS endpoint (for example `https://rpc.kraken.com/ink`). The stablecoin + hook addresses are used whenever the UI builds calldata for INK, so point them at the canonical contracts deployed for your environment.

### Step-by-step: running `apps/web` locally

The current sandbox we used to validate this repo has a few extra requirements (Nx daemon sockets, patched GraphQL codegen, Cloudflare inspector conflicts). To reproduce the working setup exactly:

1. **Use the pinned runtimes**
   ```bash
   source "$HOME/.nvm/nvm.sh" && nvm use 22.13.1
   export PATH="$HOME/.bun/bin:$PATH"
   bun --version # should print 1.3.1
   ```
2. **Create the writable temp folders Nx/Bun will use**
   ```bash
   mkdir -p .tmp/tmp .tmp/nx-sockets .tmp/bun-tmp .tmp/bun-home .tmp/logs
   ```
3. **Install dependencies + run `bun g:prepare` with daemon isolation disabled (and our Bun patch for `@graphql-codegen/cli` will auto-apply)**
   ```bash
   ROOT="$PWD" \
   NX_DAEMON=false \
   NX_ISOLATE_PLUGINS=false \
   NX_SOCKET_DIR="$ROOT/.tmp/nx-sockets" \
   BUN_TMPDIR="$ROOT/.tmp/bun-tmp" \
   BUN_INSTALL="$ROOT/.tmp/bun-home" \
   TMPDIR="$ROOT/.tmp/tmp" TMP="$ROOT/.tmp/tmp" TEMP="$ROOT/.tmp/tmp" \
   bun install
   ```
4. **Start the dev server without the Cloudflare inspector (the sandbox can’t bind that debug port)**
   ```bash
   ROOT="$PWD" \
   NX_DAEMON=false \
   NX_ISOLATE_PLUGINS=false \
   NX_SOCKET_DIR="$ROOT/.tmp/nx-sockets" \
   BUN_TMPDIR="$ROOT/.tmp/bun-tmp" \
   BUN_INSTALL="$ROOT/.tmp/bun-home" \
   TMPDIR="$ROOT/.tmp/tmp" TMP="$ROOT/.tmp/tmp" TEMP="$ROOT/.tmp/tmp" \
   CLOUDFLARE_INSPECTOR_PORT=false \
   bun web dev
   ```

Once Vite prints the `Local:` URL (usually `http://localhost:3000`), open it in your browser—the UI should hot-reload normally.

For instructions per application or package, see the README published for each application:

- [Web](apps/web/README.md)
- [Mobile](apps/mobile/README.md)
- [Extension](apps/extension/README.md)

## Contributing

For instructions on the best way to contribute, please review our [Contributing guide](CONTRIBUTING.md)!

## Socials / Contact

- X (Formerly Twitter): [@Uniswap](https://x.com/Uniswap)
- Reddit: [/r/Uniswap](https://www.reddit.com/r/Uniswap/)
- Email: [contact@uniswap.org](mailto:contact@uniswap.org)
- Discord: [Uniswap](https://discord.com/invite/uniswap)
- LinkedIn: [Uniswap Labs](https://www.linkedin.com/company/uniswaporg)

## Uniswap Links

- Website: [uniswap.org](https://uniswap.org/)
- Docs: [uniswap.org/docs/](https://docs.uniswap.org/)

## Whitepapers

- [V4](https://uniswap.org/whitepaper-v4.pdf)
- [V3](https://uniswap.org/whitepaper-v3.pdf)
- [V2](https://uniswap.org/whitepaper.pdf)
- [V1](https://hackmd.io/C-DvwDSfSxuh-Gd4WKE_ig)

## Production & Release Process

Uniswap Labs develops all front-end interfaces in a private repository.
At the end of each development cycle:

1. We publish the latest production-ready code to this public repository.

2. Releases are automatically tagged — view them in the [Releases tab](https://github.com/Uniswap/interface/releases).

## 🗂 Directory Structure

| Folder      | Contents                                                                       |
| ----------- | ------------------------------------------------------------------------------ |
| `apps/`     | The home for each standalone application.                                      |
| `config/`   | Shared infrastructure packages and configurations.                             |
| `packages/` | Shared code packages covering UI, shared functionality, and shared utilities.  |
