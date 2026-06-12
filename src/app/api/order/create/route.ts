import { NextResponse } from 'next/server';
import { CreateOrderSchema } from '@/lib/validations';
import { mockMenuItems } from '@/lib/mockData';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate the client request payload with Zod (decoupled input)
    const result = CreateOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid order input data', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { tableNumber, items } = result.data;

    // 2. Server-side pricing calculation (Never trust the client total price)
    let calculatedTotalAmount = 0;
    const orderItemsWithPrices = [];

    for (const item of items) {
      // Look up current price in the database (mock data here)
      const dbItem = mockMenuItems.find((i) => i.id === item.menuItemId);
      if (!dbItem) {
        return NextResponse.json(
          { error: `Item with ID ${item.menuItemId} is not available in the menu` },
          { status: 404 }
        );
      }
      
      const itemTotal = dbItem.price * item.quantity;
      calculatedTotalAmount += itemTotal;

      orderItemsWithPrices.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        priceAtOrder: dbItem.price,
      });
    }

    // 3. Generate a mock Razorpay order ID (or real one if SDK is configured)
    const mockOrderId = 'order_' + Math.random().toString(36).substring(2, 15).toUpperCase();

    // In production, you would run:
    // const razorpayOrder = await razorpay.orders.create({ amount: calculatedTotalAmount, currency: 'INR' });
    // And insert the order into the Supabase database.
    
    // Return order initialization info to the frontend
    return NextResponse.json({
      success: true,
      orderId: mockOrderId,
      totalAmount: calculatedTotalAmount,
      tableNumber,
      items: orderItemsWithPrices,
      message: 'Order created successfully (Server-calculated total)',
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
