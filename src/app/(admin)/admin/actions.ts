'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// FIX: Aligned 'preparing' with our Supabase SQL ENUM to prevent DB rejection
const StatusUpdateSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  newStatus: z.enum(['pending', 'preparing', 'served', 'completed', 'cancelled']),
});

/**
 * Server Action: Update an order's status.
 * Protected by server-side execution AND Supabase session verification.
 */
export async function updateOrderStatus(orderId: string, newStatus: string) {
  // 1. Validate inputs with Zod before touching the DB
  const result = StatusUpdateSchema.safeParse({ orderId, newStatus });
  if (!result.success) {
    return { error: 'Invalid input: ' + JSON.stringify(result.error.flatten().fieldErrors) };
  }

  const supabase = await createClient();

  // 2. SECURITY BARRIER: Verify active admin session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Unauthorized access. Active session required.' };
  }

  // 3. STRICT REVENUE ENFORCEMENT: Prevent 'completed' if unpaid
  if (result.data.newStatus === 'completed') {
    const { data: order } = await supabase
      .from('orders')
      .select('payment_status')
      .eq('id', result.data.orderId)
      .single();
      
    if (order?.payment_status !== 'paid') {
      return { error: 'Cannot complete order: Payment has not been collected.' };
    }
  }

  // 4. Perform the update on the database
  const { error } = await supabase
    .from('orders')
    .update({ status: result.data.newStatus })
    .eq('id', result.data.orderId);

  if (error) {
    console.error('Failed to update order status:', error.message);
    return { error: 'Database update failed. Please try again.' };
  }

  // 5. Revalidate the admin dashboard so server components re-fetch fresh data
  revalidatePath('/admin/dashboard');

  return { success: true };
}

/**
 * Server Action: Toggle a menu item's availability status (in/out of stock).
 * Protected by Supabase session verification.
 */
export async function toggleMenuItemAvailability(itemId: string, currentStatus: boolean) {
  const supabase = await createClient();

  // SECURITY BARRIER: Verify active admin session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Unauthorized access. Active session required.' };
  }

  const { error } = await supabase
    .from('menu_items')
    .update({ is_available: !currentStatus })
    .eq('id', itemId);

  if (error) {
    console.error('Failed to toggle item availability:', error.message);
    return { error: 'Database update failed. Please try again.' };
  }

  revalidatePath('/admin/dashboard');
  return { success: true };
}

/**
 * Server Action: Mark an order as paid (Used for Cash transactions)
 * Protected by Supabase session verification.
 */
export async function markOrderAsPaid(orderId: string) {
  const supabase = await createClient();
  
  // SECURITY BARRIER: Verify active admin session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Unauthorized access. Active session required.' };
  }

  const { error } = await supabase
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('id', orderId);

  if (error) {
    console.error('Failed to mark order as paid:', error.message);
    return { error: 'Database update failed. Please try again.' };
  }

  revalidatePath('/admin/dashboard');
  return { success: true };
}
export async function clearTableBill(tableNumber: string) {
  const supabase = await createClient();
  
  // Find all unpaid orders for this table and mark them as paid AND completed (archived)
  const { error } = await supabase
    .from('orders')
    .update({ 
      payment_status: 'paid',
      status: 'completed'
    })
    .eq('table_number', tableNumber)
    .eq('payment_status', 'pending');

  if (error) {
    console.error("Failed to clear table:", error);
    return { error };
  }

  revalidatePath('/admin/dashboard');
  return { success: true };
}
export async function clearAllDrafts() {
  const supabase = await createClient();
  
  // Permanently deletes all completed/cancelled tickets from the database
  const { error } = await supabase
    .from('orders')
    .delete()
    .in('status', ['completed', 'cancelled']);

  if (error) {
    console.error("Failed to clear drafts:", error);
    return { error };
  }

  revalidatePath('/admin/dashboard');
  return { success: true };
}