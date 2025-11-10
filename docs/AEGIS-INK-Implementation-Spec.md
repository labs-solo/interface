# AEGIS INK LP Interface – Implementation Specification

**Owner:** Platform Engineering / Codex
**Repo:** `universe` (Uniswap interface mirror)
**Target Branch:** `aegis-ink-implementation-spec`
**Last Updated:** 2025-11-10

---
## 1. Executive Summary
- Fork the web interface into an LP-only shell that can be branded for **AEGIS**, **The Deep**, or future partners while staying focused on **Uniswap v4** flows.
- Strip nonessential routes (swap, explore, portfolio, passkeys, Toucan) to shrink bundle size and reduce maintenance.
- Inject a white-label theming/branding layer so AEGIS, The Deep, or any downstream brand styles and copy are applied via configuration rather than code edits.
- First supported network is **Kraken INK (chain id 57073)** using the provided PoolManager/Router/etc. addresses; architecture should make adding more chains trivial.
- Maintain compatibility with upstream shared packages (`packages/ui`, `packages/uniswap`, `@universe/*`) to ease future merges and security patches.
- Keep telemetry, analytics, and feature-flag hooks plumbed but default-disabled so we can re-enable later without refactoring.
- Deliver a hardened CI/CD path (Bun + Nx) plus Playwright e2e coverage for the happy-path LP lifecycle on INK.

---
## 2. Goals & Non-Goals
### Goals
1. Deliver a simplified LP-only experience (create pool, add/remove liquidity, view/manage v4 positions) with wallet + network management.
2. Provide a brand configuration layer (tokens, logos, copy, favicons) that can be overridden via a single package/env flag to switch between **AEGIS**, **The Deep**, or any custom brand with zero code edits.
3. Add INK chain support with correct RPC endpoints, explorers, gas config, and v4 contract addresses.
4. Establish maintainable CI, testing, and upstream sync practices for the forked repo.

### Non-Goals
- Shipping swap/bridge/governance/earn/analytics surfaces.
- Maintaining the React Native wallet or browser extension artifacts in this fork.
- Implementing new protocol features beyond what upstream Universe already exposes for v4.

---
## 3. Success Criteria
- LP-only navigation with working flows: create v4 pool, add liquidity, view position, remove liquidity, claim fees.
- Branded experiences (AEGIS, The Deep, or any registered profile) applied purely via configuration (no manual CSS overrides); theme switch demoable at runtime.
- INK chain registered and selected by default; Playwright smoke validates the end-to-end flow on INK RPC/fork.
- CI pipeline runs `bun g:typecheck`, `bun g:lint`, `bun g:test`, `bun web build:production`, and Playwright LP smoke on every PR.
- Repo documents GPLv3 obligations, brand config usage, and INK onboarding instructions.

---
## 4. Architecture Overview
```
+------------------------------+
| apps/web (LP shell)          |
|  - Routes: Positions,        |
|    PositionDetail, Create,   |
|    Increase/Remove, Settings |
|  - Multichain + Wallet UI    |
+---------------+--------------+
                |
                v
+----------------------------------------------+
| packages/uniswap                             |
|  - Chain info (INK)                          |
|  - Tx settings, telemetry, GraphQL hooks     |
|  - LP contexts + parsing utilities           |
+------------------+---------------------------+
                   |
                   v
+--------------------------------------+    +-------------------+
| packages/ui                          |    | brand-config pkg  |
|  - Tamagui tokens/themes             |<---|  - colors, fonts  |
|  - Shared components/icons           |    |  - logos, copy    |
+--------------------------------------+    |  - env overrides  |
                                            +-------------------+
```
Key points:
- `brand-config` supplies token overrides + metadata that are merged before `createTamagui` initializes in `apps/web`.
- INK chain info lives beside existing EVM chains and feeds both wagmi/viem configs and REST queries, ensuring future merges remain trivial.
- Feature-flag/telemetry hooks still reference `@universe/gating` and telemetry packages, but flags default to `false` to avoid unneeded dependencies at runtime.

---
## 5. Simplification Plan
### 5.1 Routing & Navigation
- Update `RouteDefinitions.tsx` to keep only:
  - `/positions`, `/positions/v4/:chainName/:tokenId`
  - `/positions/create/v4`
  - `/positions/:tokenId/*` sub-routes used by add/remove/increase
  - `/pool/:chainName/:poolAddress`
  - `/settings` (transaction + slippage)
- Redirect legacy routes (swap, explore, migrate) to `/positions` with info banners explaining scope.
- Remove lazy imports for unused pages and delete associated tests/stories to shrink bundle.

### 5.2 State & Store Cleanup
- Remove swap/explore-specific atoms/selectors from `apps/web/src/state`.
- Keep `multichain`, `transactions`, `user`, `wallet`, and `lp` contexts; update selectors to assume v4-only.
- Delete translation keys referenced exclusively by removed surfaces; run `bun i18n:extract` afterward.

### 5.3 Dynamic Fee Hook Defaults
- Make the **AEGIS Dynamic Fee Manager (DFM) hook** the only option when creating new pools. The Create Position flow should no longer expose raw fee tiers; instead it automatically deploys v4 pools with the DFM hook attached, and later can swap to the **AEGIS Liquidity Engine hook** via config.
- Store the hook address (and any calldata required by PoolManager) in brand-config so switching from DFM → Liquidity Engine is a small configuration change rather than a UI rewrite.
- Update creation/transaction contexts to inject the hook parameters into `PoolManager.createAndInitialize` and subsequent `modifyLiquidities` calls, ensuring all pools minted via this UI inherit the dynamic fee logic without extra user steps.
- Retain read-only support for non-AEGIS pools (positions imported from elsewhere), but mark them as “external” and disable pool-creation actions to avoid accidental deployments without the default hook.

### 5.4 Dependencies
- Trim `apps/web/package.json` dev/prod deps: drop cypress, Toucan, passkey modules, swap-specific libraries.
- Update Nx targets: remove swap/anvil-specific commands; add `lp:e2e` pointing to the new Playwright spec.
- Document new dev commands in README (e.g., `bun aegis dev`, `bun lp:e2e`).

---
## 6. Branding & Theming Specification
### 6.1 Brand Config Package
- Create `packages/brand-config` exporting:
  ```ts
  export interface BrandTokens {
    name: 'uniswap' | 'aegis' | 'the-deep' | (string & {})
    theme: {
      colorsLight: Record<string, string>
      colorsDark: Record<string, string>
      spacing?: Partial<typeof spacing>
      radii?: Partial<typeof borderRadii>
      fonts?: Partial<typeof fonts>
    }
    assets: {
      logoSvg: string
      faviconIco: string
      socialPreview: string
    }
    copy: {
      title: string
      description: string
    }
    telemetry: { enabled: boolean }
  }
  ```
- Provide default (`uniswap`), `aegis`, and `the-deep` implementations plus a sample `brand.config.json` for overrides that can define additional partner brands.
- Expose helper `resolveBrand()` that reads `process.env.AEGIS_BRAND` (e.g., `AEGIS_BRAND=the-deep`) or falls back to default, and allow the helper to ingest a JSON/YAML profile supplied at deploy time so re-branding never requires a compile or code change.
- Document that assets/tokens/copy live entirely inside the brand profile so a new partner only needs to drop a config file + asset bundle and set the env flag.

### 6.2 Tamagui Integration
- In `apps/web/src/app/Providers.tsx`, call `resolveBrand()` before `createTamagui`. Merge brand tokens into `packages/ui/src/theme/color/colors` and `themes.ts`.
- Ensure hover/focus tokens remain valid by running `validateColorValue` on overrides.
- Provide runtime toggle (dev-only) to verify brand switching without rebuild.

### 6.3 Asset & Copy Injection
- Use brand assets for navbar logo, favicon (`vite.config`), `index.html` meta tags.
- Store copy overrides (hero text, CTA labels) in brand config and reference them in LP screens.
- Maintain WCAG AA contrast by linting tokens via a simple script (e.g., `scripts/verify-brand-contrast.ts`).

### 6.4 Zero-Code Brand Activation
- Ship a `docs/BRANDING.md` playbook that walks through adding a new brand profile (e.g., `the-deep`) by copying `brand.config.example.json`, updating asset paths, and setting `AEGIS_BRAND=<profile>`.
- Ensure CI + `bun web dev --brand <profile>` can hot-swap between `uniswap`, `aegis`, and `the-deep` without rebuilding so stakeholders can verify theming live.
- During build/deploy, point the hosting layer at the desired `brand.config.json` blob (S3, KV, etc.). `resolveBrand()` must read from that artifact at startup so rebrands require only config/file changes.
- Provide smoke Playwright coverage that boots each bundled brand profile and asserts logo + hero copy swap, guaranteeing white-label readiness stays healthy.

---
## 7. INK Network Enablement
### 7.1 Chain Registration
- Add `packages/uniswap/src/features/chains/evm/info/ink.ts`:
  ```ts
  export const INK_CHAIN_INFO = {
    id: 57073,
    label: 'INK',
    interfaceName: 'ink',
    platform: Platform.EVM,
    supportsV4: true,
    rpcUrls: {
      public: ['https://rpc.kraken.com/ink'],
      fallback: ['https://ink.rpc.backup'],
      interface: ['https://rpc.kraken.com/ink'],
    },
    explorer: {
      name: 'InkScan',
      url: 'https://inkscan.kraken.com',
      apiURL: 'https://inkscan.kraken.com/api',
    },
    nativeCurrency: { name: 'Ink ETH', symbol: 'INK', decimals: 18 },
    wrappedNativeCurrency: {
      name: 'Wrapped Ink',
      symbol: 'WINK',
      address: '0x...'(TBD),
    },
    defaultPoolHook: {
      label: 'AEGIS Dynamic Fee Manager',
      address: '0xHOOK_DFM_ADDRESS',
      type: 'dynamic-fee',
      // allows future switch to Liquidity Engine without UI surgery
    },
    v4Addresses: {
      poolManager: '0x360e68faccca8ca495c1b759fd9eee466db9fb32',
      positionDescriptor: '0x42e3ccd9b7f67b5b2ee0c12074b84ccf2a8e7f36',
      positionManager: '0x1b35d13a2e2528f192637f14b05f0dc0e7deb566',
      quoter: '0x3972c00f7ed4885e145823eb7c655375d275a1c5',
      stateView: '0x76fd297e2d437cd7f76d50f01afe6160f86e9990',
      universalRouter: '0x112908dac86e20e7241b0927479ea3bf935d1fa0',
      permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
    },
  }
  ```
- Append `INK_CHAIN_INFO` to `ORDERED_CHAINS` and update `UniverseChainId` enum accordingly.

### 7.2 RPC & Wagmi Config
- Extend `apps/web/src/wagmi/config.ts` to include INK chain from `packages/uniswap`.
- Default Multichain context to INK; fall back to user selection when other chains are later enabled.

### 7.3 Token Lists & Metadata
- Provide `tokenlists/aegis-ink.json` (curated allowlist). Load via brand config to avoid coupling to upstream token APIs.
- Document how to refresh the list (script hitting Kraken registry).

### 7.4 Testing
- Add Playwright fixtures pointing to an INK fork (Anvil/Hardhat) seeded with tokens.
- Unit tests verifying `getChainInfo(57073)` returns v4 addresses, `supportsV4` true, and injects `defaultPoolHook` metadata.
- Regression tests asserting that pool-creation transactions always include the configured hook address (e.g., inspect emitted `PoolCreated` events in forked-playwright runs).

---
## 8. Telemetry, Feature Flags, and Security
- Ship a lightweight `@universe/gating` adapter that returns `false` for all Statsig flags unless an env var enables remote evaluation. This prevents runtime errors in components still calling `useFeatureFlag`.
- Trace/analytics wrappers should check `brandConfig.telemetry.enabled` before sending events.
- Enforce Permit2 + Universal Router addresses for INK to prevent misuse; add guardrails in transaction builders (throw if missing chain support).
- Maintain blocked token list + phishing URL checks from upstream (located in `packages/uniswap/src/features/trm`).

---
## 9. Testing & CI/CD
1. **Unit / Integration (Vitest):** Run `bun g:test` focused on LP modules; update snapshots after branding changes.
2. **E2E (Playwright):** Create `apps/web/playwright/lp-ink.spec.ts` covering create → add → remove flows on INK.
3. **Lint/Typecheck:** `bun g:lint`, `bun g:typecheck` remain mandatory.
4. **Build:** `bun web build:production` using AEGIS brand + INK default.
5. **CI Pipeline:** GitHub Actions (or equivalent) with Nx cache steps:
   - Install (Bun)
   - `bun g:typecheck`
   - `bun g:lint`
   - `bun g:test`
   - `bun web build:production`
   - `bun web playwright:test --grep "INK LP"`
6. **Artifacts:** upload production build + Playwright report for releases.

---
## 10. Work Breakdown & Timeline
| Milestone | Tasks | Estimate |
| --- | --- | --- |
| M0 – Baseline & Planning | Run setup, audit LP dependencies, finalize spec | 2d |
| M1 – Route/State Simplification | Prune routes, delete unused slices/tests, update docs | 5d |
| M2 – Branding Layer | Build `brand-config`, integrate Tamagui overrides, add assets | 4d |
| M3 – INK Chain Enablement | Chain info, RPC wiring, token list, Playwright fixtures | 5d |
| M4 – Polish & Testing | Copy updates, accessibility pass, telemetry toggles, finalize CI | 4d |
| M5 – Launch | Final QA, README/licensing updates, tag release | 2d |

**Risks & Mitigations**
- **Incorrect chain config** → add contract smoke tests + manual verification before launch.
- **Brand tokens break theme** → add validation script + Storybook visual diff.
- **Upstream merge conflicts** → keep changes isolated to new files (`brand-config`, `ink.ts`, router). Document rebase procedure.
- **RPC instability** → configure multiple fallback endpoints and longer retry windows similar to Base chain defaults.

---
## 11. Documentation & Licensing
- Update root README: describe AEGIS fork scope, setup commands, INK addresses, and GPL attribution linking back to `https://github.com/Uniswap/interface`.
- Include `LICENSE` reference in brand docs; ensure any proprietary assets are noted as not covered by GPL (if applicable).
- Provide `docs/INK-chain.md` detailing how to rotate addresses or add new ones.

---
## 12. Open Items
- Confirm wrapped native token address (WINK) for INK.
- Receive final RPC and explorer URLs from Kraken infra.
- Decide whether to keep translations beyond English in future phases.
- Determine hosting/deployment pipeline (Vercel vs Kraken infra) and required environment secrets.
- Clarify whether AEGIS requires configurable hook selection/fee display for v4 pools (e.g., exposing the dynamic-fee hook address in the UI).
- Align on long-term token list ownership (static JSON bundled vs. remote registry/API) and icon hosting strategy for new INK assets.
- Decide on telemetry stance (fully disabled vs. minimal opt-in metrics) so we can either remove analytics plumbing entirely or wire a specific provider.
- Provide guidance on future multi-network support so copy/components can anticipate adding additional chains without major refactors.
- Specify where GPL attribution should surface in-product (e.g., footer/about modal) in addition to repository-level notices.
- Call out any extra QA requirements beyond our current test plan (e.g., high-position-volume stress tests, hardware-wallet smoke tests, mobile browsers).
- Confirm production hosting domain/CDN requirements and any integration points with Kraken infrastructure (SSO, monitoring, etc.).
- Ensure an INK testnet (e.g., INK Sepolia) with v4 deployments is available during implementation for end-to-end dry runs.

---
## 13. Critical Implementation Notes & Rationale
1. **LP-only fork justification:** Stripping swap/bridge/governance/mobile/extension code shrinks bundle size, removes unused dependencies, and removes attack surface. We keep only the Create/Add/Remove liquidity routes plus positions pages because those already use the same Redux slices and hooks needed for v4; deleting the rest avoids conflicts during upstream merges and keeps GPL obligations limited to the parts we actually ship.
2. **Maintain upstream alignment:** Retaining React + TypeScript, Nx+Bun tooling, Tamagui UI tokens, and wagmi/viem web3 adapters ensures we can periodically rebase onto Uniswap/interface (`apps/web`, `packages/uniswap`, `packages/ui`) without re-writing the build graph. Wherever possible, AEGIS-specific behavior (routing, branding, INK support) is expressed as configuration or small wrapper modules so that future upstream fixes apply cleanly.
3. **Branding via tokens only:** All AEGIS visuals (colors, typography, spacing, logos, favicon, copy) enter through the new brand-config package that feeds Tamagui tokens/themes. By avoiding ad-hoc CSS overrides we guarantee consistent WCAG AA color contrast and allow a single-file brand flip for future white-label deployments.
4. **INK network enablement:** Chain id `57073` plus Kraken-provided v4 contract addresses (PoolManager `0x360e…fb32`, PositionDescriptor `0x42e3…7f36`, PositionManager `0x1b35…b566`, Quoter `0x3972…a1c5`, StateView `0x76fd…9990`, Universal Router `0x1129…1fa0`, Permit2 canonical `0x0000…BA3`) are registered in `packages/uniswap` so every liquidity action targets INK deployments. Wagmi uses INK RPC(s) and explorer links, Multichain context defaults to INK, and token selectors read from an AEGIS-managed allowlist to avoid unverified assets.
5. **Hardened UX:** Statsig gating, multi-language packs, growth analytics, and experimental modules are removed or stubbed to keep required features always-on. We preserve critical safety rails—token blocklists, Permit2/approval safeguards, warnings for low liquidity or extreme price ranges, and structured error handling for RPC failures—so the UI remains safe despite reduced surface area.
6. **Sync strategy:** We fork from the latest public Universe release, keep `upstream/main` as a clean baseline, and isolate all AEGIS deltas (theme config, INK chain entry, route pruning) so merges boil down to reapplying a small, well-documented patch set. CI (Bun/Nx) enforces lint/type/test/build/Playwright on every PR so divergences are caught early.
7. **Risk-managed rollout:** The WBS phases (audit → de-scope → theming → INK wiring → testing) each include explicit acceptance criteria and mitigations (e.g., verifying contract addresses via read calls, fallback to ERC20 approve when Permit2 absent, providing guidance for wallet network switching). “Done” requires a Playwright-validated end-to-end LP flow on INK plus CI green and documentation updated for GPL attribution and brand config usage.
8. **Default hook requirement:** Pool creation is hard-wired to attach the AEGIS Dynamic Fee Manager hook (and later, the Liquidity Engine) so every pool launched from this interface inherits the dynamic fee behavior automatically; the UI no longer asks users to pick fee tiers, reducing footguns and guaranteeing hook adoption.
