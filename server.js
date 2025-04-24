// server.js (in your project root)

const express       = require('express');
const basicAuth     = require('express-basic-auth');
const fs            = require('fs');
const path          = require('path');

const app   = express();
const PORT  = process.env.PORT || 3000;
const DB    = path.join(__dirname, 'orders.json');

// --- Middleware ---
app.use(express.json());

// protect admin routes & API with HTTP Basic Auth
app.use(['/api/orders', '/api/orders/:id/fulfill', '/admin.html', '/order.html'], basicAuth({
  users: { daromax: 'Azurion.01.-' },
  challenge: true
}));

// serve all static files (your HTML, CSS, JS, assets, etc.)
app.use(express.static(__dirname));

// --- Helpers to read/write orders.json ---
function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(DB));
  } catch {
    return [];
  }
}
function writeOrders(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// --- API Routes ---

// 1) Create a new order
app.post('/api/orders', (req, res) => {
  const orders   = readOrders();
  const newOrder = {
    id:         Date.now(),
    createdAt:  new Date().toISOString(),
    fulfilled:  false,
    ...req.body               // your checkout page should POST { items: [...], customer: {...}, ... }
  };
  orders.push(newOrder);
  writeOrders(orders);
  res.status(201).json(newOrder);
});

// 2) List all orders (admin only)
app.get('/api/orders', (req, res) => {
  res.json(readOrders());
});

// 3) Mark an order fulfilled (admin only)
app.post('/api/orders/:id/fulfill', (req, res) => {
  const orders = readOrders();
  const idx    = orders.findIndex(o => o.id === +req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Order not found' });
  orders[idx].fulfilled = true;
  writeOrders(orders);
  res.json(orders[idx]);
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
