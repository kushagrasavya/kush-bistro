import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { tableNumber, utr } = await req.json();
    const supabase = await createClient();

    // Attach the UTR (payment_id) to all pending orders for this table
    const { error } = await supabase
      .from('orders')
      .update({ payment_id: utr })
      .eq('table_number', tableNumber)
      .eq('payment_status', 'pending');

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("UTR Submission Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}