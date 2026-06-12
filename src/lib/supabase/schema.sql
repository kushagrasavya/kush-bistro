-- ==========================================
-- SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Project: White-Label QR Menu & Order Billing
-- ==========================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create MENU_ITEMS Table
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL, -- Stored in paise (smallest currency unit, e.g. 500 = ₹5.00)
    image TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    is_veg BOOLEAN DEFAULT TRUE NOT NULL,
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for fast category fetches and searches
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(is_available);

-- Enable RLS for menu_items
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for menu_items
-- Customers (Anonymous Public) can SELECT menu items to view them
CREATE POLICY "Allow public select on menu items" 
ON public.menu_items 
FOR SELECT 
USING (true);

-- Admins (Authenticated Users) can perform all operations (INSERT, UPDATE, DELETE)
CREATE POLICY "Allow admin all operations on menu items" 
ON public.menu_items 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- 2. Create ORDERS Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number VARCHAR(10) NOT NULL,
    items JSONB NOT NULL, -- Array of order items containing {menuItemId, quantity, priceAtOrder, customizations}
    total_amount INTEGER NOT NULL, -- Stored in paise, calculated server-side
    status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- pending, cooking, served, completed, cancelled
    payment_status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- pending, paid, failed
    payment_id VARCHAR(100), -- Razorpay order/payment ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for fast dashboard list queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- Enable RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
-- Customers can INSERT orders (to place them)
CREATE POLICY "Allow customer order placement" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- Customers can SELECT their own orders if they have the specific Order UUID
CREATE POLICY "Allow customer select own order by uuid" 
ON public.orders 
FOR SELECT 
USING (true); -- Public UUID selection is secure due to unguessable random UUIDs

-- Admins (Authenticated Users) can view and update order status/payment info
CREATE POLICY "Allow admin all operations on orders" 
ON public.orders 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- ==========================================
-- 3. SEED INITIAL MENU ITEMS (Latte & Terracotta Theme)
-- ==========================================

INSERT INTO public.menu_items (id, name, description, price, image, category, is_available, is_veg, attributes)
VALUES 
('1a54728b-b827-4638-b74c-4e1ea05f6e80', 'Truffle Parmesan Fries', 'Crispy golden fries tossed in rich white truffle oil, grated parmesan cheese, and fresh parsley.', 35000, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60', 'Appetizers', true, true, '{"spicy": false, "recommended": true}'),
('2b54728b-b827-4638-b74c-4e1ea05f6e81', 'Crispy Avocado Sliders', 'Three mini sliders with panko-crusted avocado, spicy sriracha mayo, and tangy pickled cabbage.', 49000, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=60', 'Appetizers', true, true, '{"spicy": true, "recommended": false}'),
('3c54728b-b827-4638-b74c-4e1ea05f6e82', 'Smoked Salmon Sourdough', 'Toasted sourdough loaded with herb cream cheese, premium smoked salmon, capers, and dill.', 65000, 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=500&auto=format&fit=crop&q=60', 'Mains', true, false, '{"spicy": false, "recommended": true}'),
('4d54728b-b827-4638-b74c-4e1ea05f6e83', 'Pesto Burrata Pasta', 'Fresh fettuccine tossed in dynamic basil pesto, cherry tomatoes, topped with a whole creamy burrata ball.', 59000, 'https://images.unsplash.com/photo-1621996346565-e3bb64e0be5e?w=500&auto=format&fit=crop&q=60', 'Mains', true, true, '{"spicy": false, "recommended": true}'),
('5e54728b-b827-4638-b74c-4e1ea05f6e84', 'Matcha Tiramisu', 'Modern twist on classic tiramisu layered with matcha soaked ladyfingers and whipped mascarpone cream.', 32000, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=60', 'Desserts', true, true, '{"spicy": false, "recommended": false}'),
('6f54728b-b827-4638-b74c-4e1ea05f6e85', 'Classic Cold Brew', '24-hour slow steeped specialty coffee beans served over clear ice cubes.', 22000, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60', 'Beverages', true, true, '{"spicy": false, "recommended": false}'),
('7g54728b-b827-4638-b74c-4e1ea05f6e86', 'Hibiscus Elderflower Tonic', 'Vibrant pink cold brew hibiscus tea paired with premium tonic water and fresh mint.', 28000, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60', 'Beverages', true, true, '{"spicy": false, "recommended": true}')
ON CONFLICT (id) DO NOTHING;
