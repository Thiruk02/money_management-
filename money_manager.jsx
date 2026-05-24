import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_CATEGORIES = [
  { id: "petrol", label: "Petrol", icon: "ti-gas-station", color: "#E85D04", bg: "#FFF3E0" },
  { id: "grocery", label: "Grocery", icon: "ti-shopping-cart", color: "#2E7D32", bg: "#E8F5E9" },
  { id: "recharge", label: "Recharge", icon: "ti-device-mobile", color: "#1565C0", bg: "#E3F2FD" },
  { id: "snacks", label: "Snacks", icon: "ti-cookie", color: "#6A1B9A", bg: "#F3E5F5" },
  { id: "stationery", label: "Stationery shop", icon: "ti-pencil", color: "#0288D1", bg: "#E1F5FE" },
  { id: "textiles", label: "Textiles", icon: "ti-shirt", color: "#EC407A", bg: "#FCE4EC" },
  { id: "silver", label: "Silver", icon: "ti-brightness-up", color: "#78909C", bg: "#ECEFF1" },
  { id: "gold", label: "Gold", icon: "ti-crown", color: "#FBC02D", bg: "#FFF9C4" },
  { id: "fancy_store", label: "Fancy store", icon: "ti-sparkles", color: "#8E24AA", bg: "#F3E5F5" },
  { id: "repair", label: "Repair cost", icon: "ti-wrench", color: "#D84315", bg: "#FBE9E7" },
  { id: "plastic_goods", label: "Plastic goods store", icon: "ti-box", color: "#00897B", bg: "#E0F2F1" },
  { id: "kitchenware", label: "Kitchenware", icon: "ti-tools-kitchen-2", color: "#4E342E", bg: "#EFEBE9" },
  { id: "shoes_slippers", label: "Shoes or slipper shop", icon: "ti-shoe", color: "#5D4037", bg: "#EFEBE9" },
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

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Please enter a username.");
      return;
    }
    setError(null);
    onLogin({
      email: trimmed.toLowerCase() + "@local",
      name: trimmed,
      picture: "",
    });
  };

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #0d47a1 0%, #1565c0 40%, #42a5f5 100%)",
        fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "40px 24px",
          width: "100%",
          background: "#fff",
          borderRadius: 24,
          boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 24, color: "#1565C0", fontWeight: 800 }}>Money Manager</h1>
        <p style={{ margin: "0 0 24px", color: "#666", fontSize: 14 }}>Enter your name to start tracking expenses.</p>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: 16,
                borderRadius: 12,
                border: "1px solid #ddd",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#1565c0";
                e.target.style.boxShadow = "0 0 0 3px rgba(21, 101, 192, 0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#ddd";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
          {error && <p style={{ color: "#c62828", fontSize: 13, margin: "0 0 8px", textAlign: "left" }}>{error}</p>}
          <button
            type="submit"
            style={{
              padding: "12px",
              borderRadius: 12,
              border: "none",
              background: "#1565C0",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(21,101,192,0.3)",
              transition: "transform 0.1s, background-color 0.2s",
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#0d47a1";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#1565C0";
            }}
          >
            Get Started
          </button>
        </form>
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
  const [addMenuOpen, setAddMenuOpen] = useState(false);
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
    if (amt > balance) {
      showToast("Insufficient funds in your wallet.");
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

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <style>{`
        .app-viewport-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          width: 100vw;
          background: #0b0f19;
          box-sizing: border-box;
          overflow: hidden;
        }
        
        .app-container {
          width: 100%;
          height: 100vh;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }
        
        @media (min-width: 500px) {
          .app-container {
            width: 390px;
            height: 844px;
            border-radius: 40px;
            border: 12px solid #1e293b;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          
          .app-container::before {
            content: "";
            position: absolute;
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            width: 110px;
            height: 24px;
            background: #1e293b;
            border-radius: 12px;
            z-index: 10000;
          }
        }
        
        .app-main-content {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          position: relative;
          box-sizing: border-box;
        }
        
        .app-header {
          background: #fff;
          padding: 16px;
          padding-top: 16px;
          box-shadow: 0 1px 8px rgba(0,0,0,0.04);
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 1000;
        }
        @media (min-width: 500px) {
          .app-header {
            padding-top: 44px;
          }
        }
        
        .app-scroll-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          padding-bottom: 100px;
          box-sizing: border-box;
          -webkit-overflow-scrolling: touch;
        }
        
        .app-bottom-nav {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 72px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 2000;
          padding-bottom: env(safe-area-inset-bottom);
          box-sizing: border-box;
        }
        
        .app-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 11px;
          font-weight: 600;
          text-decoration: none;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: color 0.2s;
          flex: 1;
          height: 100%;
          gap: 4px;
        }
        
        .app-nav-item.active {
          color: #1565C0;
        }
        
        .app-nav-item i {
          font-size: 20px;
        }
        
        .app-fab-add {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: 56px;
          height: 56px;
          border-radius: 28px;
          background: #1565C0;
          color: #fff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(21, 101, 192, 0.4);
          cursor: pointer;
          z-index: 3000;
          transition: transform 0.2s, background-color 0.2s;
        }
        .app-fab-add:hover {
          background-color: #0d47a1;
          transform: translateX(-50%) scale(1.05);
        }
        .app-fab-add:active {
          transform: translateX(-50%) scale(0.95);
        }
        .app-fab-add i {
          font-size: 24px;
        }
        
        .bottom-sheet-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 4000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: fadeIn 0.2s ease-out;
        }
        
        .bottom-sheet {
          background: #fff;
          width: 100%;
          border-top-left-radius: 28px;
          border-top-right-radius: 28px;
          padding: 24px;
          max-height: 80%;
          overflow-y: auto;
          box-shadow: 0 -10px 25px -5px rgba(0, 0, 0, 0.1);
          box-sizing: border-box;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
      
      <div className="app-viewport-wrapper">
        <div className="app-container">
          {!hydrated ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontFamily: "system-ui, sans-serif", color: "#64748b" }}>
              Loading…
            </div>
          ) : !user?.email ? (
            <LoginScreen onLogin={handleLogin} />
          ) : (
            <div className="app-main-content">
              <header className="app-header">
                <img
                  src={user.picture || "https://www.gravatar.com/avatar/?d=mp"}
                  alt=""
                  style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{user.name || "User"}</div>
                  <div style={{ fontSize: 11, color: "#666", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
                </div>
              </header>
              
              <div className="app-scroll-body">
                {tab === "home" && (
                  <div>
                    <div
                      style={{
                        background: "linear-gradient(135deg, #1565C0, #42A5F5)",
                        borderRadius: 16,
                        padding: 20,
                        color: "#fff",
                        marginBottom: 16,
                        boxShadow: "0 8px 20px rgba(21,101,192,0.2)",
                      }}
                    >
                      <div style={{ fontSize: 12, opacity: 0.9 }}>Current balance</div>
                      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{fmt(balance)}</div>
                      <div style={{ display: "flex", gap: 16, marginTop: 16, fontSize: 12, opacity: 0.95 }}>
                        <span>In +{fmt(incomeTotal)}</span>
                        <span>Out −{fmt(expenseTotal)}</span>
                      </div>
                    </div>
                    
                    <div style={{ fontWeight: 700, marginBottom: 8, color: "#333", fontSize: 15 }}>Recent</div>
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
                              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
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
                                fontSize: 14,
                              }}
                            >
                              {t.type === "income" ? "+" : "−"}
                              {fmt(t.amount)}
                            </div>
                          </div>
                        );
                      })}
                      {transactions.length === 0 && (
                        <div style={{ textAlign: "center", color: "#999", padding: 24, fontSize: 13 }}>No transactions yet.</div>
                      )}
                    </div>
                  </div>
                )}
                
                {tab === "analytics" && (
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 12, color: "#333", fontSize: 15 }}>Spending by category</div>
                    {Object.keys(categoryTotals).length === 0 && (
                      <div style={{ textAlign: "center", color: "#999", padding: 24, fontSize: 13 }}>No expenses to analyze.</div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {Object.entries(categoryTotals)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cid, total]) => {
                          const cat = findCategory(categories, cid);
                          const pct = expenseTotal > 0 ? Math.round((total / expenseTotal) * 100) : 0;
                          return (
                            <div key={cid} style={{ background: "#fff", borderRadius: 12, padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                              <div style={{ display: "flex", justifycontent: "space-between", marginBottom: 8, fontSize: 14 }}>
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
                              <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
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
                    <div style={{ fontWeight: 700, marginBottom: 12, color: "#333", fontSize: 15 }}>All transactions</div>
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
                              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
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
                                justifycontent: "center",
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
                            <div style={{ fontWeight: 700, color: t.type === "income" ? "#2E7D32" : "#C62828", fontSize: 14, marginRight: 4 }}>
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
                                fontWeight: 600,
                              }}
                            >
                              Undo
                            </button>
                          </div>
                        );
                      })}
                      {transactions.length === 0 && (
                        <div style={{ textAlign: "center", color: "#999", padding: 24, fontSize: 13 }}>No history.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                type="button"
                className="app-fab-add"
                onClick={() => setAddMenuOpen(true)}
              >
                <i className="ti ti-plus" />
              </button>
              
              <div className="app-bottom-nav">
                <button
                  type="button"
                  className={`app-nav-item ${tab === "home" ? "active" : ""}`}
                  onClick={() => setTab("home")}
                >
                  <i className="ti ti-home" />
                  <span>Home</span>
                </button>
                <button
                  type="button"
                  className={`app-nav-item ${tab === "history" ? "active" : ""}`}
                  onClick={() => setTab("history")}
                >
                  <i className="ti ti-receipt" />
                  <span>History</span>
                </button>
                
                <div style={{ width: 56 }} />
                
                <button
                  type="button"
                  className={`app-nav-item ${tab === "analytics" ? "active" : ""}`}
                  onClick={() => setTab("analytics")}
                >
                  <i className="ti ti-chart-pie" />
                  <span>Analytics</span>
                </button>
                <button
                  type="button"
                  className="app-nav-item"
                  onClick={handleLogout}
                >
                  <i className="ti ti-logout" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
          
          {toast && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: 88,
                transform: "translateX(-50%)",
                background: "rgba(30, 41, 59, 0.95)",
                color: "#fff",
                padding: "12px 20px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                zIndex: 5000,
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                textAlign: "center",
                width: "80%",
                boxSizing: "border-box",
              }}
            >
              {toast}
            </div>
          )}
          
          {addMenuOpen && (
            <div className="bottom-sheet-backdrop" onClick={() => setAddMenuOpen(false)}>
              <div className="bottom-sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 32 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Add Transaction</h3>
                  <button onClick={() => setAddMenuOpen(false)} style={{ border: "none", background: "none", fontSize: 24, cursor: "pointer", color: "#64748b" }}>×</button>
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  <button
                    onClick={() => {
                      setAddMenuOpen(false);
                      setIncomeOpen(true);
                    }}
                    style={{
                      flex: 1,
                      padding: "16px",
                      borderRadius: 16,
                      border: "none",
                      background: "#E8F5E9",
                      color: "#2E7D32",
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <i className="ti ti-plus" style={{ fontSize: 24 }} />
                    Add Income
                  </button>
                  <button
                    onClick={() => {
                      setAddMenuOpen(false);
                      openExpense();
                    }}
                    style={{
                      flex: 1,
                      padding: "16px",
                      borderRadius: 16,
                      border: "none",
                      background: "#FFEBEE",
                      color: "#C62828",
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <i className="ti ti-minus" style={{ fontSize: 24 }} />
                    Add Expense
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {expenseOpen && (
            <div className="bottom-sheet-backdrop" onClick={() => setExpenseOpen(false)}>
              <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
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
                      <span style={{ fontWeight: 600, color: "#333", fontSize: 13 }}>{c.label}</span>
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
            <div className="bottom-sheet-backdrop" onClick={() => setIncomeOpen(false)}>
              <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
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
      </div>
    </>
  );
}
