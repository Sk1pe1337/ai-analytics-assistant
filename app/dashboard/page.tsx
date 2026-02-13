"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

type ParsedData = {
  columns: string[];
  rows: Record<string, any>[];
};

type KpiData = {
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number;
  orders: number;
  avgOrder: number;

  topProduct: string;
  topProductRevenue: number;

  warnings: string[];
  recommendations: string[];
};

type Health = {
  score: number; // 0..100
  label: "Critical" | "At risk" | "Stable" | "Growing";
  colorCls: string;
  summary: string;
  drivers: string[];
};

type TrendPoint = {
  label: string; // date bucket
  revenue: number;
  cost: number;
  profit: number;
};

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function normalizeKey(s: string) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[_-]/g, "");
}

function parseNumber(v: any) {
  if (v == null) return 0;
  const s = String(v).trim();
  if (!s) return 0;

  const cleaned = s.replace(/[^\d,.\-]/g, "").replace(/\s+/g, "");
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let numStr = cleaned;
  if (hasComma && !hasDot) numStr = cleaned.replace(",", ".");
  if (hasComma && hasDot) numStr = cleaned.replace(/,/g, "");

  const n = Number(numStr);
  return Number.isFinite(n) ? n : 0;
}

function money(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function suggestColumn(columns: string[], candidates: string[]) {
  const norm = columns.map((c) => ({ raw: c, norm: normalizeKey(c) }));

  for (const cand of candidates) {
    const cn = normalizeKey(cand);
    const found = norm.find((x) => x.norm === cn);
    if (found) return found.raw;
  }
  for (const cand of candidates) {
    const cn = normalizeKey(cand);
    const found = norm.find((x) => x.norm.includes(cn) || cn.includes(x.norm));
    if (found) return found.raw;
  }
  return "";
}

function tryParseDate(v: any): Date | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;

  // пробуем ISO / обычный Date
  const d1 = new Date(s);
  if (!isNaN(d1.getTime())) return d1;

  // пробуем dd.mm.yyyy / dd/mm/yyyy
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    let yy = Number(m[3]);
    if (yy < 100) yy += 2000;
    const d2 = new Date(yy, mm - 1, dd);
    if (!isNaN(d2.getTime())) return d2;
  }

  return null;
}

function computeKpis(params: {
  rows: Record<string, any>[];
  revenueCol: string;
  costCols: string[];
  productCol: string;
}): KpiData {
  const { rows, revenueCol, costCols, productCol } = params;

  const warnings: string[] = [];
  const orders = rows.length;

  if (!revenueCol) warnings.push("Revenue column is not selected. Revenue assumed as 0.");
  if (!costCols.length) warnings.push("No cost columns selected. Cost assumed as 0 (profit may look inflated).");

  let revenue = 0;
  let cost = 0;

  const productRevenue = new Map<string, number>();

  for (const row of rows) {
    const r = revenueCol ? parseNumber(row[revenueCol]) : 0;
    revenue += r;

    let rowCost = 0;
    for (const c of costCols) rowCost += parseNumber(row[c]);
    cost += rowCost;

    if (productCol) {
      const p = String(row[productCol] ?? "").trim() || "Unknown";
      productRevenue.set(p, (productRevenue.get(p) || 0) + r);
    }
  }

  const profit = revenue - cost;
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;
  const avgOrder = orders ? revenue / orders : 0;

  let topProduct = "N/A";
  let topProductRevenue = 0;
  if (productCol && productRevenue.size) {
    for (const [p, rev] of productRevenue.entries()) {
      if (rev > topProductRevenue) {
        topProductRevenue = rev;
        topProduct = p;
      }
    }
  }

  const recommendations: string[] = [];
  if (revenue === 0) {
    recommendations.push("Revenue is 0 (or revenue column not selected). Select the correct revenue column or check your data.");
  } else if (profit < 0) {
    recommendations.push("You’re operating at a loss. Identify the largest expense categories and cut non-essential spend.");
    recommendations.push("Focus on your most profitable offers; pause low-margin products/services.");
    recommendations.push("Avoid heavy discounting unless you can keep margins positive.");
  } else {
    recommendations.push("You’re profitable. Reinvest in the best ROI channels and monitor cost growth weekly.");
    recommendations.push("Increase average order value via bundles, upsells, or minimum-order incentives.");
  }

  if (marginPct > 0 && marginPct < 10) {
    recommendations.push("Margin is thin (<10%). Consider pricing adjustments, supplier negotiation, or reducing variable costs.");
  }
  if (topProduct !== "N/A") {
    recommendations.push(`Top product is "${topProduct}". Prevent stockouts and consider promoting it more.`);
  }

  return {
    revenue,
    cost,
    profit,
    marginPct,
    orders,
    avgOrder,
    topProduct,
    topProductRevenue,
    warnings,
    recommendations,
  };
}

function computeHealth(k: KpiData): Health {
  const profit = k.profit;
  const margin = k.marginPct;
  const costRatio = k.revenue > 0 ? k.cost / k.revenue : 1;
  const aov = k.avgOrder;

  let score = 50;
  const drivers: string[] = [];

  if (profit < 0) {
    score -= 30;
    drivers.push("Negative profit (loss).");
  } else {
    score += 20;
    drivers.push("Positive profit.");
  }

  if (margin < 0) {
    score -= 10;
    drivers.push("Negative margin.");
  } else if (margin < 10) {
    score -= 10;
    drivers.push("Thin margin (<10%).");
  } else if (margin < 25) {
    score += 5;
    drivers.push("Healthy margin (10–25%).");
  } else {
    score += 15;
    drivers.push("Strong margin (25%+).");
  }

  if (costRatio > 0.95) {
    score -= 15;
    drivers.push("Costs are consuming most revenue.");
  } else if (costRatio > 0.8) {
    score -= 5;
    drivers.push("Costs are relatively high vs revenue.");
  } else if (costRatio < 0.6) {
    score += 10;
    drivers.push("Costs are well-controlled.");
  }

  if (k.orders >= 200) {
    score += 5;
    drivers.push("Sufficient volume for stable signals.");
  } else if (k.orders < 20) {
    score -= 5;
    drivers.push("Low volume (signals may be noisy).");
  }

  if (aov > 0 && aov < 20) {
    score -= 3;
    drivers.push("Low average order value (AOV).");
  } else if (aov >= 100) {
    score += 3;
    drivers.push("High AOV.");
  }

  score = clamp(Math.round(score), 0, 100);

  let label: Health["label"] = "Stable";
  let colorCls = "bg-white/5 text-zinc-300 ring-white/10";

  if (score < 35) {
    label = "Critical";
    colorCls = "bg-rose-500/15 text-rose-200 ring-rose-500/25";
  } else if (score < 55) {
    label = "At risk";
    colorCls = "bg-amber-500/15 text-amber-200 ring-amber-500/25";
  } else if (score < 75) {
    label = "Stable";
    colorCls = "bg-sky-500/15 text-sky-200 ring-sky-500/25";
  } else {
    label = "Growing";
    colorCls = "bg-emerald-500/15 text-emerald-200 ring-emerald-500/25";
  }

  const parts: string[] = [];
  if (profit < 0) {
    parts.push("Business is currently operating at a loss.");
    parts.push("Main priority: reduce the largest costs and protect margin.");
  } else {
    parts.push("Business is profitable.");
    if (margin < 10) parts.push("However, margin is thin — small cost increases can flip profit.");
    else parts.push("Margin looks healthy — you can scale the best-performing channels.");
  }
  if (k.topProduct !== "N/A") parts.push(`Top product: "${k.topProduct}" (focus inventory & promotion).`);

  return {
    score,
    label,
    colorCls,
    summary: parts.join(" "),
    drivers: drivers.slice(0, 4),
  };
}

async function parseCsvFile(file: File): Promise<ParsedData> {
  const parsedCsv = await new Promise<ParsedData>((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        try {
          const rows = (results.data || []) as Record<string, any>[];
          const columns = (results.meta.fields || []) as string[];
          if (!rows.length || !columns.length) {
            reject(new Error("CSV has no rows or no headers."));
            return;
          }
          resolve({ rows, columns });
        } catch (e: any) {
          reject(e);
        }
      },
      error: (err) => reject(err),
    });
  });
  return parsedCsv;
}

async function parseExcelFile(file: File): Promise<ParsedData> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

  const columns = json.length ? Object.keys(json[0]) : [];
  if (!json.length || !columns.length) throw new Error("Excel sheet is empty or has no headers.");

  return { rows: json, columns };
}

function toSheetsCsvUrl(input: string): string {
  const s = input.trim();
  if (!s) return "";

  if (s.includes("export?format=csv")) return s;

  const m = s.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const id = m?.[1] || (s.includes("/") ? "" : s);

  const gidMatch = s.match(/[?#&]gid=(\d+)/);
  const gid = gidMatch?.[1] || "0";

  if (!id) return "";
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

function buildDemoData(kind: "loss" | "growth"): ParsedData {
  // 60 days synthetic dataset
  const rows: Record<string, any>[] = [];
  const start = new Date();
  start.setDate(start.getDate() - 60);

  const products = ["Latte", "Espresso", "Cappuccino", "Croissant", "Sandwich"];
  let baseRevenue = kind === "growth" ? 120 : 90;
  let baseMarketing = kind === "growth" ? 8 : 18;
  let baseRent = 25;
  let baseSalary = kind === "growth" ? 35 : 45;
  let baseCOGS = kind === "growth" ? 35 : 48;

  for (let i = 0; i < 60; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    // simulate trend
    const trend = kind === "growth" ? 1 + i * 0.01 : 1 - i * 0.005;
    const noise = 0.85 + Math.random() * 0.3;

    const revenue = Math.max(10, baseRevenue * trend * noise);
    const cogs = Math.max(1, baseCOGS * trend * (0.9 + Math.random() * 0.25));
    const marketing = Math.max(1, baseMarketing * (0.8 + Math.random() * 0.5));
    const rent = baseRent; // flat
    const salary = Math.max(1, baseSalary * (0.95 + Math.random() * 0.1));

    const product = products[Math.floor(Math.random() * products.length)];

    rows.push({
      Date: d.toISOString().slice(0, 10),
      Product: product,
      Revenue: revenue.toFixed(2),
      COGS: cogs.toFixed(2),
      Marketing: marketing.toFixed(2),
      Rent: rent.toFixed(2),
      Salary: salary.toFixed(2),
    });
  }

  return {
    columns: ["Date", "Product", "Revenue", "COGS", "Marketing", "Rent", "Salary"],
    rows,
  };
}

function groupTrend(params: {
  rows: Record<string, any>[];
  dateCol: string;
  revenueCol: string;
  costCols: string[];
}): TrendPoint[] {
  const { rows, dateCol, revenueCol, costCols } = params;
  if (!dateCol || !revenueCol || !rows.length) return [];

  const map = new Map<string, { revenue: number; cost: number }>();

  for (const r of rows) {
    const dt = tryParseDate(r[dateCol]);
    if (!dt) continue;

    // bucket by YYYY-MM-DD
    const key = dt.toISOString().slice(0, 10);

    const rev = parseNumber(r[revenueCol]);
    let cost = 0;
    for (const c of costCols) cost += parseNumber(r[c]);

    const prev = map.get(key) || { revenue: 0, cost: 0 };
    prev.revenue += rev;
    prev.cost += cost;
    map.set(key, prev);
  }

  const keys = Array.from(map.keys()).sort();
  const out: TrendPoint[] = keys.map((k) => {
    const v = map.get(k)!;
    return {
      label: k,
      revenue: v.revenue,
      cost: v.cost,
      profit: v.revenue - v.cost,
    };
  });

  // limit to last 30 points to keep UI fast
  return out.slice(Math.max(0, out.length - 30));
}

function svgLinePath(values: number[], w: number, h: number, padding = 8) {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const xStep = (w - padding * 2) / Math.max(1, values.length - 1);

  const pts = values.map((v, i) => {
    const x = padding + i * xStep;
    const y = padding + (1 - (v - min) / span) * (h - padding * 2);
    return { x, y };
  });

  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
  }
  return d;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"file" | "sheets">("file");

  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // mapping
  const [revenueCol, setRevenueCol] = useState<string>("");
  const [costCols, setCostCols] = useState<string[]>([]);
  const [productCol, setProductCol] = useState<string>("");
  const [dateCol, setDateCol] = useState<string>("");

  // UI
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Google Sheets
  const [sheetsInput, setSheetsInput] = useState("");
  const [sheetsHint, setSheetsHint] = useState("");

  // load saved mapping per “source”
  useEffect(() => {
    if (!parsed || !fileName) return;
    const key = `mapping:${fileName}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const m = JSON.parse(raw);
      if (m?.revenueCol) setRevenueCol(m.revenueCol);
      if (Array.isArray(m?.costCols)) setCostCols(m.costCols);
      if (m?.productCol != null) setProductCol(m.productCol);
      if (m?.dateCol != null) setDateCol(m.dateCol);
    } catch {}
  }, [parsed, fileName]);

  useEffect(() => {
    if (!fileName) return;
    const key = `mapping:${fileName}`;
    const payload = JSON.stringify({ revenueCol, costCols, productCol, dateCol });
    try {
      localStorage.setItem(key, payload);
    } catch {}
  }, [fileName, revenueCol, costCols, productCol, dateCol]);

  const kpis = useMemo(() => {
    if (!parsed) return null;
    return computeKpis({ rows: parsed.rows, revenueCol, costCols, productCol });
  }, [parsed, revenueCol, costCols, productCol]);

  const health = useMemo(() => (kpis ? computeHealth(kpis) : null), [kpis]);

  const statusBadge = useMemo(() => {
    if (!kpis) return { label: "No data", cls: "bg-white/5 text-zinc-300 ring-white/10" };
    if (kpis.profit < 0) return { label: "Loss", cls: "bg-rose-500/15 text-rose-200 ring-rose-500/25" };
    return { label: "Profitable", cls: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/25" };
  }, [kpis]);

  const trend = useMemo(() => {
    if (!parsed || !dateCol || !revenueCol) return [];
    return groupTrend({ rows: parsed.rows, dateCol, revenueCol, costCols });
  }, [parsed, dateCol, revenueCol, costCols]);

  const costBreakdown = useMemo(() => {
    if (!parsed || !costCols.length) return [];
    const sums = costCols.map((c) => {
      let s = 0;
      for (const r of parsed.rows) s += parseNumber(r[c]);
      return { col: c, value: s };
    });
    sums.sort((a, b) => b.value - a.value);
    return sums;
  }, [parsed, costCols]);

  function applyAutoMapping(columns: string[]) {
    const suggestedRevenue =
      suggestColumn(columns, ["revenue", "sales", "amount", "total", "price", "value", "ordertotal", "net", "income"]) || "";

    const suggestedCost =
      suggestColumn(columns, [
        "cost",
        "expense",
        "expenses",
        "cogs",
        "spend",
        "fees",
        "shipping",
        "delivery",
        "tax",
        "rent",
        "salary",
        "marketing",
      ]) || "";

    const suggestedProduct = suggestColumn(columns, ["product", "item", "name", "sku", "category"]) || "";
    const suggestedDate = suggestColumn(columns, ["date", "day", "timestamp", "createdat", "orderdate"]) || "";

    setRevenueCol(suggestedRevenue);
    setCostCols(suggestedCost ? [suggestedCost] : []);
    setProductCol(suggestedProduct);
    setDateCol(suggestedDate);
  }

  async function loadParsedData(name: string, data: ParsedData) {
    setParsed(data);
    setFileName(name);
    applyAutoMapping(data.columns);
  }

  async function handleFile(file?: File) {
    if (!file) return;

    setError("");
    setLoading(true);

    const ext = file.name.toLowerCase().split(".").pop();

    try {
      let data: ParsedData;
      if (ext === "csv") data = await parseCsvFile(file);
      else if (ext === "xlsx" || ext === "xls") data = await parseExcelFile(file);
      else throw new Error("Upload .csv, .xlsx or .xls");

      await loadParsedData(file.name, data);
    } catch (e: any) {
      setParsed(null);
      setFileName("");
      setError(e?.message || "Parse error");
    } finally {
      setLoading(false);
    }
  }

  async function importFromGoogleSheets() {
    setError("");
    setLoading(true);
    try {
      const url = toSheetsCsvUrl(sheetsInput);
      if (!url) throw new Error("Paste Google Sheets URL (or Spreadsheet ID).");

      setSheetsHint(url);

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch sheet. Make sure it is public or 'Published to web'.");

      const text = await res.text();

      const results = Papa.parse<Record<string, any>>(text, {
        header: true,
        skipEmptyLines: true,
      });

      const rows = (results.data || []) as Record<string, any>[];
      const columns = (results.meta.fields || []) as string[];

      if (!rows.length || !columns.length) throw new Error("Sheet has no rows or headers.");

      await loadParsedData("google-sheets.csv", { rows, columns });
      setActiveTab("file");
    } catch (e: any) {
      setError(e?.message || "Import error");
    } finally {
      setLoading(false);
    }
  }

  function toggleCostCol(col: string) {
    setCostCols((prev) => (prev.includes(col) ? prev.filter((x) => x !== col) : [...prev, col]));
  }

  function loadDemo(kind: "loss" | "growth") {
    setError("");
    setLoading(false);
    const d = buildDemoData(kind);
    loadParsedData(kind === "loss" ? "demo_loss.csv" : "demo_growth.csv", d);
  }

  function exportReport() {
    if (!parsed || !kpis) return;

    const payload = {
      generatedAt: new Date().toISOString(),
      source: fileName || "unknown",
      mapping: { dateCol, revenueCol, costCols, productCol },
      kpis,
      health,
      trend,
      costBreakdown,
      sampleRows: parsed.rows.slice(0, 10),
      columns: parsed.columns,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  }

  const trendRevenue = trend.map((p) => p.revenue);
  const trendProfit = trend.map((p) => p.profit);

  return (
    <div className="min-h-screen bg-[#070713] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute top-40 -left-40 h-[560px] w-[560px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[720px] w-[720px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#070713]/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xs text-zinc-400">AI Analytics Assistant</div>
            <h1 className="text-lg font-semibold tracking-tight">Business Dashboard</h1>
          </div>

          <div className="flex items-center gap-2">
            <span className={clsx("rounded-full px-3 py-1 text-xs ring-1", statusBadge.cls)}>{statusBadge.label}</span>
            <button
              onClick={exportReport}
              disabled={!kpis}
              className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
            >
              Export report
            </button>
            <button onClick={logout} className="rounded-full bg-white/10 px-3 py-2 text-xs ring-1 ring-white/10 hover:bg-white/5">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* WOW demo buttons */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            Tip for defense: click <span className="text-zinc-200">Demo Loss</span> / <span className="text-zinc-200">Demo Growth</span> — instant story.
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadDemo("loss")}
              className="rounded-full bg-rose-500/15 px-4 py-2 text-xs text-rose-200 ring-1 ring-rose-500/25 hover:bg-rose-500/20"
            >
              Demo Loss ↘
            </button>
            <button
              onClick={() => loadDemo("growth")}
              className="rounded-full bg-emerald-500/15 px-4 py-2 text-xs text-emerald-200 ring-1 ring-emerald-500/25 hover:bg-emerald-500/20"
            >
              Demo Growth ↗
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("file")}
            className={clsx(
              "rounded-full px-4 py-2 text-xs ring-1",
              activeTab === "file" ? "bg-white/10 text-zinc-100 ring-white/15" : "bg-white/5 text-zinc-300 ring-white/10 hover:bg-white/10"
            )}
          >
            Upload file (CSV/Excel)
          </button>
          <button
            onClick={() => setActiveTab("sheets")}
            className={clsx(
              "rounded-full px-4 py-2 text-xs ring-1",
              activeTab === "sheets" ? "bg-white/10 text-zinc-100 ring-white/15" : "bg-white/5 text-zinc-300 ring-white/10 hover:bg-white/10"
            )}
          >
            Import Google Sheets
          </button>
        </div>

        <div className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10">
          {activeTab === "file" ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Upload CSV or Excel</div>
                  <div className="mt-1 text-xs text-zinc-400">
                    Supported: <span className="text-zinc-200">.csv, .xlsx, .xls</span>
                  </div>
                </div>

                <button onClick={() => fileRef.current?.click()} className="rounded-full bg-white/10 px-4 py-2 text-xs ring-1 ring-white/10 hover:bg-white/5">
                  Choose file
                </button>

                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              </div>

              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  handleFile(f);
                }}
                className={clsx(
                  "mt-5 rounded-2xl border border-dashed p-6 transition",
                  dragOver ? "border-indigo-400/70 bg-indigo-500/10" : "border-white/15 bg-black/20"
                )}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm text-zinc-200">{loading ? "Parsing..." : parsed ? "File loaded" : "Drop your file here"}</div>
                    <div className="text-xs text-zinc-400">
                      {parsed ? (
                        <>
                          <span className="text-zinc-200">{fileName}</span>{" "}
                          <span>• {parsed.rows.length.toLocaleString()} rows</span>{" "}
                          <span>• {parsed.columns.length} columns</span>
                        </>
                      ) : (
                        "Headers required (first row)."
                      )}
                    </div>
                  </div>
                  <div className={clsx("text-xs", dragOver ? "text-indigo-200" : "text-zinc-400")}>{dragOver ? "Release to upload" : "CSV / Excel"}</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Import Google Sheets</div>
                  <div className="mt-1 text-xs text-zinc-400">
                    Works if the sheet is <span className="text-zinc-200">public</span> or <span className="text-zinc-200">Published to web</span>.
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  value={sheetsInput}
                  onChange={(e) => setSheetsInput(e.target.value)}
                  placeholder="Paste Google Sheets URL or Spreadsheet ID"
                  className="w-full rounded-2xl bg-black/35 px-4 py-3 text-sm text-zinc-100 ring-1 ring-white/10 outline-none placeholder:text-zinc-500 focus:ring-indigo-500/40"
                />
                <button
                  onClick={importFromGoogleSheets}
                  disabled={loading}
                  className="rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
                >
                  {loading ? "Importing..." : "Import"}
                </button>
              </div>

              {!!sheetsHint && (
                <div className="mt-2 text-xs text-zinc-400">
                  Using export URL: <span className="text-zinc-200 break-all">{sheetsHint}</span>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="mt-4 rounded-2xl bg-rose-500/10 p-3 text-sm text-rose-200 ring-1 ring-rose-500/20">{error}</div>
          )}

          {parsed && (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-black/30 p-5 ring-1 ring-white/10">
                <div className="text-sm font-semibold">Column mapping</div>
                <div className="mt-1 text-xs text-zinc-400">Revenue + costs (1+) + date (for trend) + product optional.</div>

                <div className="mt-4 grid gap-3">
                  <div>
                    <div className="text-xs text-zinc-300">Date (optional, enables trend)</div>
                    <select
                      value={dateCol}
                      onChange={(e) => setDateCol(e.target.value)}
                      className="mt-1 w-full rounded-xl bg-black/40 p-3 text-sm text-zinc-100 ring-1 ring-white/10 outline-none focus:ring-indigo-500/40"
                    >
                      <option value="">— None —</option>
                      {parsed.columns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="text-xs text-zinc-300">Revenue (required)</div>
                    <select
                      value={revenueCol}
                      onChange={(e) => setRevenueCol(e.target.value)}
                      className="mt-1 w-full rounded-xl bg-black/40 p-3 text-sm text-zinc-100 ring-1 ring-white/10 outline-none focus:ring-indigo-500/40"
                    >
                      <option value="">— Select —</option>
                      {parsed.columns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="text-xs text-zinc-300">Costs (select one or many)</div>
                    <div className="mt-2 max-h-44 overflow-auto rounded-xl bg-black/40 p-3 ring-1 ring-white/10">
                      <div className="grid gap-2">
                        {parsed.columns.map((c) => (
                          <label key={c} className="flex items-center gap-2 text-sm text-zinc-200">
                            <input type="checkbox" checked={costCols.includes(c)} onChange={() => toggleCostCol(c)} />
                            <span className="truncate">{c}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-zinc-400">
                      Selected: <span className="text-zinc-200">{costCols.length ? costCols.join(", ") : "none"}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-zinc-300">Product (optional)</div>
                    <select
                      value={productCol}
                      onChange={(e) => setProductCol(e.target.value)}
                      className="mt-1 w-full rounded-xl bg-black/40 p-3 text-sm text-zinc-100 ring-1 ring-white/10 outline-none focus:ring-indigo-500/40"
                    >
                      <option value="">— None —</option>
                      {parsed.columns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-xs text-zinc-400">
                    WOW: mapping сохраняется автоматически (localStorage) для этого источника данных.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-black/30 p-5 ring-1 ring-white/10">
                <div className="text-sm font-semibold">Data preview</div>
                <div className="mt-1 text-xs text-zinc-400">First 8 rows • first 8 columns</div>

                <div className="mt-3 overflow-auto rounded-xl ring-1 ring-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-zinc-300">
                      <tr>
                        {parsed.columns.slice(0, 8).map((c) => (
                          <th key={c} className="px-3 py-2 whitespace-nowrap">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-black/20 text-zinc-200">
                      {parsed.rows.slice(0, 8).map((r, idx) => (
                        <tr key={idx} className="border-t border-white/10">
                          {parsed.columns.slice(0, 8).map((c) => (
                            <td key={c} className="px-3 py-2 whitespace-nowrap">{String(r[c] ?? "")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {!!fileName && (
                  <div className="mt-3 text-xs text-zinc-500">
                    Source: <span className="text-zinc-200">{fileName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {kpis && (
            <>
              {kpis.warnings.length > 0 && (
                <div className="mt-6 rounded-2xl bg-white/5 p-4 text-sm text-zinc-200 ring-1 ring-white/10">
                  <div className="font-semibold">Notes</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-300">
                    {kpis.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <KpiCard title="Revenue" value={money(kpis.revenue)} hint={revenueCol ? `Column: ${revenueCol}` : "Select revenue"} />
                <KpiCard title="Cost" value={money(kpis.cost)} hint={costCols.length ? `Columns: ${costCols.length}` : "Select costs"} />
                <KpiCard title="Profit" value={money(kpis.profit)} hint="Revenue − Cost" />
                <KpiCard title="Margin" value={`${kpis.marginPct.toFixed(1)}%`} hint="Profit / Revenue" />
                <KpiCard title="Orders" value={String(kpis.orders)} hint="Rows in dataset" />
                <KpiCard title="Avg order" value={money(kpis.avgOrder)} hint="Revenue / Orders" />
              </div>

              {health && (
                <div className="mt-6 rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">Business Health</div>
                      <div className="mt-1 text-xs text-zinc-400">Simple scoring model (great for teacher demo).</div>
                    </div>

                    <span className={clsx("rounded-full px-3 py-1 text-xs ring-1", health.colorCls)}>
                      {health.label} • {health.score}/100
                    </span>
                  </div>

                  <div className="mt-4 text-sm text-zinc-200">{health.summary}</div>

                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {health.drivers.map((d) => (
                      <div key={d} className="rounded-2xl bg-black/30 p-3 text-xs text-zinc-200 ring-1 ring-white/10">
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WOW: Trend */}
              {dateCol && trend.length >= 5 && (
                <div className="mt-6 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl bg-black/30 p-5 ring-1 ring-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">Revenue trend (last {trend.length} days)</div>
                        <div className="mt-1 text-xs text-zinc-400">Auto-built from Date + Revenue.</div>
                      </div>
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300 ring-1 ring-white/10">
                        WOW Chart
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl bg-black/20 p-3 ring-1 ring-white/10">
                      <svg width="100%" viewBox="0 0 520 140" className="block">
                        <path d={svgLinePath(trendRevenue, 520, 140)} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.9" />
                      </svg>
                    </div>

                    <div className="mt-3 text-xs text-zinc-400">
                      Date column: <span className="text-zinc-200">{dateCol}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/30 p-5 ring-1 ring-white/10">
                    <div className="text-sm font-semibold">Profit trend</div>
                    <div className="mt-1 text-xs text-zinc-400">Shows if business is improving or sliding.</div>

                    <div className="mt-4 rounded-2xl bg-black/20 p-3 ring-1 ring-white/10">
                      <svg width="100%" viewBox="0 0 520 140" className="block">
                        <path d={svgLinePath(trendProfit, 520, 140)} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.9" />
                      </svg>
                    </div>

                    <div className="mt-3 text-xs text-zinc-400">
                      Tip: teacher любит “динамику”, а не только итоговые KPI.
                    </div>
                  </div>
                </div>
              )}

              {/* WOW: Cost breakdown */}
              {costBreakdown.length > 0 && (
                <div className="mt-6 rounded-2xl bg-black/30 p-5 ring-1 ring-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">Cost breakdown</div>
                      <div className="mt-1 text-xs text-zinc-400">Which costs drive losses the most.</div>
                    </div>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300 ring-1 ring-white/10">
                      Explainable
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {costBreakdown.slice(0, 6).map((c) => (
                      <div key={c.col} className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 ring-1 ring-white/10">
                        <div className="text-sm text-zinc-200 truncate">{c.col}</div>
                        <div className="text-sm font-semibold">{money(c.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl bg-black/30 p-5 ring-1 ring-white/10">
                  <div className="text-sm font-semibold">Recommendations</div>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-200">
                    {kpis.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-black/30 p-5 ring-1 ring-white/10">
                  <div className="text-sm font-semibold">Top product</div>
                  <div className="mt-2 text-sm text-zinc-200">
                    {kpis.topProduct === "N/A" ? (
                      <span className="text-zinc-400">Select a product column to compute top product.</span>
                    ) : (
                      <>
                        <div className="text-lg font-semibold">{kpis.topProduct}</div>
                        <div className="mt-1 text-xs text-zinc-400">
                          Revenue contribution: <span className="text-zinc-200">{money(kpis.topProductRevenue)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-zinc-500">
          MVP • CSV/Excel + Google Sheets (public export) • Demo mode • Trend + Breakdown
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl bg-white/[0.06] p-5 ring-1 ring-white/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-zinc-400">{title}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
        </div>
        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300 ring-1 ring-white/10">
          {hint}
        </span>
      </div>
    </div>
  );
}
