import { useState, useCallback, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const CHART_COLORS = ["#0d9488", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#6366f1", "#ec4899"];

export default function App() {
  const [source, setSource] = useState("chase");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [merchantBreakdown, setMerchantBreakdown] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [merchantFilter, setMerchantFilter] = useState("");
  const [drillCategory, setDrillCategory] = useState(null);
  const [drillMerchant, setDrillMerchant] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      if (categoryFilter) params.set("category", categoryFilter);
      if (merchantFilter) params.set("merchant", merchantFilter);
      const r = await fetch(`${API_BASE}/transactions?${params}`);
      const data = await r.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, [dateFrom, dateTo, categoryFilter, merchantFilter]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      const [catRes, merRes, monRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/category-breakdown?${params}`),
        fetch(`${API_BASE}/analytics/merchant-breakdown?${params}`),
        fetch(`${API_BASE}/analytics/monthly?${params}`),
      ]);
      const catData = await catRes.json();
      const merData = await merRes.json();
      const monData = await monRes.json();
      setCategoryBreakdown(Array.isArray(catData) ? catData : []);
      setMerchantBreakdown(Array.isArray(merData) ? merData : []);
      setMonthlyData(Array.isArray(monData) ? monData : []);
    } catch {
      setCategoryBreakdown([]);
      setMerchantBreakdown([]);
      setMonthlyData([]);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.name.endsWith(".csv") || f.type === "text/csv")) {
      setFile(f);
      setResult(null);
    }
  }, []);

  const onFileChange = useCallback((e) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (!f) setResult(null);
  }, []);

  async function upload() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setShowRaw(false);
    const form = new FormData();
    form.append("source", source);
    form.append("file", file);
    try {
      const r = await fetch(`${API_BASE}/upload`, { method: "POST", body: form });
      const data = await r.json();
      setResult(data);
      if (!data.error) {
        fetchTransactions();
        fetchAnalytics();
      }
    } catch (e) {
      setResult({ error: "Upload failed. Is the backend running?" });
    } finally {
      setLoading(false);
    }
  }

  const handleDrillCategory = (name) => {
    setCategoryFilter(name);
    setDrillCategory(name);
    setDrillMerchant(null);
  };

  const handleDrillMerchant = (name) => {
    setMerchantFilter(name);
    setDrillMerchant(name);
    setDrillCategory(null);
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setCategoryFilter("");
    setMerchantFilter("");
    setDrillCategory(null);
    setDrillMerchant(null);
  };

  const isError = result && "error" in result;
  const categoriesForPie = Array.isArray(categoryBreakdown)
    ? categoryBreakdown.map((c) => ({ name: c.category, value: Math.abs(Number(c.total) || 0) }))
    : [];

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Spend Analyzer</h1>
        <p className="subtitle">Upload transaction CSVs and explore spending</p>
      </header>

      <section className="card">
        <h2 className="cardTitle">Upload transactions</h2>
        <div className="formRow">
          <div>
            <label className="label" htmlFor="source">Source</label>
            <select id="source" className="select" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="chase">Chase</option>
              <option value="amex">Amex</option>
              <option value="apple_card">Apple Card</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div>
            <label className="label">CSV file</label>
            <div
              className={`dropZone ${dragOver ? "dragOver" : ""}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <div className="dropZoneIcon">📄</div>
              <p className="dropZoneText">{file ? "Replace file" : "Drop your CSV here or click to browse"}</p>
              <p className="dropZoneHint">Columns: date (or posted_date), description (or merchant), amount</p>
              {file && <p className="dropZoneFile">{file.name}</p>}
            </div>
            <input id="file-input" type="file" className="fileInput" accept=".csv,text/csv" onChange={onFileChange} />
          </div>
          <div className="actions">
            <button type="button" className="btn btnPrimary" onClick={upload} disabled={!file || loading}>
              {loading ? <><span className="spinner" /> Uploading…</> : "Upload"}
            </button>
            {file && !loading && (
              <button
                type="button"
                className="btn btnSecondary"
                onClick={() => { setFile(null); setResult(null); document.getElementById("file-input").value = ""; }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {result && (
        <section className={`resultCard ${isError ? "error" : "success"}`}>
          <h2 className="resultTitle">{isError ? "Error" : "Upload complete"}</h2>
          {isError ? (
            <p className="resultError">{result.error}</p>
          ) : (
            <>
              <div className="resultSummary">
                <div className="resultStat">
                  <span className="resultStatValue">{result.inserted ?? 0}</span>
                  <span className="resultStatLabel">imported</span>
                </div>
                <div className="resultStat">
                  <span className="resultStatValue">{result.skipped ?? 0}</span>
                  <span className="resultStatLabel">skipped</span>
                </div>
              </div>
              <p className="resultMeta">
                {result.source && `Source: ${result.source}`}
                {result.filename && ` · ${result.filename}`}
              </p>
            </>
          )}
          <button type="button" className="rawToggle" onClick={() => setShowRaw((s) => !s)}>
            {showRaw ? "Hide" : "Show"} raw response
          </button>
          {showRaw && <pre className="rawPre">{JSON.stringify(result, null, 2)}</pre>}
        </section>
      )}

      {/* Dashboard charts */}
      {(categoriesForPie.length > 0 || (Array.isArray(monthlyData) && monthlyData.length > 0) || (Array.isArray(merchantBreakdown) && merchantBreakdown.length > 0)) && (
        <section className="card dashboardSection">
          <h2 className="cardTitle">Spending overview</h2>
          <div className="filterRow">
            <label>Date from <input type="date" className="inputSm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
            <label>Date to <input type="date" className="inputSm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
            <button type="button" className="btn btnSecondary btnSm" onClick={clearFilters}>Clear filters</button>
          </div>
          {analyticsLoading ? (
            <p className="tableEmpty">Loading analytics…</p>
          ) : (
            <div className="chartsGrid">
              {categoriesForPie.length > 0 && (
                <div className="chartCard">
                  <h3 className="chartTitle">By category</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={categoriesForPie}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        onClick={(e) => handleDrillCategory(e.name)}
                        style={{ cursor: "pointer" }}
                      >
                        {categoriesForPie.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, "Total"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              {Array.isArray(monthlyData) && monthlyData.length > 0 && (
                <div className="chartCard">
                  <h3 className="chartTitle">Monthly spending</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, "Total"]} />
                      <Bar dataKey="total" fill="#0d9488" name="Total" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {Array.isArray(merchantBreakdown) && merchantBreakdown.length > 0 && (
                <div className="chartCard chartCardWide">
                  <h3 className="chartTitle">Top merchants</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={(Array.isArray(merchantBreakdown) ? merchantBreakdown : []).slice(0, 10)}
                      layout="vertical"
                      margin={{ top: 8, right: 24, left: 60, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="merchant" width={56} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, "Total"]} />
                      <Bar dataKey="total" fill="#0ea5e9" name="Total" radius={[0, 4, 4, 0]} onClick={(data) => data?.merchant && handleDrillMerchant(data.merchant)} style={{ cursor: "pointer" }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <section className="card">
        <div className="tableHeader">
          <h2 className="cardTitle">Transactions</h2>
          <div className="filterRow">
            <input type="date" className="inputSm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" />
            <input type="date" className="inputSm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" />
            <input type="text" className="inputSm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} placeholder="Category" />
            <input type="text" className="inputSm" value={merchantFilter} onChange={(e) => setMerchantFilter(e.target.value)} placeholder="Merchant" />
            <button type="button" className="btn btnSecondary btnSm" onClick={fetchTransactions} disabled={transactionsLoading}>
              {transactionsLoading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>
        {transactionsLoading ? (
          <p className="tableEmpty">Loading transactions…</p>
        ) : transactions.length === 0 ? (
          <p className="tableEmpty">No transactions. Upload a CSV or adjust filters.</p>
        ) : (
          <div className="tableWrap">
            <table className="transactionsTable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Merchant</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th className="amountCol">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date || "—"}</td>
                    <td><span className="sourceBadge">{t.merchant_normalized || t.merchant_raw || "—"}</span></td>
                    <td>{t.category || "—"}</td>
                    <td>{t.description || "—"}</td>
                    <td className={`amountCol ${Number(t.amount) < 0 ? "amountNegative" : "amountPositive"}`}>
                      {typeof t.amount === "number"
                        ? t.amount < 0 ? `-$${Math.abs(t.amount).toFixed(2)}` : `$${t.amount.toFixed(2)}`
                        : t.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
