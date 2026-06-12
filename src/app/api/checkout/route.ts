import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { tableNumber, items } = await req.json();
    const supabase = await createClient();

    let totalPaise = 0;
    const formattedItems = [];

    // 1. Force server-side price calculation to prevent hacking
    for (const item of items) {
      const { data: menuItem, error } = await supabase
        .from('menu_items')
        .select('price')
        .eq('id', item.menuItemId)
        .single();
        
      if (error || !menuItem) throw new Error(`Menu item not found in database.`);
      
      totalPaise += menuItem.price * item.quantity;
      formattedItems.push({ ...item, priceAtOrder: menuItem.price });
    }

    // 2. Save the pending order to the database (NO payment gateway yet)
    const { data: orderData, error: dbError } = await supabase
      .from('orders')
      .insert({
        table_number: tableNumber,
        total_amount: totalPaise,
        status: 'pending',
        payment_status: 'pending', // Mark as unpaid so the admin can clear it later
        items: formattedItems
      })
      .select('id')
      .single();

    if (dbError) throw dbError;

    // Return the new order ID to the frontend
    return NextResponse.json({ success: true, orderId: orderData.id });

  } catch (error: any) {
    console.error("Order Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}