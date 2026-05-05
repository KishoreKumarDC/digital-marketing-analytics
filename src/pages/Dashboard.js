/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║        NEXUS INTELLIGENCE — User Dashboard                   ║
 * ║  Real-time Firestore · Black × Blue Glass · Gemini AI       ║
 * ║  Set your Google Gemini API key on line below               ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../services/firebase";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import "./dashboard.css";



/* ════════════════════════════════════════════════════════════════
   SVG ICONS
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
  overview:    "M3 3h7v9H3zm11 0h7v5h-7zm0 9h7v9h-7zM3 16h7v5H3z",
  campaigns:   "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  analytics:   "M18 20V10M12 20V4M6 20v-6",
  engagement:  "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  roi:         "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  ai:          "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  send:        "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  mic:         "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8",
  micOff:      "M1 1l22 22M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6M17 16.95A7 7 0 015 12v-2m14 0v2c0 .386-.035.764-.1 1.13M12 19v4M8 23h8",
  history:     "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  newChat:     "M12 5v14M5 12h14",
  logout:      "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  close:       "M18 6L6 18M6 6l12 12",
  chevR:       "M9 18l6-6-6-6",
  refresh:     "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  user:        "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  trash:       "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  clock:       "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  spark:       "M13 10V3L4 14h7v7l9-11h-7z",
};

/* ════════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════════ */
const fmt   = n => n >= 1e6 ? (n/1e6).toFixed(2)+"M" : n >= 1e3 ? (n/1e3).toFixed(0)+"k" : String(n||0);
const fmtR  = n => "₹" + fmt(n);
const fmtN  = n => Number(n||0).toLocaleString("en-IN");
const clamp = (v,mn,mx) => Math.min(Math.max(v,mn),mx);

const PLATFORM_COLORS = {
  Instagram:"#A78BFA", Google:"#60A5FA", Meta:"#22D3EE",
  YouTube:"#F87171",   LinkedIn:"#3B82F6", TikTok:"#10B981",
  Email:"#F59E0B",     Programmatic:"#22D3EE", Twitter:"#60A5FA",
  Pinterest:"#F87171", Snapchat:"#F59E0B", Display:"#A78BFA", Other:"#94A3B8",
};

function statusClass(s) {
  switch(s) {
    case "Active":    return "pill-green";
    case "Paused":    return "pill-amber";
    case "Completed": return "pill-muted";
    case "Draft":     return "pill-blue";
    default:          return "pill-muted";
  }
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"rgba(4,15,50,0.9)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:9, padding:"9px 13px", fontSize:11, backdropFilter:"blur(14px)" }}>
      {label && <p style={{ color:"#4B6A9B", marginBottom:4, fontSize:10 }}>{label}</p>}
      {payload.map((p,i) => (
        <p key={i} style={{ color: p.color || "#EFF6FF", margin:"2px 0" }}>
          {p.name}: <strong>{p.value?.toLocaleString?.() || p.value}</strong>
        </p>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TOAST
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
   AI CHAT PANEL  — Groq API
════════════════════════════════════════════════════════════════ */

// const GROQ_API_KEY = "GROQ_API_KEY"; // 🔑 Replace with your Groq API key

const GROQ_MODEL   = "llama-3.3-70b-versatile"; // Current recommended; alternatives: "llama-3.1-8b-instant", "gemma2-9b-it"

function AiPanel({ campaigns, showToast }) {
  const INIT = [{ role:"ai", text:`Intelligence online. Watching ${campaigns.length} live campaigns in real-time via Firestore. Ask me about performance, ROI, budget, or fatigue — or use voice input.` }];
  const [hist,      setHist]      = useState(INIT);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [sessions,  setSessions]  = useState(() => { try { return JSON.parse(localStorage.getItem("nx_sess")||"[]"); } catch { return []; } });
  const [showHist,  setShowHist]  = useState(false);
  const [recording, setRecording] = useState(false);
  const recRef  = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    setHist([{ role:"ai", text:`Intelligence online. Watching ${campaigns.length} live campaign${campaigns.length===1?"":"s"} from Firestore. Ask me anything.` }]);
  }, [campaigns.length]);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = 9e9; }, [hist, loading]);

  const saveSession = useCallback(() => {
    if (hist.length <= 1) return;
    const firstUser = hist.find(m => m.role === "user");
    const s = { id:Date.now(), ts:new Date().toISOString(), preview:firstUser?.text?.slice(0,55)||"Session", messages:hist };
    const updated = [s, ...sessions].slice(0, 25);
    setSessions(updated);
    localStorage.setItem("nx_sess", JSON.stringify(updated));
  }, [hist, sessions]);

  const newChat  = () => { saveSession(); setHist(INIT); };
  const loadSess = (s) => { setHist(s.messages); setShowHist(false); };
  const clearAll = () => { setSessions([]); localStorage.removeItem("nx_sess"); setShowHist(false); showToast("History cleared","info"); };

  const toggleVoice = async () => {
    // Stop if already recording
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }

    // Browser support check
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      showToast("Voice not supported. Please use Chrome or Edge.", "error");
      return;
    }

    // Explicitly request mic permission first so we get a clear error
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // release immediately; SR manages its own stream
    } catch (permErr) {
      showToast("Microphone blocked. Allow mic access in browser settings.", "error");
      return;
    }

    const r = new SR();
    recRef.current    = r;
    r.lang            = "en-IN";
    r.continuous      = false;
    r.interimResults  = false;
    r.maxAlternatives = 1;

    r.onstart = () => setRecording(true);
    r.onend   = () => setRecording(false);

    r.onerror = (e) => {
      setRecording(false);
      const msgs = {
        "not-allowed"  : "Mic blocked — allow microphone access in your browser.",
        "no-speech"    : "No speech detected. Please try again.",
        "audio-capture": "No microphone found. Check your device settings.",
        "network"      : "Network error during voice recognition.",
        "aborted"      : "Voice input cancelled.",
      };
      showToast(msgs[e.error] || `Voice error: ${e.error}`, "error");
    };

    r.onresult = (e) => {
      const t = e.results[0][0].transcript.trim();
      if (t) {
        setInput(t);
        showToast(`Voice: "${t.slice(0, 40)}..."`, "info");
      }
    };

    try {
      r.start();
    } catch (startErr) {
      setRecording(false);
      showToast("Could not start voice input. Try again.", "error");
    }
  };

  const ask = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");

    const totBudget = campaigns.reduce((a,c)=>a+(Number(c.budget)||0),0);
    const totConv   = campaigns.reduce((a,c)=>a+(Number(c.conversions)||0),0);
    const totReach  = campaigns.reduce((a,c)=>a+(Number(c.reach)||0),0);
    const updated   = [...hist, { role:"user", text:q }];
    setHist(updated);
    setLoading(true);

    try {
      /* ── Build the system prompt ── */
      const systemText = `You are Nexus AI, an elite marketing intelligence assistant.
Live Firestore portfolio: ${campaigns.length} campaigns. Total reach: ${fmtN(totReach)}. Budget: ${fmtR(totBudget)}. Conversions: ${fmtN(totConv)}.
Top campaign by budget: ${[...campaigns].sort((a,b)=>b.budget-a.budget)[0]?.name || "—"}.
Active campaigns: ${campaigns.filter(c=>c.status==="Active").length}.
Respond in 2-4 sentences. Be precise and recommend a clear action.`;

      /* ── Convert chat history → Groq/OpenAI format ──
         Groq uses OpenAI-compatible roles: "system" | "user" | "assistant"
         Skip the initial AI greeting (index 0); it's already captured in the system prompt context.
         Ensure the conversation starts with a "user" message. */
      const groqMessages = [
        { role: "system", content: systemText },
        ...updated
          .filter(m => m.role === "user" || m.role === "ai")
          .map(m => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.text,
          }))
          // Drop any leading "assistant" messages (the initial greeting)
          .slice(updated.findIndex(m => m.role === "user") >= 0
            ? updated.slice(0).findIndex(m => m.role === "user")
            : 0),
      ];

      const res = await fetch("/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: GROQ_MODEL,
    messages: groqMessages,
  }),
});

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data?.error?.message || `HTTP ${res.status}`;
        throw new Error(errMsg);
      }

      const aiText =
        data?.choices?.[0]?.message?.content?.trim() ||
        "No response received.";

      setHist(p => [...p, { role:"ai", text: aiText }]);

    } catch(e) {
      setHist(p => [...p, { role:"ai", text:`⚠ ${e.message}. Check your GROQ_API_KEY in AiPanel.jsx.` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="db-ai-panel">
      {showHist && (
        <div style={{ position:"absolute",inset:0,background:"rgba(2,8,23,0.95)",backdropFilter:"blur(14px)",zIndex:10,display:"flex",flexDirection:"column" }}>
          <div style={{ padding:"11px 13px",borderBottom:"1px solid rgba(59,130,246,0.13)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
            <span style={{ fontSize:12,fontWeight:700,color:"#EFF6FF" }}>Session History</span>
            <div style={{ display:"flex",gap:5 }}>
              {sessions.length > 0 && (
                <button className="btn btn-glass" style={{ padding:"4px 9px",fontSize:10 }} onClick={clearAll}>
                  <Icon d={IC.trash} size={11}/> Clear
                </button>
              )}
              <button className="btn-icon" onClick={()=>setShowHist(false)}><Icon d={IC.close} size={12}/></button>
            </div>
          </div>
          <div style={{ flex:1,overflowY:"auto",padding:"8px" }}>
            {sessions.length === 0
              ? <div style={{ textAlign:"center",padding:"40px 14px",color:"#4B6A9B",fontSize:11 }}>No sessions yet.</div>
              : sessions.map(s => (
                <div key={s.id}
                  style={{ padding:"9px 11px",borderRadius:8,marginBottom:5,background:"rgba(6,20,60,0.6)",border:"1px solid rgba(59,130,246,0.10)",cursor:"pointer" }}
                  onClick={()=>loadSess(s)}>
                  <div style={{ fontSize:11,fontWeight:700,color:"#EFF6FF",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2 }}>{s.preview}</div>
                  <div style={{ fontSize:9,color:"#4B6A9B" }}>{s.messages.length} msgs · {new Date(s.ts).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      <div className="db-ai-header">
        <div className="db-ai-icon"><Icon d={IC.ai} size={13}/></div>
        <div style={{ flex:1 }}>
          <div className="db-ai-title">DIGITAL AI</div>
          <div className="db-ai-status">
            <span className="dot dot-blue"/>&nbsp;
            "Groq · Connected"
          </div>
        </div>
        <div className="flex-gap-6">
          <button className="btn-icon" title="Session history" onClick={()=>setShowHist(true)}>
            <Icon d={IC.history} size={12}/>
            {sessions.length > 0 && <span className="badge">{sessions.length > 9 ? "9+" : sessions.length}</span>}
          </button>
          <button className="btn-icon" title="New chat" onClick={newChat}><Icon d={IC.newChat} size={12}/></button>
        </div>
      </div>

      <div className="db-chat-window" ref={chatRef}>
        {hist.map((m,i) => (
          <div key={i} className={`db-chat-bubble ${m.role}`}>{m.text}</div>
        ))}
        {loading && (
          <div className="db-chat-dots">
            <span className="db-chat-dot"/><span className="db-chat-dot"/><span className="db-chat-dot"/>
          </div>
        )}
      </div>

      {hist.length < 3 && !showHist && (
        <div className="db-prompt-list">
          {["Which campaign has best ROI?","Where should I reallocate budget?","Show top performing platform"].map(p=>(
            <button key={p} className="db-prompt-btn" onClick={()=>setInput(p)}>{p}</button>
          ))}
        </div>
      )}

      <div className="db-chat-input-row">
        <button
          title={recording?"Stop":"Voice input"}
          onClick={toggleVoice}
          className={`btn-icon ${recording ? "recording" : ""}`}
          style={{ borderColor:recording?"rgba(248,113,113,0.4)":"", color:recording?"#F87171":"", background:recording?"rgba(248,113,113,0.10)":"" }}>
          <Icon d={recording ? IC.micOff : IC.mic} size={12}/>
        </button>
        <input
          className="db-chat-input"
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&ask()}
          placeholder={recording?"Listening…":"Ask about campaigns…"}
          disabled={loading}
        />
        <button
          className="btn-icon"
          onClick={ask}
          disabled={loading||!input.trim()}
          style={{ borderColor:input.trim()?"rgba(34,211,238,0.3)":"", color:input.trim()?"#22D3EE":"", background:input.trim()?"rgba(34,211,238,0.08)":"" }}>
          <Icon d={IC.send} size={12}/>
        </button>
      </div>
    </aside>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const navigate  = useNavigate();
  const user      = auth.currentUser;

  const [tab,         setTab]         = useState("overview");
  const [campaigns,   setCampaigns]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [predLevel,   setPredLevel]   = useState(20);
  const [showUser,    setShowUser]    = useState(false);
  const [toasts,      setToasts]      = useState([]);
  const toastId = useRef(0);

  /* ── Toast helper ── */
  const showToast = useCallback((msg, type="success") => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3600);
  }, []);

  /* ── Real-time Firestore listener ── */
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, "campaigns"),
      (snap) => {
        const data = snap.docs.map(d => ({ id:d.id, ...d.data() }));
        setCampaigns(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        showToast("Firestore connection error","error");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [showToast]);

  /* ── Aggregate metrics ── */
  const totReach  = campaigns.reduce((a,c) => a+(Number(c.reach)||0), 0);
  const totConv   = campaigns.reduce((a,c) => a+(Number(c.conversions)||0), 0);
  const totBudget = campaigns.reduce((a,c) => a+(Number(c.budget)||0), 0);
  const totClicks = campaigns.reduce((a,c) => a+(Number(c.clicks)||0), 0);
  const totSpend  = campaigns.reduce((a,c) => a+(Number(c.spend)||0), 0);
  const avgROI    = totBudget > 0 ? Math.round(((totConv*150 - totBudget)/totBudget)*100) : 0;
  const blendRoas = totSpend > 0 ? parseFloat(((totConv*150)/totSpend).toFixed(2)) : 0;
  const activeCount = campaigns.filter(c=>c.status==="Active").length;

  /* ── Projection ── */
  const projConv = Math.floor(totConv * (1 + predLevel/100));
  const projRev  = Math.floor(totConv*150 * (1 + predLevel/100));

  /* ── Chart data ── */
  const barData = [...campaigns]
    .sort((a,b) => (Number(b.reach)||0) - (Number(a.reach)||0))
    .slice(0,8)
    .map(c => ({ name:c.platform||c.name?.split(" ")[0]||"—", reach:Number(c.reach)||0, clicks:Number(c.clicks)||0, conv:Number(c.conversions)||0 }));

  const pieData = Object.entries(
    campaigns.reduce((acc,c) => {
      const p = c.platform || "Other";
      acc[p] = (acc[p]||0) + (Number(c.budget)||0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value-a.value).slice(0,6);

  const PIE_COLORS = ["#3B82F6","#22D3EE","#A78BFA","#10B981","#F59E0B","#F87171"];

  /* ── ROI chart data — top 10 campaigns by ROI ── */
  const roiChartData = [...campaigns]
    .map(c => ({
      name: c.name?.length > 14 ? c.name.slice(0,14)+"…" : (c.name||"—"),
      roi:  c.budget > 0 ? Math.round(((c.conversions*150 - c.budget)/c.budget)*100) : 0,
      budget: Number(c.budget)||0,
      conv:   Number(c.conversions)||0,
    }))
    .sort((a,b) => b.roi - a.roi)
    .slice(0, 10);

  /* ── ROI trend line ── */
  const roiTrendData = roiChartData.map((d, i) => ({
    name: d.name,
    roi:  d.roi,
    avg:  roiChartData.slice(0, i+1).reduce((s,x)=>s+x.roi,0) / (i+1) | 0,
  }));

  /* ── Engagement data per platform ── */
  const engagementByPlatform = Object.entries(
    campaigns.reduce((acc, c) => {
      const p = c.platform || "Other";
      if (!acc[p]) acc[p] = { reach:0, clicks:0, conv:0, impressions:0, count:0 };
      acc[p].reach       += Number(c.reach)||0;
      acc[p].clicks      += Number(c.clicks)||0;
      acc[p].conv        += Number(c.conversions)||0;
      acc[p].impressions += Number(c.impressions)||0;
      acc[p].count       += 1;
      return acc;
    }, {})
  ).map(([name, d]) => ({
    name,
    ctr:     d.reach > 0 ? parseFloat(((d.clicks/d.reach)*100).toFixed(2)) : 0,
    cvr:     d.clicks > 0 ? parseFloat(((d.conv/d.clicks)*100).toFixed(2)) : 0,
    eng:     d.reach > 0 ? parseFloat(((d.clicks+d.conv)/d.reach*100).toFixed(2)) : 0,
    reach:   d.reach,
    clicks:  d.clicks,
    conv:    d.conv,
    count:   d.count,
    color:   PLATFORM_COLORS[name] || "#94A3B8",
  })).sort((a,b) => b.eng - a.eng);

  /* ── Radar data for top platforms ── */
  const radarData = engagementByPlatform.slice(0,6).map(d => ({
    platform: d.name,
    CTR:      clamp(d.ctr * 10, 0, 100),
    CVR:      clamp(d.cvr * 5,  0, 100),
    Reach:    clamp((d.reach / (totReach||1)) * 100, 0, 100),
    Volume:   clamp(d.count * 15, 0, 100),
  }));

  /* ── Recently added campaigns — last 5 by createdAt ── */
  const recentCampaigns = [...campaigns]
    .filter(c => c.createdAt)
    .sort((a,b) => {
      const ta = a.createdAt?.toDate?.()?.getTime() || 0;
      const tb = b.createdAt?.toDate?.()?.getTime() || 0;
      return tb - ta;
    })
    .slice(0, 5);

  /* ── Sign out ── */
  const handleSignOut = () => signOut(auth).then(()=>navigate("/")).catch(()=>showToast("Sign-out failed","error"));

  /* ── Sorted campaigns ── */
  const sortedCampaigns = [...campaigns].sort((a,b)=>(Number(b.budget)||0)-(Number(a.budget)||0));

  const NAV = [
    { id:"overview",    label:"Overview",    icon:IC.overview   },
    { id:"campaigns",   label:"Campaigns",   icon:IC.campaigns  },
    { id:"analytics",   label:"Analytics",   icon:IC.analytics  },
    { id:"roi",         label:"ROI Charts",  icon:IC.roi        },
    { id:"engagement",  label:"Engagement",  icon:IC.engagement },
  ];

  const topbarMeta = {
    overview:   `${campaigns.length} live campaigns · ${activeCount} active`,
    campaigns:  `${campaigns.length} campaigns from Firestore`,
    analytics:  "Performance attribution",
    roi:        "Return on investment analysis",
    engagement: "Audience engagement breakdown",
  };
  const topbarTitle = {
    overview:   "Market Command",
    campaigns:  "Campaign Hub",
    analytics:  "Attribution Analytics",
    roi:        "ROI Intelligence",
    engagement: "Engagement Analytics",
  };

  /* ════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════ */
  return (
    <div className="db-shell">
      <div className="db-bg">
        <div className="db-bg-orb3"/>
      </div>

      {/* ══ SIDEBAR ══ */}
      <aside className="db-sidebar">
        <div className="db-brand">
          <div className="db-brand-row">
            <div className="db-brand-icon">M</div>
            <div>
              <div className="db-brand-name">DIGITAL</div>
              <div className="db-brand-tag">Analytics</div>
            </div>
          </div>
        </div>

        <div className="db-nav-group">Workspace</div>
        {NAV.map(({ id, label, icon }) => (
          <button key={id} className={`db-nav-btn ${tab===id?"active":""}`} onClick={()=>setTab(id)}>
            <Icon d={icon} size={13}/>{label}
          </button>
        ))}

        <div className="db-live-pill">
          <span className="dot dot-on"/>
          Live · {campaigns.length} synced
        </div>

        <div className="db-user-card" onClick={()=>setShowUser(true)}>
          <div className="db-user-row">
            <div className="db-user-avatar">{user?.email?.[0]?.toUpperCase()||"A"}</div>
            <div style={{ flex:1,minWidth:0 }}>
              <div className="db-user-name">{user?.email?.split("@")[0]||"admin"}</div>
              <div className="db-user-role">Strategic User</div>
            </div>
            <Icon d={IC.chevR} size={12}/>
          </div>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main className="db-main">
        <div className="db-topbar">
          <div>
            <span className="db-topbar-title">{topbarTitle[tab]}</span>
            <span className="db-topbar-sub">{topbarMeta[tab]}</span>
          </div>
          <div className="flex-gap-6">
            <span className="db-engine-tag">Engine v4.2 · 2026</span>
          </div>
        </div>

        <div className="db-content">

          {/* Loading skeleton */}
          {loading && (
            <div className="db-kpi-grid">
              {[1,2,3,4].map(i=>(
                <div key={i} className="glass db-kpi">
                  <div style={{ height:10,width:"60%",borderRadius:5,background:"linear-gradient(90deg,rgba(59,130,246,0.08) 25%,rgba(59,130,246,0.15) 50%,rgba(59,130,246,0.08) 75%)" }}/>
                  <div style={{ height:26,width:"80%",borderRadius:5,marginTop:8,background:"linear-gradient(90deg,rgba(59,130,246,0.08) 25%,rgba(59,130,246,0.15) 50%,rgba(59,130,246,0.08) 75%)" }}/>
                </div>
              ))}
            </div>
          )}

          {/* ═══ OVERVIEW TAB ═══ */}
          {!loading && tab==="overview" && (
            <>
              {/* KPI row */}
              <div className="db-kpi-grid">
                {[
                  { label:"Aggregated Reach",  value:fmt(totReach),   color:"#60A5FA", trend:"+14.2%", up:true  },
                  { label:"Total Conversions",  value:fmtN(totConv),   color:"#10B981", trend:"+8.6%",  up:true  },
                  { label:"Total Budget",       value:fmtR(totBudget), color:"#A78BFA", trend:"−2.1%",  up:false },
                  { label:"Blended ROAS",       value:blendRoas+"x",   color:"#22D3EE", trend:"+5.8%",  up:true  },
                ].map(({ label,value,color,trend,up }) => (
                  <div key={label} className="glass db-kpi">
                    <span className="db-kpi-label">{label}</span>
                    <span className="db-kpi-value" style={{ color }}>{value}</span>
                    <div className="db-kpi-foot">
                      <span className={`db-kpi-trend ${up?"up":"down"}`}>{trend}</span>
                      <span style={{ fontSize:9,color:"#4B6A9B" }}>vs last period</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bar chart + Simulator */}
              <div className="db-grid-2" style={{ gridTemplateColumns:"2fr 1fr" }}>
                <div className="glass db-section scan-wrap">
                  <div className="db-section-title">Campaign Reach & Conversions</div>
                  {campaigns.length === 0 ? (
                    <div style={{ textAlign:"center",padding:"30px",color:"#4B6A9B",fontSize:12 }}>No campaign data yet. Add campaigns in the Admin panel.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={190}>
                      <BarChart data={barData} margin={{ top:4,right:4,left:-10,bottom:0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" vertical={false}/>
                        <XAxis dataKey="name" stroke="#4B6A9B" fontSize={9} tickLine={false} axisLine={false}/>
                        <YAxis stroke="#4B6A9B" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Bar dataKey="reach"  name="Reach"       fill="#1D4ED8" fillOpacity={0.6} radius={[3,3,0,0]}/>
                        <Bar dataKey="clicks" name="Clicks"      fill="#3B82F6" fillOpacity={0.5} radius={[3,3,0,0]}/>
                        <Bar dataKey="conv"   name="Conversions" fill="#22D3EE" fillOpacity={0.7} radius={[3,3,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="glass db-slider-wrap">
                  <div className="flex-between" style={{ marginBottom:6 }}>
                    <span className="db-section-title" style={{ marginBottom:0 }}>Growth Simulator</span>
                    <span className="pill pill-amber">+{predLevel}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={1} value={predLevel}
                    onChange={e=>setPredLevel(+e.target.value)} className="db-slider" style={{ "--val":`${predLevel}%` }}/>
                  <div className="db-sim-rows">
                    {[
                      ["Proj. Conv.",   fmtN(projConv),                    "#60A5FA"],
                      ["Proj. Revenue", fmtR(projRev),                     "#10B981"],
                      ["New Leads",     fmtN(Math.floor(projConv*.38)),     "#A78BFA"],
                    ].map(([l,v,c]) => (
                      <div key={l} className="db-sim-row">
                        <span className="db-sim-label">{l}</span>
                        <span className="db-sim-value" style={{ color:c }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize:10,color:"#4B6A9B",marginTop:10,lineHeight:1.5 }}>
                    A <strong style={{ color:"#EFF6FF" }}>{predLevel}% budget lift</strong> yields{" "}
                    <strong style={{ color:"#60A5FA" }}>{fmtN(projConv-totConv)} more conversions</strong>.
                  </p>
                </div>
              </div>

              {/* Recently Added Campaigns */}
              <div className="glass db-section" style={{ marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                  <div className="db-section-title" style={{ marginBottom:0 }}>Recently Added Campaigns</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span className="dot dot-on"/>
                    <span style={{ fontSize:10, color:"var(--em)" }}>Live from Firestore</span>
                  </div>
                </div>
                {recentCampaigns.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"24px", color:"#4B6A9B", fontSize:12 }}>
                    No campaigns yet. Add some from the Admin panel.
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {recentCampaigns.map((c, i) => {
                      const roi   = c.budget > 0 ? Math.round(((c.conversions*150 - c.budget)/c.budget)*100) : 0;
                      const color = PLATFORM_COLORS[c.platform] || "#60A5FA";
                      const ts    = c.createdAt?.toDate?.();
                      const timeAgo = ts ? (() => {
                        const diff = (Date.now() - ts.getTime()) / 1000;
                        if (diff < 60)    return "just now";
                        if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
                        if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
                        return `${Math.floor(diff/86400)}d ago`;
                      })() : "—";
                      return (
                        <div key={c.id} style={{
                          display:"flex", alignItems:"center", gap:14,
                          padding:"11px 14px", borderRadius:10,
                          background:"rgba(59,130,246,0.05)",
                          border:"1px solid rgba(59,130,246,0.10)",
                          transition:"background 0.15s",
                          animationDelay:`${i*0.06}s`,
                        }}>
                          <div style={{ width:3, height:36, borderRadius:3, background:color, flexShrink:0, boxShadow:`0 0 8px ${color}60` }}/>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:700, color:"var(--txt)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</div>
                            <div style={{ fontSize:10, color:"#4B6A9B", marginTop:2, display:"flex", gap:8 }}>
                              <span style={{ color }}>{c.platform||"—"}</span>
                              <span>·</span>
                              <span>{c.objective||"—"}</span>
                              <span>·</span>
                              <span style={{ display:"flex", alignItems:"center", gap:3 }}><Icon d={IC.clock} size={9}/>{timeAgo}</span>
                            </div>
                          </div>
                          <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                            <span className={`pill ${statusClass(c.status)}`}>{c.status||"Active"}</span>
                            <span style={{ fontSize:11, fontWeight:700, fontVariantNumeric:"tabular-nums", color:roi>0?"#10B981":"#F87171", minWidth:46, textAlign:"right" }}>
                              {roi>0?"+":""}{roi}% ROI
                            </span>
                            <span style={{ fontSize:11, color:"#4B6A9B" }}>₹{fmtN(c.budget)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Campaign summary table */}
              <div className="glass db-section">
                <div className="db-section-title">Live Campaign Summary</div>
                {campaigns.length === 0 ? (
                  <div style={{ textAlign:"center",padding:"30px",color:"#4B6A9B",fontSize:12 }}>
                    No campaigns yet. Go to Admin panel to add or import campaigns.
                  </div>
                ) : (
                  <div className="db-table-wrap">
                    <table className="db-table">
                      <thead>
                        <tr>{["Campaign","Platform","Status","Reach","Clicks","Conv.","Budget","ROI"].map(h=><th key={h}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {sortedCampaigns.slice(0,10).map(c => {
                          const roi = c.budget > 0 ? Math.round(((c.conversions*150 - c.budget)/c.budget)*100) : 0;
                          return (
                            <tr key={c.id}>
                              <td style={{ fontWeight:600,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.name}</td>
                              <td><span className="pill pill-blue" style={{ color:PLATFORM_COLORS[c.platform]||"#60A5FA" }}>{c.platform||"—"}</span></td>
                              <td><span className={`pill ${statusClass(c.status)}`}>{c.status||"—"}</span></td>
                              <td className="num" style={{ color:"#93C5FD" }}>{fmtN(c.reach)}</td>
                              <td className="num">{fmtN(c.clicks)}</td>
                              <td className="blue-v">{fmtN(c.conversions)}</td>
                              <td className="num">₹{fmtN(c.budget)}</td>
                              <td style={{ color:roi>0?"#10B981":"#F87171", fontWeight:700, fontVariantNumeric:"tabular-nums" }}>
                                {roi>0?"+":""}{roi}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                
              </div>
              {/* AI Panel — mobile only (desktop uses sidebar) */}
<div className="show-mobile">
  <AiPanel campaigns={campaigns} showToast={showToast}/>
</div>
            </>
          )}

          {/* ═══ CAMPAIGNS TAB ═══ */}
          {!loading && tab==="campaigns" && (
            <>
              <div className="db-kpi-grid" style={{ gridTemplateColumns:"repeat(5,minmax(0,1fr))" }}>
                {[
                  { l:"Total",  v:campaigns.length,  c:"#60A5FA" },
                  { l:"Active", v:activeCount,         c:"#10B981" },
                  { l:"Budget", v:fmtR(totBudget),    c:"#A78BFA" },
                  { l:"Reach",  v:fmt(totReach),      c:"#22D3EE" },
                  { l:"Conv.",  v:fmtN(totConv),       c:"#F59E0B" },
                ].map(({ l,v,c }) => (
                  <div key={l} className="glass db-kpi">
                    <span className="db-kpi-label">{l}</span>
                    <span className="db-kpi-value" style={{ color:c,fontSize:20 }}>{v}</span>
                  </div>
                ))}
              </div>
              {campaigns.length === 0 ? (
                <div className="db-camp-grid">
                  <div className="db-empty">
                    <div className="db-empty-icon">📡</div>
                    <div className="db-empty-title">No campaigns yet</div>
                    <div className="db-empty-sub">Go to the Admin panel to add or import campaigns via CSV.</div>
                  </div>
                </div>
              ) : (
                <div className="db-camp-grid">
                  {campaigns.map((c,i) => {
                    const roi   = c.budget>0 ? Math.round(((c.conversions*150-c.budget)/c.budget)*100) : 0;
                    const pct   = clamp(Math.abs(roi)/10, 0, 100);
                    const color = PLATFORM_COLORS[c.platform] || "#60A5FA";
                    return (
                      <div key={c.id} className="glass db-camp-card" style={{ animationDelay:`${i*0.05}s` }}>
                        <div className="db-camp-glow"/>
                        <div className="db-camp-header">
                          <div>
                            <div className="db-camp-name">{c.name}</div>
                            <div className="db-camp-meta">{c.objective||"—"} · {c.startDate||"—"}</div>
                          </div>
                          <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5 }}>
                            <span className="pill" style={{ color,background:`${color}18`,border:`1px solid ${color}30` }}>{c.platform||"—"}</span>
                            <span className={`pill ${statusClass(c.status)}`}>{c.status||"Active"}</span>
                          </div>
                        </div>
                        <div className="db-camp-metrics">
                          {[
                            ["Reach",  fmt(c.reach),          "#60A5FA"],
                            ["Clicks", fmtN(c.clicks),         "#22D3EE"],
                            ["Conv.",  fmtN(c.conversions),    "#10B981"],
                            ["Budget", fmtR(c.budget),         "#A78BFA"],
                            ["Spend",  fmtR(c.spend||0),      "#F59E0B"],
                            ["ROI",    (roi>0?"+":"")+roi+"%", roi>0?"#10B981":"#F87171"],
                          ].map(([l,v,clr]) => (
                            <div key={l} className="db-camp-metric-box">
                              <div className="db-camp-metric-label">{l}</div>
                              <div className="db-camp-metric-value" style={{ color:clr }}>{v}</div>
                            </div>
                          ))}
                        </div>
                        <div className="db-prog-track"><div className="db-prog-fill" style={{ width:`${pct}%` }}/></div>
                        {c.notes && <p style={{ fontSize:10,color:"#4B6A9B",marginTop:8,lineHeight:1.5 }}>{c.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ═══ ANALYTICS TAB ═══ */}
          {!loading && tab==="analytics" && (
            <>
              <div className="db-kpi-grid">
                {[
                  { label:"Total Impressions", value:fmt(campaigns.reduce((a,c)=>a+(Number(c.impressions)||0),0)), color:"#60A5FA" },
                  { label:"Total Clicks",       value:fmtN(totClicks),    color:"#22D3EE" },
                  { label:"Avg CTR",            value:(totClicks&&totReach)?((totClicks/totReach)*100).toFixed(2)+"%":"0%", color:"#A78BFA" },
                  { label:"Portfolio ROI",      value:(avgROI>0?"+":"")+avgROI+"%", color:avgROI>=0?"#10B981":"#F87171" },
                ].map(({ label,value,color }) => (
                  <div key={label} className="glass db-kpi">
                    <span className="db-kpi-label">{label}</span>
                    <span className="db-kpi-value" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="db-grid-2">
                <div className="glass db-section">
                  <div className="db-section-title">Budget vs Conversions</div>
                  {campaigns.length === 0 ? (
                    <div style={{ textAlign:"center",padding:"30px",color:"#4B6A9B",fontSize:12 }}>No data yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={[...campaigns].sort((a,b)=>b.budget-a.budget).slice(0,10).map(c=>({ name:c.platform||"—", budget:c.budget||0, conv:c.conversions||0 }))} margin={{ top:4,right:4,left:-10,bottom:0 }}>
                        <defs>
                          <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#22D3EE" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" vertical={false}/>
                        <XAxis dataKey="name" stroke="#4B6A9B" fontSize={9} tickLine={false} axisLine={false}/>
                        <YAxis stroke="#4B6A9B" fontSize={9} tickLine={false} axisLine={false}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Area dataKey="budget" name="Budget"      stroke="#3B82F6" fill="url(#gB)" strokeWidth={2} dot={false}/>
                        <Area dataKey="conv"   name="Conversions" stroke="#22D3EE" fill="url(#gC)" strokeWidth={2} dot={false}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="glass db-section">
                  <div className="db-section-title">Budget by Platform</div>
                  {pieData.length === 0 ? (
                    <div style={{ textAlign:"center",padding:"30px",color:"#4B6A9B",fontSize:12 }}>No data yet.</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value">
                            {pieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                          </Pie>
                          <Tooltip content={<CustomTooltip/>}/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginTop:8 }}>
                        {pieData.map((d,i) => (
                          <span key={d.name} style={{ display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#4B6A9B" }}>
                            <span style={{ width:7,height:7,borderRadius:2,background:PIE_COLORS[i%PIE_COLORS.length],display:"inline-block"}}/>
                            {d.name}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="glass db-section">
                <div className="db-section-title">Full Campaign Attribution</div>
                {campaigns.length === 0 ? (
                  <div style={{ textAlign:"center",padding:"30px",color:"#4B6A9B",fontSize:12 }}>No campaigns. Add them in Admin panel.</div>
                ) : (
                  <div className="db-table-wrap">
                    <table className="db-table" style={{ minWidth:900 }}>
                      <thead>
                        <tr>{["Campaign","Platform","Type","Reach","Impressions","Clicks","Conv.","Budget","Spend","CTR","ROI"].map(h=><th key={h}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {[...campaigns].sort((a,b)=>{
                          const roiA = a.budget>0?((a.conversions*150-a.budget)/a.budget)*100:0;
                          const roiB = b.budget>0?((b.conversions*150-b.budget)/b.budget)*100:0;
                          return roiB - roiA;
                        }).map(c => {
                          const roi = c.budget>0?Math.round(((c.conversions*150-c.budget)/c.budget)*100):0;
                          const ctr = c.reach>0?((c.clicks/c.reach)*100).toFixed(2)+"%":"0%";
                          return (
                            <tr key={c.id}>
                              <td style={{ fontWeight:600,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.name}</td>
                              <td><span className="pill" style={{ color:PLATFORM_COLORS[c.platform]||"#60A5FA",background:`${PLATFORM_COLORS[c.platform]||"#3B82F6"}18`,border:`1px solid ${PLATFORM_COLORS[c.platform]||"#3B82F6"}30` }}>{c.platform||"—"}</span></td>
                              <td style={{ color:"#4B6A9B",fontSize:10 }}>{c.type||"—"}</td>
                              <td className="num" style={{ color:"#93C5FD" }}>{fmtN(c.reach)}</td>
                              <td className="num" style={{ color:"#4B6A9B" }}>{fmtN(c.impressions)}</td>
                              <td className="num">{fmtN(c.clicks)}</td>
                              <td className="blue-v">{fmtN(c.conversions)}</td>
                              <td className="num">₹{fmtN(c.budget)}</td>
                              <td className="num" style={{ color:"#4B6A9B" }}>₹{fmtN(c.spend||0)}</td>
                              <td className="num" style={{ color:"#A78BFA" }}>{ctr}</td>
                              <td style={{ color:roi>0?"#10B981":"#F87171",fontWeight:700,fontVariantNumeric:"tabular-nums" }}>{roi>0?"+":""}{roi}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══ ROI CHARTS TAB ═══ */}
          {!loading && tab==="roi" && (
            <>
              <div className="db-kpi-grid">
                {[
                  { label:"Portfolio ROI",    value:(avgROI>0?"+":"")+avgROI+"%",     color:avgROI>=0?"#10B981":"#F87171" },
                  { label:"Blended ROAS",     value:blendRoas+"x",                    color:"#22D3EE" },
                  { label:"Total Revenue Est",value:fmtR(totConv*150),                color:"#A78BFA" },
                  { label:"Total Spend",      value:fmtR(totSpend),                   color:"#F59E0B" },
                ].map(({ label,value,color }) => (
                  <div key={label} className="glass db-kpi">
                    <span className="db-kpi-label">{label}</span>
                    <span className="db-kpi-value" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="glass db-section" style={{ marginBottom:16 }}>
                <div className="db-section-title">ROI by Campaign (Top 10)</div>
                {roiChartData.length === 0 ? (
                  <div style={{ textAlign:"center",padding:"30px",color:"#4B6A9B",fontSize:12 }}>No data yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={roiChartData} margin={{ top:4,right:4,left:-10,bottom:30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" vertical={false}/>
                      <XAxis dataKey="name" stroke="#4B6A9B" fontSize={9} tickLine={false} axisLine={false} angle={-35} textAnchor="end" interval={0}/>
                      <YAxis stroke="#4B6A9B" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v=>v+"%"}/>
                      <Tooltip content={<CustomTooltip/>} formatter={(v)=>v+"%"}/>
                      <Bar dataKey="roi" name="ROI %" radius={[4,4,0,0]}>
                        {roiChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.roi >= 0 ? "#10B981" : "#F87171"} fillOpacity={0.75}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="db-grid-2">
                <div className="glass db-section">
                  <div className="db-section-title">ROI vs Running Average</div>
                  {roiTrendData.length === 0 ? (
                    <div style={{ textAlign:"center",padding:"30px",color:"#4B6A9B",fontSize:12 }}>No data yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={roiTrendData} margin={{ top:4,right:4,left:-10,bottom:0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" vertical={false}/>
                        <XAxis dataKey="name" stroke="#4B6A9B" fontSize={8} tickLine={false} axisLine={false} tick={false}/>
                        <YAxis stroke="#4B6A9B" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v=>v+"%"}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Line dataKey="roi" name="Campaign ROI" stroke="#22D3EE" strokeWidth={2} dot={{ r:3, fill:"#22D3EE" }}/>
                        <Line dataKey="avg" name="Running Avg"  stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="glass db-section">
                  <div className="db-section-title">Budget vs Estimated Revenue</div>
                  {roiChartData.length === 0 ? (
                    <div style={{ textAlign:"center",padding:"30px",color:"#4B6A9B",fontSize:12 }}>No data yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={roiChartData} margin={{ top:4,right:4,left:-10,bottom:0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" vertical={false}/>
                        <XAxis dataKey="name" stroke="#4B6A9B" fontSize={8} tickLine={false} axisLine={false} tick={false}/>
                        <YAxis stroke="#4B6A9B" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Bar dataKey="budget" name="Budget"        fill="#3B82F6" fillOpacity={0.55} radius={[3,3,0,0]}/>
                        <Bar dataKey="conv"   name="Est. Revenue"  fill="#10B981" fillOpacity={0.65} radius={[3,3,0,0]}
                             data={roiChartData.map(d=>({...d, conv:d.conv*150}))}/>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="glass db-section">
                <div className="db-section-title">Full ROI Breakdown</div>
                {campaigns.length === 0 ? (
                  <div style={{ textAlign:"center",padding:"30px",color:"#4B6A9B",fontSize:12 }}>No campaigns yet.</div>
                ) : (
                  <div className="db-table-wrap">
                    <table className="db-table">
                      <thead>
                        <tr>{["Rank","Campaign","Platform","Budget","Est. Revenue","Profit","ROI %","ROAS"].map(h=><th key={h}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {[...campaigns]
                          .map(c => {
                            const revenue = c.conversions * 150;
                            const profit  = revenue - (c.budget||0);
                            const roi     = c.budget>0 ? Math.round((profit/c.budget)*100) : 0;
                            const roas    = c.spend>0  ? parseFloat((revenue/c.spend).toFixed(2)) : 0;
                            return { ...c, revenue, profit, roi, roas };
                          })
                          .sort((a,b) => b.roi - a.roi)
                          .map((c, i) => (
                            <tr key={c.id}>
                              <td style={{ color:"#4B6A9B", fontWeight:700, width:40 }}>#{i+1}</td>
                              <td style={{ fontWeight:600,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.name}</td>
                              <td><span className="pill" style={{ color:PLATFORM_COLORS[c.platform]||"#60A5FA",background:`${PLATFORM_COLORS[c.platform]||"#3B82F6"}18`,border:`1px solid ${PLATFORM_COLORS[c.platform]||"#3B82F6"}30` }}>{c.platform||"—"}</span></td>
                              <td className="num">₹{fmtN(c.budget)}</td>
                              <td className="num" style={{ color:"#A78BFA" }}>₹{fmtN(c.revenue)}</td>
                              <td className="num" style={{ color:c.profit>=0?"#10B981":"#F87171" }}>
                                {c.profit>=0?"+":"-"}₹{fmtN(Math.abs(c.profit))}
                              </td>
                              <td style={{ color:c.roi>0?"#10B981":"#F87171",fontWeight:700,fontVariantNumeric:"tabular-nums" }}>
                                {c.roi>0?"+":""}{c.roi}%
                              </td>
                              <td style={{ color:"#22D3EE",fontWeight:700 }}>{c.roas}x</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══ ENGAGEMENT TAB ═══ */}
          {!loading && tab==="engagement" && (
            <>
              <div className="db-kpi-grid">
                {[
                  { label:"Avg CTR",        value:(totClicks&&totReach)?((totClicks/totReach)*100).toFixed(2)+"%":"0%", color:"#60A5FA" },
                  { label:"Avg CVR",        value:(totConv&&totClicks)?((totConv/totClicks)*100).toFixed(2)+"%":"0%",   color:"#10B981" },
                  { label:"Total Clicks",   value:fmtN(totClicks),    color:"#22D3EE" },
                  { label:"Total Reach",    value:fmt(totReach),      color:"#A78BFA" },
                ].map(({ label,value,color }) => (
                  <div key={label} className="glass db-kpi">
                    <span className="db-kpi-label">{label}</span>
                    <span className="db-kpi-value" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="db-grid-2">
                <div className="glass db-section">
                  <div className="db-section-title">CTR by Platform</div>
                  {engagementByPlatform.length === 0 ? (
                    <div style={{ textAlign:"center",padding:"30px",color:"#4B6A9B",fontSize:12 }}>No data yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={engagementByPlatform} layout="vertical" margin={{ top:4,right:20,left:50,bottom:0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" horizontal={false}/>
                        <XAxis type="number" stroke="#4B6A9B" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v=>v+"%"}/>
                        <YAxis type="category" dataKey="name" stroke="#4B6A9B" fontSize={9} tickLine={false} axisLine={false}/>
                        <Tooltip content={<CustomTooltip/>} formatter={v=>v+"%"}/>
                        <Bar dataKey="ctr" name="CTR %" radius={[0,4,4,0]}>
                          {engagementByPlatform.map((e,i)=>(
                            <Cell key={i} fill={e.color} fillOpacity={0.7}/>
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="glass db-section">
                  <div className="db-section-title">Conversion Rate by Platform</div>
                  {engagementByPlatform.length === 0 ? (
                    <div style={{ textAlign:"center",padding:"30px",color:"#4B6A9B",fontSize:12 }}>No data yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={engagementByPlatform} layout="vertical" margin={{ top:4,right:20,left:50,bottom:0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" horizontal={false}/>
                        <XAxis type="number" stroke="#4B6A9B" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v=>v+"%"}/>
                        <YAxis type="category" dataKey="name" stroke="#4B6A9B" fontSize={9} tickLine={false} axisLine={false}/>
                        <Tooltip content={<CustomTooltip/>} formatter={v=>v+"%"}/>
                        <Bar dataKey="cvr" name="CVR %" radius={[0,4,4,0]}>
                          {engagementByPlatform.map((e,i)=>(
                            <Cell key={i} fill={e.color} fillOpacity={0.65}/>
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="db-grid-2">
                <div className="glass db-section">
                  <div className="db-section-title">Platform Engagement Radar</div>
                  {radarData.length === 0 ? (
                    <div style={{ textAlign:"center",padding:"30px",color:"#4B6A9B",fontSize:12 }}>No data yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(59,130,246,0.12)"/>
                        <PolarAngleAxis dataKey="platform" stroke="#4B6A9B" fontSize={9}/>
                        <Radar name="CTR"   dataKey="CTR"   stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.15} strokeWidth={1.5}/>
                        <Radar name="CVR"   dataKey="CVR"   stroke="#10B981" fill="#10B981" fillOpacity={0.12} strokeWidth={1.5}/>
                        <Radar name="Reach" dataKey="Reach" stroke="#A78BFA" fill="#A78BFA" fillOpacity={0.10} strokeWidth={1.5}/>
                        <Tooltip content={<CustomTooltip/>}/>
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="glass db-section">
                  <div className="db-section-title">Engagement Score by Platform</div>
                  {engagementByPlatform.length === 0 ? (
                    <div style={{ textAlign:"center",padding:"30px",color:"#4B6A9B",fontSize:12 }}>No data yet.</div>
                  ) : (
                    <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                      {engagementByPlatform.slice(0,7).map((e,i) => {
                        const pct = clamp(e.eng, 0, 100);
                        return (
                          <div key={e.name}>
                            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
                              <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                                <span style={{ width:8,height:8,borderRadius:2,background:e.color,display:"inline-block",boxShadow:`0 0 6px ${e.color}80` }}/>
                                <span style={{ fontSize:11,fontWeight:600,color:"var(--txt)" }}>{e.name}</span>
                                <span style={{ fontSize:9,color:"#4B6A9B" }}>{e.count} campaigns</span>
                              </div>
                              <div style={{ display:"flex",gap:10,fontSize:10 }}>
                                <span style={{ color:"#60A5FA" }}>CTR {e.ctr}%</span>
                                <span style={{ color:"#10B981" }}>CVR {e.cvr}%</span>
                                <span style={{ color:e.color,fontWeight:700 }}>Eng {e.eng}%</span>
                              </div>
                            </div>
                            <div className="db-prog-track">
                              <div style={{ height:"100%",borderRadius:3,width:`${pct}%`,background:`linear-gradient(90deg,${e.color}80,${e.color})`,boxShadow:`0 0 6px ${e.color}40`,transition:"width 0.8s cubic-bezier(0.4,0,0.2,1)" }}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="glass db-section">
                <div className="db-section-title">Campaign-Level Engagement Breakdown</div>
                {campaigns.length === 0 ? (
                  <div style={{ textAlign:"center",padding:"30px",color:"#4B6A9B",fontSize:12 }}>No campaigns yet.</div>
                ) : (
                  <div className="db-table-wrap">
                    <table className="db-table" style={{ minWidth:860 }}>
                      <thead>
                        <tr>{["Campaign","Platform","Status","Reach","Clicks","Impressions","CTR","CVR","Conv.","Eng. Score"].map(h=><th key={h}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {[...campaigns]
                          .map(c => {
                            const ctr = c.reach>0  ? parseFloat(((c.clicks/c.reach)*100).toFixed(2))           : 0;
                            const cvr = c.clicks>0 ? parseFloat(((c.conversions/c.clicks)*100).toFixed(2))     : 0;
                            const eng = c.reach>0  ? parseFloat((((c.clicks+c.conversions)/c.reach)*100).toFixed(2)) : 0;
                            return { ...c, ctr, cvr, eng };
                          })
                          .sort((a,b) => b.eng - a.eng)
                          .map(c => (
                            <tr key={c.id}>
                              <td style={{ fontWeight:600,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.name}</td>
                              <td><span className="pill" style={{ color:PLATFORM_COLORS[c.platform]||"#60A5FA",background:`${PLATFORM_COLORS[c.platform]||"#3B82F6"}18`,border:`1px solid ${PLATFORM_COLORS[c.platform]||"#3B82F6"}30` }}>{c.platform||"—"}</span></td>
                              <td><span className={`pill ${statusClass(c.status)}`}>{c.status||"—"}</span></td>
                              <td className="num" style={{ color:"#93C5FD" }}>{fmtN(c.reach)}</td>
                              <td className="num">{fmtN(c.clicks)}</td>
                              <td className="num" style={{ color:"#4B6A9B" }}>{fmtN(c.impressions)}</td>
                              <td style={{ color:"#60A5FA",fontWeight:600 }}>{c.ctr}%</td>
                              <td style={{ color:"#10B981",fontWeight:600 }}>{c.cvr}%</td>
                              <td className="blue-v">{fmtN(c.conversions)}</td>
                              <td>
                                <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                                  <div style={{ width:48,height:4,borderRadius:3,background:"rgba(59,130,246,0.10)",overflow:"hidden" }}>
                                    <div style={{ width:`${clamp(c.eng,0,100)}%`,height:"100%",background:"linear-gradient(90deg,#3B82F6,#22D3EE)",borderRadius:3 }}/>
                                  </div>
                                  <span style={{ fontSize:10,fontWeight:700,color:"#22D3EE",minWidth:36 }}>{c.eng}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </main>

      {/* ══ AI PANEL ══ */}
      <AiPanel campaigns={campaigns} showToast={showToast}/>

      {/* ══ USER PANEL MODAL ══ */}
      {showUser && (
        <div className="db-user-modal-overlay" onClick={()=>setShowUser(false)}>
          <div className="glass db-user-modal" onClick={e=>e.stopPropagation()}>
            <div className="db-user-modal-banner">
              <button onClick={()=>setShowUser(false)} style={{ position:"absolute",top:12,right:12,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(59,130,246,0.15)",borderRadius:8,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#4B6A9B" }}>
                <Icon d={IC.close} size={14}/>
              </button>
            </div>
            <div className="db-user-modal-body">
              <div className="db-modal-avatar">{user?.email?.[0]?.toUpperCase()||"A"}</div>
              <div className="db-modal-name">{user?.email?.split("@")[0]||"admin"}</div>
              <div className="db-modal-email">{user?.email}</div>
              <div style={{ display:"flex",gap:6,marginBottom:16 }}>
                <span className="pill pill-blue">Strategic User</span>
                <span className="pill pill-green"><span className="dot dot-on"/>&nbsp;Active</span>
              </div>
              {[
                ["User ID",   user?.uid||"—"],
                ["Email",     user?.email||"—"],
                ["Auth",      "Email / Password"],
                ["Campaigns", campaigns.length+" synced"],
              ].map(([l,v]) => (
                <div key={l} className="db-modal-info-row">
                  <span className="db-modal-info-label">{l}</span>
                  <span className="db-modal-info-value">{v}</span>
                </div>
              ))}
              <button className="db-signout-btn" onClick={handleSignOut}>
                <Icon d={IC.logout} size={14}/> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <Toasts list={toasts}/>
    </div>
  );
}