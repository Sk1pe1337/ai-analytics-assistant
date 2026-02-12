"use client";

import React, { useMemo, useRef, useState } from "react";
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
  // accepts:
  // - full sheets url: https://docs.google.com/spreadsheets/d/<ID>/edit#gid=0
  // - already export url: .../export?format=csv&gid=0
  // - raw id
  const s = input.trim();
  if (!s) return "";

  if (s.includes("export?format=csv")) return s;

  const m = s.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const id = m?.[1] || (s.includes("/") ? "" : s);

  // best-effort gid extraction
  const gidMatch = s.match(/[?#&]gid=(\d+)/);
  const gid = gidMatch?.[1] || "0";

  if (!id) return "";
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"file" | "sheets">("file");

  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // mapping selections
  const [revenueCol, setRevenueCol] = useState<string>("");
  const [costCols, setCostCols] = useState<string[]>([]);
  const [productCol, setProductCol] = useState<string>("");

  // UI
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Google Sheets input
  const [sheetsInput, setSheetsInput] = useState("");
  const [sheetsHint, setSheetsHint] = useState("");

  const kpis = useMemo(() => {
    if (!parsed) return null;
    return computeKpis({
      rows: parsed.rows,
      revenueCol,
      costCols,
      productCol,
    });
  }, [parsed, revenueCol, costCols, productCol]);

  const statusBadge = useMemo(() => {
    if (!kpis) return { label: "No data", cls: "bg-white/5 text-zinc-300 ring-white/10" };
    if (kpis.profit < 0) return { label: "Loss", cls: "bg-rose-500/15 text-rose-200 ring-rose-500/25" };
    return { label: "Profitable", cls: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/25" };
  }, [kpis]);

  function applyAutoMapping(columns: string[]) {
    const suggestedRevenue =
      suggestColumn(columns, ["revenue", "sales", "amount", "total", "price", "value", "ordertotal", "net", "income"]) || "";
    const suggestedCost =
      suggestColumn(columns, ["cost", "expense", "expenses", "cogs", "spend", "fees", "shipping", "delivery", "tax", "rent", "salary", "marketing"]) || "";
    const suggestedProduct =
      suggestColumn(columns, ["product", "item", "name", "sku", "category"]) || "";

    setRevenueCol(suggestedRevenue);
    setCostCols(suggestedCost ? [suggestedCost] : []);
    setProductCol(suggestedProduct);
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

  function exportReport() {
    if (!parsed || !kpis) return;

    const payload = {
      generatedAt: new Date().toISOString(),
      source: fileName || "unknown",
      mapping: { revenueCol, costCols, productCol },
      kpis,
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

  return (
    <div className="min-h-screen bg-[#070713] text-zinc-100">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute top-40 -left-40 h-[560px] w-[560px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[720px] w-[720px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear_gradient(to_bottom,white_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      {/* Header */}
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
            <button
              onClick={logout}
              className="rounded-full bg-white/10 px-3 py-2 text-xs ring-1 ring-white/10 hover:bg-white/5"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
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

        {/* Panels */}
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

                <button
                  onClick={() => fileRef.current?.click()}
                  className="rounded-full bg-white/10 px-4 py-2 text-xs ring-1 ring-white/10 hover:bg-white/5"
                >
                  Choose file
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </div>

              {/* Dropzone */}
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
                    <div className="text-sm text-zinc-200">
                      {loading ? "Parsing..." : parsed ? "File loaded" : "Drop your file here"}
                    </div>
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
                  <div className={clsx("text-xs", dragOver ? "text-indigo-200" : "text-zinc-400")}>
                    {dragOver ? "Release to upload" : "CSV / Excel"}
                  </div>
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
            <div className="mt-4 rounded-2xl bg-rose-500/10 p-3 text-sm text-rose-200 ring-1 ring-rose-500/20">
              {error}
            </div>
          )}

          {/* Mapping + Preview */}
          {parsed && (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-black/30 p-5 ring-1 ring-white/10">
                <div className="text-sm font-semibold">Column mapping</div>
                <div className="mt-1 text-xs text-zinc-400">Pick revenue + costs (1+), product optional.</div>

                <div className="mt-4 grid gap-3">
                  <div>
                    <div className="text-xs text-zinc-300">Revenue (required)</div>
                    <select
                      value={revenueCol}
                      onChange={(e) => setRevenueCol(e.target.value)}
                      className="mt-1 w-full rounded-xl bg-black/40 p-3 text-sm text-zinc-100 ring-1 ring-white/10 outline-none focus:ring-indigo-500/40"
                    >
                      <option value="">— Select —</option>
                      {parsed.columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
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
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-xs text-zinc-400">
                    Tip: set revenue & at least one cost column for realistic profit/margin.
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
                          <th key={c} className="px-3 py-2 whitespace-nowrap">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-black/20 text-zinc-200">
                      {parsed.rows.slice(0, 8).map((r, idx) => (
                        <tr key={idx} className="border-t border-white/10">
                          {parsed.columns.slice(0, 8).map((c) => (
                            <td key={c} className="px-3 py-2 whitespace-nowrap">
                              {String(r[c] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* KPI + Insights */}
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
          MVP • supports CSV/Excel + Google Sheets (public export).
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
