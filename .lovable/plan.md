
## Ringkasan

Menggantikan seluruh data mock dengan data **live** dari Blockscout Robinhood Chain (`https://robinhoodchain.blockscout.com/api/v2`), menambahkan **Login via X (Twitter)**, dan menyimpan **reviews** di Lovable Cloud dengan verifikasi handle X asli.

## Catatan penting soal Login X

Lovable Cloud (Supabase) **tidak menyediakan provider X (Twitter) native** — hanya Google, Apple, Email, Phone, SAML. Untuk pakai X sebagai login, saya akan implementasikan **X OAuth 2.0 custom flow** via TanStack server routes (`/api/public/auth/x/callback`) menggunakan **X API connector** yang sudah tersedia di Lovable. User akan authorize di X → kita dapat handle & user id → kita mint Supabase session pakai admin API. Ini butuh:
- Enable Lovable Cloud
- Connect X connector (Anda authorize sekali)
- Set secret `X_CLIENT_ID` + `X_CLIENT_SECRET` (dari developer.x.com — saya akan minta setelah plan disetujui)

Alternatif lebih sederhana: login **Google/Email**, lalu user "link" X handle-nya via OAuth. Saya rekomendasikan alternatif ini kalau Anda tidak punya X Developer app — lebih cepat & fitur verifikasi review tetap jalan.

## Arsitektur Data (Live Blockscout)

Semua fetch di **server function** (`createServerFn`), cache di TanStack Query, refetch tiap 30 detik untuk feed live.

```
src/lib/rhc.functions.ts       server fns → Blockscout REST
  - getAddressOverview(addr)   /addresses/{addr}
  - getAddressTxs(addr)        /addresses/{addr}/transactions
  - getAddressTokens(addr)     /addresses/{addr}/token-transfers (filter type=ERC-20 creation)
  - getDeployedContracts(addr) /addresses/{addr}?filter=contract_creation via txs
  - getContractInfo(addr)      /smart-contracts/{addr}  (verified? source code?)
  - getLatestActivity()        /transactions (untuk ticker global)
  - getTokenInfo(addr)         /tokens/{addr}
```

Setiap data yang ditampilkan (tx hash, contract address, token address) akan jadi **link langsung ke Blockscout explorer** — inilah "verifiable by user": klik → lihat bukti on-chain.

## Reputation Score (dihitung real dari on-chain)

Formula deterministik, ditampilkan breakdown-nya:
- Age of wallet (tx pertama)
- Jumlah kontrak di-deploy & yang ter-verified di Blockscout
- Jumlah token created
- Rasio "still active" (kontrak masih ada transfer 7 hari terakhir)
- Community rating dari reviews (weighted 30%)

Setiap komponen skor diklik → tampilkan tx list sebagai bukti.

## Auth & Reviews

**Skema DB (Lovable Cloud):**
```sql
profiles            (id uuid PK → auth.users, x_handle text UNIQUE, x_user_id text UNIQUE, x_verified bool, avatar_url)
reviews             (id, dev_address text, author_id uuid → auth.users, rating 1-5, content, created_at)
review_votes        (review_id, voter_id, value +1/-1)   -- opsional
```
Semua tabel: GRANT + RLS (read public, write hanya author sendiri, satu review per (author, dev_address)).

**Verifikasi X:**
- Login via X OAuth → server exchange code → simpan `x_handle`, `x_user_id`, `x_verified=true` di profiles.
- Review yang ditampilkan menunjukkan @handle-nya, badge "Verified via X" karena tersimpan dari OAuth (bukan input manual → anti-impersonation).
- Rate limit: 1 review per handle per dev address (unique constraint).

## Halaman & fitur yang jadi live

1. **Home** — search wallet 0x… → langsung fetch Blockscout, redirect ke `/dev/0x…`. Ticker global = latest transactions Robinhood Chain real.
2. **/dev/$address** — profil live: overview (balance, tx count, first seen), tab Deployed Contracts (dengan status verified badge dari Blockscout), tab Token Launches, tab Reviews. Setiap item punya "View on Explorer ↗".
3. **/leaderboard** — daftar wallet yang di-tracked (dari daftar reviewed devs + top deployers cache). Sort by reputation / launches / reviews.
4. **Login page** — "Sign in with X" satu tombol.
5. **Review form** — hanya muncul kalau logged-in; kirim ke server fn dengan RLS.

## Yang saya butuhkan dari Anda setelah plan ini di-approve

1. Konfirmasi: **X OAuth langsung** ATAU **Google login + link X**? (rekomendasi #2 lebih cepat)
2. Kalau #1: X `CLIENT_ID` & `CLIENT_SECRET` dari https://developer.x.com (app dengan OAuth 2.0, callback URL akan saya kasih)
3. Konfirmasi endpoint Blockscout `https://robinhoodchain.blockscout.com/api/v2` responsif — saya akan test dulu di call pertama.

## Urutan build

1. Enable Lovable Cloud + migration (profiles, reviews, RLS)
2. Server functions Blockscout + smoke test
3. Auth flow (X atau Google+link) + profiles trigger
4. Refactor route `/dev/$address` pakai real data + verify-link ke explorer
5. Home ticker & search pakai live data
6. Leaderboard pakai devs yang punya reviews + top on-chain
7. Review form + RLS + UI badge verified
8. Hapus semua mock data & pastikan build hijau
