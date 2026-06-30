import React, { useState, useEffect } from "react";
import {
  Box, Film, Image as ImageIcon, Upload, ChevronRight, ChevronLeft,
  Check, Clock, CircleDashed, CheckCircle2, Download, Layers,
  Sparkles, RotateCw, Play, ArrowRight, Stamp, X, AlertTriangle
} from "lucide-react";
import * as api from "./api/forgeviewClient";

// Maps DB status string -> the step index STATUS_STEPS already uses
const DB_STATUS_TO_STEP_INDEX = {
  received: 0, in_review: 1, modeling: 2, rendering: 3, ready: 4, on_hold: 1, rejected: 0,
};

/* ---------- tokens ----------
  bg        #16181C  graphite
  panel     #1D2025
  paper     #E8E5DE  steel/paper
  ink       #16181C
  muted     #8B8F98
  orange    #FF5A1F  signal/status
  blue      #3D5AFE  blueprint / 3D
  line      #2C3036
--------------------------------*/

const PACKAGES = [
  { id: "model3d", label: "3D Model", icon: Box, desc: "Production-grade mesh from your photos or specs.", price: 480, days: 4 },
  { id: "renders", label: "Render Set", icon: ImageIcon, desc: "8 photoreal angles, studio + lifestyle lighting.", price: 260, days: 2 },
  { id: "turntable", label: "Turntable Animation", icon: RotateCw, desc: "360° rotation, loopable, 1080p.", price: 220, days: 2 },
  { id: "aivideo", label: "AI Product Film", icon: Film, desc: "15–30s generated spot with motion + voiceover option.", price: 540, days: 5 },
  { id: "variants", label: "Color/Material Variants", icon: Layers, desc: "Up to 6 finish variants from one base model.", price: 180, days: 1 },
];

const STATUS_STEPS = ["Received", "In Review", "Modeling", "Rendering", "Ready"];

const SAMPLE_PROJECTS = [
  { id: "WO-2291", name: "Aria Desk Fan — DF-12", status: 3, packages: ["model3d", "renders", "turntable"], thumb: "fan" },
  { id: "WO-2287", name: "Trailhead Cooler 28qt", status: 4, packages: ["model3d", "renders", "aivideo"], thumb: "cooler" },
  { id: "WO-2279", name: "Nordlite Pendant Lamp", status: 1, packages: ["renders", "variants"], thumb: "lamp" },
];

function Stamp_({ children, color = "#FF5A1F" }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] tracking-widest uppercase font-mono border rounded-sm"
      style={{ color, borderColor: color }}
    >
      {children}
    </span>
  );
}

function PlaceholderThumb({ kind, className = "" }) {
  // simple geometric placeholder "renders" so the UI feels populated without real assets
  const shapes = {
    fan: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="30" fill="none" stroke="#3D5AFE" strokeWidth="2" />
        <circle cx="50" cy="50" r="4" fill="#FF5A1F" />
        <path d="M50 50 L50 22 A14 14 0 0 1 64 36 Z" fill="#3D5AFE" opacity="0.5" />
        <path d="M50 50 L74 58 A14 14 0 0 1 64 78 Z" fill="#3D5AFE" opacity="0.35" />
        <path d="M50 50 L30 70 A14 14 0 0 1 28 50 Z" fill="#3D5AFE" opacity="0.2" />
      </svg>
    ),
    cooler: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="20" y="35" width="60" height="40" rx="4" fill="none" stroke="#3D5AFE" strokeWidth="2" />
        <rect x="20" y="25" width="60" height="12" rx="3" fill="#3D5AFE" opacity="0.4" />
        <line x1="35" y1="35" x2="35" y2="75" stroke="#3D5AFE" strokeWidth="1" opacity="0.4" />
        <line x1="65" y1="35" x2="65" y2="75" stroke="#3D5AFE" strokeWidth="1" opacity="0.4" />
      </svg>
    ),
    lamp: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M35 30 L65 30 L58 55 L42 55 Z" fill="none" stroke="#3D5AFE" strokeWidth="2" />
        <line x1="50" y1="55" x2="50" y2="80" stroke="#3D5AFE" strokeWidth="2" />
        <circle cx="50" cy="20" r="3" fill="#FF5A1F" />
      </svg>
    ),
  };
  return (
    <div className={`flex items-center justify-center bg-[#13151A] ${className}`}>
      <div className="w-2/3 h-2/3 opacity-90">{shapes[kind] || shapes.fan}</div>
    </div>
  );
}

function Header({ view, setView }) {
  const navItem = (id, label) => (
    <button
      onClick={() => setView(id)}
      className={`font-mono text-[12px] tracking-widest uppercase px-3 py-2 transition-colors ${
        view === id ? "text-[#FF5A1F]" : "text-[#8B8F98] hover:text-[#E8E5DE]"
      }`}
    >
      {label}
    </button>
  );
  return (
    <header className="border-b border-[#2C3036] sticky top-0 z-30 bg-[#16181C]/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-14">
        <button onClick={() => setView("landing")} className="flex items-center gap-2">
          <div className="w-6 h-6 border border-[#FF5A1F] flex items-center justify-center">
            <div className="w-2 h-2 bg-[#FF5A1F]" />
          </div>
          <span className="font-mono text-[13px] tracking-[0.2em] uppercase text-[#E8E5DE]">Forgeview</span>
        </button>
        <nav className="hidden sm:flex items-center">
          {navItem("landing", "Studio")}
          {navItem("brief", "New Order")}
          {navItem("dashboard", "Work Orders")}
        </nav>
        <button
          onClick={() => setView("brief")}
          className="font-mono text-[11px] tracking-widest uppercase px-3 py-2 border border-[#E8E5DE] text-[#E8E5DE] hover:bg-[#E8E5DE] hover:text-[#16181C] transition-colors"
        >
          Start Order
        </button>
      </div>
    </header>
  );
}

function Landing({ setView }) {
  return (
    <div className="text-[#E8E5DE]">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-20 border-b border-[#2C3036]">
        <div className="flex items-center gap-3 mb-6">
          <Stamp_>Routing No. 001</Stamp_>
          <span className="font-mono text-[11px] text-[#8B8F98] tracking-widest uppercase">Product Visualization Shop</span>
        </div>
        <h1 className="text-[15vw] sm:text-[6.5rem] leading-[0.85] font-extrabold tracking-tight uppercase mb-8" style={{ fontFamily: "Arial Narrow, Oswald, sans-serif" }}>
          Send a part.<br />
          <span className="text-[#FF5A1F]">Get a film.</span>
        </h1>
        <div className="grid sm:grid-cols-3 gap-6 mt-10">
          <p className="text-[#8B8F98] text-sm leading-relaxed sm:col-span-2">
            Forgeview is a visualization shop for manufacturers. Upload photos or CAD of what you make —
            a fan, a cooler, a pump housing, a lamp — and our line turns it into production-grade 3D models,
            photoreal renders, turntables, and AI-generated product films. No studio, no photographer, no waiting on agencies.
          </p>
          <button
            onClick={() => setView("brief")}
            className="group flex items-center justify-between border border-[#FF5A1F] px-5 py-4 h-fit font-mono text-[12px] tracking-widest uppercase text-[#FF5A1F] hover:bg-[#FF5A1F] hover:text-[#16181C] transition-colors"
          >
            Open a work order
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Capability strip — work order metaphor */}
      <section className="max-w-6xl mx-auto px-5 py-16 border-b border-[#2C3036]">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-mono text-[12px] tracking-[0.2em] uppercase text-[#8B8F98]">Capabilities — Select Any Combination</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#2C3036]">
          {PACKAGES.map((p) => (
            <div key={p.id} className="bg-[#16181C] p-6 hover:bg-[#1D2025] transition-colors">
              <p.icon size={20} className="text-[#3D5AFE] mb-4" strokeWidth={1.5} />
              <h3 className="font-mono text-[13px] tracking-wide uppercase mb-2">{p.label}</h3>
              <p className="text-[#8B8F98] text-sm leading-relaxed mb-4">{p.desc}</p>
              <div className="flex items-center justify-between font-mono text-[11px] text-[#8B8F98]">
                <span>FROM ${p.price}</span>
                <span>{p.days}D TURN</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Before/after, mocked */}
      <section className="max-w-6xl mx-auto px-5 py-16 border-b border-[#2C3036]">
        <h2 className="font-mono text-[12px] tracking-[0.2em] uppercase text-[#8B8F98] mb-8">Recent Routing — Out the Door</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {SAMPLE_PROJECTS.map((proj) => (
            <button
              key={proj.id}
              onClick={() => setView({ name: "project", id: proj.id })}
              className="text-left border border-[#2C3036] hover:border-[#3D5AFE] transition-colors group"
            >
              <PlaceholderThumb kind={proj.thumb} className="h-40 border-b border-[#2C3036]" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-[#8B8F98]">{proj.id}</span>
                  <Stamp_ color={proj.status >= 4 ? "#3D5AFE" : "#FF5A1F"}>
                    {STATUS_STEPS[proj.status]}
                  </Stamp_>
                </div>
                <h3 className="text-sm">{proj.name}</h3>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-20 text-center">
        <p className="font-mono text-[11px] tracking-widest uppercase text-[#8B8F98] mb-4">No catalog. No minimums. One part at a time.</p>
        <button
          onClick={() => setView("brief")}
          className="font-mono text-[13px] tracking-widest uppercase px-8 py-4 bg-[#FF5A1F] text-[#16181C] hover:bg-[#E8E5DE] transition-colors"
        >
          Start a Work Order
        </button>
      </section>
    </div>
  );
}

function Brief({ setView }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({ company: "", product: "", material: "", dims: "", notes: "" });
  const [fileNames, setFileNames] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const total = selected.reduce((sum, id) => sum + PACKAGES.find((p) => p.id === id).price, 0);
  const maxDays = selected.length ? Math.max(...selected.map((id) => PACKAGES.find((p) => p.id === id).days)) : 0;

  const steps = ["Product", "Packages", "Review"];

  return (
    <div className="max-w-3xl mx-auto px-5 py-12 text-[#E8E5DE]">
      <div className="flex items-center gap-2 mb-2">
        <Stamp_>New Work Order</Stamp_>
      </div>
      <h1 className="font-mono text-2xl uppercase tracking-tight mb-8">Routing Slip</h1>

      {/* progress */}
      <div className="flex items-center mb-10 font-mono text-[11px] tracking-widest uppercase">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${i === step ? "text-[#FF5A1F]" : i < step ? "text-[#3D5AFE]" : "text-[#8B8F98]"}`}>
              <span className="w-5 h-5 border flex items-center justify-center text-[10px]" style={{ borderColor: "currentColor" }}>
                {i < step ? <Check size={11} /> : i + 1}
              </span>
              {s}
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-[#2C3036] mx-3" />}
          </React.Fragment>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-6">
          <div
            className="border-2 border-dashed border-[#2C3036] p-10 text-center hover:border-[#3D5AFE] transition-colors cursor-pointer"
            onClick={() =>
              setFileNames((f) => [...f, `reference_${f.length + 1}.jpg`])
            }
          >
            <Upload className="mx-auto mb-3 text-[#8B8F98]" size={28} strokeWidth={1.5} />
            <p className="text-sm text-[#8B8F98]">Drop product photos, CAD files, or spec sheets — click to simulate adding a file</p>
            {fileNames.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {fileNames.map((f) => (
                  <span key={f} className="font-mono text-[10px] px-2 py-1 bg-[#1D2025] border border-[#2C3036]">{f}</span>
                ))}
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} placeholder="Nordlite Manufacturing" />
            <Field label="Product Name" value={form.product} onChange={(v) => setForm({ ...form, product: v })} placeholder="Pendant Lamp PL-04" />
            <Field label="Primary Material" value={form.material} onChange={(v) => setForm({ ...form, material: v })} placeholder="Spun aluminum, brushed" />
            <Field label="Dimensions" value={form.dims} onChange={(v) => setForm({ ...form, dims: v })} placeholder='14" x 9" x 9"' />
          </div>
          <div>
            <label className="font-mono text-[11px] tracking-widest uppercase text-[#8B8F98] block mb-2">Notes for the modeling team</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Brand colors, reference lighting, intended use (web, catalog, ads)..."
              className="w-full bg-[#1D2025] border border-[#2C3036] px-3 py-2 text-sm focus:border-[#3D5AFE] outline-none"
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-px bg-[#2C3036]">
          {PACKAGES.map((p) => {
            const active = selected.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
                  active ? "bg-[#1D2025]" : "bg-[#16181C] hover:bg-[#1D2025]"
                }`}
              >
                <div
                  className="w-5 h-5 border flex items-center justify-center shrink-0"
                  style={{ borderColor: active ? "#FF5A1F" : "#8B8F98" }}
                >
                  {active && <Check size={12} className="text-[#FF5A1F]" />}
                </div>
                <p.icon size={18} className="text-[#3D5AFE] shrink-0" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="font-mono text-[13px] uppercase tracking-wide">{p.label}</p>
                  <p className="text-[#8B8F98] text-xs">{p.desc}</p>
                </div>
                <div className="font-mono text-[11px] text-[#8B8F98] text-right shrink-0">
                  <div>${p.price}</div>
                  <div>{p.days}d</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {step === 2 && (
        <div className="border border-[#2C3036]">
          <div className="p-5 border-b border-[#2C3036] flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-widest uppercase text-[#8B8F98]">Order Summary</span>
            <Stamp_>Draft</Stamp_>
          </div>
          <div className="p-5 space-y-4">
            <Row label="Company" value={form.company || "—"} />
            <Row label="Product" value={form.product || "—"} />
            <Row label="Material" value={form.material || "—"} />
            <Row label="Dimensions" value={form.dims || "—"} />
            <Row label="Files" value={fileNames.length ? `${fileNames.length} attached` : "None attached"} />
            <div className="pt-4 border-t border-[#2C3036]">
              <span className="font-mono text-[11px] tracking-widest uppercase text-[#8B8F98] block mb-2">Packages</span>
              {selected.length === 0 && <p className="text-sm text-[#8B8F98]">No packages selected yet.</p>}
              {selected.map((id) => {
                const p = PACKAGES.find((x) => x.id === id);
                return (
                  <div key={id} className="flex justify-between text-sm py-1">
                    <span>{p.label}</span>
                    <span className="font-mono text-[#8B8F98]">${p.price}</span>
                  </div>
                );
              })}
            </div>
            <div className="pt-4 border-t border-[#2C3036] flex items-center justify-between">
              <span className="font-mono text-[12px] tracking-widest uppercase">Total</span>
              <span className="font-mono text-xl text-[#FF5A1F]">${total}</span>
            </div>
            <p className="font-mono text-[11px] text-[#8B8F98]">Est. turnaround: {maxDays || 0} business days</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-10">
        <button
          onClick={() => (step === 0 ? setView("landing") : setStep(step - 1))}
          className="flex items-center gap-1 font-mono text-[12px] tracking-widest uppercase text-[#8B8F98] hover:text-[#E8E5DE]"
        >
          <ChevronLeft size={14} /> Back
        </button>
        {step < 2 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-1 font-mono text-[12px] tracking-widest uppercase px-5 py-3 border border-[#E8E5DE] hover:bg-[#E8E5DE] hover:text-[#16181C] transition-colors"
          >
            Continue <ChevronRight size={14} />
          </button>
        ) : (
          <div className="flex flex-col items-end gap-2">
            {submitError && (
              <p className="flex items-center gap-1 text-[#FF5A1F] text-xs font-mono">
                <AlertTriangle size={12} /> {submitError}
              </p>
            )}
            <button
              onClick={async () => {
                setSubmitting(true);
                setSubmitError(null);
                try {
                  // 1. Ensure a company exists (in a real app, this comes from auth/session)
                  const { company } = await api.createCompany({
                    name: form.company || "Unnamed Company",
                    contactEmail: "ops@example.com",
                  });

                  // 2. Create the work order with selected packages
                  const { workOrder } = await api.createWorkOrder({
                    companyId: company.id,
                    productName: form.product || "Untitled Product",
                    material: form.material,
                    dimensions: form.dims,
                    notes: form.notes,
                    packages: selected,
                    imageUrls: [], // would be populated by api.uploadFile() results
                  });

                  setView({ name: "project", id: workOrder.id });
                } catch (err) {
                  // Backend not running, or request failed — fall back to local-only flow
                  // so the prototype still demos without the API up.
                  setSubmitError(`Couldn't reach backend (${err.message}). Showing local preview instead.`);
                  setTimeout(() => setView("dashboard"), 1200);
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={selected.length === 0 || submitting}
              className="flex items-center gap-1 font-mono text-[12px] tracking-widest uppercase px-5 py-3 bg-[#FF5A1F] text-[#16181C] hover:bg-[#E8E5DE] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Order"} <Check size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="font-mono text-[11px] tracking-widest uppercase text-[#8B8F98] block mb-2">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#1D2025] border border-[#2C3036] px-3 py-2 text-sm focus:border-[#3D5AFE] outline-none"
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[#8B8F98]">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Dashboard({ setView }) {
  const [orders, setOrders] = useState(SAMPLE_PROJECTS);
  const [usingLiveData, setUsingLiveData] = useState(false);

  useEffect(() => {
    api
      .listWorkOrders()
      .then(({ workOrders }) => {
        if (workOrders.length > 0) {
          setOrders(
            workOrders.map((wo) => ({
              id: wo.order_number,
              dbId: wo.id,
              name: wo.product_name,
              status: DB_STATUS_TO_STEP_INDEX[wo.status] ?? 0,
              packages: [], // populate from station_jobs if needed in list view
              thumb: "fan", // placeholder art until real thumbnails exist
            }))
          );
          setUsingLiveData(true);
        }
      })
      .catch(() => {
        // backend not reachable — keep showing SAMPLE_PROJECTS
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-5 py-12 text-[#E8E5DE]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Stamp_>Active Routing</Stamp_>
            {!usingLiveData && <Stamp_ color="#8B8F98">Demo Data</Stamp_>}
          </div>
          <h1 className="font-mono text-2xl uppercase tracking-tight mt-2">Work Orders</h1>
        </div>
        <button
          onClick={() => setView("brief")}
          className="font-mono text-[11px] tracking-widest uppercase px-4 py-2 border border-[#E8E5DE] hover:bg-[#E8E5DE] hover:text-[#16181C] transition-colors"
        >
          + New Order
        </button>
      </div>

      <div className="space-y-px bg-[#2C3036]">
        {orders.map((proj) => (
          <button
            key={proj.id}
            onClick={() => setView({ name: "project", id: proj.dbId || proj.id })}
            className="w-full bg-[#16181C] hover:bg-[#1D2025] transition-colors p-5 flex items-center gap-5 text-left"
          >
            <PlaceholderThumb kind={proj.thumb} className="w-16 h-16 shrink-0 border border-[#2C3036]" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-[10px] text-[#8B8F98]">{proj.id}</span>
                <span className="font-mono text-[10px] text-[#8B8F98]">·</span>
                <span className="font-mono text-[10px] text-[#8B8F98]">{proj.packages.length} packages</span>
              </div>
              <h3 className="text-sm truncate">{proj.name}</h3>
            </div>
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              {STATUS_STEPS.map((s, i) => (
                <div key={s} className="flex items-center">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: i <= proj.status ? (i === proj.status ? "#FF5A1F" : "#3D5AFE") : "#2C3036",
                    }}
                  />
                  {i < STATUS_STEPS.length - 1 && <div className="w-4 h-px bg-[#2C3036]" />}
                </div>
              ))}
            </div>
            <span className="font-mono text-[11px] text-[#8B8F98] w-24 text-right shrink-0">{STATUS_STEPS[proj.status]}</span>
            <ChevronRight size={16} className="text-[#8B8F98] shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProjectDetail({ id, setView }) {
  const sampleMatch = SAMPLE_PROJECTS.find((p) => p.id === id);
  const [proj, setProj] = useState(
    sampleMatch || { id, name: "Loading...", status: 0, packages: [], thumb: "fan" }
  );
  const [liveAssets, setLiveAssets] = useState(null);
  const [tab, setTab] = useState("3d");

  useEffect(() => {
    if (sampleMatch) return; // already showing demo data, nothing to fetch
    api
      .getWorkOrder(id)
      .then(({ workOrder }) => {
        setProj({
          id: workOrder.order_number,
          name: workOrder.product_name,
          status: DB_STATUS_TO_STEP_INDEX[workOrder.status] ?? 0,
          packages: workOrder.stationJobs.map((j) => j.package_type),
          thumb: "fan",
        });
        setLiveAssets(workOrder.assets);
      })
      .catch(() => {
        // backend unreachable or unknown id — leave the "Loading..." stand-in
      });
  }, [id]);

  const isReady = proj.status >= 4;

  return (
    <div className="max-w-6xl mx-auto px-5 py-10 text-[#E8E5DE]">
      <button onClick={() => setView("dashboard")} className="flex items-center gap-1 font-mono text-[11px] tracking-widest uppercase text-[#8B8F98] hover:text-[#E8E5DE] mb-6">
        <ChevronLeft size={14} /> All Work Orders
      </button>

      <div className="flex items-start justify-between mb-2 flex-wrap gap-3">
        <div>
          <span className="font-mono text-[11px] text-[#8B8F98]">{proj.id}</span>
          <h1 className="font-mono text-2xl uppercase tracking-tight">{proj.name}</h1>
        </div>
        <Stamp_ color={isReady ? "#3D5AFE" : "#FF5A1F"}>{STATUS_STEPS[proj.status]}</Stamp_>
      </div>

      {/* status track full */}
      <div className="flex items-center my-8 font-mono text-[10px] tracking-widest uppercase">
        {STATUS_STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex flex-col items-center gap-1 ${i <= proj.status ? "text-[#E8E5DE]" : "text-[#8B8F98]"}`}>
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: i <= proj.status ? (i === proj.status ? "#FF5A1F" : "#3D5AFE") : "#2C3036" }}
              />
              {s}
            </div>
            {i < STATUS_STEPS.length - 1 && <div className="flex-1 h-px bg-[#2C3036] mx-2 mb-4" />}
          </React.Fragment>
        ))}
      </div>

      {/* tabs for deliverables */}
      <div className="flex gap-1 border-b border-[#2C3036] mb-6">
        {[
          { id: "3d", label: "3D Model", icon: Box },
          { id: "renders", label: "Renders", icon: ImageIcon },
          { id: "video", label: "AI Video", icon: Film },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 font-mono text-[11px] tracking-widest uppercase border-b-2 -mb-px transition-colors ${
              tab === t.id ? "border-[#FF5A1F] text-[#FF5A1F]" : "border-transparent text-[#8B8F98] hover:text-[#E8E5DE]"
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "3d" && (
        <div className="border border-[#2C3036]">
          <div className="relative h-80 bg-[#13151A] flex items-center justify-center">
            <PlaceholderThumb kind={proj.thumb} className="w-48 h-48" />
            <div className="absolute bottom-3 right-3 font-mono text-[10px] text-[#8B8F98] flex items-center gap-1">
              <RotateCw size={12} /> drag to orbit — mock viewer
            </div>
          </div>
          <div className="p-4 flex items-center justify-between border-t border-[#2C3036]">
            <span className="font-mono text-[11px] text-[#8B8F98]">forgeview_{proj.id.toLowerCase()}.glb · 14.2 MB</span>
            <button className="flex items-center gap-1 font-mono text-[11px] tracking-widest uppercase text-[#3D5AFE] hover:text-[#E8E5DE]">
              <Download size={13} /> Download
            </button>
          </div>
        </div>
      )}

      {tab === "renders" && (
        <div className="grid sm:grid-cols-4 gap-px bg-[#2C3036]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#16181C] relative group">
              <PlaceholderThumb kind={proj.thumb} className="h-32" />
              <button className="absolute inset-0 bg-[#16181C]/0 group-hover:bg-[#16181C]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <Download size={16} className="text-[#E8E5DE]" />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "video" && (
        <div className="border border-[#2C3036]">
          <div className="relative h-80 bg-[#13151A] flex items-center justify-center">
            {isReady ? (
              <button className="w-16 h-16 rounded-full border-2 border-[#FF5A1F] flex items-center justify-center hover:bg-[#FF5A1F] group transition-colors">
                <Play size={22} className="text-[#FF5A1F] group-hover:text-[#16181C] ml-1" />
              </button>
            ) : (
              <div className="text-center">
                <Sparkles className="mx-auto mb-3 text-[#8B8F98]" size={24} />
                <p className="font-mono text-[11px] tracking-widest uppercase text-[#8B8F98]">Generating — ready after rendering stage</p>
              </div>
            )}
          </div>
          <div className="p-4 flex items-center justify-between border-t border-[#2C3036]">
            <span className="font-mono text-[11px] text-[#8B8F98]">22s · 1080p · AI-generated product film</span>
            {isReady && (
              <button className="flex items-center gap-1 font-mono text-[11px] tracking-widest uppercase text-[#3D5AFE] hover:text-[#E8E5DE]">
                <Download size={13} /> Download
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("landing");
  const name = typeof view === "string" ? view : view.name;

  return (
    <div className="min-h-screen bg-[#16181C]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <Header view={name} setView={setView} />
      {name === "landing" && <Landing setView={setView} />}
      {name === "brief" && <Brief setView={setView} />}
      {name === "dashboard" && <Dashboard setView={setView} />}
      {name === "project" && <ProjectDetail id={view.id} setView={setView} />}
    </div>
  );
}
