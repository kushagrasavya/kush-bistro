import { MenuItem } from './validations';

export const mockMenuItems: MenuItem[] = [
  {
    id: '1a54728b-b827-4638-b74c-4e1ea05f6e80',
    name: 'Truffle Parmesan Fries',
    description: 'Crispy golden fries tossed in rich white truffle oil, grated parmesan cheese, and fresh parsley.',
    price: 35000, // ₹350.00
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60',
    category: 'Appetizers',
    isAvailable: true,
    isVeg: true,
    attributes: {
      spicy: false,
      recommended: true
    }
  },
  {
    id: '2b54728b-b827-4638-b74c-4e1ea05f6e81',
    name: 'Crispy Avocado Sliders',
    description: 'Three mini sliders with panko-crusted avocado, spicy sriracha mayo, and tangy pickled cabbage.',
    price: 49000, // ₹490.00
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=60',
    category: 'Appetizers',
    isAvailable: true,
    isVeg: true,
    attributes: {
      spicy: true,
      recommended: false
    }
  },
  {
    id: '3c54728b-b827-4638-b74c-4e1ea05f6e82',
    name: 'Smoked Salmon Sourdough',
    description: 'Toasted sourdough loaded with herb cream cheese, premium smoked salmon, capers, and dill.',
    price: 65000, // ₹650.00
    image: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=500&auto=format&fit=crop&q=60',
    category: 'Mains',
    isAvailable: true,
    isVeg: false,
    attributes: {
      spicy: false,
      recommended: true
    }
  },
  {
    id: '4d54728b-b827-4638-b74c-4e1ea05f6e83',
    name: 'Pesto Burrata Pasta',
    description: 'Fresh fettuccine tossed in dynamic basil pesto, cherry tomatoes, topped with a whole creamy burrata ball.',
    price: 59000, // ₹590.00
    image: 'https://images.unsplash.com/photo-1621996346565-e3bb64e0be5e?w=500&auto=format&fit=crop&q=60',
    category: 'Mains',
    isAvailable: true,
    isVeg: true,
    attributes: {
      spicy: false,
      recommended: true
    }
  },
  {
    id: '5e54728b-b827-4638-b74c-4e1ea05f6e84',
    name: 'Matcha Tiramisu',
    description: 'Modern twist on classic tiramisu layered with matcha soaked ladyfingers and whipped mascarpone cream.',
    price: 32000, // ₹320.00
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=60',
    category: 'Desserts',
    isAvailable: true,
    isVeg: true,
    attributes: {
      spicy: false,
      recommended: false
    }
  },
  {
    id: '6f54728b-b827-4638-b74c-4e1ea05f6e85',
    name: 'Classic Cold Brew',
    description: '24-hour slow steeped specialty coffee beans served over clear ice cubes.',
    price: 22000, // ₹220.00
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60',
    category: 'Beverages',
    isAvailable: true,
    isVeg: true,
    attributes: {
      spicy: false,
      recommended: false
    }
  },
  {
    id: '7a54728b-b827-4638-b74c-4e1ea05f6e86',
    name: 'Hibiscus Elderflower Tonic',
    description: 'Vibrant pink cold brew hibiscus tea paired with premium tonic water and fresh mint.',
    price: 28000, // ₹280.00
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60',
    category: 'Beverages',
    isAvailable: true,
    isVeg: true,
    attributes: {
      spicy: false,
      recommended: true
    }
  }
];

export const mockCategories = ['All', 'Appetizers', 'Mains', 'Desserts', 'Beverages'];
