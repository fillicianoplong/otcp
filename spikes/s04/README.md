# Spike S-04: npm license scan

Question for NFR-18 and R-04 (W-06).

## Question

Does any npm package in the shell lockfile, the `scaffold-draft` lockfile, or the planned ADR-001 packages that are missing from both, use a non-permissive license (GPL, AGPL, LGPL, SSPL, unknown, or unlicensed)? Which runtime packages need attribution on the Notices page?

Pass means the inventory lists every package, and every non-permissive package is called out for Notices. An empty non-permissive list is a pass.

## Method

The scanner is `spikes/s04/scan-licenses.mjs`. It reads an npm lockfile (lockfileVersion 3). Each package entry already stores the SPDX license npm copied from the registry at install time.

Rules for a row:

- One row per hoisted package. A nested copy under another package's `node_modules` is skipped.
- **Direct** means the name is in the root `dependencies` or `devDependencies`. **Transitive** means it is not.
- **Runtime** means the lockfile entry is part of a production install. **Dev** means `dev: true` (only required by devDependencies, the same set `npm ci --omit=dev` drops).
- **Optional** means the lockfile marks the package optional (platform builds such as `fsevents` and `lightningcss-*`).

The license check parses SPDX expressions. `OR` may use a permissive side (`MIT OR GPL-3.0-only` passes on MIT). `AND` must satisfy every part. A missing license, `UNLICENSED`, `UNKNOWN`, `NOASSERTION`, or `SEE LICENSE IN ...` is treated as unknown and fails. GPL, AGPL, LGPL, and SSPL fail even if someone adds them to the allowlist.

After `npm ci`, the check compares each installed `package.json` `license` field with the lockfile. Optional packages that this OS does not install are skipped. Their lockfile license is still in the inventory.

Planned ADR-001 packages already in a lockfile were not installed again:

| Planned package | Where it already is                                                    |
| --------------- | ---------------------------------------------------------------------- |
| Vite 7          | `scaffold-draft`: direct devDependency `vite@7.3.7` (MIT)              |
| React 19        | `scaffold-draft`: `react@19.3.1`, `react-dom@19.3.1` (MIT)             |
| Tailwind 4      | `scaffold-draft`: `tailwindcss@4.3.3`, `@tailwindcss/vite@4.3.3` (MIT) |
| React Router    | `scaffold-draft`: direct runtime `react-router@7.18.5` (MIT)           |
| Supabase JS     | Neither lockfile                                                       |

Supabase JS was resolved in a temp install on 2026-10-28: `npm install --ignore-scripts --save @supabase/supabase-js`, which wrote `@supabase/supabase-js@^2.118.0` and locked `2.118.0`.

Main also contains `vite@8.3.5` (MIT). That copy is a transitive dev package: `vitest@5.0.5` peers on Vite `^6.4.0`, `^7`, or `^8`, and npm installed 8.3.5. Both Vite versions are MIT. ADR-001 still names Vite 7, which is the scaffold pin. See open questions.

Regenerate the inventory from the three lockfiles:

```bash
node spikes/s04/scan-licenses.mjs \
  --lock package-lock.json --source main \
  --lock <scaffold-draft package-lock.json> --source scaffold-draft \
  --lock <supabase package-lock.json> --source planned-supabase \
  --csv spikes/s04/inventory.csv
```

## Environment

| Item           | Value                                      |
| -------------- | ------------------------------------------ |
| Date           | 2026-10-28                                 |
| OS             | Linux 6.12.94+ x86_64                      |
| Node.js        | 22.23.4 (`.nvmrc` is 22)                   |
| npm            | 10.9.9                                     |
| main           | `339481efb2f752ec74c2dfa0090f245de8bce57d` |
| scaffold-draft | `cc318a8480bb37007b539cd8d4d2d22d09e73308` |

Installs used `npm ci --ignore-scripts` for `scaffold-draft`, and `npm ci` for main. The Supabase temp tree used `npm install --ignore-scripts`.

## Raw results

Full inventory: [`inventory.csv`](inventory.csv). 436 packages. Columns are source, name, version, license, relationship (direct or transitive), scope (dev or runtime), optional, allowlist, non-permissive, and notices attribution.

| Source           | Packages | Direct | Transitive | Runtime | Dev | Non-permissive |
| ---------------- | -------: | -----: | ---------: | ------: | --: | -------------: |
| main             |      157 |     10 |        147 |       0 | 157 |              0 |
| scaffold-draft   |      270 |     21 |        249 |       6 | 264 |              0 |
| planned-supabase |        9 |      1 |          8 |       9 |   0 |              0 |

License counts:

| License       | main | scaffold-draft | planned-supabase |
| ------------- | ---: | -------------: | ---------------: |
| MIT           |  113 |            220 |                8 |
| Apache-2.0    |   17 |             18 |                0 |
| MPL-2.0       |   12 |             12 |                0 |
| ISC           |    6 |             10 |                0 |
| BSD-2-Clause  |    6 |              6 |                0 |
| BSD-3-Clause  |    2 |              2 |                0 |
| BlueOak-1.0.0 |    1 |              1 |                0 |
| CC-BY-4.0     |    0 |              1 |                0 |
| 0BSD          |    0 |              0 |                1 |

`package.json` cross-check (lockfile license vs installed `license` field):

| Tree             | Matched | Not installed here | Mismatches |
| ---------------- | ------: | -----------------: | ---------: |
| main             |     134 |                 23 |          0 |
| scaffold-draft   |     202 |                 68 |          0 |
| planned-supabase |       9 |                  0 |          0 |

Every package that was not installed is optional. Registry spot-checks of packages that were not on disk matched the lockfile:

| Spec                                    | `npm view` license |
| --------------------------------------- | ------------------ |
| `lightningcss-linux-arm64-gnu@1.33.0`   | MPL-2.0            |
| `lightningcss-android-arm64@1.32.0`     | MPL-2.0            |
| `@rolldown/binding-darwin-arm64@1.2.15` | MIT                |
| `fsevents@2.3.3`                        | MIT                |
| `caniuse-lite@1.0.30001819`             | CC-BY-4.0          |
| `tslib@2.8.1`                           | 0BSD               |
| `react@19.3.1`                          | MIT                |
| `vite@7.3.7`                            | MIT                |
| `vite@8.3.5`                            | MIT                |
| `@supabase/supabase-js@2.118.0`         | MIT                |

Direct packages on main (all dev): `@eslint/js@10.0.1` MIT, `@playwright/test@1.64.1` Apache-2.0, `@types/node@22.20.5` MIT, `eslint@10.13.0` MIT, `eslint-config-prettier@10.1.8` MIT, `globals@16.5.0` MIT, `prettier@3.9.10` MIT, `typescript@5.9.3` Apache-2.0, `typescript-eslint@8.72.1` MIT, `vitest@5.0.5` MIT.

The 17 Apache-2.0 packages on main are dev tools (TypeScript, Playwright and `playwright-core`, and ESLint support packages such as `@humanfs/*` and `@eslint/*`). The 12 MPL-2.0 packages are `lightningcss@1.33.0` and its platform builds, all dev. `minimatch@10.2.6` is the only BlueOak-1.0.0 package, pulled in by ESLint and typescript-eslint, dev.

On `scaffold-draft`, the extra license is `caniuse-lite@1.0.30001819` (CC-BY-4.0), a dev dependency of browserslist. Tailwind's `lightningcss` there is `1.32.0`, still MPL-2.0, still dev.

### Licenses that need a closer look

None of these are GPL, AGPL, LGPL, SSPL, unknown, or unlicensed.

| Package                             | License       | Scope                  | What to do                                                                                                                                                                                                                                  |
| ----------------------------------- | ------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lightningcss` and `lightningcss-*` | MPL-2.0       | dev                    | Weak copyleft on lightningcss's own files. The stylesheet it writes stays under the project license. Put it on the Notices page only if the app redistributes the package. Leave the files unmodified, or follow MPL-2.0 when editing them. |
| `minimatch@10.2.6`                  | BlueOak-1.0.0 | dev                    | Permissive. Keep the license text only if this package is redistributed.                                                                                                                                                                    |
| `caniuse-lite@1.0.30001819`         | CC-BY-4.0     | dev                    | Attribution applies if the dataset is redistributed. Build-time use leaves it out of the client bundle.                                                                                                                                     |
| `tslib@2.8.1`                       | 0BSD          | runtime of Supabase JS | Public-domain equivalent. No attribution line on the Notices page.                                                                                                                                                                          |

### Runtime packages that need Notices attribution

MIT requires the copyright line and the permission notice. The current main lockfile has no runtime packages, so the shell has no npm notices yet. The app stack (scaffold plus the Supabase temp install) has these:

| Package                  | Version | Relationship                | Source               | Copyright line                                                                                                                 |
| ------------------------ | ------- | --------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `react`                  | 19.3.1  | direct                      | scaffold-draft       | Copyright (c) Meta Platforms, Inc. and affiliates.                                                                             |
| `react-dom`              | 19.3.1  | direct                      | scaffold-draft       | Copyright (c) Meta Platforms, Inc. and affiliates.                                                                             |
| `scheduler`              | 0.28.0  | transitive (`react-dom`)    | scaffold-draft       | Copyright (c) Meta Platforms, Inc. and affiliates.                                                                             |
| `react-router`           | 7.18.5  | direct                      | scaffold-draft       | Copyright (c) React Training LLC 2015-2019. Copyright (c) Remix Software Inc. 2020-2021. Copyright (c) Shopify Inc. 2022-2023. |
| `cookie`                 | 1.1.1   | transitive (`react-router`) | scaffold-draft       | Copyright (c) 2012-2014 Roman Shtylman. Copyright (c) 2015 Douglas Christopher Wilson.                                         |
| `set-cookie-parser`      | 2.7.3   | transitive (`react-router`) | scaffold-draft       | Copyright (c) 2015 Nathan Friedly.                                                                                             |
| `@supabase/supabase-js`  | 2.118.0 | direct                      | planned temp install | Copyright (c) 2020 Supabase.                                                                                                   |
| `@supabase/auth-js`      | 2.118.0 | transitive                  | planned temp install | Copyright (c) 2020 Supabase.                                                                                                   |
| `@supabase/functions-js` | 2.118.0 | transitive                  | planned temp install | Copyright (c) 2020 Supabase.                                                                                                   |
| `@supabase/postgrest-js` | 2.118.0 | transitive                  | planned temp install | Copyright (c) 2020 Supabase.                                                                                                   |
| `@supabase/realtime-js`  | 2.118.0 | transitive                  | planned temp install | Copyright (c) 2020 Supabase.                                                                                                   |
| `@supabase/storage-js`   | 2.118.0 | transitive                  | planned temp install | Copyright (c) 2020 Supabase.                                                                                                   |
| `@supabase/phoenix`      | 0.4.5   | transitive                  | planned temp install | Copyright (c) 2014 Chris McCord.                                                                                               |
| `iceberg-js`             | 0.8.1   | transitive                  | planned temp install | Copyright (c) 2025 Supabase.                                                                                                   |

`tslib@2.8.1` (0BSD, Microsoft) is a runtime dependency of the Supabase packages and does not need an attribution line.

Non-permissive packages for the Notices page: none.

## Pass/fail

**Pass.**

The inventory covers the main shell lockfile (157), the `scaffold-draft` lockfile (270), and the Supabase JS temp tree (9). Non-permissive packages: 0. Every row is on the allowlist. Installed `package.json` licenses matched the lockfile with 0 mismatches.

NFR-18 is the Notices page itself (W-13 stub, W-61 final). This spike supplies the list that page should show. R-04 (an npm license incompatible with Notices) did not occur on these trees.

## Chosen fallback if it fails

The scan passed, so no package was replaced.

If a later run fails, replace that package before W-61, as R-04 says. Keep it off the Notices page until the replacement is in the lockfile and the check is green.

## CI check

`npm run licenses` runs the classifier tests, then `node spikes/s04/scan-licenses.mjs --check` against the repo `package-lock.json`. CI runs that step after `npm ci`, so the `package.json` cross-check runs too.

The allowlist is [`license-allowlist.json`](license-allowlist.json):

| SPDX id                    | Why it is allowed                                              |
| -------------------------- | -------------------------------------------------------------- |
| MIT, MIT-0                 | Permissive. MIT-0 needs no attribution. Seen: MIT.             |
| Apache-2.0                 | Permissive, with a notice if redistributed. Seen on dev tools. |
| ISC                        | Permissive, notice if redistributed.                           |
| BSD-2-Clause, BSD-3-Clause | Permissive, notice if redistributed.                           |
| BlueOak-1.0.0              | Permissive, notice if redistributed. Seen: `minimatch`.        |
| 0BSD, CC0-1.0, Unlicense   | No attribution required. Seen: `tslib` is 0BSD.                |
| CC-BY-4.0                  | Permissive with attribution. Seen: `caniuse-lite`, dev only.   |
| MPL-2.0                    | Weak copyleft, file scope. Seen: `lightningcss`, dev only.     |

A new SPDX id fails the job until it is added here after review. That is the point of the allowlist. A small script is enough: lockfileVersion 3 already stores the registry license, and the script checks it. Pulling in a separate scanner would add another dependency tree that would itself need a scan.

## Sources

- npm lockfile `license` field: <https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json>
- SPDX license list: <https://spdx.org/licenses/>
- MIT: <https://opensource.org/license/mit>
- Apache-2.0: <https://www.apache.org/licenses/LICENSE-2.0>
- ISC: <https://www.isc.org/licenses/>
- BSD-2-Clause: <https://opensource.org/license/bsd-2-clause>
- BSD-3-Clause: <https://opensource.org/license/bsd-3-clause>
- 0BSD: <https://opensource.org/license/0bsd>
- Blue Oak Model License 1.0.0: <https://blueoakcouncil.org/license/1.0.0>
- MPL-2.0: <https://www.mozilla.org/en-US/MPL/2.0/>
- CC-BY-4.0: <https://creativecommons.org/licenses/by/4.0/>
- lightningcss (MPL-2.0): <https://github.com/parcel-bundler/lightningcss>
- caniuse-lite (CC-BY-4.0): <https://github.com/browserslist/caniuse-lite>
- React license: <https://github.com/facebook/react/blob/main/LICENSE>
- React Router license: <https://github.com/remix-run/react-router/blob/main/LICENSE.md>
- `@supabase/supabase-js` license: <https://github.com/supabase/supabase-js/blob/master/packages/core/supabase-js/LICENSE>
- tslib license: <https://github.com/microsoft/tslib/blob/main/LICENSE.txt>

## Open questions

1. `cookie` and `set-cookie-parser` are production dependencies of `react-router`, and the Node / React Server builds import them. A BrowserRouter client bundle may leave them out. Keep both on the Notices list until a production bundle check shows they are absent. W-61 can drop a row that is not in the bundle.
2. ADR-001 names Vite 7. `scaffold-draft` has `vite@7.3.7`. Main's Vitest peer install is `vite@8.3.5`. Both are MIT. W-09 should pick the app's Vite version. This spike only settles the license.
3. MPL-2.0 and CC-BY-4.0 are allowlisted, and today both are dev-only. If either shows up as a runtime dependency, CI stays green and the Notices page still has to name it. W-13 / W-61 should use the `notices_attribution` column, not only the CI exit code.
4. `@supabase/supabase-js@2.118.0` is the version resolved on 2026-10-28 from a fresh install. Pin a version when the app dependency is added, and run `npm run licenses` again. The client license on that version is MIT.
5. Optional platform packages that this machine did not install were checked from the lockfile, plus the registry spot-checks above. The same registry field is what npm writes into the lockfile.

## Proposed doc edits

Apply these with the next docs batch. This spike does not edit `docs/SRS.md`, `docs/ARCHITECTURE.md`, `docs/UI.md`, or `docs/IMPLEMENTATION_PLAN.md`.

### ARCHITECTURE.md §9 Technology stack, License column

| Row                      | Proposed license cell                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vite                     | MIT (confirmed S-04: scaffold-draft `vite@7.3.7`; main's Vitest peer installs `vite@8.3.5`, also MIT)                                                                           |
| React                    | MIT (confirmed S-04: `react@19.3.1` and `react-dom@19.3.1` on scaffold-draft)                                                                                                   |
| TypeScript               | Apache-2.0 (confirmed S-04: `typescript@5.9.3`)                                                                                                                                 |
| Tailwind CSS             | MIT (confirmed S-04: `tailwindcss@4.3.3` on scaffold-draft)                                                                                                                     |
| Vitest                   | MIT (confirmed S-04: `vitest@5.0.5`)                                                                                                                                            |
| Playwright Chromium-only | Apache-2.0 (confirmed S-04: `@playwright/test@1.64.1`)                                                                                                                          |
| Supabase                 | MIT for `@supabase/supabase-js@2.118.0` and its `@supabase/*` and `iceberg-js` runtime dependencies. `tslib@2.8.1` is 0BSD. Confirmed S-04. Hosted-service terms are unchanged. |
| React Router             | MIT (confirmed S-04: `react-router@7.18.5` on scaffold-draft)                                                                                                                   |

Replace the sentence under the table:

> **UNVERIFIED:** Versions and licenses marked UNVERIFIED. Confirm after the spikes below.

with:

> **UNVERIFIED:** Versions marked UNVERIFIED. Confirm after the spikes below. Licenses in this table were confirmed in S-04 for the versions named above.

### ARCHITECTURE.md §9.2 UNVERIFIED list

Remove:

> - npm dependency licenses for the Notices page (NFR-18, S-04).

### ARCHITECTURE.md §8 R-04 mitigation

Replace:

> Spike S-04 license scan in CI; replace the package

with:

> S-04 found no non-permissive license. CI runs `npm run licenses` and fails if a package is outside the allowlist. Replace the package if a scan fails.

### SRS.md §10.3 Software and APIs

Vite, React, TypeScript, Tailwind license cell, replace `MIT (typical; verify each package)` with:

> Vite, React, and Tailwind: MIT. TypeScript: Apache-2.0. Confirmed in S-04.

Vitest, Playwright license cell, replace `MIT (typical; verify)` with:

> Vitest: MIT. Playwright (`@playwright/test`): Apache-2.0. Confirmed in S-04.

Supabase license cell, replace `Vendor terms` with:

> Hosted service: vendor terms. Client `@supabase/supabase-js`: MIT (S-04, 2.118.0). Runtime dependency `tslib` is 0BSD.

Replace the UNVERIFIED paragraph:

> **UNVERIFIED:** Exact third-party package licenses for the PR #1 stack are not re-checked in this draft. Verify each npm license before release. TCGplayer new API access remains closed as of October 27, 2026.

with:

> **UNVERIFIED:** TCGplayer new API access remains closed as of October 27, 2026. S-04 checked npm licenses for the main shell lockfile, the scaffold-draft lockfile, and `@supabase/supabase-js` 2.118.0. None were GPL, AGPL, LGPL, SSPL, unknown, or unlicensed. The Notices page lists the runtime packages from that inventory (NFR-18).
