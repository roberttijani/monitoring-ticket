// Debug endpoint untuk cek environment variables
// HAPUS FILE INI setelah debugging selesai!

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    env_check: {
      MAYAR_WEBHOOK_TOKEN_set: !!process.env.MAYAR_WEBHOOK_TOKEN,
      SUPABASE_SERVICE_ROLE_KEY_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SUPABASE_URL_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
      // JANGAN TAMPILKAN VALUE SEBENARNYA - HANYA STATUS
    }
  })
}
