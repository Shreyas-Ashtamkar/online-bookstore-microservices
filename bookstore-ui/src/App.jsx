import React, { useEffect, useMemo, useState, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";

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
  const [gw, setGw] = useState(DEFAULT_GATEWAY);
  useEffect(() => { setGw(DEFAULT_GATEWAY); }, []);
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="font-semibold text-xl tracking-tight">📚 Bookstore</Link>
          <nav className="ml-6 hidden md:flex gap-3 text-sm">
            <Link className="hover:underline" to="/">Catalog</Link>
            <Link className="hover:underline" to="/cart">Cart</Link>
            <Link className="hover:underline" to="/checkout">Checkout</Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link to="/cart" className="rounded-full px-3 py-1 bg-gray-100">🛒 {items.length} • {currency(total)}</Link>
            <button title="Config" onClick={() => setOpen(!open)} className="rounded-full px-3 py-1 border">⚙️</button>
          </div>
        </div>
        {open && (
          <div className="border-t bg-white">
            <div className="max-w-6xl mx-auto px-4 py-3 grid md:grid-cols-3 gap-3 items-center">
              <div className="col-span-2">
                <label className="text-xs font-medium">Gateway Base URL</label>
                <input value={gw} onChange={(e)=>setGw(e.target.value)} placeholder="http://localhost:8080" className="w-full mt-1 px-3 py-2 border rounded" />
              </div>
              <div className="flex gap-2 pt-6 md:pt-0">
                <button className="px-3 py-2 rounded bg-gray-100" onClick={()=>{ setGw(""); localStorage.setItem("GATEWAY_BASE", ""); }}>Use relative</button>
                <button className="px-3 py-2 rounded bg-black text-white" onClick={()=>{ localStorage.setItem("GATEWAY_BASE", gw); location.reload(); }}>Save & Reload</button>
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-gray-500">Demo UI • React Router • Minimal files</footer>
    </div>
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
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Catalog</h1>
          <p className="text-sm text-gray-500">Pick a book. Add to cart. Checkout. Payment may fail by design (circuit breaker demo).</p>
        </div>
        <StatusPill loading={loading} error={error} />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map((b) => (
          <div key={b.id} className="border rounded-2xl p-4 bg-white shadow-sm flex flex-col">
            <div className="flex-1">
              <div className="text-lg font-medium">{b.title}</div>
              <div className="mt-2 text-sm text-gray-500">Book ID: {b.id}</div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="font-semibold">{currency(b.price)}</div>
              <button onClick={() => add(b, 1)} className="px-3 py-2 rounded-xl bg-black text-white">Add</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CartPage() {
  const { items, setQty, remove, total } = useCart();
  const navigate = useNavigate();
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">Cart</h1>
      {items.length === 0 ? (
        <EmptyState title="Your cart is empty" action={<Link className="underline" to="/">Browse books</Link>} />
      ) : (
        <div className="grid gap-3">
          {items.map(({ book, qty }) => (
            <div key={book.id} className="border rounded-2xl p-4 bg-white flex items-center gap-4">
              <div className="flex-1">
                <div className="font-medium">{book.title}</div>
                <div className="text-xs text-gray-500">ID {book.id}</div>
              </div>
              <div className="text-sm">{currency(book.price)}</div>
              <input type="number" min={1} value={qty} onChange={(e)=>setQty(book.id, Number(e.target.value||1))} className="w-16 border rounded px-2 py-1" />
              <button onClick={()=>remove(book.id)} className="px-2 py-1 rounded border">Remove</button>
            </div>
          ))}
          <div className="flex items-center justify-between mt-2">
            <div className="text-lg font-semibold">Total: {currency(total)}</div>
            <button className="px-4 py-2 rounded-xl bg-black text-white" onClick={()=>navigate("/checkout")}>Proceed to Checkout</button>
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

  if (items.length === 0) return <EmptyState title="No items to checkout" action={<Link className="underline" to="/">Add some books</Link>} />;

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
      <div className="grid gap-3">
        <div className="border rounded-2xl p-4 bg-white">
          <div className="font-medium mb-2">Order Summary</div>
          <ul className="text-sm space-y-1">
            {items.map(({ book, qty }) => (
              <li key={book.id} className="flex justify-between"><span>{book.title} × {qty}</span><span>{currency(book.price * qty)}</span></li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between font-semibold">
            <span>Total</span><span>{currency(total)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={placing} onClick={placeOrder} className={cls("px-4 py-2 rounded-xl text-white", placing?"bg-gray-400":"bg-black")}>{placing?"Placing...":"Place Order & Pay"}</button>
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
        <div className="text-xs text-gray-500">Payment service may randomly fail (~30%). If it fails repeatedly, your backend Circuit Breaker should respond with a friendly message.</div>
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
    <section className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Payment {ok?"Successful":"Result"}</h1>
      <div className={cls("border rounded-2xl p-4", ok?"bg-green-50 border-green-200":"bg-red-50 border-red-200") }>
        <div className="text-sm">Order <span className="font-mono">#{orderId}</span></div>
        <div className="text-lg font-semibold mt-1">{ok?"Paid":"Not Paid"} • {currency(amount)}</div>
        {!ok && (
          <p className="text-sm text-gray-700 mt-2">{String(raw?.message || raw?.error || "Payment service temporarily unavailable (circuit open?)")}</p>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <Link className="px-4 py-2 rounded-xl bg-black text-white" to="/">Back to Catalog</Link>
        {!ok && <button onClick={handleTryAgain} className="px-4 py-2 rounded-xl border">Try Again</button>}
      </div>
      <details className="mt-6 text-xs text-gray-500">
        <summary>Raw response</summary>
        <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto">{JSON.stringify(raw ?? {}, null, 2)}</pre>
      </details>
    </section>
  );
}

function NotFound() {
  return <EmptyState title="Page not found" action={<Link className="underline" to="/">Home</Link>} />;
}

// --- Reusable bits ---
function StatusPill({ loading, error }) {
  if (loading) return <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-gray-100"><Pulse/> Loading…</span>;
  if (error) return <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">⚠️ {error}</span>;
  return <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">✅ Live</span>;
}

function EmptyState({ title, action }) {
  return (
    <div className="border rounded-2xl p-6 bg-white text-center">
      <div className="text-lg font-medium mb-2">{title}</div>
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
      <CartProvider>
        <Shell>
          <Routes>
            <Route path="/" element={<CatalogPage/>} />
            <Route path="/cart" element={<CartPage/>} />
            <Route path="/checkout" element={<CheckoutPage/>} />
            <Route path="/payment" element={<PaymentResultPage/>} />
            <Route path="*" element={<NotFound/>} />
          </Routes>
        </Shell>
      </CartProvider>
    </BrowserRouter>
  );
}
