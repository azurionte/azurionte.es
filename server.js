// server.js

const express    = require('express');
const session    = require('express-session');
const bcrypt     = require('bcrypt');
const fs         = require('fs');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB   = path.join(__dirname, 'orders.json');

// — Admin credentials —
const ADMIN_USER      = 'daromax';
// Hashed version of 'Azurion.01.-'
const ADMIN_PASS_HASH = bcrypt.hashSync('Azurion.01.-', 10);

// — Middleware —
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'replace-this-with-a-secure-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }  // set to true if HTTPS-only
}));

// Serve all static files (HTML, CSS, JS, assets)
app.use(express.static(__dirname));

// — Auth guard for admin pages & protected API —
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.redirect('/login.html');
}

// — Login / Logout —
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (
    username === ADMIN_USER &&
    bcrypt.compareSync(password, ADMIN_PASS_HASH)
  ) {
    req.session.authenticated = true;
    return res.redirect('/admin.html');
  }
  res.redirect('/login.html?error=1');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

// — Helpers to read/write orders.json —
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

// — Public API route to create orders —
app.post('/api/orders', (req, res) => {
  const orders   = readOrders();
  const newOrder = {
    id:        Date.now(),
    createdAt: new Date().toISOString(),
    fulfilled: false,
    ...req.body        // expects { items: [...], customer: {...}, etc. }
  };
  orders.push(newOrder);
  writeOrders(orders);
  res.status(201).json(newOrder);
});

// — Protected API routes (admin only) —
app.get('/api/orders', requireAuth, (req, res) => {
  res.json(readOrders());
});

app.post('/api/orders/:id/fulfill', requireAuth, (req, res) => {
  const orders = readOrders();
  const idx    = orders.findIndex(o => o.id === +req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Order not found' });
  orders[idx].fulfilled = true;
  writeOrders(orders);
  res.json(orders[idx]);
});

// — Protect admin HTML pages —
app.get('/admin.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});
app.get('/order.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'order.html'));
});

// — Start the server —
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
