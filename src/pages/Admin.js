/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║        NEXUS INTELLIGENCE — Admin Command Centre             ║
 * ║  Uses dashboard.css design system — no admin.css needed      ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { db, auth } from "../services/firebase";
import {
  collection, getDocs, addDoc, deleteDoc,
  doc, updateDoc, writeBatch,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";

function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("nexus-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("nexus-theme", dark ? "dark" : "light");
  }, [dark]);
  return { dark, toggle: () => setDark(d => !d) };
}

/* ════════════════════════════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════════════════════════════ */
const PLATFORMS  = ["Instagram","Google","Meta","YouTube","LinkedIn","TikTok","Email","Programmatic","Twitter","Pinterest","Snapchat","Display","Other"];
const TYPES      = ["Video","Search","Carousel","Sponsored","Newsletter","Display","Shopping","Story","Promoted","Reels","Other"];
const OBJECTIVES = ["Awareness","Conversions","Retargeting","Leads","Traffic","Engagement","Retention","Other"];
const STATUSES   = ["Active","Paused","Completed","Draft"];

const EMPTY_FORM = {
  name:"", platform:"", type:"", objective:"", status:"Active",
  clicks:"", reach:"", impressions:"", conversions:"",
  budget:"", spend:"", startDate:"", endDate:"", notes:"",
};

const fmt  = n => n >= 1e6 ? (n/1e6).toFixed(1)+"M" : n >= 1e3 ? (n/1e3).toFixed(0)+"k" : String(n||0);
const fmtR = n => "₹" + fmt(n);
const fmtN = n => Number(n||0).toLocaleString("en-IN");

/* ════════════════════════════════════════════════════════════════
   SVG ICON
════════════════════════════════════════════════════════════════ */
function Icon({ d, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={1.8}
         strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const IC = {
  campaigns: "M3 3h7v9H3zm11 0h7v5h-7zm0 9h7v9h-7zM3 16h7v5H3z",
  users:     "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  activity:  "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  system:    "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  add:       "M12 5v14M5 12h14",
  edit:      "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  trash:     "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  upload:    "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  download:  "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  search:    "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  close:     "M18 6L6 18M6 6l12 12",
  warn:      "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  logout:    "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  refresh:   "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  filter:    "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  copy:      "M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8l-4-4H8zm4 9v4m-2-2h4",
  promote:   "M7 11l5-5 5 5M7 17l5-5 5 5",
  demote:    "M7 7l5 5 5-5M7 13l5 5 5-5",
  eye:       "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  sortUp:    "M5 15l7-7 7 7",
  sortDown:  "M19 9l-7 7-7-7",
  shield:    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
};

/* ─── pill helpers ─── */
function statusClass(s)  { return s==="Active"?"pill-green":s==="Paused"?"pill-amber":s==="Draft"?"pill-blue":"pill-muted"; }
function roleClass(r)    { return r==="admin"?"pill-cyan":r==="manager"?"pill-purple":"pill-muted"; }
function actionClass(a)  {
  if (["CREATE","DUPLICATE"].includes(a)) return "pill-green";
  if (a==="UPDATE")    return "pill-cyan";
  if (["DELETE","DELETE ALL","BULK DELETE","REVOKE"].includes(a)) return "pill-red";
  if (a==="PROMOTE")   return "pill-purple";
  if (a==="DEMOTE")    return "pill-amber";
  return "pill-muted";
}

/* ════════════════════════════════════════════════════════════════
   TOAST STACK
════════════════════════════════════════════════════════════════ */
function Toasts({ list }) {
  const icons = { success:"✓", error:"✕", info:"ℹ", warning:"⚠" };
  return (
    <div className="db-toast-stack">
      {list.map(t => (
        <div key={t.id} className={`db-toast ${t.type}`}>
          <span>{icons[t.type]||"ℹ"}</span>
          <span className="db-toast-msg">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CONFIRM MODAL
════════════════════════════════════════════════════════════════ */
function ConfirmModal({ modal, onConfirm, onCancel }) {
  const [typed, setTyped] = useState("");
  useEffect(() => setTyped(""), [modal]);
  if (!modal) return null;
  const canGo = !modal.confirmText || typed === modal.confirmText;
  return (
    <div className="db-user-modal-overlay" onClick={onCancel}>
      <div className="glass db-user-modal" style={{ padding: "28px", maxWidth: 420, width: "100%", borderRadius: 18 }} onClick={e => e.stopPropagation()}>
        {/* icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, marginBottom: 14,
          background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red)"
        }}>
          <Icon d={IC.warn} size={22}/>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--txt)", marginBottom: 8, letterSpacing: "-0.02em" }}>{modal.title}</div>
        <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7, marginBottom: 16 }}>{modal.body}</p>
        {modal.confirmText && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              Type <strong style={{ color: "var(--txt)" }}>{modal.confirmText}</strong> to confirm
            </label>
            <input autoFocus value={typed} onChange={e => setTyped(e.target.value)}
                   style={inputStyle} placeholder={modal.confirmText}/>
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button style={btnOutlineStyle} onClick={onCancel}>Cancel</button>
          <button style={{ ...btnDangerStyle, opacity: canGo ? 1 : 0.4, cursor: canGo ? "pointer" : "not-allowed" }}
                  onClick={onConfirm} disabled={!canGo}>
            {modal.action || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   INLINE STYLE TOKENS (keeps parity with dashboard.css vars)
════════════════════════════════════════════════════════════════ */
const inputStyle = {
  width: "100%", background: "rgba(6,20,60,0.55)",
  border: "1px solid rgba(59,130,246,0.2)", borderRadius: 9,
  padding: "8px 11px", color: "var(--txt)", fontSize: 12,
  outline: "none", fontFamily: "inherit",
};
const selectStyle = { ...inputStyle, cursor: "pointer" };
const btnBase = {
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "7px 14px", borderRadius: 9, fontSize: 12,
  fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
  transition: "all 0.2s", border: "1px solid transparent",
  fontFamily: "inherit", lineHeight: 1,
};
const btnPrimaryStyle = { ...btnBase, background: "linear-gradient(135deg,#3B82F6,#0ea5e9)", color: "#fff", borderColor: "rgba(59,130,246,0.5)" };
const btnOutlineStyle = { ...btnBase, background: "rgba(59,130,246,0.08)", borderColor: "rgba(59,130,246,0.22)", color: "var(--blue-br)" };
const btnDangerStyle  = { ...btnBase, background: "rgba(248,113,113,0.12)", borderColor: "rgba(248,113,113,0.3)", color: "var(--red)" };
const btnWarningStyle = { ...btnBase, background: "rgba(245,158,11,0.10)", borderColor: "rgba(245,158,11,0.28)", color: "var(--amb)" };
const btnSmStyle      = { padding: "5px 10px", fontSize: 11 };
const btnXsStyle      = { padding: "4px 8px",  fontSize: 10 };
const actBtnStyle = {
  width: 28, height: 28, borderRadius: 8,
  background: "rgba(6,20,60,0.6)", border: "1px solid rgba(59,130,246,0.13)",
  color: "var(--muted)", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "all 0.15s", flexShrink: 0,
};

/* ════════════════════════════════════════════════════════════════
   CAMPAIGN FORM MODAL
════════════════════════════════════════════════════════════════ */
function CampaignModal({ form, setForm, onSave, onClose, isEdit, saving }) {
  const F = (key, label, type="text", opts=null) => (
    <div key={key} style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ fontSize:10, fontWeight:700, color:"var(--muted)", letterSpacing:"0.05em", textTransform:"uppercase" }}>{label}</label>
      {opts ? (
        <select style={selectStyle} value={form[key]} onChange={e => setForm(f => ({...f,[key]:e.target.value}))}>
          <option value="">Select…</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type==="textarea" ? (
        <textarea style={{ ...inputStyle, resize:"vertical" }} rows={3} value={form[key]}
                  onChange={e => setForm(f => ({...f,[key]:e.target.value}))}/>
      ) : (
        <input type={type} style={inputStyle} value={form[key]}
               onChange={e => setForm(f => ({...f,[key]:e.target.value}))}/>
      )}
    </div>
  );

  return (
    <div className="db-user-modal-overlay" onClick={onClose}>
      <div className="glass" onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 680, maxHeight: "90vh",
        borderRadius: 18, overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(59,130,246,0.1)",
        animation: "slideUp 0.22s ease",
      }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"20px 22px 16px", borderBottom:"1px solid var(--gb)", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--txt)", letterSpacing:"-0.02em" }}>
              {isEdit ? "Edit Campaign" : "New Campaign Deployment"}
            </div>
            <div style={{ fontSize:10, color:"var(--muted)", marginTop:3 }}>
              {isEdit ? "Update Firestore record — syncs instantly to dashboard" : "Save to Firestore — appears live in user dashboard"}
            </div>
          </div>
          <button style={actBtnStyle} onClick={onClose}><Icon d={IC.close} size={14}/></button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"18px 22px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            {F("name","Campaign Name *")}{F("platform","Platform","text",PLATFORMS)}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
            {F("type","Ad Type","text",TYPES)}{F("objective","Objective","text",OBJECTIVES)}{F("status","Status","text",STATUSES)}
          </div>

          <div style={{ height:1, background:"var(--gb)", margin:"14px 0 10px" }}/>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", color:"var(--muted)", textTransform:"uppercase", marginBottom:10 }}>Performance Metrics</div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
            {F("reach","Reach","number")}{F("impressions","Impressions","number")}{F("clicks","Clicks","number")}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
            {F("conversions","Conversions","number")}{F("budget","Budget (₹)","number")}{F("spend","Spend (₹)","number")}
          </div>

          <div style={{ height:1, background:"var(--gb)", margin:"14px 0 10px" }}/>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", color:"var(--muted)", textTransform:"uppercase", marginBottom:10 }}>Schedule</div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            {F("startDate","Start Date","date")}{F("endDate","End Date","date")}
          </div>
          {F("notes","Notes","textarea")}
        </div>

        {/* Footer */}
        <div style={{ display:"flex", gap:10, padding:"14px 22px", borderTop:"1px solid var(--gb)", flexShrink:0 }}>
          <button style={btnOutlineStyle} onClick={onClose}>Cancel</button>
          <button style={{ ...btnPrimaryStyle, flex:2, opacity: (saving||!form.name.trim()) ? 0.4 : 1 }}
                  onClick={onSave} disabled={saving||!form.name.trim()}>
            {saving ? "Saving to Firestore…" : isEdit ? "Save Changes" : "Create & Sync to Dashboard"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   USER DETAIL MODAL  (uses db-user-modal classes)
════════════════════════════════════════════════════════════════ */
function UserModal({ u, onClose, onPromote, onDemote, onRevoke }) {
  const initial = u.email?.[0]?.toUpperCase() || "?";
  const grad = u.role==="admin"
    ? "linear-gradient(135deg,#3B82F6,#22D3EE)"
    : u.role==="manager"
    ? "linear-gradient(135deg,#A78BFA,#3B82F6)"
    : "linear-gradient(135deg,#4B6A9B,#334155)";
  return (
    <div className="db-user-modal-overlay" onClick={onClose}>
      <div className="glass db-user-modal" onClick={e => e.stopPropagation()}>
        <div className="db-user-modal-banner">
          <button onClick={onClose} style={{
            position:"absolute", top:12, right:12,
            background:"rgba(255,255,255,0.07)", border:"1px solid rgba(59,130,246,0.15)",
            borderRadius:8, width:27, height:27, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", color:"var(--muted)"
          }}><Icon d={IC.close} size={13}/></button>
        </div>
        <div className="db-user-modal-body">
          <div className="db-modal-avatar" style={{ background: grad }}>{initial}</div>
          <div className="db-modal-name">{u.email?.split("@")[0] || "Unknown"}</div>
          <div className="db-modal-email">{u.email}</div>
          <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
            <span className={`pill ${roleClass(u.role)}`}>{u.role || "user"}</span>
            <span className="pill pill-green"><span className="dot dot-on"/>&nbsp;Active</span>
          </div>
          {[
            ["User ID",    u.id,                                                         "mono"],
            ["Department", u.department||"—",                                            ""],
            ["Joined",     u.createdAt?.toDate?.()?.toLocaleDateString("en-IN")||"—",    ""],
            ["Last Login", u.lastLogin||"—",                                             ""],
          ].map(([l,v,e]) => (
            <div key={l} className="db-modal-info-row">
              <span className="db-modal-info-label">{l}</span>
              <span className={`db-modal-info-value ${e}`}>{v}</span>
            </div>
          ))}
          <div style={{ display:"flex", gap:8, marginTop:14, flexWrap:"wrap" }}>
            <button style={{ ...btnPrimaryStyle, ...btnSmStyle }} onClick={onPromote}><Icon d={IC.promote} size={11}/> Promote</button>
            <button style={{ ...btnWarningStyle, ...btnSmStyle }} onClick={onDemote}><Icon d={IC.demote}  size={11}/> Demote</button>
            <button style={{ ...btnDangerStyle,  ...btnSmStyle }} onClick={onRevoke}><Icon d={IC.trash}   size={11}/> Revoke</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SORTABLE TH
════════════════════════════════════════════════════════════════ */
function SortTh({ label, k, sortKey, sortDir, onSort }) {
  const active = sortKey === k;
  return (
    <th onClick={() => onSort(k)} style={{ cursor:"pointer", userSelect:"none" }}>
      <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
        {label}
        <Icon d={active ? (sortDir==="asc" ? IC.sortUp : IC.sortDown) : IC.filter} size={9}/>
      </span>
    </th>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN ADMIN
════════════════════════════════════════════════════════════════ */
export default function Admin() {
  const navigate = useNavigate();
  const user     = auth.currentUser;


  const { dark, toggle } = useTheme();

  const [tab,        setTab]        = useState("campaigns");
  const [campaigns,  setCampaigns]  = useState([]);
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState({ campaigns:false, users:false });
  const [saving,     setSaving]     = useState(false);

  const [form,       setForm]       = useState(EMPTY_FORM);
  const [editId,     setEditId]     = useState(null);
  const [showForm,   setShowForm]   = useState(false);

  const [search,     setSearch]     = useState("");
  const [filtPlat,   setFiltPlat]   = useState("All");
  const [filtStat,   setFiltStat]   = useState("All");
  const [sortKey,    setSortKey]    = useState("name");
  const [sortDir,    setSortDir]    = useState("asc");
  const [selected,   setSelected]   = useState(new Set());

  const [userSearch,   setUserSearch]   = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const [actLog,     setActLog]     = useState([]);
  const [modal,      setModal]      = useState(null);
  const [pendingFn,  setPendingFn]  = useState(null);
  const [toasts,     setToasts]     = useState([]);
  const toastId = useRef(0);
  const [health,     setHealth]     = useState({ status:"checking", latency:null });

  /* ── Toast ── */
  const toast = useCallback((msg, type="success") => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);

  /* ── Activity log ── */
  const logAction = useCallback((action, detail="") => {
    setActLog(prev => [{
      id: Date.now(), action, detail,
      user: user?.email || "admin",
      timestamp: new Date(),
    }, ...prev].slice(0, 100));
  }, [user]);

  /* ── Confirm dialog ── */
  const confirmDlg = (title, body, action, fn, variant="danger", confirmText=null) => {
    setModal({ title, body, action, variant, confirmText });
    setPendingFn(() => fn);
  };
  const handleConfirm = async () => {
    setModal(null);
    if (pendingFn) await pendingFn();
    setPendingFn(null);
  };
  const handleCancel = () => { setModal(null); setPendingFn(null); };

  /* ── Fetch ── */
  const fetchCampaigns = useCallback(async () => {
    setLoading(l => ({...l, campaigns:true}));
    try {
      const snap = await getDocs(collection(db,"campaigns"));
      setCampaigns(snap.docs.map(d => ({id:d.id,...d.data()})));
    } catch { toast("Failed to load campaigns","error"); }
    finally { setLoading(l => ({...l, campaigns:false})); }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    setLoading(l => ({...l, users:true}));
    try {
      const snap = await getDocs(collection(db,"users"));
      setUsers(snap.docs.map(d => ({id:d.id,...d.data()})));
    } catch { toast("Failed to load users","error"); }
    finally { setLoading(l => ({...l, users:false})); }
  }, [toast]);

  const checkHealth = async () => {
    setHealth({ status:"checking", latency:null });
    const t0 = Date.now();
    try {
      await getDocs(collection(db,"campaigns"));
      setHealth({ status:"healthy", latency:Date.now()-t0 });
    } catch { setHealth({ status:"degraded", latency:null }); }
  };

  useEffect(() => { fetchCampaigns(); fetchUsers(); checkHealth(); }, [fetchCampaigns, fetchUsers]);

  /* ── Campaign CRUD ── */
  const openNew   = ()  => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  const openEdit  = (c) => { setForm({...EMPTY_FORM,...c}); setEditId(c.id); setShowForm(true); };
  const closeForm = ()  => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast("Campaign name required","warning"); return; }
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(), platform: form.platform,
        type: form.type, objective: form.objective, status: form.status||"Active",
        clicks: Number(form.clicks)||0, reach: Number(form.reach)||0,
        impressions: Number(form.impressions)||0, conversions: Number(form.conversions)||0,
        budget: Number(form.budget)||0, spend: Number(form.spend)||0,
        startDate: form.startDate, endDate: form.endDate,
        notes: form.notes, updatedAt: new Date(),
      };
      if (editId) {
        await updateDoc(doc(db,"campaigns",editId), data);
        toast("Campaign updated — synced to dashboard ✓");
        logAction("UPDATE", form.name);
      } else {
        await addDoc(collection(db,"campaigns"), {...data, createdAt:new Date()});
        toast("Campaign created — now live in dashboard ✓");
        logAction("CREATE", form.name);
      }
      closeForm(); fetchCampaigns();
    } catch(e) { toast("Save failed: "+e.message,"error"); }
    finally { setSaving(false); }
  };

  const handleDelete = (c) => {
    confirmDlg("Delete Campaign",
      `"${c.name}" will be permanently removed from Firestore.`,
      "Delete",
      async () => {
        await deleteDoc(doc(db,"campaigns",c.id));
        toast(`"${c.name}" deleted`,"info");
        logAction("DELETE", c.name); fetchCampaigns();
      }
    );
  };

  const handleDuplicate = async (c) => {
    const { id:_, ...data } = c;
    await addDoc(collection(db,"campaigns"),{...data, name:c.name+" (Copy)", createdAt:new Date()});
    toast("Campaign duplicated — live on dashboard");
    logAction("DUPLICATE", c.name); fetchCampaigns();
  };

  const handleDeleteAll = () => {
    confirmDlg(
      "Nuke Entire Campaign Database",
      `ALL ${campaigns.length} campaigns will be permanently destroyed. The user dashboard will immediately go empty.`,
      "Nuke All",
      async () => {
        const batch = writeBatch(db);
        campaigns.forEach(c => batch.delete(doc(db,"campaigns",c.id)));
        await batch.commit();
        toast("All campaigns deleted","info");
        logAction("DELETE ALL", campaigns.length+" records"); fetchCampaigns();
      },
      "danger", "DELETE ALL"
    );
  };

  const handleDeleteSelected = () => {
    confirmDlg("Delete Selected",
      `${selected.size} campaign(s) will be removed from Firestore.`,
      "Delete Selected",
      async () => {
        const batch = writeBatch(db);
        selected.forEach(id => batch.delete(doc(db,"campaigns",id)));
        await batch.commit();
        toast(`${selected.size} campaigns deleted`,"info");
        logAction("BULK DELETE", selected.size+" records");
        setSelected(new Set()); fetchCampaigns();
      }
    );
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      setSaving(true);
      const lines = ev.target.result.split("\n").slice(1).filter(l => l.trim());
      const batch = writeBatch(db);
      let count = 0;
      lines.forEach(row => {
        const cols = row.split(",");
        if (cols.length >= 3 && cols[0].trim()) {
          batch.set(doc(collection(db,"campaigns")), {
            name: cols[0].trim(), platform: cols[1]?.trim()||"",
            clicks: Number(cols[2])||0, reach: Number(cols[3])||0,
            impressions: Number(cols[4])||0, conversions: Number(cols[5])||0,
            budget: Number(cols[6])||0, spend: Number(cols[7])||0,
            status: cols[8]?.trim()||"Active", createdAt: new Date(),
          });
          count++;
        }
      });
      try {
        await batch.commit();
        toast(`${count} campaigns imported — live on dashboard ✓`);
        logAction("CSV IMPORT", count+" records"); fetchCampaigns();
      } catch { toast("CSV import failed","error"); }
      finally { setSaving(false); e.target.value = null; }
    };
    reader.readAsText(file);
  };

  const exportCSV = () => {
    const headers = ["Name","Platform","Type","Objective","Status","Reach","Impressions","Clicks","Conversions","Budget","Spend","Start","End","Notes"];
    const rows    = filtered.map(c => [c.name,c.platform,c.type,c.objective,c.status,c.reach,c.impressions,c.clicks,c.conversions,c.budget,c.spend||0,c.startDate,c.endDate,c.notes||""]);
    const blob = new Blob([[headers,...rows].map(r => r.join(",")).join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `Nexus_Campaigns_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    toast("CSV exported"); logAction("EXPORT", filtered.length+" records");
  };

  /* ── Filtering + sorting ── */
  const platforms = ["All",...new Set(campaigns.map(c => c.platform).filter(Boolean))];
  const statuses  = ["All",...STATUSES];

  const filtered = campaigns
    .filter(c => {
      const q = search.toLowerCase();
      return (
        (!q || c.name?.toLowerCase().includes(q) || c.platform?.toLowerCase().includes(q)) &&
        (filtPlat==="All" || c.platform===filtPlat) &&
        (filtStat==="All" || c.status===filtStat)
      );
    })
    .sort((a,b) => {
      const av=a[sortKey]??"", bv=b[sortKey]??"";
      const cmp = typeof av==="number" ? av-bv : String(av).localeCompare(String(bv));
      return sortDir==="asc" ? cmp : -cmp;
    });

  const toggleSort = (k) => { if(sortKey===k) setSortDir(d => d==="asc"?"desc":"asc"); else { setSortKey(k); setSortDir("asc"); } };
  const allSel    = filtered.length>0 && filtered.every(c => selected.has(c.id));
  const toggleAll = () => allSel ? setSelected(new Set()) : setSelected(new Set(filtered.map(c => c.id)));
  const toggleOne = (id) => setSelected(prev => { const s=new Set(prev); s.has(id)?s.delete(id):s.add(id); return s; });

  /* ── User management ── */
const ROLES = ["user", "manager", "admin"];



const handlePromote = async (u) => {
  const newRole = ROLES[Math.min(ROLES.indexOf(u.role || "user") + 1, ROLES.length - 1)];
  await updateDoc(doc(db, "users", u.id), { role: newRole });
  toast(`${u.email} → ${newRole}`);
  logAction("PROMOTE", `${u.email} → ${newRole}`);
  setSelectedUser(null);
  fetchUsers();
};

const handleDemote = async (u) => {
  const newRole = ROLES[Math.max(ROLES.indexOf(u.role || "user") - 1, 0)];
  await updateDoc(doc(db, "users", u.id), { role: newRole });
  toast(`${u.email} → ${newRole}`, "warning");
  logAction("DEMOTE", `${u.email} → ${newRole}`);
  setSelectedUser(null);
  fetchUsers();
};

const handleRevoke = (u) => {
  confirmDlg(
    "Revoke User Access",
    `"${u.email}" will be permanently removed.`,
    "Revoke",
    async () => {
      await deleteDoc(doc(db, "users", u.id));
      toast(`${u.email} revoked`, "info");
      logAction("REVOKE", u.email);
      setSelectedUser(null);
      fetchUsers();
    }
  );
};

  /* ── Aggregates ── */
  const totBudget   = campaigns.reduce((a,c) => a+(Number(c.budget)||0),0);
  const totReach    = campaigns.reduce((a,c) => a+(Number(c.reach)||0),0);
  const totConv     = campaigns.reduce((a,c) => a+(Number(c.conversions)||0),0);
  const activeCount = campaigns.filter(c => c.status==="Active").length;
  const filteredUsers = users.filter(u => !userSearch || u.email?.toLowerCase().includes(userSearch.toLowerCase()));

  const TH = ({label,k}) => <SortTh label={label} k={k} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}/>;

  /* ════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════ */
  return (
    <div className="db-shell">
      <div className="db-bg"><div className="db-bg-orb3"/></div>

      {/* ══ SIDEBAR ══ */}
      <aside className="db-sidebar">
        {/* Brand */}
        <div className="db-brand">
          <div className="db-brand-row">
            <div className="db-brand-icon">⚡</div>
            <div>
              <div className="db-brand-name">Digital Admin</div>
              <div className="db-brand-tag">Command Centre</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="db-nav-group">Management</div>
        {[
          { id:"campaigns", label:"Campaigns",      icon:IC.campaigns },
          { id:"users",     label:"Access Control", icon:IC.users },
          { id:"activity",  label:"Activity Log",   icon:IC.activity },
          { id:"system",    label:"System Health",  icon:IC.system },
        ].map(({ id, label, icon }) => (
          <button key={id} className={`db-nav-btn ${tab===id?"active":""}`} onClick={() => setTab(id)}>
            <Icon d={icon} size={13}/>{label}
          </button>
        ))}

        {/* Live status pill */}
        <div className="db-live-pill" style={{
          background: health.status==="healthy" ? "rgba(16,185,129,0.07)" : health.status==="checking" ? "rgba(245,158,11,0.07)" : "rgba(248,113,113,0.07)",
          borderColor: health.status==="healthy" ? "rgba(16,185,129,0.15)" : health.status==="checking" ? "rgba(245,158,11,0.15)" : "rgba(248,113,113,0.15)",
          color: health.status==="healthy" ? "var(--em)" : health.status==="checking" ? "var(--amb)" : "var(--red)",
        }}>
          <span className={`dot ${health.status==="healthy"?"dot-on":health.status==="checking"?"dot-blue":"dot-off"}`}/>
          {health.status==="healthy" ? `Live · ${health.latency}ms` : health.status==="checking" ? "Checking…" : "Degraded"}
        </div>

        {/* User card */}
        <div className="db-user-card" style={{ cursor:"default" }}>
          <div className="db-user-row">
            <div className="db-user-avatar">{user?.email?.[0]?.toUpperCase() || "A"}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="db-user-name">{user?.email?.split("@")[0] || "admin"}</div>
              <div className="db-user-role">Administrator</div>
            </div>
          </div>
          <button className="db-signout-btn" onClick={() => signOut(auth).then(() => navigate("/"))}>
            <Icon d={IC.logout} size={13}/> Sign Out
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main className="db-main">
        {/* Topbar */}
        <div className="db-topbar">
          <div>
            <span className="db-topbar-title">
              {{ campaigns:"Campaign Workspace", users:"Access Governance", activity:"Audit Trail", system:"System Health" }[tab]}
            </span>
            <span className="db-topbar-sub">
              {{ campaigns:`${campaigns.length} total · ${activeCount} active · saves sync live to dashboard`,
                 users:`${users.length} users registered`,
                 activity:`${actLog.length} actions this session`,
                 system:"Firestore health & diagnostics" }[tab]}
            </span>
          </div>
          <div className="flex-gap-6">
  <button
    className="db-theme-toggle"
    onClick={toggle}
    aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    type="button"
  >
    <span className="db-theme-label">{dark ? "Dark" : "Light"}</span>
    <div className="db-theme-track">
      <div className={`db-theme-pill ${dark ? "at-dark" : "at-light"}`} />
      <div className={`db-theme-option ${!dark ? "active" : ""}`}>
        <span className="db-theme-sun">☀️</span>
      </div>
      <div className={`db-theme-option ${dark ? "active" : ""}`}>
        <span className="db-theme-moon">🌙</span>
      </div>
    </div>
  </button>
  <span className="pill pill-amber">Admin Mode</span>
</div>
        </div>

        <div className="db-content">

          {/* ── Stats Row ── */}
          {(tab==="campaigns"||tab==="users") && (
            <div className="db-kpi-grid" style={{ gridTemplateColumns:"repeat(5,minmax(0,1fr))" }}>
              {[
                { l:"Total Campaigns",   v:campaigns.length,  c:"#60A5FA" },
                { l:"Active",            v:activeCount,        c:"#10B981" },
                { l:"Total Budget",      v:fmtR(totBudget),   c:"#A78BFA" },
                { l:"Total Reach",       v:fmt(totReach),     c:"#22D3EE" },
                { l:"Total Conversions", v:fmtN(totConv),     c:"#F59E0B" },
              ].map(({ l, v, c }) => (
                <div key={l} className="glass db-kpi">
                  <span className="db-kpi-label">{l}</span>
                  <span className="db-kpi-value" style={{ color:c, fontSize:22 }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* ═══ CAMPAIGNS TAB ═══ */}
          {tab==="campaigns" && (
            <>
              {/* Toolbar */}
              <div className="glass" style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", marginBottom:12, flexWrap:"wrap" }}>
                {/* Search */}
               {/* Search - Adjusted Size */}
<div style={{ position: "relative", flex: 2, minWidth: 250, maxWidth: 400 }}>
  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex", alignItems: "center", pointerEvents: "none" }}>
    <Icon d={IC.search} size={14}/>
  </span>
  <input 
    value={search} 
    onChange={e => setSearch(e.target.value)}
    placeholder="Search campaigns…"
    style={{ 
      ...inputStyle, 
      paddingLeft: 50, // Increased slightly to clear the icon
      height: "55px"   // Taller input
    }}
  />
</div>
                <select value={filtPlat} onChange={e => setFiltPlat(e.target.value)} style={{ ...selectStyle, width:128 }}>
                  {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={filtStat} onChange={e => setFiltStat(e.target.value)} style={{ ...selectStyle, width:108 }}>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {/* Right actions */}
                <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:"auto", flexWrap:"wrap" }}>
                  {selected.size > 0 && (
                    <button style={{ ...btnDangerStyle, ...btnSmStyle }} onClick={handleDeleteSelected}>
                      <Icon d={IC.trash} size={12}/> Delete {selected.size}
                    </button>
                  )}
                  <label style={{ ...btnOutlineStyle, ...btnSmStyle, cursor:"pointer" }}>
                    <Icon d={IC.upload} size={12}/>{saving ? "Importing…" : "Import CSV"}
                    <input type="file" accept=".csv" hidden onChange={handleCSVUpload} disabled={saving}/>
                  </label>
                  <button style={{ ...btnOutlineStyle, ...btnSmStyle }} onClick={exportCSV}>
                    <Icon d={IC.download} size={12}/> Export
                  </button>
                  <button style={{ ...btnDangerStyle, ...btnSmStyle }} onClick={handleDeleteAll}>
                    <Icon d={IC.trash} size={12}/> Nuke DB
                  </button>
                  <button style={{ ...btnPrimaryStyle, ...btnSmStyle }} onClick={openNew}>
                    <Icon d={IC.add} size={12}/> New Campaign
                  </button>
                </div>
              </div>

              {/* CSV hint */}
              <div style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"8px 14px", marginBottom:12, borderRadius:9,
                background:"rgba(59,130,246,0.05)", border:"1px solid rgba(59,130,246,0.12)",
                fontSize:10, color:"var(--muted)"
              }}>
                <Icon d={IC.shield} size={13}/>
                <span>CSV: <code style={{ background:"rgba(59,130,246,0.10)", borderRadius:4, padding:"1px 5px", color:"var(--blue-br)" }}>Name, Platform, Clicks, Reach, Impressions, Conversions, Budget, Spend, Status</code> — header row skipped. Campaigns appear <strong style={{ color:"var(--em)" }}>live</strong> on import.</span>
              </div>

              {/* Table */}
              <div className="glass" style={{ overflow:"hidden" }}>
                <div style={{ overflowX:"auto" }}>
                  <table className="db-table" style={{ minWidth:1080 }}>
                    <thead>
                      <tr>
                        <th style={{ width:36, cursor:"default" }}>
                          <input type="checkbox" checked={allSel} onChange={toggleAll}/>
                        </th>
                        <TH label="Campaign"  k="name"/>
                        <TH label="Platform"  k="platform"/>
                        <TH label="Status"    k="status"/>
                        <TH label="Reach"     k="reach"/>
                        <TH label="Clicks"    k="clicks"/>
                        <TH label="Conv."     k="conversions"/>
                        <TH label="Budget"    k="budget"/>
                        <TH label="Spend"     k="spend"/>
                        <TH label="ROI"       k="roi"/>
                        <th style={{ cursor:"default" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading.campaigns ? (
                        <tr><td colSpan={11} style={{ textAlign:"center", padding:"40px", color:"var(--muted)" }}>Loading campaigns…</td></tr>
                      ) : filtered.length===0 ? (
                        <tr><td colSpan={11}>
                          <div style={{ padding:"60px 20px", textAlign:"center" }}>
                            <div style={{ fontSize:42, opacity:0.2, marginBottom:12 }}>📂</div>
                            <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.7 }}>No campaigns found.<br/>Create one or import a CSV — campaigns appear live in the user dashboard.</div>
                          </div>
                        </td></tr>
                      ) : filtered.map(c => {
                        const roi = c.budget>0 ? Math.round(((c.conversions*150-c.budget)/c.budget)*100) : 0;
                        return (
                          <tr key={c.id} style={{ background: selected.has(c.id) ? "rgba(59,130,246,0.08)" : undefined }}>
                            <td style={{ textAlign:"center" }}>
                              <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleOne(c.id)}/>
                            </td>
                            <td style={{ fontWeight:700 }}>{c.name}</td>
                            <td>{c.platform ? <span className="pill pill-blue">{c.platform}</span> : "—"}</td>
                            <td><span className={`pill ${statusClass(c.status)}`}>{c.status||"—"}</span></td>
                            <td className="num" style={{ color:"var(--muted)" }}>{fmtN(c.reach)}</td>
                            <td className="num">{fmtN(c.clicks)}</td>
                            <td style={{ color:"var(--em)", fontWeight:700 }}>{fmtN(c.conversions)}</td>
                            <td className="num">₹{fmtN(c.budget)}</td>
                            <td className="num" style={{ color:"var(--muted)" }}>₹{fmtN(c.spend||0)}</td>
                            <td style={{ color:roi>0?"#10B981":"#F87171", fontWeight:700, fontVariantNumeric:"tabular-nums" }}>
                              {roi>0?"+":""}{roi}%
                            </td>
                            <td>
                              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                                <button className="btn-icon" title="Edit"      onClick={() => openEdit(c)}><Icon d={IC.edit}  size={13}/></button>
                                <button className="btn-icon" title="Duplicate" onClick={() => handleDuplicate(c)}><Icon d={IC.copy}  size={13}/></button>
                                <button className="btn-icon" title="Delete"    onClick={() => handleDelete(c)}
                                        style={{ ...actBtnStyle }}
                                        onMouseEnter={e => { e.currentTarget.style.color="var(--red)"; e.currentTarget.style.borderColor="rgba(248,113,113,0.35)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.color="var(--muted)"; e.currentTarget.style.borderColor="rgba(59,130,246,0.13)"; }}>
                                  <Icon d={IC.trash} size={13}/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Table footer */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderTop:"1px solid var(--gb)", background:"rgba(59,130,246,0.02)" }}>
                  <span style={{ fontSize:11, color:"var(--muted)" }}>
                    Showing <strong style={{ color:"var(--txt)" }}>{filtered.length}</strong> of <strong style={{ color:"var(--txt)" }}>{campaigns.length}</strong>
                    {selected.size>0 && <> · <span style={{ color:"var(--blue-br)" }}><strong>{selected.size} selected</strong></span></>}
                  </span>
                  <button style={{ ...btnOutlineStyle, ...btnXsStyle }} onClick={fetchCampaigns}>
                    <Icon d={IC.refresh} size={11}/> Refresh
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ═══ USERS TAB ═══ */}
          {tab==="users" && (
            <>
              <div className="glass" style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", marginBottom:12 }}>
                <div style={{ position:"relative", maxWidth:280 }}>
                  <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--muted)", display:"flex", alignItems:"center", pointerEvents:"none" }}>
                    <Icon d={IC.search} size={13}/>
                  </span>
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                         placeholder="Search by email…" style={{ ...inputStyle, paddingLeft:32 }}/>
                </div>
                <div style={{ marginLeft:"auto" }}>
                  <button style={{ ...btnOutlineStyle, ...btnSmStyle }} onClick={fetchUsers}>
                    <Icon d={IC.refresh} size={12}/> Refresh
                  </button>
                </div>
              </div>

              <div className="glass" style={{ overflow:"hidden" }}>
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>User</th><th>Email</th><th>Role</th>
                      <th>Status</th><th>UID</th><th style={{ cursor:"default" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.users ? (
                      <tr><td colSpan={6} style={{ textAlign:"center", padding:"40px", color:"var(--muted)" }}>Loading users…</td></tr>
                    ) : filteredUsers.length===0 ? (
                      <tr><td colSpan={6}>
                        <div style={{ padding:"60px 20px", textAlign:"center" }}>
                          <div style={{ fontSize:42, opacity:0.2, marginBottom:12 }}>👥</div>
                          <div style={{ fontSize:12, color:"var(--muted)" }}>No users found.</div>
                        </div>
                      </td></tr>
                    ) : filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{
                              width:26, height:26, borderRadius:"50%", flexShrink:0,
                              background:"linear-gradient(135deg,var(--blue),var(--cyan))",
                              display:"flex", alignItems:"center", justifyContent:"center",
                              fontSize:11, fontWeight:800, color:"#fff"
                            }}>{u.email?.[0]||"?"}</div>
                            <span style={{ fontWeight:600 }}>{u.email?.split("@")[0]}</span>
                          </div>
                        </td>
                        <td style={{ color:"var(--muted)", fontSize:11 }}>{u.email}</td>
                        <td><span className={`pill ${roleClass(u.role)}`}>{u.role||"user"}</span></td>
                        <td><div className="flex-gap-6" style={{ fontSize:11 }}><span className="dot dot-on"/>Active</div></td>
                        <td style={{ fontFamily:"'SF Mono','Fira Code',monospace", fontSize:10, maxWidth:110, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.id}</td>
                        <td>
                          <button className="btn-icon" onClick={() => setSelectedUser(u)}>
                            <Icon d={IC.eye} size={13}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display:"flex", alignItems:"center", padding:"10px 14px", borderTop:"1px solid var(--gb)", background:"rgba(59,130,246,0.02)" }}>
                  <span style={{ fontSize:11, color:"var(--muted)" }}>
                    <strong style={{ color:"var(--txt)" }}>{users.filter(u => u.role==="admin").length}</strong> admins ·{" "}
                    <strong style={{ color:"var(--txt)" }}>{users.filter(u => u.role==="manager").length}</strong> managers ·{" "}
                    <strong style={{ color:"var(--txt)" }}>{users.filter(u => !u.role||u.role==="user").length}</strong> users
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ═══ ACTIVITY TAB ═══ */}
          {tab==="activity" && (
            <div className="glass" style={{ overflow:"hidden", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:"1px solid var(--gb)" }}>
                <span style={{ fontSize:13, fontWeight:700, color:"var(--txt)" }}>Audit Trail</span>
                <button style={{ ...btnOutlineStyle, ...btnXsStyle }} onClick={() => { setActLog([]); toast("Log cleared","info"); }}>
                  <Icon d={IC.trash} size={11}/> Clear
                </button>
              </div>
              {actLog.length===0 ? (
                <div style={{ padding:"60px", textAlign:"center", color:"var(--muted)", fontSize:12, lineHeight:2 }}>
                  <div style={{ fontSize:34, marginBottom:10, opacity:0.2 }}>⏱</div>
                  No actions logged yet.<br/>Create, edit, or delete campaigns to generate entries.
                </div>
              ) : (
                <div style={{ maxHeight:480, overflowY:"auto" }}>
                  {actLog.map(e => (
                    <div key={e.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 18px", borderBottom:"1px solid rgba(59,130,246,0.06)" }}>
                      <div style={{ width:90, flexShrink:0 }}>
                        <span className={`pill ${actionClass(e.action)}`}>{e.action}</span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:"var(--txt)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.detail||"—"}</div>
                        <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>{e.user}</div>
                      </div>
                      <div style={{ fontSize:10, color:"var(--muted)", textAlign:"right", lineHeight:1.5, flexShrink:0 }}>
                        {e.timestamp.toLocaleDateString("en-IN",{month:"short",day:"numeric"})}<br/>
                        {e.timestamp.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ SYSTEM TAB ═══ */}
          {tab==="system" && (
            <>
              {/* Health cards */}
              <div className="db-grid-3">
                {[
                  { l:"Firebase Status",  v:health.status==="healthy"?"Connected":"Degraded", c:health.status==="healthy"?"#10B981":"#F87171", d:health.latency?`${health.latency}ms latency`:"Unavailable" },
                  { l:"Campaign Records", v:campaigns.length,  c:"#60A5FA", d:`${activeCount} active · ${campaigns.length-activeCount} paused/other` },
                  { l:"Registered Users", v:users.length,       c:"#A78BFA", d:`${users.filter(u=>u.role==="admin").length} admins · ${users.filter(u=>!u.role||u.role==="user").length} users` },
                ].map(({ l, v, c, d }) => (
                  <div key={l} className="glass db-kpi">
                    <span className="db-kpi-label">{l}</span>
                    <span className="db-kpi-value" style={{ color:c }}>{v}</span>
                    <span style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>{d}</span>
                  </div>
                ))}
              </div>

              {/* Diagnostics */}
              <div className="glass db-section" style={{ marginBottom:14 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                  <span className="db-section-title">Connection Diagnostics</span>
                  <button style={{ ...btnOutlineStyle, ...btnSmStyle }} onClick={checkHealth}>
                    <Icon d={IC.refresh} size={12}/> Run Check
                  </button>
                </div>
                {[
                  ["Firestore Connection", health.status==="healthy",  health.status==="healthy"?"Operational":"Unavailable"],
                  ["Authentication",       !!user,                     user?"Signed In":"Not Authenticated"],
                  ["Campaign Collection",  campaigns.length>=0,        `${campaigns.length} documents`],
                  ["Users Collection",     users.length>=0,            `${users.length} documents`],
                  ["Real-time Sync",       true,                       "Dashboard uses onSnapshot — updates instantly"],
                  ["Batch Write API",      true,                       "Available for CSV import"],
                  ["Activity Logging",     true,                       `${actLog.length} entries this session`],
                ].map(([label, ok, detail]) => (
                  <div key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", borderRadius:8, background:"rgba(59,130,246,0.04)", border:"1px solid rgba(59,130,246,0.08)", marginBottom:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"var(--txt)" }}>
                      <span className={`dot ${ok?"dot-on":"dot-off"}`}/>{label}
                    </div>
                    <span style={{ fontSize:11, fontWeight:600, color:ok?"var(--em)":"var(--red)" }}>{detail}</span>
                  </div>
                ))}
              </div>

              {/* Danger zone */}
              <div className="glass db-section" style={{ borderColor:"rgba(248,113,113,0.18)" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--red)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:14 }}>Danger Zone</div>
                {[
                  { name:"Clear All Campaigns", detail:"Permanently destroys all Firestore campaign records — dashboard goes empty immediately", action:handleDeleteAll, style:btnDangerStyle, label:"Clear All" },
                  { name:"Refresh All Data",     detail:"Re-fetch campaigns and users from Firestore", action:()=>{fetchCampaigns();fetchUsers();toast("Data refreshed");}, style:btnWarningStyle, label:"Refresh" },
                ].map(({ name, detail, action, style, label }) => (
                  <div key={name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, padding:"12px 14px", borderRadius:10, background:"rgba(248,113,113,0.04)", border:"1px solid rgba(248,113,113,0.10)", marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:"var(--txt)", marginBottom:2 }}>{name}</div>
                      <div style={{ fontSize:10, color:"var(--muted)" }}>{detail}</div>
                    </div>
                    <button style={{ ...style, ...btnSmStyle }} onClick={action}>{label}</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* ══ MODALS ══ */}
      {showForm && <CampaignModal form={form} setForm={setForm} onSave={handleSave} onClose={closeForm} isEdit={!!editId} saving={saving}/>}
      {selectedUser && <UserModal u={selectedUser} onClose={() => setSelectedUser(null)} onPromote={() => handlePromote(selectedUser)} onDemote={() => handleDemote(selectedUser)} onRevoke={() => handleRevoke(selectedUser)}/>}
      <ConfirmModal modal={modal} onConfirm={handleConfirm} onCancel={handleCancel}/>
      <Toasts list={toasts}/>
    </div>
  );
}
