# Integrasi Mayar → monitoring-ticket (realtime)

Alur data:

```
Pembeli bayar tiket di Mayar
  → Mayar POST webhook payment.received
  → /api/webhooks/mayar (Vercel)
  → increment tickets.sold di Supabase
  → Supabase Realtime push ke semua dashboard yang terbuka
```

## File yang ditambahkan ke repo

| File | Fungsi |
|---|---|
| `src/app/api/webhooks/mayar/route.ts` | Penerima webhook Mayar |
| `src/lib/supabase/realtime.ts` | Subscription realtime tabel `tickets` |
| `supabase/mayar-integration.sql` | Migrasi DB (jalankan manual, tidak masuk build) |

## Langkah setup

### 1. Database (Supabase SQL Editor)

Jalankan seluruh isi `supabase/mayar-integration.sql`. Ini menambah:
kolom `tickets.mayar_product_id`, tabel `mayar_webhook_log` (dedupe/audit),
fungsi `increment_ticket_sold`, dan mengaktifkan Realtime untuk `tickets`.

Jika `alter publication` error "already member", abaikan — artinya sudah aktif.

### 2. Environment variables (Vercel → Settings → Environment Variables)

```
SUPABASE_SERVICE_ROLE_KEY = <Supabase → Settings → API → service_role>
MAYAR_WEBHOOK_TOKEN       = <string acak panjang, buat sendiri, mis. openssl rand -hex 24>
```

service_role key **tidak boleh** berprefiks `NEXT_PUBLIC_` — key ini bypass RLS
dan hanya boleh hidup di server.

### 3. Daftarkan webhook di Mayar

Dashboard Mayar → **Integration → Webhook**, isi URL:

```
https://monitoring-ticket.vercel.app/api/webhooks/mayar?token=<MAYAR_WEBHOOK_TOKEN>
```

Klik **Test URL** — harus mengembalikan status sukses.

### 4. Mapping produk Mayar ke tiket

Untuk setiap tiket yang dijual lewat Mayar, isi kolom `mayar_product_id`
dengan `productId` produk Mayar-nya:

```sql
update tickets set mayar_product_id = '<productId-dari-mayar>' where id = '<ticket-uuid>';
```

Cara termudah mendapatkan productId: lakukan 1 transaksi tes, lalu lihat
`payload` di tabel `mayar_webhook_log`.

### 5. Aktifkan realtime di dashboard

Di komponen dashboard (mis. `src/app/admin/dashboard/page.tsx` dan
`src/app/admin/events/[id]/page.tsx`), tambahkan:

```tsx
import { useEffect } from 'react'
import { subscribeToTicketChanges } from '@/lib/supabase/realtime'

// di dalam komponen:
useEffect(() => subscribeToTicketChanges(), [])
```

## Cara tes end-to-end

1. Buka dashboard di browser.
2. Beli/tes bayar 1 tiket di Mayar (gunakan https://web.mayar.club untuk sandbox).
3. Angka **sold** di dashboard harus naik dalam ±1–2 detik tanpa refresh.
4. Cek `mayar_webhook_log` untuk memastikan payload masuk.

## Batasan yang perlu Anda sadari

- **Tidak ada pengurangan otomatis.** Mayar tidak mengirim event refund, jadi
  `sold` tidak turun kalau ada pembatalan — koreksi manual di DB.
- **Quantity.** Payload webhook Mayar tidak terdokumentasi mengirim jumlah
  tiket per transaksi. Kode membaca `qty`/`quantity` kalau ada, default 1.
  Setelah transaksi tes pertama, cek payload di `mayar_webhook_log` — kalau
  ada field jumlah dengan nama lain, sesuaikan di `route.ts`.
- **Keamanan webhook** hanya token di URL (Mayar tidak menyediakan HMAC
  signature). Cukup untuk kasus ini, tapi jangan bagikan URL-nya.
- **`scanned`** (check-in) tetap dari sistem Anda sendiri, bukan dari Mayar.
