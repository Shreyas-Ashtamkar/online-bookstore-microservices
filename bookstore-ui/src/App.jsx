import React, { useEffect, useMemo, useState, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";

// --- Theme Context ---
const ThemeContext = createContext(null);
const useTheme = () => useContext(ThemeContext);

function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// --- Simple config ---
const DEFAULT_GATEWAY = localStorage.getItem("GATEWAY_BASE") || ""; // e.g., "http://localhost:8080"
const API = {
  books: () => `${DEFAULT_GATEWAY}/catalog/books`,
  order: () => `${DEFAULT_GATEWAY}/orders`,
  pay: () => `${DEFAULT_GATEWAY}/payments`,
};

// --- Utilities ---
const currency = (n) => (n ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
const cls = (...xs) => xs.filter(Boolean).join(" ");

// --- Cart Context ---
const CartCtx = createContext(null);
const useCart = () => useContext(CartCtx);

function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("CART") || "[]"); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem("CART", JSON.stringify(items)); }, [items]);

  const add = (book, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((p) => p.book.id === book.id);
      if (i >= 0) { const next = [...prev]; next[i] = { ...next[i], qty: next[i].qty + qty }; return next; }
      return [...prev, { book, qty }];
    });
  };
  const setQty = (id, qty) => setItems((prev) => prev.map((it) => it.book.id === id ? { ...it, qty } : it));
  const remove = (id) => setItems((prev) => prev.filter((it) => it.book.id !== id));
  const clear = () => setItems([]);
  const total = useMemo(() => items.reduce((s, { book, qty }) => s + book.price * qty, 0), [items]);

  return (
    <CartCtx.Provider value={{ items, add, setQty, remove, clear, total }}>
      {children}
    </CartCtx.Provider>
  );
}

// --- Layout ---
function Shell({ children }) {
  const { items, total } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const [gw, setGw] = useState(DEFAULT_GATEWAY);
  useEffect(() => { setGw(DEFAULT_GATEWAY); }, []);
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📚 BookStore
          </Link>
          <nav className="ml-6 hidden md:flex gap-1">
            <NavLink to="/">Catalog</NavLink>
            <NavLink to="/cart">Cart</NavLink>
            <NavLink to="/orders">Orders</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link 
              to="/cart" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              🛒 <span className="font-semibold">{items.length}</span> • <span className="text-sm">{currency(total)}</span>
            </Link>
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button 
              title="Config" 
              onClick={() => setOpen(!open)} 
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              ⚙️
            </button>
          </div>
        </div>
        {open && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="max-w-6xl mx-auto px-4 py-4 grid md:grid-cols-3 gap-4 items-center">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Gateway Base URL</label>
                <input 
                  value={gw} 
                  onChange={(e)=>setGw(e.target.value)} 
                  placeholder="http://localhost:8080" 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                />
              </div>
              <div className="flex gap-2 pt-6 md:pt-0">
                <button 
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" 
                  onClick={()=>{ setGw(""); localStorage.setItem("GATEWAY_BASE", ""); }}
                >
                  Use relative
                </button>
                <button 
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors" 
                  onClick={()=>{ localStorage.setItem("GATEWAY_BASE", gw); location.reload(); }}
                >
                  Save & Reload
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      <footer className="border-t border-gray-200 dark:border-gray-700 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
        📚 BookStore Demo • Microservices Architecture • React + Tailwind
      </footer>
    </div>
  );
}

// --- Components ---
function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={cls(
        "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive 
          ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" 
          : "hover:bg-gray-100 dark:hover:bg-gray-700"
      )}
    >
      {children}
    </Link>
  );
}

// --- Pages ---
function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersRes, paymentsRes] = await Promise.all([
          fetch(API.order()).then(r => r.ok ? r.json() : []),
          fetch(API.pay()).then(r => r.ok ? r.json() : [])
        ]);
        setOrders(Array.isArray(ordersRes) ? ordersRes : []);
        setPayments(Array.isArray(paymentsRes) ? paymentsRes : []);
        setError("");
      } catch (e) {
        setError("Failed to load order history");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Order History</h1>
        <p className="text-gray-600 dark:text-gray-400">Track your past orders and payments</p>
      </div>

      <div className="flex gap-1 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('orders')}
          className={cls(
            "px-4 py-2 rounded-md font-medium transition-colors",
            activeTab === 'orders'
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={cls(
            "px-4 py-2 rounded-md font-medium transition-colors",
            activeTab === 'payments'
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          Payments ({payments.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-1/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      ) : (
        <div>
          {activeTab === 'orders' ? (
            orders.length === 0 ? (
              <EmptyState title="No orders yet" subtitle="Your order history will appear here" />
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-xl text-green-600 dark:text-green-400">{currency(order.total)}</p>
                      </div>
                    </div>
                    {order.items && (
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>Book ID: {item.bookId} × {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            payments.length === 0 ? (
              <EmptyState title="No payments yet" subtitle="Your payment history will appear here" />
            ) : (
              <div className="space-y-4">
                {payments.map((payment, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">Payment for Order #{payment.orderId}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(payment.datetime).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-xl text-green-600 dark:text-green-400">{currency(payment.amount)}</p>
                        <p className="text-sm text-green-600 dark:text-green-400">✅ Paid</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}

// --- Pages ---
function CatalogPage() {
  const { add } = useCart();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(API.books())
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!mounted) return;
        const normalized = (Array.isArray(data) ? data : data.books || []).map((b, i) => ({
          id: b.id ?? b.bookID ?? b.bookId ?? i+1,
          title: b.title ?? "Untitled",
          price: Number(b.price ?? 0),
        }));
        setBooks(normalized);
        setError("");
      })
      .catch(() => {
        // Fallback mock data for quick demo
        setBooks([
          { id: 1, title: "Gödel, Escher, Bach", price: 39.5 },
          { id: 2, title: "The Pragmatic Programmer", price: 29.0 },
          { id: 3, title: "Clean Architecture", price: 33.25 },
        ]);
        setError("Live catalog unreachable – showing mock data.");
      })
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <section>
      <div className="flex items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Book Catalog</h1>
          <p className="text-gray-600 dark:text-gray-400">Discover your next great read. Add books to your cart and enjoy our seamless checkout experience.</p>
        </div>
        <StatusPill loading={loading} error={error} />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-2/3"></div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((b) => (
            <div key={b.id} className="group border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <div className="flex-1">
                <div className="text-lg font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{b.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">ID: {b.id}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">{currency(b.price)}</div>
                <button 
                  onClick={() => add(b, 1)} 
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors transform hover:scale-105 active:scale-95"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <span className="text-yellow-500">⚠️</span>
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Showing Demo Data</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CartPage() {
  const { items, setQty, remove, total } = useCart();
  const navigate = useNavigate();
  return (
    <section>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {items.length === 0 ? 'Your cart is empty' : `${items.length} item${items.length > 1 ? 's' : ''} in your cart`}
        </p>
      </div>
      
      {items.length === 0 ? (
        <EmptyState 
          title="Your cart is empty" 
          subtitle="Start by adding some books to your cart"
          action={
            <Link 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors" 
              to="/"
            >
              📚 Browse Books
            </Link>
          } 
        />
      ) : (
        <div className="grid gap-4">
          <div className="space-y-4">
            {items.map(({ book, qty }) => (
              <div key={book.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800 flex items-center gap-6">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{book.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Book ID: {book.id}</p>
                  <p className="text-lg font-medium text-green-600 dark:text-green-400 mt-2">{currency(book.price)} each</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Qty:</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={99}
                      value={qty} 
                      onChange={(e)=>setQty(book.id, Number(e.target.value||1))} 
                      className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Subtotal</p>
                    <p className="font-semibold text-lg">{currency(book.price * qty)}</p>
                  </div>
                  <button 
                    onClick={()=>remove(book.id)} 
                    className="px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                    title="Remove from cart"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xl font-semibold">Total:</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">{currency(total)}</span>
              </div>
              <button 
                className="w-full px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition-colors transform hover:scale-[1.02] active:scale-[0.98]" 
                onClick={()=>navigate("/checkout")}
              >
                Proceed to Checkout →
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [err, setErr] = useState("");

  const payload = useMemo(() => ({
    items: items.map(({ book, qty }) => ({ bookId: book.id, quantity: qty })),
  }), [items]);

  const placeOrder = async () => {
    setPlacing(true); setErr("");
    try {
      const r = await fetch(API.order(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error(`Order failed: HTTP ${r.status}`);
      const data = await r.json();
      const orderId = data.orderId ?? data.id ?? Math.floor(Math.random()*1e6);
      const amount = data.total ?? total;
      // immediately attempt payment
      const p = await fetch(API.pay(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, amount }) });
      const pjs = await p.json().catch(()=>({ status: "failed" }));
      const status = p.ok ? (pjs.status ?? "success") : "failed";
      const paymentSuccess = /success|paid|approved/i.test(status || "");
      if (paymentSuccess) {
        clear();
      }
      navigate("/payment", { state: { orderId, amount, status, raw: pjs, cartItems: paymentSuccess ? null : items } });
    } catch (e) {
      setErr(String(e.message || e));
    } finally { setPlacing(false); }
  };

  if (items.length === 0) return (
    <EmptyState 
      title="No items to checkout" 
      subtitle="Add some books to your cart first"
      action={<Link className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors" to="/">📚 Browse Books</Link>} 
    />
  );

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-gray-600 dark:text-gray-400">Review your order and complete your purchase</p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800">
            <h2 className="font-semibold text-xl mb-4">Order Summary</h2>
            <div className="space-y-3">
              {items.map(({ book, qty }) => (
                <div key={book.id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex-1">
                    <h3 className="font-medium">{book.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quantity: {qty} × {currency(book.price)}</p>
                  </div>
                  <div className="font-semibold">{currency(book.price * qty)}</div>
                </div>
              ))}
              <div className="pt-3 flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span className="text-green-600 dark:text-green-400">{currency(total)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800">
            <h2 className="font-semibold text-xl mb-4">Payment</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <span className="text-blue-500">ℹ️</span>
                  <div>
                    <h3 className="font-medium text-blue-800 dark:text-blue-200">Demo Payment Service</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      This is a demo. The payment service has a 30% failure rate to demonstrate circuit breaker functionality.
                    </p>
                  </div>
                </div>
              </div>
              
              <button 
                disabled={placing} 
                onClick={placeOrder} 
                className={cls(
                  "w-full px-6 py-3 rounded-lg font-semibold text-lg transition-all transform",
                  placing
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {placing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Pulse /> Processing...
                  </span>
                ) : (
                  "Place Order & Pay Now"
                )}
              </button>
              
              {err && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-red-500">❌</span>
                    <p className="text-sm text-red-700 dark:text-red-300">{err}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PaymentResultPage() {
  const { state } = useLocation();
  const nav = useNavigate();
  const { add, clear } = useCart();
  if (!state) return <EmptyState title="No payment info" action={<Link className="underline" to="/">Go to catalog</Link>} />;
  const { orderId, amount, status, raw, cartItems } = state;
  const ok = /success|paid|approved/i.test(status || "");

  const handleTryAgain = () => {
    if (cartItems && cartItems.length > 0) {
      clear(); // Clear current cart first
      cartItems.forEach(({ book, qty }) => add(book, qty)); // Restore items
    }
    nav("/checkout");
  };

  return (
    <section className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className={cls("inline-flex items-center justify-center w-16 h-16 rounded-full mb-4", ok ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30")}>
          <span className="text-2xl">{ok ? "✅" : "❌"}</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Payment {ok ? "Successful" : "Failed"}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {ok ? "Thank you for your purchase!" : "We couldn't process your payment"}
        </p>
      </div>
      
      <div className={cls(
        "border rounded-xl p-6 mb-6",
        ok 
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
      )}>
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Order <span className="font-mono font-semibold">#{orderId}</span>
          </div>
          <div className="text-2xl font-bold mb-2">{currency(amount)}</div>
          <div className={cls(
            "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
            ok
              ? "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
              : "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200"
          )}>
            {ok ? "✅ Payment Completed" : "❌ Payment Failed"}
          </div>
          
          {!ok && raw?.message && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                {String(raw.message || raw.error || "Payment service temporarily unavailable")}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link 
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-center transition-colors" 
          to="/"
        >
          Continue Shopping
        </Link>
        {!ok && (
          <button 
            onClick={handleTryAgain} 
            className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
          >
            Try Again
          </button>
        )}
        <Link 
          className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-center transition-colors" 
          to="/orders"
        >
          View Orders
        </Link>
      </div>
      
      {raw && (
        <details className="mt-8 text-xs">
          <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">View Technical Details</summary>
          <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-auto text-gray-800 dark:text-gray-200">
            {JSON.stringify(raw ?? {}, null, 2)}
          </pre>
        </details>
      )}
    </section>
  );
}

function NotFound() {
  return <EmptyState title="Page not found" action={<Link className="underline" to="/">Home</Link>} />;
}

// --- Reusable bits ---
function StatusPill({ loading, error }) {
  if (loading) return (
    <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
      <Pulse/> Loading…
    </span>
  );
  if (error) return (
    <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
      ⚠️ Offline
    </span>
  );
  return (
    <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
      ✅ Live
    </span>
  );
}

function EmptyState({ title, subtitle, action }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-8 bg-white dark:bg-gray-800 text-center">
      <div className="text-6xl mb-4">📚</div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {subtitle && <p className="text-gray-600 dark:text-gray-400 mb-4">{subtitle}</p>}
      <div>{action}</div>
    </div>
  );
}

function Pulse(){
  return <span className="inline-block w-2 h-2 rounded-full bg-gray-400 animate-pulse" />;
}

// --- App ---
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <CartProvider>
          <Shell>
            <Routes>
              <Route path="/" element={<CatalogPage/>} />
              <Route path="/cart" element={<CartPage/>} />
              <Route path="/checkout" element={<CheckoutPage/>} />
              <Route path="/payment" element={<PaymentResultPage/>} />
              <Route path="/orders" element={<OrdersPage/>} />
              <Route path="*" element={<NotFound/>} />
            </Routes>
          </Shell>
        </CartProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
