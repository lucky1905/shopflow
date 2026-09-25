import type {
  Category,
  Product,
  ProductStatus,
  StockMovement,
  Supplier,
} from '../types';

/* -------------------------------------------------------------------------- */
/*  In-memory mock database for the inventory service.                        */
/*  Lives for the browser session; every service mutation updates it, so the  */
/*  UI behaves exactly like a real backend (filtering, pagination, history).  */
/* -------------------------------------------------------------------------- */

export const MOCK_LATENCY_MS = 420;

function iso(daysAgo: number, hour = 10, minute = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

interface MockDb {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  movements: StockMovement[];
}

/* -------------------------------------------------------------------------- */
/*  Categories                                                                */
/* -------------------------------------------------------------------------- */

const SEED_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Grocery', description: 'Staples, rice, oil, tea and coffee.', color: '#f59e0b', createdAt: iso(220), updatedAt: iso(12) },
  { id: 'cat_2', name: 'Beverages', description: 'Soft drinks, water, juices and mixes.', color: '#06b6d4', createdAt: iso(220), updatedAt: iso(9) },
  { id: 'cat_3', name: 'Dairy', description: 'Milk, yogurt, cheese and butter.', color: '#38bdf8', createdAt: iso(210), updatedAt: iso(21) },
  { id: 'cat_4', name: 'Bakery', description: 'Fresh bread and pastry, baked daily.', color: '#a78bfa', createdAt: iso(190), updatedAt: iso(4) },
  { id: 'cat_5', name: 'Snacks', description: 'Chocolate, crisps and impulse treats.', color: '#ec4899', createdAt: iso(180), updatedAt: iso(16) },
  { id: 'cat_6', name: 'Household', description: 'Cleaning, paper goods and laundry.', color: '#10b981', createdAt: iso(150), updatedAt: iso(30) },
  { id: 'cat_7', name: 'Personal Care', description: 'Toiletries and everyday essentials.', color: '#6366f1', createdAt: iso(140), updatedAt: iso(40) },
  { id: 'cat_8', name: 'Produce', description: 'Fresh fruit and vegetables.', color: '#84cc16', createdAt: iso(120), updatedAt: iso(2) },
];

/* -------------------------------------------------------------------------- */
/*  Suppliers                                                                 */
/* -------------------------------------------------------------------------- */

const SEED_SUPPLIERS: Supplier[] = [
  { id: 'sup_1', name: 'FreshLine Foods', contactName: 'Aisha Bello', email: 'orders@freshline.co', phone: '+1 (555) 014-2210', address: '88 Harbor Rd, Springfield', leadTimeDays: 2, status: 'active', notes: 'Deliveries every Mon / Thu before 9 AM.', createdAt: iso(200), updatedAt: iso(6) },
  { id: 'sup_2', name: 'GrainHub Co.', contactName: 'Marcus Lee', email: 'sales@grainhub.com', phone: '+1 (555) 093-7781', address: 'Unit 12, Mill District', leadTimeDays: 4, status: 'active', notes: 'Bulk pricing kicks in at 20 cases.', createdAt: iso(195), updatedAt: iso(14) },
  { id: 'sup_3', name: 'DailyDairy', contactName: 'Priya Nair', email: 'hello@dailydairy.io', phone: '+1 (555) 011-4432', address: '42 Pasture Lane', leadTimeDays: 1, status: 'active', notes: 'Cold chain - check truck temp on arrival.', createdAt: iso(190), updatedAt: iso(3) },
  { id: 'sup_4', name: 'BevServe', contactName: 'Tomas Nowak', email: 'po@bevserve.net', phone: '+1 (555) 077-1904', address: '9 Bottling Way', leadTimeDays: 3, status: 'active', notes: '', createdAt: iso(170), updatedAt: iso(25) },
  { id: 'sup_5', name: 'PackWell Industries', contactName: 'Elena Petrova', email: 'elena@packwell.co', phone: '+1 (555) 060-8822', address: '230 Industrial Pkwy', leadTimeDays: 6, status: 'active', notes: 'Also supplies bakery packaging.', createdAt: iso(160), updatedAt: iso(33) },
  { id: 'sup_6', name: 'Lumen Supplies', contactName: 'David Osei', email: 'david@lumensupplies.com', phone: '+1 (555) 021-5511', address: '17 Crest Avenue', leadTimeDays: 5, status: 'inactive', notes: 'Paused - switching household range to PackWell.', createdAt: iso(150), updatedAt: iso(48) },
];

/* -------------------------------------------------------------------------- */
/*  Products                                                                  */
/* -------------------------------------------------------------------------- */

interface ProductSeed {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  supplierId: string | null;
  price: number;
  cost: number;
  stock: number;
  reorderPoint: number;
  unit: string;
  description: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  createdDaysAgo?: number;
}

const SEED_PRODUCT_ROWS: ProductSeed[] = [
  { id: 'prd_01', name: 'Sunflower Oil 1L', sku: 'GRO-101', barcode: '4006381333931', categoryId: 'cat_1', supplierId: 'sup_1', price: 12.99, cost: 8.4, stock: 34, reorderPoint: 60, unit: 'pc', description: 'Refined sunflower oil, 1 litre bottle.', isFeatured: true, createdDaysAgo: 90 },
  { id: 'prd_02', name: 'Basmati Rice 5kg', sku: 'GRO-214', barcode: '5011026123457', categoryId: 'cat_1', supplierId: 'sup_2', price: 18.5, cost: 13.1, stock: 142, reorderPoint: 80, unit: 'pack', description: 'Aged long-grain basmati, 5 kg sack.', isFeatured: true, createdDaysAgo: 88 },
  { id: 'prd_03', name: 'Whole Milk 1L', sku: 'DAI-322', barcode: '4400103210199', categoryId: 'cat_3', supplierId: 'sup_3', price: 2.49, cost: 1.6, stock: 96, reorderPoint: 120, unit: 'pc', description: 'Fresh pasteurised whole milk.', createdDaysAgo: 85 },
  { id: 'prd_04', name: 'Cola Classic 2L', sku: 'BEV-108', barcode: '5449000000996', categoryId: 'cat_2', supplierId: 'sup_4', price: 3.99, cost: 2.1, stock: 0, reorderPoint: 60, unit: 'pc', description: 'Classic cola flavour, 2 litre bottle.', createdDaysAgo: 84 },
  { id: 'prd_05', name: 'Sparkling Water 6x330ml', sku: 'BEV-155', barcode: '5012345678900', categoryId: 'cat_2', supplierId: 'sup_4', price: 5.49, cost: 3.2, stock: 210, reorderPoint: 80, unit: 'pack', description: 'Lightly carbonated spring water multipack.', createdDaysAgo: 82 },
  { id: 'prd_06', name: 'Sourdough Loaf', sku: 'BAK-401', barcode: '2000000012345', categoryId: 'cat_4', supplierId: 'sup_5', price: 4.25, cost: 2.05, stock: 18, reorderPoint: 24, unit: 'pc', description: 'Slow-fermented country sourdough.', createdDaysAgo: 80 },
  { id: 'prd_07', name: 'Croissant 4-pack', sku: 'BAK-408', barcode: '2000000043210', categoryId: 'cat_4', supplierId: 'sup_5', price: 5.99, cost: 3.3, stock: 52, reorderPoint: 30, unit: 'pack', description: 'All-butter croissants, 4 per pack.', createdDaysAgo: 78 },
  { id: 'prd_08', name: 'Dark Chocolate 90g', sku: 'SNK-701', barcode: '7622300101234', categoryId: 'cat_5', supplierId: 'sup_5', price: 2.99, cost: 1.45, stock: 164, reorderPoint: 70, unit: 'pc', description: '70% cocoa dark chocolate bar.', isFeatured: true, createdDaysAgo: 76 },
  { id: 'prd_09', name: 'Salted Pretzels 150g', sku: 'SNK-714', barcode: '7622300456789', categoryId: 'cat_5', supplierId: 'sup_5', price: 1.99, cost: 0.95, stock: 0, reorderPoint: 50, unit: 'pc', description: 'Crunchy oven-baked salted pretzels.', createdDaysAgo: 74 },
  { id: 'prd_10', name: 'Paper Bags M (50pk)', sku: 'HSE-903', barcode: '5901234123457', categoryId: 'cat_6', supplierId: 'sup_5', price: 6.99, cost: 4.1, stock: 380, reorderPoint: 200, unit: 'pack', description: 'Kraft paper bags, medium, 50 per pack.', createdDaysAgo: 72 },
  { id: 'prd_11', name: 'Dish Soap 750ml', sku: 'HSE-911', barcode: '3059943012345', categoryId: 'cat_6', supplierId: 'sup_6', price: 2.89, cost: 1.55, stock: 88, reorderPoint: 60, unit: 'pc', description: 'Lemon dishwashing liquid.', createdDaysAgo: 70 },
  { id: 'prd_12', name: 'Laundry Pods 30ct', sku: 'HSE-927', barcode: '3059943098761', categoryId: 'cat_6', supplierId: 'sup_6', price: 11.99, cost: 7.4, stock: 39, reorderPoint: 40, unit: 'box', description: '3-in-1 laundry detergent capsules.', createdDaysAgo: 68 },
  { id: 'prd_13', name: 'Toothpaste 100ml', sku: 'PCN-601', barcode: '4005808801245', categoryId: 'cat_7', supplierId: 'sup_6', price: 3.49, cost: 1.8, stock: 75, reorderPoint: 50, unit: 'pc', description: 'Fluoride toothpaste, mint.', createdDaysAgo: 66 },
  { id: 'prd_14', name: 'Shampoo 400ml', sku: 'PCN-615', barcode: '4005808856789', categoryId: 'cat_7', supplierId: 'sup_6', price: 6.99, cost: 3.9, stock: 63, reorderPoint: 45, unit: 'pc', description: 'Daily care shampoo, all hair types.', createdDaysAgo: 64 },
  { id: 'prd_15', name: 'Green Tea 25 bags', sku: 'GRO-233', barcode: '5012345987654', categoryId: 'cat_1', supplierId: 'sup_1', price: 4.49, cost: 2.6, stock: 120, reorderPoint: 60, unit: 'box', description: 'Sencha green tea, 25 enveloped bags.', isFeatured: true, createdDaysAgo: 60 },
  { id: 'prd_16', name: 'Instant Coffee 200g', sku: 'GRO-248', barcode: '5012345098761', categoryId: 'cat_1', supplierId: 'sup_1', price: 8.99, cost: 5.3, stock: 26, reorderPoint: 40, unit: 'pc', description: 'Freeze-dried 100% arabica instant coffee.', createdDaysAgo: 58 },
  { id: 'prd_17', name: 'Orange Juice 1L', sku: 'BEV-162', barcode: '5449000133459', categoryId: 'cat_2', supplierId: 'sup_4', price: 3.29, cost: 2.0, stock: 140, reorderPoint: 70, unit: 'pc', description: 'Not-from-concentrate orange juice.', createdDaysAgo: 55 },
  { id: 'prd_18', name: 'Greek Yogurt 500g', sku: 'DAI-336', barcode: '4400103320194', categoryId: 'cat_3', supplierId: 'sup_3', price: 4.79, cost: 2.85, stock: 58, reorderPoint: 50, unit: 'pc', description: 'Strained Greek-style yogurt.', createdDaysAgo: 52 },
  { id: 'prd_19', name: 'Cheddar Block 250g', sku: 'DAI-344', barcode: '4400103450192', categoryId: 'cat_3', supplierId: 'sup_3', price: 5.49, cost: 3.2, stock: 0, reorderPoint: 40, unit: 'pc', description: 'Mature cheddar cheese block.', createdDaysAgo: 50 },
  { id: 'prd_20', name: 'Banana Bunch 1kg', sku: 'PRD-801', barcode: '2000000089012', categoryId: 'cat_8', supplierId: 'sup_1', price: 1.99, cost: 1.1, stock: 64, reorderPoint: 40, unit: 'kg', description: 'Fairtrade bananas, ~1 kg bunch.', createdDaysAgo: 46 },
  { id: 'prd_21', name: 'Cherry Tomatoes 500g', sku: 'PRD-814', barcode: '2000000090121', categoryId: 'cat_8', supplierId: 'sup_1', price: 2.79, cost: 1.6, stock: 37, reorderPoint: 30, unit: 'pack', description: 'Vine-ripened cherry tomatoes.', createdDaysAgo: 44 },
  { id: 'prd_22', name: 'Avocado 2-pack', sku: 'PRD-820', barcode: '2000000091230', categoryId: 'cat_8', supplierId: 'sup_1', price: 4.49, cost: 2.7, stock: 29, reorderPoint: 25, unit: 'pack', description: 'Ready-to-eat hass avocados.', createdDaysAgo: 42 },
  { id: 'prd_23', name: 'Paper Towels 6-roll', sku: 'HSE-935', barcode: '5901234098761', categoryId: 'cat_6', supplierId: 'sup_5', price: 9.49, cost: 6.2, stock: 110, reorderPoint: 60, unit: 'pack', description: 'Double-layer kitchen towels.', status: 'draft', createdDaysAgo: 30 },
  { id: 'prd_24', name: 'Floor Cleaner 1L', sku: 'HSE-942', barcode: '3059943123459', categoryId: 'cat_6', supplierId: 'sup_6', price: 4.99, cost: 2.9, stock: 72, reorderPoint: 50, unit: 'pc', description: 'Pine floor cleaner concentrate.', status: 'archived', createdDaysAgo: 25 },
];

/* -------------------------------------------------------------------------- */
/*  Movement seeds                                                            */
/* -------------------------------------------------------------------------- */

interface MovementSeed {
  productId: string;
  type: StockMovement['type'];
  delta: number;
  reason: string;
  reference: string;
  note: string;
  user: string;
  daysAgo: number;
  hour?: number;
}

const SEED_MOVEMENTS: MovementSeed[] = [
  { productId: 'prd_01', type: 'out', delta: -18, reason: 'Sale', reference: 'SALE-8841', note: 'Weekend rush', user: 'Sam Rivera', daysAgo: 0, hour: 9 },
  { productId: 'prd_02', type: 'out', delta: -6, reason: 'Sale', reference: 'SALE-8839', note: '', user: 'Sam Rivera', daysAgo: 0, hour: 10 },
  { productId: 'prd_03', type: 'in', delta: 40, reason: 'Purchase received', reference: 'PO-2093', note: 'DailyDairy run', user: 'Priya Patel', daysAgo: 0, hour: 8 },
  { productId: 'prd_08', type: 'out', delta: -12, reason: 'Sale', reference: 'SALE-8836', note: '', user: 'Alex Morgan', daysAgo: 1, hour: 17 },
  { productId: 'prd_06', type: 'adjust', delta: -2, reason: 'Damaged / expired', reference: '', note: 'Crushed during shelf restock', user: 'Priya Patel', daysAgo: 1, hour: 14 },
  { productId: 'prd_01', type: 'in', delta: 72, reason: 'Purchase received', reference: 'PO-2091', note: 'FreshLine Foods', user: 'Alex Morgan', daysAgo: 2, hour: 11 },
  { productId: 'prd_16', type: 'out', delta: -8, reason: 'Sale', reference: 'SALE-8821', note: '', user: 'Sam Rivera', daysAgo: 2, hour: 15 },
  { productId: 'prd_04', type: 'out', delta: -24, reason: 'Sale', reference: 'SALE-8818', note: 'Sold out - promo', user: 'Sam Rivera', daysAgo: 3, hour: 18 },
  { productId: 'prd_19', type: 'out', delta: -9, reason: 'Sale', reference: 'SALE-8810', note: '', user: 'Priya Patel', daysAgo: 3, hour: 12 },
  { productId: 'prd_09', type: 'adjust', delta: -4, reason: 'Stock count correction', reference: 'AUDIT-03', note: 'Quarterly count', user: 'Alex Morgan', daysAgo: 4, hour: 16 },
  { productId: 'prd_05', type: 'in', delta: 60, reason: 'Purchase received', reference: 'PO-2088', note: 'BevServe', user: 'Priya Patel', daysAgo: 5, hour: 10 },
  { productId: 'prd_12', type: 'out', delta: -11, reason: 'Sale', reference: 'SALE-8802', note: '', user: 'Sam Rivera', daysAgo: 5, hour: 13 },
  { productId: 'prd_02', type: 'in', delta: 100, reason: 'Purchase received', reference: 'PO-2085', note: 'GrainHub Co.', user: 'Alex Morgan', daysAgo: 6, hour: 9 },
  { productId: 'prd_17', type: 'out', delta: -16, reason: 'Sale', reference: 'SALE-8795', note: '', user: 'Priya Patel', daysAgo: 7, hour: 12 },
  { productId: 'prd_20', type: 'in', delta: 30, reason: 'Purchase received', reference: 'PO-2083', note: '', user: 'Alex Morgan', daysAgo: 8, hour: 8 },
  { productId: 'prd_11', type: 'adjust', delta: 6, reason: 'Stock count correction', reference: 'AUDIT-02', note: 'Found unopened case', user: 'Priya Patel', daysAgo: 9, hour: 15 },
  { productId: 'prd_15', type: 'out', delta: -14, reason: 'Sale', reference: 'SALE-8784', note: '', user: 'Sam Rivera', daysAgo: 10, hour: 11 },
  { productId: 'prd_14', type: 'out', delta: -7, reason: 'Sale', reference: 'SALE-8776', note: '', user: 'Sam Rivera', daysAgo: 11, hour: 14 },
  { productId: 'prd_18', type: 'in', delta: 36, reason: 'Purchase received', reference: 'PO-2079', note: 'DailyDairy', user: 'Priya Patel', daysAgo: 12, hour: 9 },
  { productId: 'prd_07', type: 'out', delta: -20, reason: 'Sale', reference: 'SALE-8769', note: '', user: 'Alex Morgan', daysAgo: 13, hour: 17 },
  { productId: 'prd_13', type: 'in', delta: 24, reason: 'Purchase received', reference: 'PO-2076', note: '', user: 'Alex Morgan', daysAgo: 14, hour: 10 },
];

/* -------------------------------------------------------------------------- */
/*  Database assembly                                                         */
/* -------------------------------------------------------------------------- */

function randomMinute(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 60;
  }
  return hash;
}

function buildDb(): MockDb {
  const now = Date.now();

  const products: Product[] = SEED_PRODUCT_ROWS.map((row) => {
    const created = new Date(now - (row.createdDaysAgo ?? 30) * 86_400_000);
    const updated = new Date(now - Math.min((row.createdDaysAgo ?? 30) / 4, 9) * 86_400_000);
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      sku: row.sku,
      barcode: row.barcode,
      categoryId: row.categoryId,
      supplierId: row.supplierId,
      price: row.price,
      cost: row.cost,
      stock: row.stock,
      reorderPoint: row.reorderPoint,
      unit: row.unit,
      status: row.status ?? 'active',
      imageUrl: null,
      isFeatured: row.isFeatured ?? false,
      createdAt: created.toISOString(),
      updatedAt: updated.toISOString(),
    };
  });

  const categories = SEED_CATEGORIES.map((category) => ({ ...category }));
  const suppliers = SEED_SUPPLIERS.map((supplier) => ({ ...supplier }));
  const movements: StockMovement[] = [];

  // Opening movement for every product (same timestamp as its creation).
  for (const product of products) {
    movements.push({
      id: `mov_${product.id}_open`,
      productId: product.id,
      type: 'opening',
      delta: 60,
      previousStock: 0,
      newStock: 60,
      reason: 'Opening stock',
      reference: 'INIT-LOAD',
      note: 'Initial catalog import',
      user: 'Alex Morgan',
      createdAt: product.createdAt,
    });
  }

  // Replay seed history oldest -> newest with running balances.
  const runningStock = new Map(products.map((product) => [product.id, 60]));
  const sortedSeeds = [...SEED_MOVEMENTS].sort((a, b) => a.daysAgo - b.daysAgo);

  for (const seed of sortedSeeds) {
    const previousStock = runningStock.get(seed.productId) ?? 0;
    const newStock = Math.max(0, previousStock + seed.delta);
    runningStock.set(seed.productId, newStock);

    const date = new Date(now - seed.daysAgo * 86_400_000);
    date.setHours(seed.hour ?? 12, randomMinute(seed.productId), 0, 0);

    movements.push({
      id: `mov_${seed.productId}_${seed.daysAgo}_${seed.hour ?? 12}`,
      productId: seed.productId,
      type: seed.type,
      delta: seed.delta,
      previousStock,
      newStock,
      reason: seed.reason,
      reference: seed.reference,
      note: seed.note,
      user: seed.user,
      createdAt: date.toISOString(),
    });
  }

  return { products, categories, suppliers, movements };
}

/** Session-scoped singleton - survives route changes, resets on reload. */
export const mockDb: MockDb = buildDb();
