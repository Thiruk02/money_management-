import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_CATEGORIES = [
  { id: "petrol", label: "Petrol", icon: "ti-gas-station", color: "#E85D04", bg: "#FFF3E0" },
  { id: "grocery", label: "Grocery", icon: "ti-shopping-cart", color: "#2E7D32", bg: "#E8F5E9" },
  { id: "recharge", label: "Recharge", icon: "ti-device-mobile", color: "#1565C0", bg: "#E3F2FD" },
  { id: "snacks", label: "Snacks", icon: "ti-cookie", color: "#6A1B9A", bg: "#F3E5F5" },
];

const CUSTOM_PALETTE = [
  { color: "#C62828", bg: "#FFEBEE" },
  { color: "#AD1457", bg: "#FCE4EC" },
  { color: "#4527A0", bg: "#EDE7F6" },
  { color: "#00695C", bg: "#E0F2F1" },
  { color: "#EF6C00", bg: "#FFF3E0" },
  { color: "#37474F", bg: "#ECEFF1" },
  { color: "#558B2F", bg: "#F1F8E9" },
  { color: "#283593", bg: "#E8EAF6" },
];

const GOOGLE_CLIENT_ID = "";

const USER_KEY = "moneymanager_user";

function storageKey(email) {
  return `moneymanager_v1_${email}`;
}

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return null;
}

function saveUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

function loadData(email) {
  try {
    const raw = localStorage.getItem(storageKey(email));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        balance: parsed.balance ?? 0,
        transactions: parsed.transactions ?? [],
        customCategories: parsed.customCategories ?? [],
      };
    }
  } catch {
    /* ignore */
  }
  return { balance: 0, transactions: [], customCategories: [] };
}

function saveData(email, data) {
  try {
    localStorage.setItem(storageKey(email), JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function parseJwt(token) {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(base64));
}

function fmt(n) {
  return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}

function allCategories(customCategories) {
  return [...DEFAULT_CATEGORIES, ...customCategories];
}

function findCategory(categories, id) {
  return categories.find((c) => c.id === id) || { icon: "ti-tag", color: "#555", bg: "#F5F5F5", label: "Expense" };
}

function nextCustomPaletteIndex(customCategories) {
  return customCategories.length % CUSTOM_PALETTE.length;
}

function LoginScreen({ onLogin, clientId }) {
  const btnRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return;
    }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => setScriptReady(true));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => setError("Could not load Google Sign-In.");
    document.head.appendChild(script);
  }, [clientId]);

  useEffect(() => {
    if (!scriptReady || !clientId || !btnRef.current || !window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (res) => {
        try {
          const payload = parseJwt(res.credential);
          onLogin({
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
          });
        } catch {
          setError("Sign-in failed. Please try again.");
        }
      },
    });
    btnRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(btnRef.current, {
      theme: "filled_blue",
      size: "large",
      shape: "pill",
      text: "signin_with",
      width: 280,
    });
  }, [scriptReady, clientId, onLogin]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #0d47a1 0%, #1565c0 40%, #42a5f5 100%)",
        fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "40px 28px",
          maxWidth: 400,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 8 }}>💰</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 24, color: "#1565C0" }}>Money Manager</h1>
        <p style={{ margin: "0 0 24px", color: "#666", fontSize: 14 }}>Sign in with Google to track expenses and balance.</p>
        {!clientId && (
          <p style={{ color: "#c62828", fontSize: 13, marginBottom: 16 }}>
            Set <code>GOOGLE_CLIENT_ID</code> in the code to enable Google Sign-In.
          </p>
        )}
        {error && <p style={{ color: "#c62828", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <div ref={btnRef} style={{ minHeight: 42, display: "flex", justifyContent: "center" }} />
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState("home");
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeNote, setIncomeNote] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [expenseCategoryId, setExpenseCategoryId] = useState(DEFAULT_CATEGORIES[0]?.id ?? "");
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    const u = loadUser();
    if (u?.email) {
      setUser(u);
      const d = loadData(u.email);
      setBalance(d.balance);
      setTransactions(d.transactions);
      setCustomCategories(d.customCategories);
    }
    setHydrated(true);
  }, []);

  const categories = allCategories(customCategories);

  const persist = useCallback(
    (nextBalance, nextTx, nextCustom) => {
      if (!user?.email) return;
      saveData(user.email, {
        balance: nextBalance,
        transactions: nextTx,
        customCategories: nextCustom,
      });
    },
    [user]
  );

  const handleLogin = useCallback((profile) => {
    saveUser(profile);
    setUser(profile);
    const d = loadData(profile.email);
    setBalance(d.balance);
    setTransactions(d.transactions);
    setCustomCategories(d.customCategories);
    setExpenseCategoryId(DEFAULT_CATEGORIES[0]?.id ?? "");
    showToast(`Welcome, ${profile.name || profile.email}`);
  }, [showToast]);

  const handleLogout = useCallback(() => {
    saveUser(null);
    setUser(null);
    setBalance(0);
    setTransactions([]);
    setCustomCategories([]);
    setTab("home");
    setExpenseOpen(false);
    setIncomeOpen(false);
    showToast("Signed out.");
  }, [showToast]);

  const openExpense = useCallback(() => {
    setExpenseCategoryId((id) => id || DEFAULT_CATEGORIES[0]?.id || "");
    setExpenseOpen(true);
  }, []);

  const addExpense = useCallback(() => {
    const amt = parseFloat(expenseAmount);
    if (!user?.email || !Number.isFinite(amt) || amt <= 0) {
      showToast("Enter a valid amount.");
      return;
    }
    const tx = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: "expense",
      amount: amt,
      categoryId: expenseCategoryId,
      note: expenseNote.trim(),
      date: new Date().toISOString(),
    };
    const nextBal = balance - amt;
    const nextTx = [tx, ...transactions];
    setBalance(nextBal);
    setTransactions(nextTx);
    persist(nextBal, nextTx, customCategories);
    setExpenseAmount("");
    setExpenseNote("");
    setExpenseOpen(false);
    showToast(`Expense ${fmt(amt)} saved`);
  }, [user, expenseAmount, expenseCategoryId, expenseNote, balance, transactions, customCategories, persist, showToast]);

  const addIncome = useCallback(() => {
    const amt = parseFloat(incomeAmount);
    if (!user?.email || !Number.isFinite(amt) || amt <= 0) {
      showToast("Enter a valid amount.");
      return;
    }
    const tx = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: "income",
      amount: amt,
      note: incomeNote.trim(),
      date: new Date().toISOString(),
    };
    const nextBal = balance + amt;
    const nextTx = [tx, ...transactions];
    setBalance(nextBal);
    setTransactions(nextTx);
    persist(nextBal, nextTx, customCategories);
    setIncomeAmount("");
    setIncomeNote("");
    setIncomeOpen(false);
    showToast(`Income ${fmt(amt)} added`);
  }, [user, incomeAmount, incomeNote, balance, transactions, customCategories, persist, showToast]);

  const confirmAddCustomCategory = useCallback(() => {
    const name = newCategoryName.trim();
    if (!name) {
      showToast("Type a category name.");
      return;
    }
    const pal = CUSTOM_PALETTE[nextCustomPaletteIndex(customCategories)];
    const cat = {
      id: `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      label: name,
      icon: "ti-tag",
      color: pal.color,
      bg: pal.bg,
    };
    const nextCustom = [...customCategories, cat];
    setCustomCategories(nextCustom);
    setExpenseCategoryId(cat.id);
    persist(balance, transactions, nextCustom);
    setNewCategoryName("");
    setAddCategoryOpen(false);
    showToast(`Category "${cat.label}" added`);
  }, [newCategoryName, customCategories, balance, transactions, persist, showToast]);

  const deleteTransaction = useCallback(
    (id) => {
      const tx = transactions.find((t) => t.id === id);
      if (!tx) return;
      let nextBal = balance;
      if (tx.type === "expense") nextBal += tx.amount;
      else nextBal -= tx.amount;
      const nextTx = transactions.filter((t) => t.id !== id);
      setBalance(nextBal);
      setTransactions(nextTx);
      persist(nextBal, nextTx, customCategories);
      showToast("Transaction removed");
    },
    [transactions, balance, customCategories, persist, showToast]
  );

  const expenseTotal = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const incomeTotal = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);

  const categoryTotals = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const key = t.categoryId || "unknown";
      categoryTotals[key] = (categoryTotals[key] || 0) + t.amount;
    });

  if (!hydrated) {
    return (
      <div style={{ padding: 48, textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        Loading…
      </div>
    );
  }

  if (!user?.email) {
    return (
      <>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
        <LoginScreen onLogin={handleLogin} clientId={GOOGLE_CLIENT_ID} />
      </>
    );
  }

  const shellStyle = {
    fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
    minHeight: "100vh",
    background: "#f0f4f8",
    paddingBottom: 96,
  };

  const tabBtn = (id, label) => (
    <button
      type="button"
      key={id}
      onClick={() => setTab(id)}
      style={{
        flex: 1,
        padding: "10px 8px",
        border: "none",
        borderRadius: 12,
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
        background: tab === id ? "#1565C0" : "transparent",
        color: tab === id ? "#fff" : "#555",
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <div style={shellStyle}>
      <header
        style={{
          background: "#fff",
          padding: 12,
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <img
          src={user.picture || "https://www.gravatar.com/avatar/?d=mp"}
          alt=""
          style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{user.name || "User"}</div>
          <div style={{ fontSize: 12, color: "#666", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#fafafa",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Logout
        </button>
      </header>

      <div style={{ padding: "12px 12px 0" }}>
        <div
          style={{
            display: "flex",
            background: "#e3eaf2",
            borderRadius: 14,
            padding: 4,
            marginBottom: 12,
          }}
        >
          {tabBtn("home", "Home")}
          {tabBtn("analytics", "Analytics")}
          {tabBtn("history", "History")}
        </div>

        {tab === "home" && (
          <div>
            <div
              style={{
                background: "linear-gradient(135deg, #1565C0, #42A5F5)",
                borderRadius: 16,
                padding: 20,
                color: "#fff",
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.9 }}>Current balance</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{fmt(balance)}</div>
              <div style={{ display: "flex", gap: 16, marginTop: 16, fontSize: 12, opacity: 0.95 }}>
                <span>In +{fmt(incomeTotal)}</span>
                <span>Out −{fmt(expenseTotal)}</span>
              </div>
            </div>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#333" }}>Recent</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {transactions.slice(0, 6).map((t) => {
                const cat = t.type === "expense" ? findCategory(categories, t.categoryId) : null;
                return (
                  <div
                    key={t.id}
                    style={{
                      background: "#fff",
                      borderRadius: 12,
                      padding: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: t.type === "income" ? "#E8F5E9" : cat.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: t.type === "income" ? "#2E7D32" : cat.color,
                      }}
                    >
                      <i className={`ti ${t.type === "income" ? "ti-currency-rupee" : cat.icon}`} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {t.type === "income" ? "Income" : cat.label}
                      </div>
                      <div style={{ fontSize: 12, color: "#888" }}>
                        {fmtDate(t.date)}
                        {t.note ? ` · ${t.note}` : ""}
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: t.type === "income" ? "#2E7D32" : "#C62828",
                      }}
                    >
                      {t.type === "income" ? "+" : "−"}
                      {fmt(t.amount)}
                    </div>
                  </div>
                );
              })}
              {transactions.length === 0 && (
                <div style={{ textAlign: "center", color: "#999", padding: 24 }}>No transactions yet.</div>
              )}
            </div>
          </div>
        )}

        {tab === "analytics" && (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 12, color: "#333" }}>Spending by category</div>
            {Object.keys(categoryTotals).length === 0 && (
              <div style={{ textAlign: "center", color: "#999", padding: 24 }}>No expenses to analyze.</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([cid, total]) => {
                  const cat = findCategory(categories, cid);
                  const pct = expenseTotal > 0 ? Math.round((total / expenseTotal) * 100) : 0;
                  return (
                    <div key={cid} style={{ background: "#fff", borderRadius: 12, padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: cat.bg,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: cat.color,
                            }}
                          >
                            <i className={`ti ${cat.icon}`} />
                          </span>
                          {cat.label}
                        </span>
                        <span style={{ fontWeight: 700 }}>{fmt(total)}</span>
                      </div>
                      <div style={{ height: 8, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: cat.color, transition: "width 0.3s" }} />
                      </div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{pct}% of expenses</div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {tab === "history" && (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 12, color: "#333" }}>All transactions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {transactions.map((t) => {
                const cat = t.type === "expense" ? findCategory(categories, t.categoryId) : null;
                return (
                  <div
                    key={t.id}
                    style={{
                      background: "#fff",
                      borderRadius: 12,
                      padding: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: t.type === "income" ? "#E8F5E9" : cat.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: t.type === "income" ? "#2E7D32" : cat.color,
                      }}
                    >
                      <i className={`ti ${t.type === "income" ? "ti-currency-rupee" : cat.icon}`} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {t.type === "income" ? "Income" : cat.label}
                      </div>
                      <div style={{ fontSize: 12, color: "#888" }}>
                        {fmtDate(t.date)}
                        {t.note ? ` · ${t.note}` : ""}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: t.type === "income" ? "#2E7D32" : "#C62828" }}>
                      {t.type === "income" ? "+" : "−"}
                      {fmt(t.amount)}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteTransaction(t.id)}
                      style={{
                        border: "none",
                        background: "#ffebee",
                        color: "#c62828",
                        borderRadius: 8,
                        padding: "6px 10px",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Undo
                    </button>
                  </div>
                );
              })}
              {transactions.length === 0 && (
                <div style={{ textAlign: "center", color: "#999", padding: 24 }}>No history.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 88,
            transform: "translateX(-50%)",
            background: "#323232",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 12,
            fontSize: 14,
            zIndex: 2000,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}
        >
          {toast}
        </div>
      )}

      <div
        style={{
          position: "fixed",
          left: 12,
          right: 12,
          bottom: 16,
          display: "flex",
          gap: 10,
          zIndex: 1500,
        }}
      >
        <button
          type="button"
          onClick={openExpense}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: 14,
            border: "none",
            background: "#C62828",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(198,40,40,0.35)",
          }}
        >
          − Expense
        </button>
        <button
          type="button"
          onClick={() => setIncomeOpen(true)}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: 14,
            border: "none",
            background: "#2E7D32",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(46,125,50,0.35)",
          }}
        >
          + Income
        </button>
      </div>

      {expenseOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1600,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setExpenseOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 480,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "88vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Add expense</h2>
              <button type="button" onClick={() => setExpenseOpen(false)} style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer" }}>
                ×
              </button>
            </div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Amount</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                fontSize: 18,
                borderRadius: 12,
                border: "1px solid #ddd",
                marginTop: 6,
                marginBottom: 16,
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Category</span>
              <button
                type="button"
                onClick={() => {
                  setAddCategoryOpen(true);
                  setNewCategoryName("");
                }}
                style={{
                  border: "1px dashed #1565C0",
                  background: "#E3F2FD",
                  color: "#1565C0",
                  borderRadius: 10,
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <i className="ti ti-plus" /> Add item
              </button>
            </div>
            {addCategoryOpen && (
              <div
                style={{
                  background: "#f5f5f5",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                  border: "1px solid #e0e0e0",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#444" }}>New category name</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    placeholder="e.g. Rent"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
                  />
                  <button
                    type="button"
                    onClick={confirmAddCustomCategory}
                    style={{
                      padding: "0 16px",
                      borderRadius: 10,
                      border: "none",
                      background: "#1565C0",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddCategoryOpen(false)}
                    style={{ padding: "0 12px", borderRadius: 10, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 12, color: "#666" }}>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: CUSTOM_PALETTE[nextCustomPaletteIndex(customCategories)].bg,
                      color: CUSTOM_PALETTE[nextCustomPaletteIndex(customCategories)].color,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i className="ti ti-tag" />
                  </span>
                  Preview — uses next palette color
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 16 }}>
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setExpenseCategoryId(c.id)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: expenseCategoryId === c.id ? `2px solid ${c.color}` : "1px solid #eee",
                    background: c.bg,
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ color: c.color, fontSize: 20 }}>
                    <i className={`ti ${c.icon}`} />
                  </span>
                  <span style={{ fontWeight: 600, color: "#333" }}>{c.label}</span>
                </button>
              ))}
            </div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Note (optional)</label>
            <input
              type="text"
              value={expenseNote}
              onChange={(e) => setExpenseNote(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid #ddd",
                marginTop: 6,
                marginBottom: 20,
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={addExpense}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 14,
                border: "none",
                background: "#C62828",
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Save expense
            </button>
          </div>
        </div>
      )}

      {incomeOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1600,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setIncomeOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 480,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Add income</h2>
              <button type="button" onClick={() => setIncomeOpen(false)} style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer" }}>
                ×
              </button>
            </div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Amount</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                fontSize: 18,
                borderRadius: 12,
                border: "1px solid #ddd",
                marginTop: 6,
                marginBottom: 16,
                boxSizing: "border-box",
              }}
            />
            <label style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Note (optional)</label>
            <input
              type="text"
              value={incomeNote}
              onChange={(e) => setIncomeNote(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid #ddd",
                marginTop: 6,
                marginBottom: 20,
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={addIncome}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 14,
                border: "none",
                background: "#2E7D32",
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Save income
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
