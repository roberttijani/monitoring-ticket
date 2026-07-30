// src/app/api/webhooks/mayar/route.ts
// Penerima webhook Mayar → increment `sold` di Supabase secara realtime.
//
// Env yang dibutuhkan (set di Vercel):
//   NEXT_PUBLIC_SUPABASE_URL      (sudah ada)
//   SUPABASE_SERVICE_ROLE_KEY     (Supabase → Settings → API → service_role)
//   MAYAR_WEBHOOK_TOKEN           (string rahasia buatan sendiri)
//
// URL yang didaftarkan di Mayar (Integration → Webhook):
//   https://monitoring-ticket.vercel.app/api/webhooks/mayar?token=<MAYAR_WEBHOOK_TOKEN>

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface MayarWebhookPayload {
  event: string
  data: {
    id: string
    status?: string | boolean
    productId?: string
    productName?: string
    productType?: string
    amount?: number
    qty?: number
    quantity?: number
    customerName?: string
    customerEmail?: string
    customerMobile?: string
    createdAt?: number | string
    [key: string]: unknown
  }
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

// GET handler untuk test endpoint dari Mayar dashboard
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  
  // Debug info (hanya untuk development)
  const isTokenSet = !!process.env.MAYAR_WEBHOOK_TOKEN
  const tokenMatch = process.env.MAYAR_WEBHOOK_TOKEN === token
  
  if (!process.env.MAYAR_WEBHOOK_TOKEN || token !== process.env.MAYAR_WEBHOOK_TOKEN) {
    return NextResponse.json({ 
      error: 'unauthorized',
      debug: process.env.NODE_ENV === 'development' ? { isTokenSet, tokenMatch } : undefined
    }, { status: 401 })
  }

  return NextResponse.json({ 
    ok: true, 
    message: 'Mayar webhook endpoint is ready',
    timestamp: new Date().toISOString()
  })
}

export async function POST(req: NextRequest) {
  // 1. Autentikasi sederhana via token di query string.
  //    (Webhook Mayar tidak menyertakan HMAC signature, jadi token rahasia
  //    di URL adalah proteksi minimum. Jangan bagikan URL ini.)
  const token = req.nextUrl.searchParams.get('token')
  if (!process.env.MAYAR_WEBHOOK_TOKEN || token !== process.env.MAYAR_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let payload: MayarWebhookPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  // 2. Hanya proses pembayaran sukses. Event lain di-ack agar Mayar tidak retry.
  if (payload.event !== 'payment.received') {
    return NextResponse.json({ ok: true, skipped: payload.event })
  }

  const { data } = payload
  if (!data?.id || !data?.productId) {
    return NextResponse.json({ error: 'missing data.id / data.productId' }, { status: 400 })
  }

  const supabase = serviceClient()

  // 3. Dedupe — Mayar bisa mengirim ulang webhook yang sama.
  //    Insert ke log dulu; kalau sudah ada (unique violation), berhenti.
  const { error: logErr } = await supabase
    .from('mayar_webhook_log')
    .insert({
      webhook_id: data.id,
      event: payload.event,
      payload: data,
    })

  if (logErr) {
    if (logErr.code === '23505') {
      // duplikat — sudah pernah diproses
      return NextResponse.json({ ok: true, duplicate: true })
    }
    console.error('mayar webhook: log insert failed', logErr)
    return NextResponse.json({ error: 'log insert failed' }, { status: 500 })
  }

  // 4. Cari tiket yang ter-mapping ke produk Mayar ini.
  const { data: ticket, error: ticketErr } = await supabase
    .from('tickets')
    .select('id')
    .eq('mayar_product_id', data.productId)
    .maybeSingle()

  if (ticketErr) {
    console.error('mayar webhook: ticket lookup failed', ticketErr)
    return NextResponse.json({ error: 'ticket lookup failed' }, { status: 500 })
  }

  if (!ticket) {
    // Produk Mayar belum di-mapping ke tiket manapun. Ack saja (200)
    // supaya Mayar tidak retry, tapi catat di log untuk audit.
    console.warn(`mayar webhook: no ticket mapped for productId=${data.productId}`)
    return NextResponse.json({ ok: true, unmapped: data.productId })
  }

  // 5. Increment `sold` secara atomik via RPC (hindari race condition
  //    kalau dua pembayaran masuk bersamaan).
  const qty = Math.max(1, Number(data.qty ?? data.quantity ?? 1) || 1)
  const { error: rpcErr } = await supabase.rpc('increment_ticket_sold', {
    p_ticket_id: ticket.id,
    p_qty: qty,
  })

  if (rpcErr) {
    console.error('mayar webhook: increment failed', rpcErr)
    return NextResponse.json({ error: 'increment failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, ticketId: ticket.id, qty })
}
