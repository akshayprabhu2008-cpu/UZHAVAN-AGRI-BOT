import React, { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import {
  Activity, AlertOctagon, ArrowDownRight, ArrowUpRight, BatteryCharging,
  Bot, Check, CheckCircle2, ChevronDown, ChevronUp, CircleHelp, Clock3,
  CloudSun, Cpu, Download, Droplets, Gauge, Leaf, MapPin, Menu, Pause,
  Play, RotateCcw, Satellite, Settings2, ShieldCheck, Sprout, Sun,
  Thermometer, Tractor, Waves, Wind, X, Zap
} from "lucide-react";

const initialSensors = { n: 42, p: 19, k: 185, moisture: 68, ph: 6.7, temp: 32, humidity: 62, battery: 94 };
const featuresList = [
  { id: "till", label: "Rotary Micro-Tilling", sub: "Soil conditioning", icon: Tractor },
  { id: "seed", label: "Precision Row Seeding", sub: "Metered seed placement", icon: Sprout },
  { id: "spray", label: "Targeted Micronutrient Spraying", sub: "Low-volume application", icon: Droplets },
  { id: "weed", label: "Vision-Guided Weed Extraction", sub: "TinyML crop recognition", icon: Cpu }
];
const logTemplates = [
  "[LOG] Camera detected Echinochloa weed at X:142 Y:88 → Actuator blade deployed.",
  "[LOG] Soil moisture drops below 60% at Row 3 → Micro-irrigation pulsed.",
  "[LOG] Ultrasonic sensor detects furrow boundary → Rover turning 90 degrees.",
  "[LOG] Seed metering wheel calibrated → Row spacing within target tolerance.",
  "[LOG] Solar charge controller stable → 18V bus supplying drive system.",
  "[LOG] NPK probe sample stored → Nutrient profile synced to field audit."
];
const fmt = (n) => new Intl.NumberFormat("en-IN").format(Math.round(n));

function Card({ children, className = "" }) {
  return <section className={`panel ${className}`}>{children}</section>;
}
function SectionTitle({ eyebrow, title, right }) {
  return <div className="section-head"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{right}</div>;
}
function StatusPill({ children, tone = "green" }) {
  return <span className={`status-pill ${tone}`}><span className="status-dot" />{children}</span>;
}
function Metric({ label, value, unit, note, icon: Icon, accent = "green" }) {
  return <div className="metric-card">
    <div className={`metric-icon ${accent}`}><Icon size={17}/></div>
    <p className="metric-label">{label}</p>
    <div className="metric-value">{value}<small>{unit}</small></div>
    <p className="metric-note">{note}</p>
  </div>;
}
function ProgressLine({ label, value, max, unit, status, color = "green" }) {
  const pct = Math.min(100, value / max * 100);
  return <div className="progress-item">
    <div className="progress-top"><span>{label}</span><strong>{value} <small>{unit}</small></strong></div>
    <div className="track"><div className={`fill ${color}`} style={{ width: `${pct}%` }}/></div>
    <div className="progress-foot"><span>{status}</span><span>{Math.round(pct)}%</span></div>
  </div>;
}
function MoistureGauge({ value }) {
  const radius = 42, circumference = 2 * Math.PI * radius;
  return <div className="gauge-wrap">
    <svg viewBox="0 0 112 112" className="gauge-svg" aria-label={`Soil moisture ${value}%`}>
      <circle cx="56" cy="56" r={radius} className="gauge-bg" />
      <circle cx="56" cy="56" r={radius} className="gauge-progress"
        strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / 100)}
        transform="rotate(-90 56 56)" />
      <text x="56" y="53" textAnchor="middle" className="gauge-number">{value}%</text>
      <text x="56" y="69" textAnchor="middle" className="gauge-unit">MOISTURE</text>
    </svg>
  </div>;
}
function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal-card">{children}</div>
  </div>;
}

export default function App() {
  const [sensors, setSensors] = useState(initialSensors);
  const [refreshing, setRefreshing] = useState(false);
  const [sensorUpdated, setSensorUpdated] = useState("07:22:14");
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [emergency, setEmergency] = useState(false);
  const [toast, setToast] = useState("");
  const [acres, setAcres] = useState(2);
  const [features, setFeatures] = useState(["till", "seed", "spray", "weed"]);
  const [runState, setRunState] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([{ time: "07:22:14", text: "[SYS] UZHAVAN field controller online. Awaiting mission parameters." }]);
  const [abstractOpen, setAbstractOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const timerRef = useRef(null);
  const logRef = useRef(null);
  const toastRef = useRef(null);

  const selectedCount = features.length;
  const seedTarget = acres * 7100;
  const weedsTarget = acres * 920;
  const sprayTarget = acres * 1.8;
  const savingsTarget = acres * (1500 - 90);
  const completed = acres * progress / 100;
  const seeds = seedTarget * progress / 100;
  const weeds = weedsTarget * progress / 100;
  const liquid = sprayTarget * progress / 100;
  const savings = savingsTarget * progress / 100;

  const notify = (message) => {
    setToast(message);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(""), 3200);
  };
  const addLog = (text) => {
    const now = new Date().toLocaleTimeString("en-IN", { hour12: false });
    setLogs((old) => [...old.slice(-35), { time: now, text }]);
  };

  const refreshSensors = () => {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => {
      setSensors({
        n: Math.round(38 + Math.random() * 12),
        p: Math.round(16 + Math.random() * 9),
        k: Math.round(165 + Math.random() * 40),
        moisture: Math.round(62 + Math.random() * 15),
        ph: +(6.2 + Math.random() * 1.1).toFixed(1),
        temp: Math.round(29 + Math.random() * 6),
        humidity: Math.round(55 + Math.random() * 16),
        battery: Math.round(89 + Math.random() * 10)
      });
      setSensorUpdated(new Date().toLocaleTimeString("en-IN", { hour12: false }));
      setRefreshing(false);
      notify("SENSOR TELEMETRY REFRESHED · ALL PROBES RESPONDING");
      addLog("[SENSORS] NPK, moisture and ambient probes refreshed successfully.");
    }, 600);
  };

  const startRun = () => {
    if (runState === "running") return;
    if (!features.length) { notify("SELECT AT LEAST ONE FIELD OPERATION"); return; }
    if (emergency) { notify("EMERGENCY STOP ACTIVE · CLEAR SAFETY LOCK FIRST"); return; }
    setProgress(0);
    setRunState("running");
    setLogs([{ time: new Date().toLocaleTimeString("en-IN", { hour12: false }), text: `[MISSION] ${acres.toFixed(1)} acre field run initialized · ${features.length} modules armed.` }]);
    notify("MISSION STARTED · FIELD BOT IS EXECUTING");
    let tick = 0;
    const totalTicks = 65;
    timerRef.current = setInterval(() => {
      tick += 1;
      const next = Math.min(100, tick / totalTicks * 100);
      setProgress(next);
      if ([5, 13, 22, 31, 40, 49, 57, 64].includes(tick)) {
        addLog(logTemplates[(tick + features.length) % logTemplates.length]);
      }
      if (tick >= totalTicks) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setRunState("complete");
        addLog("[MISSION] Field coverage complete · Mission audit generated · Rover in standby.");
        notify("FIELD RUN COMPLETE · AUDIT READY");
      }
    }, 100);
  };
  const pauseReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRunState("idle");
    setProgress(0);
    addLog("[SYS] Mission reset by operator · Drive actuators in standby.");
    notify("SIMULATION RESET · READY FOR NEXT RUN");
  };
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); clearTimeout(toastRef.current); }, []);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logs]);

  const downloadAudit = () => {
    const doc = new jsPDF();
    doc.setFillColor(27, 67, 50); doc.rect(0, 0, 210, 34, "F");
    doc.setTextColor(255,255,255); doc.setFontSize(18); doc.text("UZHAVAN BOT", 15, 17);
    doc.setFontSize(9); doc.text("FIELD AUDIT REPORT · SOLAR-HYBRID AGRIBOT", 15, 25);
    doc.setTextColor(30,45,35); doc.setFontSize(11);
    const lines = [
      `Generated: ${new Date().toLocaleString("en-IN")}`,
      "Farm Owner: Akshayprabhu M",
      "Land Parcel: Plot #4B - Kanchipuram Agro Cluster (3.5 Acres)",
      "Device Hardware ID: UZH-BOT-TN01",
      "Linked Entity: Local FPO Cooperative Node",
      `Autonomous Mode: ${autoMode ? "AUTO" : "MANUAL"}`,
      `Mission Status: ${runState.toUpperCase()}`,
      `Configured Acreage: ${acres.toFixed(1)} acres`,
      `Enabled Modules: ${features.map(x => featuresList.find(f => f.id === x)?.label).join(", ") || "None"}`,
      `Completion: ${Math.round(progress)}%`,
      `Estimated Seeds Dispensed: ${fmt(seeds)} seeds`,
      `Weed Clusters Eliminated: ${fmt(weeds)}`,
      `Bio-spraying Liquid: ${liquid.toFixed(2)} L`,
      `Estimated Farmer Savings: ₹${fmt(savings)}`,
      "",
      "NOTE: This prototype report contains simulated telemetry and mission estimates."
    ];
    let y = 48;
    lines.forEach(line => { const wrapped = doc.splitTextToSize(line, 178); doc.text(wrapped, 15, y); y += wrapped.length * 7 + 2; });
    doc.save("uzhavan-field-audit.pdf");
    notify("FIELD AUDIT PDF DOWNLOADED");
  };

  const toggleFeature = (id) => setFeatures(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  const missionLabel = runState === "running" ? "MISSION IN PROGRESS" : runState === "complete" ? "MISSION COMPLETE" : "STANDBY";
  const phLabel = sensors.ph < 6 ? "SLIGHTLY ACIDIC" : sensors.ph > 7.5 ? "SLIGHTLY ALKALINE" : "NEUTRAL RANGE";

  return <div className="app-shell">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <header className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark"><Sun size={19}/><Leaf size={15}/></div>
        <div><div className="brand-name">UZHAVAN <span>BOT</span></div><div className="brand-sub">5-IN-1 SOLAR-HYBRID AGRIBOT</div></div>
      </div>
      <div className="top-status"><span className="live-pulse"/><span>BOT ACTIVE</span><i/>SOLAR 18V CHARGING<i/><span className="gps"><MapPin size={12}/> GPS LOCKED · 12.9716° N, 79.9824° E</span></div>
      <button className="owner-button" onClick={() => setOwnerOpen(true)}><ShieldCheck size={16}/> OWNER CONSOLE</button>
    </header>

    {emergency && <div className="emergency-banner"><AlertOctagon size={18}/><div><strong>EMERGENCY MOTOR STOP ENGAGED</strong><span>Drive and field actuators are locked. Clear the safety lock before starting another run.</span></div><button onClick={() => { setEmergency(false); notify("SAFETY LOCK CLEARED · MOTOR CONTROL RESTORED"); }}><X size={16}/> CLEAR LOCK</button></div>}

    <main className="main-content">
      <section className="hero-row">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="kicker-line"/> FIELD OPERATIONS COMMAND CENTER <span className="date-chip"><Clock3 size={12}/> LIVE PROTOTYPE</span></div>
          <h1>SMARTER FARMING.<br/><em>ROOTED IN</em> TOMORROW.</h1>
          <p>One autonomous platform. Five essential operations. Built to make precision agriculture accessible to every smallholder farmer.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => document.getElementById("simulator")?.scrollIntoView({ behavior: "smooth" })}><Play size={15} fill="currentColor"/> RUN FIELD SIMULATION</button>
            <span className="hero-meta"><span className="mini-check"><Check size={12}/></span> SOLAR-POWERED · ZERO FOSSIL FUEL</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-topline"><span><span className="live-pulse"/> FIELD UNIT 01</span><span>UZH-BOT-TN01</span></div>
          <div className="bot-scene">
            <div className="sun-orb"/><div className="field-horizon"/>
            <div className="sun-panel"><div/><div/><div/><div/><div/><div/></div>
            <div className="bot-body"><div className="bot-top"><span/><span/><span/></div><div className="bot-front"><div className="sensor-eye"/><div className="sensor-eye"/></div><div className="bot-side"/></div>
            <div className="wheel wheel-left"/><div className="wheel wheel-right"/>
            <div className="bot-shadow"/>
            <div className="field-row row-a"/><div className="field-row row-b"/><div className="field-row row-c"/>
            <div className="visual-caption"><Sprout size={15}/> AUTONOMOUS FIELD ROVER <span>•</span> SOLAR ARRAY ONLINE</div>
          </div>
          <div className="visual-bottom"><div><small>POWER SOURCE</small><strong><Sun size={14}/> PV + LI-ION</strong></div><div><small>DRIVE MODE</small><strong><Bot size={14}/> {autoMode ? "AUTONOMOUS" : "MANUAL"}</strong></div><div><small>FIELD READINESS</small><strong><span className="ready-dot"/> OPERATIONAL</strong></div></div>
        </div>
      </section>

      <nav className="tabbar">
        <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>OVERVIEW</button>
        <button className={activeTab === "telemetry" ? "active" : ""} onClick={() => { setActiveTab("telemetry"); document.getElementById("telemetry")?.scrollIntoView({behavior:"smooth"}); }}>SENSOR TELEMETRY</button>
        <button className={activeTab === "simulator" ? "active" : ""} onClick={() => { setActiveTab("simulator"); document.getElementById("simulator")?.scrollIntoView({behavior:"smooth"}); }}>FIELD SIMULATOR</button>
        <button className={activeTab === "architecture" ? "active" : ""} onClick={() => { setActiveTab("architecture"); document.getElementById("architecture")?.scrollIntoView({behavior:"smooth"}); }}>SYSTEM ARCHITECTURE</button>
      </nav>

      <section id="telemetry" className="section-block">
        <SectionTitle eyebrow="01 / FIELD INTELLIGENCE" title="LIVE SOIL PARAMETERS & NPK TELEMETRY"
          right={<div className="section-tools"><span className="updated-label">UPDATED {sensorUpdated}</span><button className="outline-button" onClick={refreshSensors} disabled={refreshing}>{refreshing ? <span className="spinner"/> : <Activity size={15}/>} {refreshing ? "READING PROBES..." : "REFRESH SENSOR TELEMETRY"}</button></div>}/>
        <div className="telemetry-grid">
          <Card className="npk-card">
            <div className="card-title-row"><div><span className="card-kicker">MACRO NUTRIENTS</span><h3>SOIL NPK PROFILE</h3></div><span className="sensor-tag"><Waves size={13}/> PROBE 01</span></div>
            <div className="npk-list">
              <ProgressLine label="NITROGEN · N" value={sensors.n} max={60} unit="mg/kg" status="OPTIMAL" />
              <ProgressLine label="PHOSPHORUS · P" value={sensors.p} max={35} unit="mg/kg" status="GOOD" color="gold" />
              <ProgressLine label="POTASSIUM · K" value={sensors.k} max={250} unit="mg/kg" status="HIGH" color="sage" />
            </div>
            <div className="npk-foot"><CheckCircle2 size={14}/> NUTRIENT BALANCE WITHIN TARGET FIELD WINDOW</div>
          </Card>
          <Card className="moisture-card">
            <div className="card-title-row"><div><span className="card-kicker">HYDRATION INDEX</span><h3>SOIL MOISTURE</h3></div><Droplets size={17} className="muted-icon"/></div>
            <div className="moisture-content"><MoistureGauge value={sensors.moisture}/><div><strong>WELL IRRIGATED</strong><p>Root-zone moisture is in a healthy operating range.</p><span className="tiny-tag">FIELD CAPACITY: GOOD</span></div></div>
          </Card>
          <Card className="ph-card">
            <div className="card-title-row"><div><span className="card-kicker">ACIDITY / ALKALINITY</span><h3>SOIL pH LEVEL</h3></div><Gauge size={17} className="muted-icon"/></div>
            <div className="ph-reading"><strong>{sensors.ph.toFixed(1)}</strong><span>pH</span></div>
            <div className="ph-scale"><div className="ph-gradient"/><div className="ph-marker" style={{left:`${(sensors.ph/14)*100}%`}}/></div>
            <div className="scale-labels"><span>ACIDIC 0</span><span>NEUTRAL 7</span><span>ALKALINE 14</span></div>
            <span className="ph-status">{phLabel}</span>
          </Card>
        </div>
        <div className="environment-grid">
          <Metric label="AMBIENT TEMPERATURE" value={sensors.temp} unit="°C" note="FIELD AIR · NORMAL" icon={Thermometer} accent="clay"/>
          <Metric label="RELATIVE HUMIDITY" value={sensors.humidity} unit="%" note="AIR MOISTURE" icon={Waves} accent="blue"/>
          <Metric label="SOLAR BATTERY" value={sensors.battery} unit="%" note="≈ 7.5 HRS DAYLIGHT RUNTIME" icon={BatteryCharging} accent="green"/>
          <Metric label="SOLAR INPUT" value="18" unit="V" note="PV CHARGING · STABLE" icon={Sun} accent="gold"/>
        </div>
      </section>

      <section id="simulator" className="section-block">
        <SectionTitle eyebrow="02 / AUTONOMOUS MISSION CONTROL" title="REAL-TIME FIELD WORK SIMULATOR & AUDIT ENGINE"
          right={<StatusPill tone={runState === "running" ? "green" : runState === "complete" ? "blue" : "neutral"}>{missionLabel}</StatusPill>}/>
        <div className="sim-layout">
          <Card className="config-card">
            <div className="card-title-row"><div><span className="card-kicker">MISSION PARAMETERS</span><h3>FIELD CONFIGURATION</h3></div><Settings2 size={17} className="muted-icon"/></div>
            <div className="acreage-control">
              <div className="control-heading"><label>SELECT FIELD ACREAGE</label><strong>{acres.toFixed(1)} <small>ACRES</small></strong></div>
              <input type="range" min="0.5" max="5" step="0.5" value={acres} disabled={runState === "running"} onChange={(e) => setAcres(Number(e.target.value))}/>
              <div className="range-labels"><span>0.5 AC</span><span>2.5 AC</span><span>5.0 AC</span></div>
            </div>
            <div className="feature-heading"><span>ENABLE FIELD OPERATIONS</span><small>{selectedCount}/4 SELECTED</small></div>
            <div className="feature-list">
              {featuresList.map(({id,label,sub,icon:Icon}) => <label className={`feature-option ${features.includes(id) ? "selected" : ""}`} key={id}>
                <input type="checkbox" checked={features.includes(id)} disabled={runState === "running"} onChange={() => toggleFeature(id)}/>
                <span className="feature-icon"><Icon size={17}/></span><span className="feature-text"><strong>{label}</strong><small>{sub}</small></span><span className="custom-check"><Check size={12}/></span>
              </label>)}
            </div>
            <div className="config-note"><CircleHelp size={14}/> SIMULATION VALUES ARE ESTIMATES FOR PROTOTYPE DEMONSTRATION.</div>
            <div className="sim-actions">
              <button className="primary-button start-button" onClick={startRun} disabled={runState === "running" || emergency}><Play size={15} fill="currentColor"/> {runState === "running" ? "MISSION RUNNING" : "START SIMULATION RUN"}</button>
              <button className="reset-button" onClick={pauseReset}><RotateCcw size={14}/> PAUSE / RESET</button>
            </div>
          </Card>

          <div className="execution-column">
            <Card className="progress-card">
              <div className="card-title-row"><div><span className="card-kicker">LIVE EXECUTION</span><h3>MISSION PROGRESS</h3></div><span className={`mission-state ${runState}`}>{runState === "running" ? "● LIVE" : runState === "complete" ? "✓ DONE" : "○ READY"}</span></div>
              <div className="progress-big"><strong>{Math.round(progress)}<small>%</small></strong><span>{runState === "running" ? "FIELD OPERATIONS IN MOTION" : runState === "complete" ? "TARGET AREA COVERED" : "AWAITING START COMMAND"}</span></div>
              <div className="mission-track"><div className="mission-fill" style={{width:`${progress}%`}}/><span className="track-glow" style={{left:`${progress}%`}}/></div>
              <div className="progress-foot"><span>0% · START</span><span>{acres.toFixed(1)} ACRES TARGET</span><span>100% · COMPLETE</span></div>
            </Card>
            <div className="run-metrics">
              <div className="run-metric"><span className="run-icon"><Sprout size={16}/></span><small>SEEDS DISPENSED</small><strong>{fmt(seeds)}</strong><em>98.6% SPACING ACCURACY</em></div>
              <div className="run-metric"><span className="run-icon weed"><Leaf size={16}/></span><small>WEEDS ELIMINATED</small><strong>{fmt(weeds)}</strong><em>VISION AI DETECTIONS</em></div>
              <div className="run-metric"><span className="run-icon water"><Droplets size={16}/></span><small>BIO-SPRAYING LIQUID</small><strong>{liquid.toFixed(2)} <i>L</i></strong><em>TARGETED APPLICATION</em></div>
              <div className="run-metric"><span className="run-icon area"><MapPin size={16}/></span><small>AREA COMPLETED</small><strong>{completed.toFixed(2)} <i>AC</i></strong><em>OF {acres.toFixed(1)} ACRES</em></div>
            </div>
            <Card className="savings-card">
              <div className="savings-left"><span className="savings-icon"><ArrowDownRight size={19}/></span><div><small>NET FARMER COST SAVINGS</small><strong>₹{fmt(savings)} <i>SAVED</i></strong><span>ESTIMATED SAVING DURING THIS RUN</span></div></div>
              <div className="cost-compare"><div><small>MANUAL LABOUR</small><strong>₹1,500<span>/AC</span></strong></div><div className="compare-divider"/><div><small>UZHAVAN SOLAR</small><strong>₹90<span>/AC</span></strong></div></div>
            </Card>
          </div>
        </div>
        <Card className="terminal-card">
          <div className="terminal-head"><div><span className="terminal-lights"><i/><i/><i/></span><strong>LIVE ROLLING ACTIVITY TERMINAL</strong></div><span><span className="terminal-live"/> STREAM {runState === "running" ? "ACTIVE" : "STANDBY"}</span></div>
          <div className="terminal-body" ref={logRef}>
            {logs.map((log,i) => <div className="log-line" key={`${log.time}-${i}`}><span className="log-time">{log.time}</span><span className={log.text.includes("[MISSION]") ? "log-mission" : log.text.includes("[SYS]") ? "log-system" : ""}>{log.text}</span></div>)}
            {runState === "running" && <div className="log-line"><span className="log-time">···</span><span className="terminal-cursor">PROCESSING FIELD TELEMETRY_</span></div>}
          </div>
          <div className="terminal-foot"><span><span className="terminal-live"/> EDGE COMPUTER ONLINE</span><span>CAMERA · NPK PROBE · ULTRASONIC · ACTUATORS</span></div>
        </Card>
      </section>

      <section id="architecture" className="section-block architecture-section">
        <button className="architecture-toggle" onClick={() => setAbstractOpen(!abstractOpen)}>
          <div><p className="eyebrow">03 / THE UZHAVAN ADVANTAGE</p><h2>PROJECT ABSTRACT & SYSTEM ARCHITECTURE</h2></div>
          {abstractOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
        </button>
        {abstractOpen && <>
          <Card className="abstract-card">
            <div className="abstract-mark"><Leaf size={22}/><span>THE<br/>VISION</span></div>
            <div><span className="card-kicker">PROJECT ABSTRACT</span><p>Smallholder farmers in India, cultivating over 80% of agricultural lands, face unprecedented crises driven by acute seasonal labor shortages, escalating manual wages, and the unaffordable capital cost of heavy farm machinery. To address this bottleneck, UZHAVAN is developed as an affordable, multi-functional, solar-hybrid agricultural robot tailored for small acreage holdings. The system integrates five vital farming operations into a unified autonomous mobile platform: real-time NPK and soil parameter analysis, rotary tilling, precision seed dispensing, targeted micro-spraying, and vision-guided weed eradication. Powered by high-efficiency photovoltaic panels coupled with a lithium-ion battery backup, the rover operates autonomously throughout daylight hours with zero fossil-fuel emissions. For weeding, an onboard TinyML edge computer-vision algorithm distinguishes crop saplings from invasive weeds by analyzing leaf morphology and spatial grid lines, triggering an electromechanical actuator to eliminate weeds without soil erosion or crop injury. With an affordable manufacturing unit cost of ₹14,000 and a commercial pricing target of ₹20,000, UZHAVAN reduces smallholder operational farming expenses by over 60%, delivering a scalable, climate-resilient, and technologically democratic solution to modern Indian agriculture.</p></div>
          </Card>
          <div className="architecture-grid">
            <div className="architecture-card"><span className="arch-number">01</span><div className="arch-icon"><Sun size={19}/></div><h3>SOLAR-HYBRID POWER</h3><p>Photovoltaic panel, charge controller and lithium-ion backup power the rover with a low-emission energy loop.</p><span className="arch-tag">18V DC BUS · BATTERY BACKUP</span></div>
            <div className="architecture-card"><span className="arch-number">02</span><div className="arch-icon"><Cpu size={19}/></div><h3>EDGE INTELLIGENCE</h3><p>TinyML vision processing classifies crop saplings and invasive weeds using leaf morphology and spatial cues.</p><span className="arch-tag">CAMERA · TINYML · MCU</span></div>
            <div className="architecture-card"><span className="arch-number">03</span><div className="arch-icon"><Waves size={19}/></div><h3>SOIL SENSING</h3><p>NPK, pH and moisture probes capture field conditions to support informed, data-led interventions.</p><span className="arch-tag">NPK · PH · MOISTURE</span></div>
            <div className="architecture-card"><span className="arch-number">04</span><div className="arch-icon"><Tractor size={19}/></div><h3>MECHATRONIC TOOLS</h3><p>Modular tilling, seeding, micro-spraying and weed-removal attachments execute precision field tasks.</p><span className="arch-tag">MOTORS · PUMP · ACTUATOR</span></div>
          </div>
          <div className="five-in-one-strip"><div><span>5-IN-1</span><strong>ONE PLATFORM. FIVE FARMING FUNCTIONS.</strong></div><div className="function-pills">{["SOIL ANALYSIS","MICRO-TILLING","ROW SEEDING","MICRO-SPRAYING","AI WEEDING"].map(x=><span key={x}>{x}</span>)}</div></div>
        </>}
      </section>

      <footer className="footer"><div className="footer-brand"><div className="brand-mark small"><Sun size={13}/><Leaf size={11}/></div><strong>UZHAVAN BOT</strong></div><span>DESIGNED FOR SMALLHOLDER FARMERS · BUILT FOR A GREENER TOMORROW</span><span className="prototype-label">PROTOTYPE DASHBOARD · V1.0</span></footer>
    </main>

    <Modal open={ownerOpen} onClose={() => setOwnerOpen(false)}>
      <div className="modal-header"><div className="modal-icon"><ShieldCheck size={20}/></div><div><p className="eyebrow">SECURE DEVICE ACCESS</p><h2>OWNER CONSOLE</h2></div><button className="icon-button" onClick={() => setOwnerOpen(false)} aria-label="Close owner console"><X size={18}/></button></div>
      <div className="owner-profile"><div className="owner-avatar">AM</div><div><strong>AKSHAYPRABHU M</strong><span>REGISTERED FARM OWNER</span></div><StatusPill>VERIFIED</StatusPill></div>
      <div className="owner-details">
        <div><span>LAND PARCEL</span><strong>Plot #4B - Kanchipuram Agro Cluster</strong><small>3.5 ACRES</small></div>
        <div><span>DEVICE HARDWARE ID</span><strong className="mono">UZH-BOT-TN01</strong></div>
        <div><span>LINKED ENTITY</span><strong>Local FPO Cooperative Node</strong></div>
      </div>
      <div className="console-controls">
        <div className="console-control"><div><strong>TOGGLE AUTONOMOUS MODE</strong><small>Switch between autonomous and manual control</small></div><button className={`switch ${autoMode ? "on" : ""}`} onClick={() => { setAutoMode(!autoMode); notify(`BOT CONTROL SET TO ${autoMode ? "MANUAL" : "AUTONOMOUS"} MODE`); }} aria-label="Toggle autonomous mode"><span/></button></div>
        <button className="emergency-button" onClick={() => { setEmergency(true); if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; setRunState("idle"); setOwnerOpen(false); addLog("[SAFETY] EMERGENCY MOTOR STOP · ALL MOTION ACTUATORS DISABLED."); notify("EMERGENCY STOP ENGAGED · MOTORS DISABLED"); window.scrollTo({top:0,behavior:"smooth"}); }}><AlertOctagon size={16}/> EMERGENCY MOTOR STOP</button>
        <button className="download-button" onClick={downloadAudit}><Download size={16}/> DOWNLOAD FIELD AUDIT (PDF)</button>
      </div>
      <div className="modal-foot"><ShieldCheck size={13}/> LOCAL DEMONSTRATION CONSOLE · MOCK OWNER DATA</div>
    </Modal>
    {toast && <div className="toast"><CheckCircle2 size={17}/><span>{toast}</span><button onClick={() => setToast("")}><X size={14}/></button></div>}
  </div>;
}
