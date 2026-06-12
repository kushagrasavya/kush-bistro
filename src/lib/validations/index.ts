import { z } from 'zod';

/**
 * Attributes for a menu item, such as size, spicy level, or custom toppings.
 */
export const MenuItemAttributesSchema = z.record(z.string(), z.unknown()).optional();

/**
 * Menu Item Schema (Database & Admin updates validation)
 */
export const MenuItemSchema = z.object({
  id: z.string().uuid("Invalid menu item ID").or(z.string().min(1)),
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must not exceed 100 characters").trim(),
  description: z.string().max(500, "Description must not exceed 500 characters").trim().optional(),
  price: z.number().int().positive("Price must be a positive integer in paise"), // In paise (smallest unit, e.g. 500 = ₹5.00)
  image: z.string().url("Invalid image URL").or(z.string().min(1)),
  category: z.string().min(1, "Category is required").trim(),
  isAvailable: z.boolean().default(true),
  isVeg: z.boolean().default(true),
  attributes: MenuItemAttributesSchema,
});

/**
 * Single Order Item Schema for incoming client requests.
 * Frontend does NOT send prices or totals.
 */
export const CreateOrderItemSchema = z.object({
  menuItemId: z.string().uuid("Invalid menu item ID"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  customizations: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Order Schema for incoming client requests.
 * Validates only table number and item IDs + quantities.
 * Prevents client-side price tampering by design.
 */
export const CreateOrderSchema = z.object({
  tableNumber: z.string().min(1, "Table number is required").trim(),
  items: z.array(CreateOrderItemSchema).min(1, "Order must contain at least one item"),
});

/**
 * Order Item Schema stored in the database.
 * Includes a snapshot of the price at the time of order to prevent future menu edits from altering historical receipts.
 */
export const OrderItemSchema = z.object({
  menuItemId: z.string().uuid("Invalid menu item ID"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  priceAtOrder: z.number().int().positive("Price must be a positive integer in paise"),
  customizations: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Complete Order Schema (Database & Server-side validation)
 * Used to validate the finalized order before insertion and after payment verification.
 */
export const OrderSchema = z.object({
  id: z.string().uuid("Invalid order ID"),
  tableNumber: z.string().min(1, "Table number is required").trim(),
  items: z.array(OrderItemSchema).min(1, "Order must contain at least one item"),
  totalAmount: z.number().int().positive("Total amount must be a positive integer in paise"), // Calculated server-side
  status: z.enum(['pending', 'cooking', 'served', 'completed', 'cancelled']).default('pending'),
  paymentStatus: z.enum(['pending', 'paid', 'failed']).default('pending'),
  paymentId: z.string().trim().optional(), // Razorpay order/payment ID
  createdAt: z.date().or(z.string().datetime()).default(() => new Date()),
});

// Types inferred from Zod schemas
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type CreateOrderItem = z.infer<typeof CreateOrderItemSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Order = z.infer<typeof OrderSchema>;
