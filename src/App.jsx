import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";

// Inject spin animation
if(typeof document!=="undefined"&&!document.getElementById("yoko-spin")){const s=document.createElement("style");s.id="yoko-spin";s.textContent="@keyframes spin{to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap'); *{font-family:'Montserrat',sans-serif!important;font-weight:300;}";document.head.appendChild(s);}
const USERS = {
  admin: { password: "ysp2026#YOKO", role: "admin", name: "Head Office", outlet: null },
  santacruz: { password: "Yok0Cruz@54", role: "manager", name: null, outlet: "santacruz" },
  bandra: { password: "Y0koBandra@50", role: "manager", name: null, outlet: "bandra" },
  oshiwara: { password: "Y0k0Oshi@102", role: "manager", name: null, outlet: "oshiwara" },
  supervisor: { password: "Yk@supervisor", role: "supervisor", name: "Supervisor", outlet: null },
  office: { password: "YkOffice@50", role: "office", name: "Office", outlet: null },
};

const OUTLETS = {
  santacruz: { name: "Santacruz", accent: "#E8A838" },
  bandra: { name: "Bandra", accent: "#2a5b1e" },
  oshiwara: { name: "Oshiwara", accent: "#6C5CE7" },
};

const staffNames = {
  santacruz: ["Sagar","Irfan","Shankar Pujari","Vitthal Shetty","Sadashiv","Sudarshan","Ashish","Ali","Kanhaiya","Rishi","Rana Bose","Trilochan","Yakub Khatri","Shashi Manas","Thapa","Imran","Sachin","Ramesh Bharti","Ajeet Verma","Ramesh Old","Amar","Pawan Kumar","Durgesh Kumar","Wali Mohd","Watchman"],
  bandra: ["Arkam Khatri","Amit","Ravindra Poojari","Uday Poojari","Deepak Verma","Lal-ji","Kailash","Phool Chand","Kanhaiya","Lara","Prashant","Shlok","Shiva","Nomi","Kundan","Ajit Bharti","Raj Verma","Deenanath Chauhan","Watchman"],
  oshiwara: ["Tahir","Raj Kumar","Sandeep","Shahid Shaikh","Karunakar","Jagdish","Rambabu Chauhan","Aman","Ashraf","Sagar","Indradev Paswan","Nitesh Kumar","Pradeep","Rajveer Pal","Sonu","Kuldeep Kumar","Ram Badal","Dilip","Bolu","Samru","Kamal","Watchman 24hrs"],
};

// Opening checklist: structured with categories, scores, photo audits
const openingChecklist = {
  categories: [
    {name:"Infrastructure & Utilities",subtotal:4,items:[
      {text:"Lights & AC ON (all zones)",score:1},
      {text:"Gas cylinders & connections inspected (no leaks, regulators secure)",score:2,photoAudit:true},
      {text:"Kitchen equipment powered & functional",score:1},
    ]},
    {name:"Front of House Readiness",subtotal:4,items:[
      {text:"Dining area cleaned & tables set",score:1},
      {text:"Mirrors, doors & glass cleaned",score:1,photoAudit:true},
      {text:"Menu cards placed on all tables",score:1},
      {text:"Signage & external lighting working",score:1},
    ]},
    {name:"Staff & Delivery Readiness",subtotal:4,items:[
      {text:"Staff present & in full uniform",score:3},
      {text:"Delivery & Dining Dashboards online; Reservations checked",score:1},
    ]},
    {name:"POS & Cash Readiness",subtotal:2,items:[
      {text:"POS system tested",score:1},
      {text:"Opening petty cash verified",score:1,cashCheck:true},
    ]},
    {name:"Ambience",subtotal:1,items:[
      {text:"Music system ON",score:1},
    ]},
  ],
  totalScore:15
};
// Flatten for state compatibility
const openingFlat = openingChecklist.categories.flatMap(cat=>cat.items.map(it=>it.text));

// Kitchen checklist: structured with categories, scores, photo audits
const kitchenChecklist = {
  categories: [
    {name:"Temperature Control",subtotal:8,items:[
      {text:"Fridge temperature recorded (°C)",score:4},
      {text:"Freezer temperature recorded (if applicable)",score:4},
    ]},
    {name:"Food Handling & Preparation",subtotal:10,items:[
      {text:"Prep surfaces sanitized before use",score:3},
      {text:"Knives & sauce spoons washed and ready",score:2},
      {text:"FIFO rotation verified (labels visible)",score:3,photoAudit:true},
      {text:"Veggies washed & cut within SOP limits",score:2},
    ]},
    {name:"Oil & Fire Safety",subtotal:9,items:[
      {text:"Frying oil quality recorded (TPM %)",score:4},
      {text:"Fire extinguisher accessible & pressure OK",score:3},
      {text:"Exhaust filters checked",score:2},
    ]},
    {name:"Waste, Plumbing & Handwash",subtotal:6,items:[
      {text:"Grease trap status verified",score:3,photoAudit:true},
      {text:"Waste segregated correctly",score:1},
      {text:"Handwash station stocked (soap & tissue)",score:2},
    ]},
    {name:"Inventory Discipline",subtotal:2,items:[
      {text:"Indent order checked & stored correctly",score:2},
    ]},
  ],
  totalScore:35
};
const kitchenFlat = kitchenChecklist.categories.flatMap(cat=>cat.items.map(it=>it.text));

// Hygiene checklist: structured with categories, scores, photo audits
const hygieneChecklist = {
  categories: [
    {name:"Staff Hygiene",subtotal:7,items:[
      {text:"Hand hygiene facilities functional (water, soap, tissue)",score:3},
      {text:"Hairnets & gloves worn by kitchen staff",score:4,photoAudit:true},
    ]},
    {name:"Surfaces & Work Areas",subtotal:7,items:[
      {text:"Food-contact surfaces sanitized",score:3},
      {text:"Prep and cooking counters clean",score:2},
      {text:"Floor drains clear (no blockage or smell)",score:2},
    ]},
    {name:"Washrooms",subtotal:4,items:[
      {text:"Washrooms cleaned and usable",score:2},
      {text:"Washroom handwash stocked (soap & tissue)",score:2},
    ]},
    {name:"Waste & Storage Discipline",subtotal:4,items:[
      {text:"Dustbin liners replaced and bins covered",score:2},
      {text:"Food containers labelled (item name & date)",score:2,photoAudit:true},
    ]},
    {name:"Pest & Contamination Control",subtotal:3,items:[
      {text:"Pest traps checked",score:2,photoAudit:true},
      {text:"Raw & cooked food stored separately",score:1},
    ]},
  ],
  totalScore:25
};
const hygieneFlat = hygieneChecklist.categories.flatMap(cat=>cat.items.map(it=>it.text));

// Closing checklist: structured with categories, scores, photo audits
const closingChecklist = {
  categories: [
    {name:"Kitchen Shutdown & Food Safety",subtotal:4,items:[
      {text:"Gas cylinders switched off & regulators secured",score:2,photoAudit:true},
      {text:"Kitchen equipment cleaned after service",score:1},
      {text:"Leftover food stored properly & labelled",score:1,photoAudit:true},
    ]},
    {name:"Cleaning & Waste",subtotal:2,items:[
      {text:"Dining area cleaned",score:1},
      {text:"Trash disposed & bins cleared",score:1},
    ]},
    {name:"Cash & POS Closure",subtotal:2,items:[
      {text:"POS day-end completed",score:1},
      {text:"Closing cash counted & matched",score:1},
    ]},
    {name:"Security & Lockdown",subtotal:2,items:[
      {text:"Premises secured after closing (lights & AC off, doors locked, gas cylinder area secured)",score:2,photoAudit:true},
    ]},
  ],
  totalScore:10
};
const closingFlat = closingChecklist.categories.flatMap(cat=>cat.items.map(it=>it.text));

const checklistItems = {
  opening: openingFlat,
  closing: closingFlat,
  kitchen: kitchenFlat,
  hygiene: hygieneFlat,
};

const IC = {
  staff: <><circle cx="9" cy="7" r="3"/><path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"/></>,
  star: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
  chef: <><path d="M6 13.87A4 4 0 017.41 6a5 5 0 011.05-1.54 5 5 0 017.08 0A5 5 0 0116.59 6 4 4 0 0118 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></>,
  wallet: <><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></>,
  check: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
  alert: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  trend: <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  upload: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  down: <><polyline points="6 9 12 15 18 9"/></>,
  up: <><polyline points="18 15 12 9 6 15"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  wrench: <><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></>,
};

const Ic = ({name, size=18, color="#A8B3AE"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{IC[name]}</svg>
);

// ═══ CHARTS ═══

const DonutChart = ({data, colors, size=110, sw=12, center}) => {
  const ref = useRef(null);
  useEffect(() => {
    if(!ref.current) return;
    const svg = d3.select(ref.current); svg.selectAll("*").remove();
    const r = size/2;
    const arc = d3.arc().innerRadius(r-sw).outerRadius(r).cornerRadius(3);
    const pie = d3.pie().value(d=>d).sort(null).padAngle(0.04);
    const g = svg.append("g").attr("transform",`translate(${r},${r})`);
    g.selectAll("path").data(pie(data)).enter().append("path")
      .attr("d", arc).attr("fill",(_,i)=>colors[i%colors.length])
      .attr("opacity",0).transition().duration(700).delay((_,i)=>i*100).attr("opacity",1);
  },[data,colors,size,sw]);
  return (
    <div style={{position:"relative",width:size,height:size}}>
      <svg ref={ref} width={size} height={size}/>
      {center && <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>{center}</div>}
    </div>
  );
};

const BarChart = ({data, width=320, height=130, color="#E8A838"}) => {
  const ref = useRef(null);
  useEffect(() => {
    if(!ref.current) return;
    const svg = d3.select(ref.current); svg.selectAll("*").remove();
    const m={t:8,r:8,b:24,l:30}, w=width-m.l-m.r, h=height-m.t-m.b;
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    const x = d3.scaleBand().domain(data.map(d=>d.l)).range([0,w]).padding(0.35);
    const y = d3.scaleLinear().domain([0,d3.max(data,d=>d.v)*1.2]).range([h,0]);
    g.append("g").attr("transform",`translate(0,${h})`).call(d3.axisBottom(x).tickSize(0)).select(".domain").remove();
    g.selectAll(".tick text").attr("fill","#7D8A86").attr("font-size",10).attr("font-family","Montserrat").attr("font-weight",600);
    g.selectAll("rect").data(data).enter().append("rect")
      .attr("x",d=>x(d.l)).attr("width",x.bandwidth()).attr("rx",4)
      .attr("y",h).attr("height",0).attr("fill",color)
      .transition().duration(500).delay((_,i)=>i*60)
      .attr("y",d=>y(d.v)).attr("height",d=>h-y(d.v));
    g.selectAll(".vl").data(data).enter().append("text")
      .attr("x",d=>x(d.l)+x.bandwidth()/2).attr("y",d=>y(d.v)-4)
      .attr("text-anchor","middle").attr("fill","#CDD6D2").attr("font-size",10).attr("font-weight",700).attr("font-family","Montserrat")
      .text(d=>d.v);
  },[data,width,height,color]);
  return <svg ref={ref} width={width} height={height}/>;
};

const HBar = ({data, width=340, height=180}) => {
  const ref = useRef(null);
  useEffect(() => {
    if(!ref.current) return;
    const svg = d3.select(ref.current); svg.selectAll("*").remove();
    const m={t:4,r:8,b:4,l:85}, w=width-m.l-m.r, h=height-m.t-m.b;
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    const mx = d3.max(data,d=>d.p+d.n)||1;
    const y = d3.scaleBand().domain(data.map(d=>d.l)).range([0,h]).padding(0.3);
    const x = d3.scaleLinear().domain([0,mx*1.2]).range([0,w]);
    g.selectAll(".lb").data(data).enter().append("text")
      .attr("x",-6).attr("y",d=>y(d.l)+y.bandwidth()/2+4)
      .attr("text-anchor","end").attr("fill","#A8B3AE").attr("font-size",10).attr("font-weight",600).attr("font-family","Montserrat")
      .text(d=>d.l);
    g.selectAll(".p").data(data).enter().append("rect")
      .attr("x",0).attr("y",d=>y(d.l)).attr("height",y.bandwidth()).attr("rx",3)
      .attr("width",0).attr("fill","#10B981")
      .transition().duration(500).attr("width",d=>x(d.p));
    g.selectAll(".n").data(data).enter().append("rect")
      .attr("x",d=>x(d.p)+2).attr("y",d=>y(d.l)).attr("height",y.bandwidth()).attr("rx",3)
      .attr("width",0).attr("fill","#E8A838")
      .transition().duration(500).delay(150).attr("width",d=>x(d.n));
  },[data,width,height]);
  return <svg ref={ref} width={width} height={height}/>;
};

const Spark = ({data, color="#E8A838", w=180, h=45}) => {
  const ref = useRef(null);
  useEffect(() => {
    if(!ref.current||!data.length) return;
    const svg = d3.select(ref.current); svg.selectAll("*").remove();
    const x = d3.scaleLinear().domain([0,data.length-1]).range([4,w-4]);
    const y = d3.scaleLinear().domain([d3.min(data)*0.92,d3.max(data)*1.08]).range([h-4,4]);
    const line = d3.line().x((_,i)=>x(i)).y(d=>y(d)).curve(d3.curveCardinal.tension(0.4));
    const area = d3.area().x((_,i)=>x(i)).y0(h).y1(d=>y(d)).curve(d3.curveCardinal.tension(0.4));
    svg.append("path").datum(data).attr("d",area).attr("fill",color).attr("opacity",0.08);
    svg.append("path").datum(data).attr("d",line).attr("fill","none").attr("stroke",color).attr("stroke-width",2).attr("stroke-linecap","round");
  },[data,color,w,h]);
  return <svg ref={ref} width={w} height={h}/>;
};

const Gauge = ({score}) => {
  const c = score>=80?"#10B981":score>=60?"#E8A838":"#EF4444";
  const ref = useRef(null);
  useEffect(() => {
    if(!ref.current) return;
    const svg = d3.select(ref.current); svg.selectAll("*").remove();
    const s=150, cx=s/2, cy=s/2+8, r=s/2-16;
    const sa=-Math.PI*0.75, ea=Math.PI*0.75, va=sa+(score/100)*(ea-sa);
    const bg = d3.arc().innerRadius(r-11).outerRadius(r).startAngle(sa).endAngle(ea).cornerRadius(5);
    const g = svg.append("g").attr("transform",`translate(${cx},${cy})`);
    g.append("path").attr("d",bg).attr("fill","#1E2926");
    g.append("path")
      .attr("d",d3.arc().innerRadius(r-11).outerRadius(r).startAngle(sa).endAngle(sa).cornerRadius(5))
      .attr("fill",c)
      .transition().duration(1100).ease(d3.easeCubicOut)
      .attrTween("d",()=>{const i=d3.interpolate(sa,va);return t=>d3.arc().innerRadius(r-11).outerRadius(r).startAngle(sa).endAngle(i(t)).cornerRadius(5)();});
  },[score,c]);
  return (
    <div style={{position:"relative",width:150,height:150}}>
      <svg ref={ref} width={150} height={150}/>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-30%)",textAlign:"center"}}>
        <div style={{fontSize:36,fontWeight:900,color:c,textShadow:`0 2px 20px ${c}44`,fontFamily:"Montserrat"}}>{score}</div>
        <div style={{fontSize:9,fontWeight:700,color:"#7D8A86",letterSpacing:2,textTransform:"uppercase"}}>Health</div>
      </div>
    </div>
  );
};

// ═══ UI PRIMITIVES ═══

// Daily random photo audit: seeded hash per day+item, ~30% chance
const isPhotoAuditToday = (itemId) => {
  const dateStr = new Date().toISOString().slice(0,10);
  const seed = `${dateStr}-${itemId}`;
  let h = 0;
  for(let i=0;i<seed.length;i++){h=((h<<5)-h)+seed.charCodeAt(i);h|=0;}
  return (Math.abs(h)%100) < 30; // 30% probability
};

const glass = {background:"rgba(14,18,17,0.8)",backdropFilter:"blur(20px)",border:"1px solid rgba(232,168,56,0.08)",borderRadius:14,boxShadow:"0 6px 32px rgba(0,0,0,0.35),inset 0 1px 0 rgba(232,168,56,0.06)"};
const inp = {padding:"11px 14px",borderRadius:8,border:"1px solid rgba(26,107,90,0.12)",background:"rgba(17,22,20,0.9)",color:"#E5EBE8",fontSize:13,fontFamily:"Montserrat",fontWeight:500,outline:"none",width:"100%",boxSizing:"border-box",transition:"border-color 0.2s",boxShadow:"inset 0 1px 0 rgba(232,168,56,0.04)"};
const btn = (bg)=>({padding:"10px 20px",borderRadius:10,border:`1px solid ${typeof bg==="string"&&bg.startsWith("rgba")?"rgba(255,255,255,0.06)":`${bg}40`}`,background:`linear-gradient(135deg,${bg},${typeof bg==="string"&&bg.startsWith("rgba")?bg:"rgba(0,0,0,0.2)"})`,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",boxShadow:`0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)`,transition:"all 0.25s cubic-bezier(0.4,0,0.2,1)",letterSpacing:0.5,textTransform:"uppercase"});
const badge = (bg,c)=>({display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:6,fontSize:10,fontWeight:700,background:bg,color:c,boxShadow:"0 1px 2px rgba(232,168,56,0.06)"});
const tag = (ok)=>({display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:6,fontSize:10,fontWeight:700,background:ok?"#10B98118":"#EF444418",color:ok?"#10B981":"#EF4444"});

// Expandable Section
const Section = ({icon,title,accent,children,open:defOpen=false,count,alertN}) => {
  const [open,setOpen] = useState(defOpen);
  return (
    <div style={{...glass,marginBottom:14,overflow:"hidden"}}>
      <div onClick={()=>setOpen(!open)} style={{padding:"14px 20px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",borderBottom:open?"1px solid rgba(26,107,90,0.06)":"none",background:open?`${accent}06`:"transparent",transition:"all 0.3s"}}>
        <div style={{width:34,height:34,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",background:`${accent}15`,flexShrink:0}}>
          <Ic name={icon} size={16} color={accent}/>
        </div>
        <h3 style={{flex:1,fontSize:13,fontWeight:800,color:"#EFF4F1",letterSpacing:0.5,margin:0,textTransform:"uppercase"}}>{title}</h3>
        {count!==undefined && <span style={badge(`${accent}18`,accent)}>{count}</span>}
        {alertN>0 && <span style={badge("#EF444418","#EF4444")}>{alertN} !</span>}
        <Ic name={open?"up":"down"} size={16} color="#5E6764"/>
      </div>
      {open && <div style={{padding:"18px 20px"}}>{children}</div>}
    </div>
  );
};

// Modal
const Modal = ({open,onClose,title,children,wide}) => {
  if(!open) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}}/>
      <div onClick={e=>e.stopPropagation()} style={{...glass,padding:24,width:wide?660:440,maxWidth:"95vw",maxHeight:"85vh",overflow:"auto",position:"relative",zIndex:1,border:"1px solid rgba(232,168,56,0.12)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <h3 style={{fontSize:15,fontWeight:800,margin:0,color:"#EFF4F1"}}>{title}</h3>
          <div onClick={onClose} style={{cursor:"pointer",padding:4}}><Ic name="x" size={18} color="#7D8A86"/></div>
        </div>
        {children}
      </div>
    </div>
  );
};

// ═══ LOGIN ═══

// Outlet GPS coordinates
const OUTLET_GPS = {
  santacruz: {lat:19.077721480866643, lng:72.83806296588831},
  bandra: {lat:19.056257012350315, lng:72.83473613941624},
  oshiwara: {lat:19.148285129801685, lng:72.83159690922217},
};
const GPS_RADIUS_M = 30.48; // 100 feet in meters
const haversineM = (lat1,lon1,lat2,lon2) => {
  const R=6371000;const toRad=d=>d*Math.PI/180;
  const dLat=toRad(lat2-lat1);const dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
};

const Login = ({onLogin, staffData}) => {
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [err,setErr]=useState(""); const [m,setM]=useState(false);
  const [pendingUser,setPendingUser]=useState(null);
  const [gpsChecking,setGpsChecking]=useState(false);
  const [gpsError,setGpsError]=useState("");
  useEffect(()=>{setTimeout(()=>setM(true),100);},[]);

  const proceedWithLogin = (user) => {
    if(user.role==="manager"&&user.outlet){
      const managers = (staffData[user.outlet]||[]).filter(s=>s.dept==="Manager").map(s=>s.name);
      if(managers.length>1){setPendingUser({...user,username:u.toLowerCase(),managers});return;}
      onLogin({...user,username:u.toLowerCase(),name:managers[0]||OUTLETS[user.outlet].name});
    } else {onLogin({...user,username:u.toLowerCase()});}
  };

  const go = ()=>{
    const user=USERS[u.toLowerCase()];
    if(!user||user.password!==p){
      // Check if admin password was used for outlet login (GPS override)
      if(user && user.role==="manager" && p===USERS.admin.password){
        proceedWithLogin({...user,gpsOverride:true});
        return;
      }
      setErr("Invalid credentials");setTimeout(()=>setErr(""),2500);return;
    }
    // For manager logins, verify GPS
    if(user.role==="manager"&&user.outlet){
      const target=OUTLET_GPS[user.outlet];
      if(!target){proceedWithLogin(user);return;}
      setGpsChecking(true);setGpsError("");
      if(!navigator.geolocation){
        setGpsError("GPS not available on this device. ");
        setGpsChecking(false);return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos)=>{
          const dist=haversineM(pos.coords.latitude,pos.coords.longitude,target.lat,target.lng);
          setGpsChecking(false);
          if(dist<=GPS_RADIUS_M){
            proceedWithLogin(user);
          } else {
            setGpsError(`You are ${Math.round(dist*3.281)}ft from ${OUTLETS[user.outlet].name} outlet. Must be within 100ft. `);
          }
        },
        (gErr)=>{
          setGpsChecking(false);
          if(gErr.code===1) setGpsError("Location permission denied. Allow location access");
          else if(gErr.code===2) setGpsError("Location unavailable. Try again");
          else setGpsError("Location request timed out. Try again");
        },
        {enableHighAccuracy:true,timeout:10000,maximumAge:0}
      );
    } else {
      proceedWithLogin(user);
    }
  };  return (
    <div style={{minHeight:"100vh",background:"#0C0F0E",fontFamily:"'Montserrat',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(26,107,90,0.07) 0%,transparent 70%)",top:-120,right:-80}}/>
      <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(181,139,60,0.07) 0%,transparent 70%)",bottom:-80,left:-60}}/>
      <div style={{...glass,width:400,maxWidth:"92vw",padding:40,textAlign:"center",opacity:m?1:0,transform:m?"translateY(0)":"translateY(30px)",transition:"all 0.8s cubic-bezier(0.16,1,0.3,1)"}}>
        <div style={{fontSize:11,fontWeight:900,letterSpacing:8,color:"#E8A838",textTransform:"uppercase",marginBottom:6}}>YOKO SIZZLERS</div>
        <h1 style={{fontSize:26,fontWeight:900,margin:"0 0 4px",background:"linear-gradient(135deg,#F5F9F7,#E8A838)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Operations Hub</h1>
        <p style={{color:"#5E6764",fontSize:12,marginBottom:30,fontWeight:500}}>Outlet Health & Management Dashboard</p>
        {pendingUser ? (
          /* Manager selection step */
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{fontSize:13,fontWeight:700,color:"#E5EBE8",marginBottom:4}}>Who is logging in?</div>
            <div style={{fontSize:11,color:"#7D8A86",marginBottom:8}}>{OUTLETS[pendingUser.outlet].name} Outlet</div>
            {(()=>{const oc=OUTLETS[pendingUser.outlet]?.accent||"#2D8E76"; return pendingUser.managers.map(name=>(
              <button key={name} onClick={()=>onLogin({...pendingUser,name})} style={{...btn(`${oc}18`),padding:"14px 20px",fontSize:14,color:"#EFF4F1",display:"flex",alignItems:"center",justifyContent:"center",gap:8,border:`1px solid ${oc}30`}}>
                <Ic name="staff" size={16} color={oc}/> {name}
              </button>
            ));})()}
            <button onClick={()=>setPendingUser(null)} style={{...btn("rgba(26,107,90,0.06)"),padding:"10px 16px",fontSize:11,color:"#7D8A86",marginTop:4}}>← Back</button>
          </div>
        ) : (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input placeholder="Username" value={u} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} style={inp}/>
          <input type="password" placeholder="Password" value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} style={inp}/>
          {err && <div style={{color:"#EF4444",fontSize:12,fontWeight:600}}>{err}</div>}
          {gpsChecking && <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px",borderRadius:8,background:"rgba(26,107,90,0.05)",border:"1px solid rgba(26,107,90,0.1)"}}>
            <div style={{width:14,height:14,border:"2px solid #2D8E76",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
            <span style={{fontSize:12,fontWeight:600,color:"#2D8E76"}}>Verifying location...</span>
          </div>}
          {gpsError && <div style={{padding:"10px 12px",borderRadius:8,background:"#EF444410",border:"1px solid #EF444420",fontSize:11,fontWeight:600,color:"#EF4444",textAlign:"left",lineHeight:1.5}}>{gpsError}</div>}
          <button onClick={go} style={{padding:"14px 28px",borderRadius:12,border:"1px solid rgba(232,168,56,0.3)",background:"linear-gradient(135deg,rgba(232,168,56,0.2),rgba(232,168,56,0.05))",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",color:"#E8A838",fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:"0 4px 20px rgba(232,168,56,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",transition:"all 0.25s",letterSpacing:1,textTransform:"uppercase",width:"100%",textShadow:"0 1px 8px rgba(232,168,56,0.3)"}}>Sign In</button>
        </div>
        )}
      </div>
    </div>
  );
};

// ═══ OUTLET DASHBOARD ═══

const OutletDash = ({outletKey, onBack, isAdmin, isOffice, maint, setMaint, extScores, revData, staffData, setStaffData, compData, setCompData, notifications, addNotif, attHistory, recordAttendance, transfers, requestTransfer, acceptTransfer, rejectTransfer, submitPettyCash, pettyCashHistory, setOutletHealth, recordHealthSnapshot, userName, salaryData, setSalaryData, salaryStatus, setSalaryStatus, salaryHistory, setSalaryHistory}) => {
  const meta = OUTLETS[outletKey];
  const ac = meta.accent;
  const userRole = isAdmin?"admin":isOffice?"office":"manager";

  // State
  const staff = staffData[outletKey].filter(s=>s.status!=="transferred");
  const setStaff = (updater) => setStaffData(prev=>({...prev,[outletKey]:typeof updater==="function"?updater(prev[outletKey]):updater}));
  const comp = compData[outletKey];
  const setComp = (updater) => setCompData(prev=>({...prev,[outletKey]:typeof updater==="function"?updater(prev[outletKey]):updater}));
  const [cls, setCls] = useState({
    opening:openingChecklist.categories.flatMap((cat,ci)=>cat.items.map((it,ii)=>({id:`o${ci}-${ii}`,text:it.text,done:false,score:it.score,photoAudit:!!it.photoAudit,cashCheck:!!it.cashCheck,photo:null,category:cat.name}))),
    closing:closingChecklist.categories.flatMap((cat,ci)=>cat.items.map((it,ii)=>({id:`c${ci}-${ii}`,text:it.text,done:false,score:it.score,photoAudit:!!it.photoAudit,photo:null,category:cat.name}))),
    kitchen:kitchenChecklist.categories.flatMap((cat,ci)=>cat.items.map((it,ii)=>({id:`k${ci}-${ii}`,text:it.text,done:false,score:it.score,photoAudit:!!it.photoAudit,photo:null,category:cat.name}))),
    hygiene:hygieneChecklist.categories.flatMap((cat,ci)=>cat.items.map((it,ii)=>({id:`h${ci}-${ii}`,text:it.text,done:false,score:it.score,photoAudit:!!it.photoAudit,photo:null,category:cat.name})))
  });
  const [fin, setFin] = useState({petty:8500});
  const rev = revData[outletKey]?.current || {del:{zomato:0,swiggy:0},din:{zomato:0,google:0},weekly:{total:0,dist:{"1":0,"2":0,"3":0,"4":0,"5":0},sent:{Quality:[0,0],Taste:[0,0],Ambience:[0,0],Music:[0,0],Service:[0,0],Delay:[0,0],Misc:[0,0]}}};
  const lastWeek = revData[outletKey]?.lastWeek || null;
  const [modal, setModal] = useState(null);
  const [activeTab, setActiveTab] = useState("attendance");
  const [mt, setMt] = useState(false);
  const [attSubmitted, setAttSubmitted] = useState(false);
  const [attSubmitTime, setAttSubmitTime] = useState(null);
  const [attDate, setAttDate] = useState(new Date().toDateString());
  const [now, setNow] = useState(new Date());
  const [clsSubmitted, setClsSubmitted] = useState({opening:false,closing:false,kitchen:false,hygiene:false});
  const [clsSubmitTime, setClsSubmitTime] = useState({opening:null,closing:null,kitchen:null,hygiene:null});
  const [clsSubmitBy, setClsSubmitBy] = useState({opening:null,closing:null,kitchen:null,hygiene:null});
  const [staffModal, setStaffModal] = useState(null); // {type:"rename"|"add"|"transfer"|"history",staff?}
  const [smName,setSmName]=useState("");
  const [smShift,setSmShift]=useState("Waiter");
  const [smSelStaff,setSmSelStaff]=useState("");
  const [smSelOutlet,setSmSelOutlet]=useState("");
  const [attMonth,setAttMonth]=useState(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;});
  const [pcSubmitted,setPcSubmitted]=useState(false);
  const [pcAmount,setPcAmount]=useState("");
  const [openingPcAmount,setOpeningPcAmount]=useState("");
  const [openingPcVerified,setOpeningPcVerified]=useState(null); // null=not checked, true=match, false=mismatch
  const canEdit = !isAdmin; // managers and office can edit
  const canManageStaff = true; // all roles can manage staff (admin, office, manager)
  useEffect(()=>{setTimeout(()=>setMt(true),50);},[]);
  useEffect(()=>{const iv=setInterval(()=>{const n=new Date();setNow(n);if(n.toDateString()!==attDate){setAttDate(n.toDateString());setAttSubmitted(false);setAttSubmitTime(null);setClsSubmitted({opening:false,closing:false,kitchen:false,hygiene:false});setClsSubmitTime({opening:null,closing:null,kitchen:null,hygiene:null});setClsSubmitBy({opening:null,closing:null,kitchen:null,hygiene:null});setPcSubmitted(false);setPcAmount("");setOpeningPcAmount("");setOpeningPcVerified(null);setStaff(prev=>prev.map(s=>s.status==="transferred"?s:{...s,status:"not_marked"}));setCls({
    opening:openingChecklist.categories.flatMap((cat,ci)=>cat.items.map((it,ii)=>({id:`o${ci}-${ii}`,text:it.text,done:false,score:it.score,photoAudit:!!it.photoAudit,cashCheck:!!it.cashCheck,photo:null,category:cat.name}))),
    closing:closingChecklist.categories.flatMap((cat,ci)=>cat.items.map((it,ii)=>({id:`c${ci}-${ii}`,text:it.text,done:false,score:it.score,photoAudit:!!it.photoAudit,photo:null,category:cat.name}))),
    kitchen:kitchenChecklist.categories.flatMap((cat,ci)=>cat.items.map((it,ii)=>({id:`k${ci}-${ii}`,text:it.text,done:false,score:it.score,photoAudit:!!it.photoAudit,photo:null,category:cat.name}))),
    hygiene:hygieneChecklist.categories.flatMap((cat,ci)=>cat.items.map((it,ii)=>({id:`h${ci}-${ii}`,text:it.text,done:false,score:it.score,photoAudit:!!it.photoAudit,photo:null,category:cat.name})))
  });}},1000);return()=>clearInterval(iv);},[attDate,outletKey]);

  // IST time helpers — get real IST regardless of browser timezone
  const getISTDate = (d) => new Date(d.toLocaleString("en-US",{timeZone:"Asia/Kolkata"}));
  const istNow = getISTDate(now);
  const istH = istNow.getHours(); const istM = istNow.getMinutes();
  const istMins = istH*60+istM;
  const attWindowOpen = istMins >= 690; // 11:30 AM = 690 mins
  const attWindowClose = istMins <= 900; // 3:00 PM = 900 mins
  const inAttWindow = attWindowOpen && attWindowClose;
  const pastDeadline = istMins > 900;
  const lateSubmission = attSubmitted && attSubmitTime && attSubmitTime > 900;

  // Checklist time windows and deadlines
  // Opening, Kitchen, Hygiene: available 10:00 AM (600) to 12:30 PM (750)
  const clsWindowOpen = 600; // 10:00 AM
  const clsWindowClose = 750; // 12:30 PM
  const inClsWindow = istMins >= clsWindowOpen && istMins <= clsWindowClose;
  const clsPastDeadline = istMins > clsWindowClose;
  // Closing & Petty Cash: available 10:00 PM (1320) to 2:00 AM (120 next day)
  const nightWindowOpen = 1320; // 10:00 PM
  const nightWindowClose = 120; // 2:00 AM
  const inNightWindow = istMins >= nightWindowOpen || istMins <= nightWindowClose;
  const nightPastDeadline = istMins > nightWindowClose && istMins < 600; // 2AM-10AM = past deadline
  const nightNotOpen = istMins > nightWindowClose && istMins < nightWindowOpen && !(istMins < 600); // between 2AM-10PM but not in the late zone

  const openingPastDeadline = clsPastDeadline && !clsSubmitted.opening;
  const closingPastDeadline = nightPastDeadline && !clsSubmitted.closing;
  const kitchenPastDeadline = clsPastDeadline && !clsSubmitted.kitchen;
  const hygienePastDeadline = clsPastDeadline && !clsSubmitted.hygiene;
  const openingLate = clsSubmitted.opening && clsSubmitTime.opening && clsSubmitTime.opening > clsWindowClose;
  const closingLate = clsSubmitted.closing && clsSubmitTime.closing && (clsSubmitTime.closing > nightWindowClose && clsSubmitTime.closing < 600);
  const kitchenLate = clsSubmitted.kitchen && clsSubmitTime.kitchen && clsSubmitTime.kitchen > clsWindowClose;
  const hygieneLate = clsSubmitted.hygiene && clsSubmitTime.hygiene && clsSubmitTime.hygiene > clsWindowClose;
  // Petty cash: same window as closing (10PM-2AM)
  const pcPastDeadline = nightPastDeadline && !pcSubmitted;

  // Health
  const pres = staff.filter(s=>s.status==="present"||s.status==="late").length;
  const late = staff.filter(s=>s.status==="late").length;
  const abs = staff.filter(s=>s.status==="absent").length;
  const unmk = staff.filter(s=>s.status==="not_marked").length;

  const computeHealth = () => {
    let sc = 0;
    // ═══ CHECKLISTS (85 pts max) ═══
    // Opening: 15 pts
    let openingPts = cls.opening.filter(c=>c.done).reduce((s,c)=>s+(c.score||0),0);
    if(openingLate) openingPts = Math.floor(openingPts/2); // late = halved
    sc += openingPts;
    // Kitchen: 35 pts
    let kitchenPts = cls.kitchen.filter(c=>c.done).reduce((s,c)=>s+(c.score||0),0);
    if(kitchenLate) kitchenPts = Math.floor(kitchenPts/2);
    sc += kitchenPts;
    // Hygiene: 25 pts
    let hygienePts = cls.hygiene.filter(c=>c.done).reduce((s,c)=>s+(c.score||0),0);
    if(hygieneLate) hygienePts = Math.floor(hygienePts/2);
    sc += hygienePts;
    // Closing: 10 pts
    let closingPts = cls.closing.filter(c=>c.done).reduce((s,c)=>s+(c.score||0),0);
    if(closingLate) closingPts = Math.floor(closingPts/2);
    sc += closingPts;

    // ═══ ATTENDANCE (5 pts) — only after submitted ═══
    if(attSubmitted){
      const presPct = staff.length>0 ? pres/staff.length : 0;
      let attPts = 0;
      if(presPct>=0.9) attPts=5;
      else if(presPct>=0.8) attPts=3;
      else if(presPct>=0.6) attPts=1;
      if(lateSubmission) attPts = Math.floor(attPts/2);
      sc += attPts;
    }

    // ═══ PETTY CASH (5 pts) — only after submitted ═══
    if(pcSubmitted){
      if(fin.petty<=10000) sc+=5;
      else if(fin.petty<=15000) sc+=2;
    }

    // ═══ REVIEWS (10 pts) — only when review data exists ═══
    const sentData = rev.weekly?.sent || {};
    const totalNeg = Object.values(sentData).reduce((s,arr)=>s+(Array.isArray(arr)?arr[1]||0:0),0);
    const hasReviewData = rev.weekly?.total > 0;
    if(hasReviewData){
      if(totalNeg>2) sc += 0;
      else sc += 10;
    }

    return Math.max(0,Math.min(100,sc));
  };
  const health = computeHealth();
  // Report health to App level for Admin overview
  useEffect(()=>{
    if(setOutletHealth) setOutletHealth(prev=>prev[outletKey]===health?prev:{...prev,[outletKey]:health});
    if(recordHealthSnapshot) recordHealthSnapshot(outletKey,health);
  },[health,outletKey]);

  // Alerts — external audit issues first, then critical, then warnings.
  const alerts = [];
  const ext = (extScores[outletKey]||[])[0] || null;
  if(!isOffice){
    // External audit alerts (admin/manager only)
    if(ext && ext.score<60) alerts.push({t:"critical",m:`External audit FAILED — score ${ext.score}/100 (${ext.grade})`});
    else if(ext && ext.score<75) alerts.push({t:"warn",m:`External audit warning — score ${ext.score}/100 (${ext.grade})`});
    // Review performance alerts
    if(lastWeek && rev.weekly.total>0) {
      const curAvg = (rev.del.zomato+rev.del.swiggy+rev.din.zomato+rev.din.google)/4;
      const prevAvg = (lastWeek.del.zomato+lastWeek.del.swiggy+lastWeek.din.zomato+lastWeek.din.google)/4;
      const diff = curAvg-prevAvg;
      if(diff<=-0.15) alerts.push({t:"critical",m:`Review ratings dropped significantly (${diff.toFixed(2)} avg decline vs last week)`});
      else if(diff<=-0.05) alerts.push({t:"warn",m:`Review ratings declined slightly (${diff.toFixed(2)} avg vs last week)`});
      else if(diff>=0.15) alerts.push({t:"info",m:`Review ratings improved significantly (+${diff.toFixed(2)} avg vs last week)`});
    }
    // Late checklist alerts
    // Only show "not submitted" alerts — once submitted, action is done (no late alerts)
    if(openingPastDeadline) alerts.push({t:"critical",m:"Opening checklist not submitted — past 12:00 PM deadline"});
    if(closingPastDeadline) alerts.push({t:"critical",m:"Closing checklist not submitted — past 2:00 AM deadline"});
    if(kitchenPastDeadline) alerts.push({t:"critical",m:"Kitchen checklist not submitted — past 12:30 PM deadline"});
    if(hygienePastDeadline) alerts.push({t:"critical",m:"Hygiene checklist not submitted — past 12:30 PM deadline"});
  }
  // Attendance alerts (all roles) — only show if NOT yet submitted
  if(!attSubmitted && pastDeadline) alerts.push({t:"critical",m:"Attendance not submitted — past 3:00 PM deadline"});
  if(!isOffice){
    // AMC alerts — compute overdue dynamically from due date
    const today = new Date();
    comp.amcs.forEach(a=>{
      const due = new Date(a.due);
      if(due<today) alerts.push({t:"critical",m:`${a.eq} AMC overdue (due ${a.due})`});
      else {
        const in14 = new Date(today.getTime()+14*24*60*60*1000);
        if(due<=in14) alerts.push({t:"warn",m:`${a.eq} AMC due soon (${a.due})`});
      }
    });
    if(fin.petty>10000) alerts.push({t:"critical",m:`Petty cash ₹${fin.petty.toLocaleString()} exceeds ₹10,000 limit`});
    const in30 = new Date(today.getTime()+30*24*60*60*1000);
    if(new Date(comp.fssai)<=in30 && new Date(comp.fssai)>=today) alerts.push({t:"warn",m:`FSSAI license expiring on ${comp.fssai} — renew within 30 days`});
    else if(new Date(comp.fssai)<today) alerts.push({t:"critical",m:`FSSAI license EXPIRED on ${comp.fssai} — renew immediately`});
    if(new Date(comp.fire)<=in30 && new Date(comp.fire)>=today) alerts.push({t:"warn",m:`Fire Safety certificate expiring on ${comp.fire} — renew within 30 days`});
    else if(new Date(comp.fire)<today) alerts.push({t:"critical",m:`Fire Safety certificate EXPIRED on ${comp.fire} — renew immediately`});
  }
  // Warnings
  if(abs>0) alerts.push({t:"warn",m:`${abs} staff absent`});
  if(unmk>staff.length*0.5 && !attSubmitted && !pastDeadline) alerts.push({t:"warn",m:"Attendance not submitted yet"});
  // Checklist incomplete warnings — only show before deadline, not after (critical alert handles post-deadline)
  if(!isOffice) Object.entries(cls).forEach(([k,v])=>{
    const isComplete = v.filter(c=>c.done).length >= v.length*0.5;
    const isMorning = k==="opening"||k==="kitchen"||k==="hygiene";
    const isNight = k==="closing";
    // Don't show closing incomplete before its window opens (10 PM)
    if(isNight && !(istMins >= nightWindowOpen || istMins <= nightWindowClose)) return;
    const deadlinePassed = isMorning ? clsPastDeadline : isNight ? (istMins > nightWindowClose && istMins < 600) : false;
    if(!isComplete && !deadlinePassed && !clsSubmitted[k]) alerts.push({t:"warn",m:`${k.charAt(0).toUpperCase()+k.slice(1)} checklist incomplete`});
  });

  // Tab definitions — Office can only see Attendance, Reviews, Compliance, Maintenance
  const allTabs = [
    {id:"attendance",label:"Attendance",icon:"staff",alertN:abs+((!attSubmitted&&pastDeadline)?1:0)},
    {id:"reviews",label:"Reviews",icon:"star",hideFor:["office"]},
    {id:"checklists",label:"Checklists",icon:"check",alertN:Object.values(cls).some(cl=>cl.filter(c=>c.done).length<cl.length*0.5)?1:0,hideFor:["office"]},
    {id:"compliance",label:"Compliance",icon:"shield",alertN:comp.amcs.filter(a=>new Date(a.due)<new Date()).length},
    {id:"finance",label:"Finance",icon:"wallet",alertN:fin.petty>10000?1:0,hideFor:["office"]},
    {id:"maintenance",label:"Maintenance",icon:"wrench",alertN:maint[outletKey].filter(m=>m.status==="pending").length},
    {id:"salary",label:"Salary",icon:"wallet",hideFor:["manager"]},
    {id:"guidebook",label:"Guidebook",icon:"list",hideFor:["office"]},
  ];
  const tabs = allTabs.filter(t=>!t.hideFor||!t.hideFor.includes(userRole));

  return (
    <div style={{opacity:mt?1:0,transform:mt?"translateY(0)":"translateY(16px)",transition:"all 0.5s cubic-bezier(0.16,1,0.3,1)"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {(isAdmin||isOffice) && <button onClick={onBack} style={{width:38,height:38,borderRadius:10,border:"1px solid rgba(26,107,90,0.12)",background:"rgba(21,28,25,0.6)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#A8B3AE",fontSize:16}}>←</button>}
          <div>
            <div style={{fontSize:11,fontWeight:800,color:ac,letterSpacing:4,textTransform:"uppercase"}}>{meta.name} Outlet</div>
            <h2 style={{fontSize:20,fontWeight:900,margin:0,background:"linear-gradient(135deg,#EFF4F1,#E8A838)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Operations Dashboard</h2>
          </div>
        </div>
      </div>

      {/* Sidebar + Main (health + content) */}
      <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
        {/* Sidebar */}
        <div style={{...glass,padding:"10px 8px",width:170,flexShrink:0,position:"sticky",top:60}}>
          {tabs.map(t=>(
            <div key={t.id} onClick={()=>setActiveTab(t.id)} style={{
              display:"flex",alignItems:"center",gap:9,padding:"10px 12px",borderRadius:10,cursor:"pointer",marginBottom:3,
              background:activeTab===t.id?`linear-gradient(135deg,${ac}18,${ac}08)`:"transparent",
              border:activeTab===t.id?`1px solid ${ac}30`:"1px solid transparent",
              backdropFilter:activeTab===t.id?"blur(12px)":"none",WebkitBackdropFilter:activeTab===t.id?"blur(12px)":"none",
              boxShadow:activeTab===t.id?`0 2px 12px ${ac}15, inset 0 1px 0 rgba(255,255,255,0.06)`:"none",
              transition:"all 0.2s"
            }}>
              <Ic name={t.icon} size={15} color={activeTab===t.id?ac:"#7D8A86"}/>
              <span style={{fontSize:12,fontWeight:activeTab===t.id?800:600,color:activeTab===t.id?"#EFF4F1":"#A8B3AE",flex:1}}>{t.label}</span>
              {t.alertN>0 && <div style={{width:18,height:18,borderRadius:5,background:"#EF444422",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#EF4444"}}>{t.alertN}</div>}
            </div>
          ))}
        </div>

        {/* Main column: health row + content */}
        <div style={{flex:1,minWidth:0}}>

      {/* Health + Alerts row — hidden on salary tab */}
      {activeTab!=="salary" && (()=>{
        const ext = (extScores[outletKey]||[])[0] || null;
        const extC = ext ? (ext.score>=80?"#10B981":ext.score>=60?"#E8A838":"#EF4444") : "#2F3836";
        return (
      <div style={{display:"grid",gridTemplateColumns:alerts.length?"auto auto 1fr":"auto auto",gap:14,marginBottom:14}}>
        <div style={{...glass,padding:16,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontSize:9,fontWeight:700,color:"#7D8A86",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Internal</div>
          <Gauge score={health}/>
        </div>
        <div style={{...glass,padding:16,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderTop:ext?`3px solid ${extC}`:"3px solid #1E2926"}}>
          <div style={{fontSize:9,fontWeight:700,color:"#2D8E76",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>External</div>
          {ext ? <>
            <Gauge score={ext.score}/>
            <div style={{marginTop:4,textAlign:"center"}}>
              {ext.grade && <div style={{fontSize:11,fontWeight:900,color:extC,marginBottom:2}}>{ext.grade}</div>}
              {ext.auditor && <div style={{fontSize:10,fontWeight:700,color:"#2D8E76",marginBottom:2}}>By: {ext.auditor}</div>}
              <div style={{fontSize:10,fontWeight:600,color:"#A8B3AE"}}>{new Date(ext.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>
              <div style={{fontSize:9,color:"#7D8A86"}}>{new Date(ext.date).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}</div>
            </div>
          </> : <div style={{width:150,height:150,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{textAlign:"center",color:"#5E6764",fontSize:11,fontWeight:600}}>No external<br/>audit yet</div>
          </div>}
        </div>
        {alerts.length>0 && (
          <div style={{...glass,padding:16,borderLeft:`3px solid ${alerts.some(a=>a.t==="critical")?"#EF4444":"#E8A838"}`}}>
            <div style={{fontSize:11,fontWeight:800,color:"#EFF4F1",letterSpacing:1,textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
              <Ic name="alert" size={14} color="#EF4444"/> Action Required ({alerts.length})
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:160,overflow:"auto"}}>
              {alerts.map((a,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:500,color:a.t==="critical"?"#FCA5A5":"#FDE68A"}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:a.t==="critical"?"#EF4444":"#E8A838",boxShadow:`0 0 6px ${a.t==="critical"?"#EF444466":"#E8A83866"}`,flexShrink:0}}/>
                  {a.m}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
        );
      })()}

      {/* Tab Content */}      {/* ─── ATTENDANCE ─── */}
      {activeTab==="attendance" && <div style={{...glass,padding:20}}>
        <div style={{fontSize:14,fontWeight:800,color:"#EFF4F1",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><Ic name="staff" size={18} color={ac}/> Staff Attendance <span style={badge(`${ac}18`,ac)}>{pres}/{staff.length}</span></div>
        {/* Time window banner */}
        <div style={{padding:"10px 14px",borderRadius:10,marginBottom:14,display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:600,
          background:attSubmitted?"#10B98110":inAttWindow?"#E8A83810":pastDeadline?"#EF444410":"rgba(26,107,90,0.05)",
          border:`1px solid ${attSubmitted?"#10B98120":inAttWindow?"#E8A83820":pastDeadline?"#EF444420":"rgba(26,107,90,0.09)"}`,
          color:attSubmitted?"#10B981":inAttWindow?"#E8A838":pastDeadline?"#EF4444":"#7D8A86"
        }}>
          <Ic name="clock" size={14} color={attSubmitted?"#10B981":inAttWindow?"#E8A838":pastDeadline?"#EF4444":"#7D8A86"}/>
          {attSubmitted
            ? `✓ Submitted at ${Math.floor(attSubmitTime/60)}:${String(attSubmitTime%60).padStart(2,"0")} IST${lateSubmission?" (Late — score penalty applied)":""}`
            : inAttWindow
              ? `Attendance window open (11:30 AM – 3:00 PM IST) • Current: ${istH}:${String(istM).padStart(2,"0")} IST`
              : pastDeadline
                ? "Deadline passed — attendance can still be submitted but score will drop"
                : `Attendance opens at 11:30 AM IST • Current: ${istH}:${String(istM).padStart(2,"0")} IST`
          }
        </div>

        <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
          <DonutChart data={[pres-late,late,abs,unmk]} colors={["#10B981","#E8A838","#EF4444","#2F3836"]} size={85} sw={10}
            center={<div style={{fontSize:18,fontWeight:900,color:"#EFF4F1"}}>{pres}</div>}/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[["On Time",pres-late,"#10B981"],["Late",late,"#E8A838"],["Absent",abs,"#EF4444"],["Unmarked",unmk,"#5E6764"]].map(([l,v,c])=>(
              <div key={l} style={{padding:"7px 12px",borderRadius:9,background:`${c}12`,textAlign:"center",minWidth:62}}>
                <div style={{fontSize:16,fontWeight:800,color:c}}>{v}</div>
                <div style={{fontSize:9,fontWeight:600,color:"#7D8A86"}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            {canEdit && !isOffice && !attSubmitted && (inAttWindow||pastDeadline) && <button onClick={()=>setStaff(s=>s.map(x=>x.status==="transferred"?x:{...x,status:x.status==="not_marked"?"present":x.status}))} style={btn("rgba(26,107,90,0.12)")}>Mark Remaining Present</button>}
            {canEdit && !isOffice && !attSubmitted && (inAttWindow||pastDeadline) && <button onClick={()=>{
              const ist=getISTDate(new Date());const m=ist.getHours()*60+ist.getMinutes();
              const updated = staffData[outletKey].map(x=>x.status==="transferred"?x:{...x,status:x.status==="not_marked"?"present":x.status,timestamp:new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})});
              setStaff(updated);
              recordAttendance(outletKey,updated.filter(s=>s.status!=="transferred"),isOffice?"Office":null);
              setAttSubmitted(true);setAttSubmitTime(m);
              if(isOffice) addNotif(`Office edited attendance for ${meta.name}`,"office_edit");
            }} style={btn(ac)}>Submit Attendance</button>}
          </div>
        </div>
        {/* Department summary */}
        {(()=>{
          const deptCount = {};
          staff.forEach(s=>{const d=s.dept||"Staff";deptCount[d]=(deptCount[d]||0)+1;});
          return <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
            {Object.entries(deptCount).sort((a,b)=>b[1]-a[1]).map(([d,c])=>(
              <div key={d} style={{padding:"4px 10px",borderRadius:6,background:`${ac}10`,border:`1px solid ${ac}15`,fontSize:10,fontWeight:700,color:ac}}>
                {c} {d}
              </div>
            ))}
          </div>;
        })()}
        {/* Staff management buttons - manager only */}
        {canManageStaff && <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          <button onClick={()=>setStaffModal({type:"add"})} style={{...btn("rgba(26,107,90,0.12)"),padding:"6px 14px",fontSize:10}}>+ Add Staff</button>
          <button onClick={()=>setStaffModal({type:"transfer"})} style={{...btn("rgba(26,107,90,0.12)"),padding:"6px 14px",fontSize:10}}>Transfer Staff</button>
        </div>}
        {/* Transfer notifications for this outlet */}
        {transfers.filter(t=>t.to===outletKey&&t.status==="pending").length>0 && <div style={{marginBottom:12}}>
          {transfers.filter(t=>t.to===outletKey&&t.status==="pending").map(t=>(
            <div key={t.id} style={{padding:"10px 14px",borderRadius:10,background:"#2D8E7610",border:"1px solid #2D8E7620",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:12,fontWeight:600,color:"#CDD6D2"}}>
                <span style={{fontWeight:800,color:"#2D8E76"}}>{t.staffName}</span> transfer request from <span style={{fontWeight:800}}>{OUTLETS[t.from].name}</span>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>acceptTransfer(t.id)} style={{...btn("#10B981"),padding:"5px 14px",fontSize:10}}>Accept</button>
                <button onClick={()=>rejectTransfer(t.id)} style={{...btn("#EF4444"),padding:"5px 14px",fontSize:10}}>Reject</button>
              </div>
            </div>
          ))}
        </div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:6}}>
          {staff.map(s=>(
            <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:9,background:s.status==="present"?"#10B98106":s.status==="late"?"#E8A83806":s.status==="absent"?"#EF444406":"rgba(26,107,90,0.03)",border:"1px solid rgba(26,107,90,0.06)",opacity:attSubmitted?0.85:1}}>
              <div style={{width:30,height:30,borderRadius:8,background:`${ac}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:ac}}>{s.name[0]}</div>
              <div style={{flex:1,cursor:(isAdmin||isOffice)?"pointer":"default"}} onClick={()=>{if(isAdmin||isOffice) setStaffModal({type:"history",staff:s});}}>
                <div style={{fontSize:12,fontWeight:700,color:"#E5EBE8"}}>{s.name} {(isAdmin||isOffice) && <span style={{fontSize:8,color:"#2D8E76"}}>▸</span>}</div>
                <div style={{fontSize:9,color:"#7D8A86",fontWeight:500}}>{s.dept||"Staff"}{s.timestamp?` • ${s.timestamp}`:""}{s.transferFrom?` • From ${s.transferFrom}`:""}</div>
              </div>
              {(isAdmin||isOffice||canManageStaff) && !attSubmitted && <div style={{display:"flex",gap:2,marginRight:4}}>
                {canManageStaff && <div onClick={()=>{setSmName(s.name);setStaffModal({type:"rename",staff:s});}} style={{cursor:"pointer",padding:3}} title="Rename"><Ic name="edit" size={11} color="#7D8A86"/></div>}
                {(isAdmin||isOffice) && <div onClick={()=>{setSmShift(s.dept||"Waiter");setStaffModal({type:"dept",staff:s});}} style={{cursor:"pointer",padding:3}} title="Change Department"><Ic name="staff" size={11} color="#2D8E76"/></div>}
                {canManageStaff && <div onClick={()=>setStaffModal({type:"remove",staff:s})} style={{cursor:"pointer",padding:3}} title="Remove"><Ic name="x" size={11} color="#EF4444"/></div>}
              </div>}
              {attSubmitted ? (
                <span style={badge(s.status==="present"?"#10B98118":s.status==="late"?"#E8A83818":"#EF444418",s.status==="present"?"#10B981":s.status==="late"?"#E8A838":"#EF4444")}>
                  {s.status==="present"?"Present":s.status==="late"?"Late":s.status==="absent"?"Absent":"Unmarked"}
                </span>
              ) : isAdmin ? (
                <span style={{fontSize:10,fontWeight:600,color:s.status==="not_marked"?"#5E6764":s.status==="present"?"#10B981":s.status==="late"?"#E8A838":"#EF4444"}}>
                  {s.status==="not_marked"?"Unmarked":s.status==="present"?"Present":s.status==="late"?"Late":"Absent"}
                </span>
              ) : canEdit && !isOffice && (inAttWindow||pastDeadline) ? (
                <div style={{display:"flex",gap:3}}>
                  {[["P","present","#10B981"],["L","late","#E8A838"],["A","absent","#EF4444"]].map(([lb,st,c])=>(
                    <button key={st} onClick={()=>setStaff(prev=>prev.map(x=>x.id===s.id?{...x,status:st}:x))} style={{
                      width:26,height:26,borderRadius:6,border:s.status===st?`2px solid ${c}`:"1px solid rgba(26,107,90,0.12)",
                      background:s.status===st?`${c}22`:"transparent",color:s.status===st?c:"#5E6764",
                      fontSize:10,fontWeight:800,cursor:"pointer",fontFamily:"Montserrat",display:"flex",alignItems:"center",justifyContent:"center"
                    }}>{lb}</button>
                  ))}
                </div>
              ) : (
                <span style={{fontSize:10,fontWeight:600,color:"#5E6764"}}>Locked</span>
              )}
            </div>
          ))}
          {/* Show transferred staff with remark */}
          {staffData[outletKey].filter(s=>s.status==="transferred").map(s=>(
            <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:9,background:"rgba(255,255,255,0.01)",border:"1px dashed rgba(26,107,90,0.09)",opacity:0.5}}>
              <div style={{width:30,height:30,borderRadius:8,background:"#2F383615",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#5E6764"}}>{s.name[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:"#7D8A86",textDecoration:"line-through"}}>{s.name}</div>
                <div style={{fontSize:9,color:"#2D8E76",fontWeight:600}}>Transferred to {s.transferTo}</div>
              </div>
            </div>
          ))}
        </div>
        {attSubmitted && <div style={{marginTop:12,padding:"10px 14px",borderRadius:9,background:"#10B98108",border:"1px solid #10B98115",fontSize:11,fontWeight:600,color:"#10B981",display:"flex",alignItems:"center",gap:6}}>
          <Ic name="check" size={14} color="#10B981"/> Attendance locked. Resets automatically tomorrow.
        </div>}

        {/* Monthly Attendance Report — Admin & Office */}
        {(isAdmin||isOffice) && (()=>{
          const history = attHistory[outletKey]||[];
          // Build month options from history
          const monthSet = new Set();
          const now2 = new Date();
          for(let i=0;i<6;i++){const d=new Date(now2.getFullYear(),now2.getMonth()-i,1);monthSet.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}
          const months = [...monthSet].sort().reverse();
          const monthLabels = months.map(m=>{const [y,mo]=m.split("-");return {key:m,label:new Date(y,mo-1).toLocaleDateString("en-IN",{month:"long",year:"numeric"})};});
          const curMonth = attMonth;

          // Filter history for selected month
          const parseDate = (dateStr) => {
            const d = new Date(dateStr);
            if(!isNaN(d)) return d;
            // Try "12 Feb 2026" format
            const parts = dateStr.match(/(\d+)\s+(\w+)\s+(\d+)/);
            if(parts){return new Date(`${parts[2]} ${parts[1]}, ${parts[3]}`);}
            return null;
          };
          const monthHistory = history.filter(r=>{
            const d = parseDate(r.date);
            if(!d) return false;
            const mk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
            return mk===curMonth;
          });

          // Build per-staff summary
          const staffMap = {};
          monthHistory.forEach(r=>{
            if(!staffMap[r.staffName]) staffMap[r.staffName]={name:r.staffName,present:0,late:0,absent:0,total:0,editedByOffice:false};
            staffMap[r.staffName][r.status]=(staffMap[r.staffName][r.status]||0)+1;
            staffMap[r.staffName].total++;
            if(r.editedBy) staffMap[r.staffName].editedByOffice=true;
          });
          const staffList = Object.values(staffMap).sort((a,b)=>a.name.localeCompare(b.name));
          const totP = staffList.reduce((s,r)=>s+r.present,0);
          const totL = staffList.reduce((s,r)=>s+r.late,0);
          const totA = staffList.reduce((s,r)=>s+r.absent,0);

          return <div style={{marginTop:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:14,fontWeight:800,color:"#EFF4F1",display:"flex",alignItems:"center",gap:8}}>
                <Ic name="list" size={16} color={ac}/> Monthly Attendance Report
              </div>
              <select value={attMonth} onChange={e=>setAttMonth(e.target.value)} style={{...inp,width:"auto",minWidth:160}}>
                {monthLabels.map(m=><option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </div>
            {/* Summary stats */}
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              {[["Staff",staffList.length,ac],["Present",totP,"#10B981"],["Late",totL,"#E8A838"],["Absent",totA,"#EF4444"]].map(([l,v,c])=>(
                <div key={l} style={{padding:"6px 14px",borderRadius:8,background:`${c}10`,border:`1px solid ${c}18`,textAlign:"center",flex:1,minWidth:60}}>
                  <div style={{fontSize:16,fontWeight:900,color:c}}>{v}</div>
                  <div style={{fontSize:9,fontWeight:600,color:"#7D8A86"}}>{l}</div>
                </div>
              ))}
            </div>
            {staffList.length===0 ? (
              <div style={{padding:20,textAlign:"center",color:"#5E6764",fontSize:12,fontWeight:500}}>No attendance data for this month yet</div>
            ) : (
              <div style={{overflowX:"auto"}}>
                <div style={{display:"grid",gridTemplateColumns:"2fr 80px 80px 80px 80px",gap:6,padding:"8px 12px",borderRadius:8,background:"rgba(26,107,90,0.05)",marginBottom:4,minWidth:480}}>
                  {["Staff Name","Present","Late","Absent","Total"].map(h=>(
                    <div key={h} style={{fontSize:10,fontWeight:800,color:"#7D8A86",letterSpacing:1,textTransform:"uppercase"}}>{h}</div>
                  ))}
                </div>
                {staffList.map(r=>(
                  <div key={r.name} style={{display:"grid",gridTemplateColumns:"2fr 80px 80px 80px 80px",gap:6,padding:"8px 12px",borderRadius:8,marginBottom:3,background:r.editedByOffice?"#E8A83806":"rgba(26,107,90,0.03)",border:`1px solid ${r.editedByOffice?"#E8A83812":"rgba(26,107,90,0.06)"}`,minWidth:480,alignItems:"center"}}>
                    <div>
                      <span style={{fontSize:12,fontWeight:700,color:"#E5EBE8"}}>{r.name}</span>
                      {r.editedByOffice && <span style={{fontSize:8,fontWeight:700,color:"#E8A838",marginLeft:6}}>OFFICE EDIT</span>}
                    </div>
                    <span style={{fontSize:13,fontWeight:800,color:"#10B981"}}>{r.present}</span>
                    <span style={{fontSize:13,fontWeight:800,color:"#E8A838"}}>{r.late}</span>
                    <span style={{fontSize:13,fontWeight:800,color:"#EF4444"}}>{r.absent}</span>
                    <span style={{fontSize:13,fontWeight:800,color:"#A8B3AE"}}>{r.total}</span>
                  </div>
                ))}
              </div>
            )}
          </div>;
        })()}
      </div>}

      {/* ─── REVIEWS ─── */}
      {activeTab==="reviews" && <div style={{...glass,padding:20}}>
        <div style={{fontSize:14,fontWeight:800,color:"#EFF4F1",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><Ic name="star" size={18} color={ac}/> Reviews & Ratings</div>
        {rev.weekly.total===0 && <div style={{padding:"16px 14px",borderRadius:10,background:"rgba(26,107,90,0.04)",border:"1px solid rgba(26,107,90,0.09)",marginBottom:14,textAlign:"center"}}>
          <div style={{fontSize:12,fontWeight:600,color:"#5E6764"}}>No review data loaded yet</div>
          <div style={{fontSize:10,color:"#2F3836",marginTop:4}}>Admin uploads Restaverse PDF from the admin dashboard</div>
        </div>}
        {/* Week-over-week comparison banner */}
        {lastWeek && rev.weekly.total>0 && (()=>{
          const curAvg = ((rev.del.zomato+rev.del.swiggy+rev.din.zomato+rev.din.google)/4);
          const prevAvg = ((lastWeek.del.zomato+lastWeek.del.swiggy+lastWeek.din.zomato+lastWeek.din.google)/4);
          const diff = curAvg-prevAvg;
          const revDiff = rev.weekly.total - lastWeek.weekly.total;
          const isUp = diff>0; const isDown = diff<0;
          const c = isUp?"#10B981":isDown?"#EF4444":"#7D8A86";
          return (
            <div style={{padding:"14px 16px",borderRadius:12,background:`${c}08`,border:`1px solid ${c}15`,marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <Ic name="trend" size={16} color={c}/>
                <span style={{fontSize:13,fontWeight:800,color:c}}>
                  {isUp?"↑ Improved":"↓ Declined"} vs Last Week
                </span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                <div>
                  <div style={{fontSize:9,fontWeight:700,color:"#7D8A86",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Avg Rating</div>
                  <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                    <span style={{fontSize:18,fontWeight:900,color:c}}>{curAvg.toFixed(2)}</span>
                    <span style={{fontSize:11,fontWeight:700,color:c}}>{diff>0?"+":""}{diff.toFixed(2)}</span>
                  </div>
                  <div style={{fontSize:10,color:"#5E6764"}}>was {prevAvg.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{fontSize:9,fontWeight:700,color:"#7D8A86",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Total Reviews</div>
                  <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                    <span style={{fontSize:18,fontWeight:900,color:"#EFF4F1"}}>{rev.weekly.total}</span>
                    <span style={{fontSize:11,fontWeight:700,color:revDiff>=0?"#10B981":"#EF4444"}}>{revDiff>=0?"+":""}{revDiff}</span>
                  </div>
                  <div style={{fontSize:10,color:"#5E6764"}}>was {lastWeek.weekly.total}</div>
                </div>
                <div>
                  <div style={{fontSize:9,fontWeight:700,color:"#7D8A86",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>5★ Reviews</div>
                  {(()=>{const cur5=parseInt(rev.weekly.dist["5"])||0;const prev5=parseInt(lastWeek.weekly.dist["5"])||0;const d5=cur5-prev5;return (
                    <div>
                      <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                        <span style={{fontSize:18,fontWeight:900,color:"#EFF4F1"}}>{cur5}</span>
                        <span style={{fontSize:11,fontWeight:700,color:d5>=0?"#10B981":"#EF4444"}}>{d5>=0?"+":""}{d5}</span>
                      </div>
                      <div style={{fontSize:10,color:"#5E6764"}}>was {prev5}</div>
                    </div>
                  );})()}
                </div>
              </div>
            </div>
          );
        })()}
        <div style={{fontSize:10,fontWeight:700,color:"#7D8A86",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Delivery Ratings</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          {[["Zomato","del","zomato","#E23744"],["Swiggy","del","swiggy","#FC8019"]].map(([p,cat,key,c])=>{
            const r=rev[cat][key]; const prev=lastWeek?lastWeek[cat][key]:null; const d=prev!==null?r-prev:null;
            return (
            <div key={p} style={{padding:"12px 16px",borderRadius:10,background:`${c}08`,border:`1px solid ${c}15`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:12,fontWeight:700,color:"#CDD6D2"}}>{p}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:60,height:4,borderRadius:2,background:"#1E2926"}}><div style={{width:`${(r/5)*100}%`,height:"100%",borderRadius:2,background:c}}/></div>
                <span style={{fontSize:16,fontWeight:900,color:c}}>{r}</span>
                {d!==null && d!==0 && <span style={{fontSize:10,fontWeight:700,color:d>0?"#10B981":"#EF4444"}}>{d>0?"+":""}{d.toFixed(1)}</span>}
              </div>
            </div>
          );})}
        </div>
        <div style={{fontSize:10,fontWeight:700,color:"#7D8A86",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Dining Ratings</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          {[["Zomato","din","zomato","#E23744"],["Google","din","google","#4285F4"]].map(([p,cat,key,c])=>{
            const r=rev[cat][key]; const prev=lastWeek?lastWeek[cat][key]:null; const d=prev!==null?r-prev:null;
            return (
            <div key={p} style={{padding:"12px 16px",borderRadius:10,background:`${c}08`,border:`1px solid ${c}15`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:12,fontWeight:700,color:"#CDD6D2"}}>{p}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:60,height:4,borderRadius:2,background:"#1E2926"}}><div style={{width:`${(r/5)*100}%`,height:"100%",borderRadius:2,background:c}}/></div>
                <span style={{fontSize:16,fontWeight:900,color:c}}>{r}</span>
                {d!==null && d!==0 && <span style={{fontSize:10,fontWeight:700,color:d>0?"#10B981":"#EF4444"}}>{d>0?"+":""}{d.toFixed(1)}</span>}
              </div>
            </div>
          );})}
        </div>
        <div style={{fontSize:10,fontWeight:700,color:"#7D8A86",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Star Distribution ({rev.weekly.total} reviews)</div>
        <BarChart data={Object.entries(rev.weekly.dist).map(([k,v])=>({l:`${k}★`,v}))} color={ac} width={320} height={120}/>
        <div style={{fontSize:10,fontWeight:700,color:"#7D8A86",letterSpacing:2,textTransform:"uppercase",margin:"14px 0 8px"}}>Sentiment Analysis</div>
        <HBar data={Object.entries(rev.weekly.sent).map(([k,[p,n]])=>({l:k,p,n}))} width={360} height={180}/>
        <div style={{display:"flex",gap:12,marginTop:4}}>
          <span style={{fontSize:10,fontWeight:600,color:"#10B981",display:"flex",alignItems:"center",gap:3}}><div style={{width:8,height:8,borderRadius:2,background:"#10B981"}}/> Positive</span>
          <span style={{fontSize:10,fontWeight:600,color:"#E8A838",display:"flex",alignItems:"center",gap:3}}><div style={{width:8,height:8,borderRadius:2,background:"#E8A838"}}/> Negative</span>
        </div>
      </div>}

      {/* ─── CHECKLISTS ─── */}
      {activeTab==="checklists" && <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {["opening","closing","kitchen","hygiene"].map(type=>{
          const cl=cls[type]; const done=cl.filter(c=>c.done).length; const pct=Math.round(done/cl.length*100);
          const isMorningCl = type==="opening"||type==="kitchen"||type==="hygiene";
          const isNightCl = type==="closing";
          const hasDeadline = true;
          const deadline = isMorningCl?"12:30 PM":"2:00 AM";
          const isSubmitted = clsSubmitted[type];
          const isLate = type==="opening"?openingLate:type==="closing"?closingLate:type==="kitchen"?kitchenLate:hygieneLate;
          const isPastDeadline = type==="opening"?openingPastDeadline:type==="closing"?closingPastDeadline:type==="kitchen"?kitchenPastDeadline:hygienePastDeadline;
          const submitTime = clsSubmitTime[type];
          // Morning checklists: 10:00 AM – 12:30 PM; Closing: 10:00 PM – 2:00 AM
          const canEditCl = isMorningCl ? (inClsWindow || clsPastDeadline) : isNightCl ? (inNightWindow || nightPastDeadline) : true;
          const windowNotOpen = isMorningCl ? (istMins < clsWindowOpen) : isNightCl ? (!inNightWindow && !nightPastDeadline) : false;
          return (
            <Section key={type} icon={type==="kitchen"?"chef":type==="hygiene"?"shield":"check"} title={type==="opening"?`Opening Checklist (${openingChecklist.totalScore} pts)`:type==="kitchen"?`Kitchen Checklist (${kitchenChecklist.totalScore} pts)`:type==="hygiene"?`Hygiene Checklist (${hygieneChecklist.totalScore} pts)`:type==="closing"?`Closing Checklist (${closingChecklist.totalScore} pts)`:`${type.charAt(0).toUpperCase()+type.slice(1)} Checklist`} accent={ac} count={`${done}/${cl.length}`} alertN={pct<50?1:0}>
              {/* Deadline / time window banner */}
              <div style={{padding:"10px 14px",borderRadius:10,marginBottom:12,display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:600,
                background:isSubmitted?(isLate?"#E8A83810":"#10B98110"):isPastDeadline?"#EF444410":windowNotOpen?"rgba(26,107,90,0.03)":inClsWindow?"#E8A83808":"rgba(26,107,90,0.05)",
                border:`1px solid ${isSubmitted?(isLate?"#E8A83820":"#10B98120"):isPastDeadline?"#EF444420":windowNotOpen?"rgba(26,107,90,0.06)":"rgba(26,107,90,0.09)"}`,
                color:isSubmitted?(isLate?"#E8A838":"#10B981"):isPastDeadline?"#EF4444":windowNotOpen?"#5E6764":inClsWindow?"#E8A838":"#7D8A86"
              }}>
                <Ic name="clock" size={14} color={isSubmitted?(isLate?"#E8A838":"#10B981"):isPastDeadline?"#EF4444":windowNotOpen?"#5E6764":"#7D8A86"}/>
                {isSubmitted
                  ? `✓ Submitted by ${clsSubmitBy[type]||"Manager"} at ${Math.floor(submitTime/60)}:${String(submitTime%60).padStart(2,"0")} IST${isLate?" (Late — points halved)":""}`
                  : windowNotOpen
                    ? isNightCl
                      ? `Opens at 10:00 PM IST • Current: ${istH}:${String(istM).padStart(2,"0")} IST`
                      : `Opens at 10:00 AM IST • Current: ${istH}:${String(istM).padStart(2,"0")} IST`
                    : isPastDeadline
                      ? `Deadline passed (${deadline}) — can still submit but points will be halved`
                      : isMorningCl
                        ? `Window: 10:00 AM – 12:30 PM IST • Deadline: ${deadline} • Current: ${istH}:${String(istM).padStart(2,"0")} IST`
                        : `Window: 10:00 PM – 2:00 AM IST • Deadline: ${deadline} • Current: ${istH}:${String(istM).padStart(2,"0")} IST`
                }
              </div>
              {/* Admin: show submission info — who submitted + timestamp + checklist state */}
              {isAdmin && isSubmitted && submitTime && <div style={{padding:"8px 12px",borderRadius:8,marginBottom:12,background:"#2D8E7608",border:"1px solid #2D8E7612",fontSize:11,fontWeight:600,color:"#2D8E76",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <Ic name="check" size={12} color="#2D8E76"/>
                Submitted by <span style={{fontWeight:800,color:"#E5EBE8"}}>{clsSubmitBy[type]||"Manager"}</span> at {Math.floor(submitTime/60)}:{String(submitTime%60).padStart(2,"0")} IST
                {isLate && <span style={{color:"#EF4444",marginLeft:4}}>(LATE)</span>}
                <span style={{color:"#7D8A86",marginLeft:4}}>• {done}/{cl.length} items checked</span>
              </div>}
              {/* Admin: show what was ticked/unticked */}
              {isAdmin && isSubmitted && <div style={{padding:"8px 12px",borderRadius:8,marginBottom:12,background:"rgba(26,107,90,0.03)",border:"1px solid rgba(26,107,90,0.06)"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#7D8A86",letterSpacing:1,marginBottom:6}}>CHECKLIST STATE</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:4}}>
                  {cl.map(item=>(
                    <div key={item.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",borderRadius:6,background:item.done?"#10B98106":"#EF444406",border:`1px solid ${item.done?"#10B98110":"#EF444410"}`}}>
                      <div style={{width:14,height:14,borderRadius:3,border:`2px solid ${item.done?"#10B981":"#EF4444"}`,background:item.done?"#10B98120":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {item.done && <Ic name="check" size={8} color="#10B981"/>}
                      </div>
                      <span style={{fontSize:10,fontWeight:600,color:item.done?"#10B981":"#EF4444"}}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>}
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                <div style={{flex:1,height:7,borderRadius:4,background:"#1E2926",overflow:"hidden"}}>
                  <div style={{width:`${pct}%`,height:"100%",borderRadius:4,background:pct===100?"#10B981":ac,transition:"width 0.4s"}}/>
                </div>
                <span style={{fontSize:12,fontWeight:800,color:pct===100?"#10B981":"#EFF4F1",minWidth:36}}>{pct}%</span>
                {!isAdmin && !isSubmitted && canEditCl && <button onClick={()=>setCls(p=>({...p,[type]:p[type].map(c=>c.cashCheck||c.photoAudit?c:{...c,done:true})}))} style={{...btn("rgba(26,107,90,0.09)"),padding:"5px 12px",fontSize:10}}>All Done</button>}
                {(()=>{
                  const allComplied = cl.every(c=>{
                    if(!c.done) return false;
                    if(c.photoAudit && !c.photo) return false;
                    if(c.cashCheck && openingPcVerified!==true) return false;
                    return true;
                  });
                  return !isAdmin && hasDeadline && !isSubmitted && canEditCl && allComplied && <button onClick={()=>{
                  const ist=getISTDate(new Date());const m=ist.getHours()*60+ist.getMinutes();
                  setClsSubmitted(p=>({...p,[type]:true}));setClsSubmitTime(p=>({...p,[type]:m}));setClsSubmitBy(p=>({...p,[type]:userName||"Manager"}));
                }} style={{...btn(ac),padding:"5px 14px",fontSize:10}}>Submit {type.charAt(0).toUpperCase()+type.slice(1)}</button>;
                })()}
              </div>
              {/* Opening checklist: render by category with scores */}
              {(type==="opening"||type==="kitchen"||type==="hygiene"||type==="closing") ? (()=>{
                const clDef = type==="opening"?openingChecklist:type==="kitchen"?kitchenChecklist:type==="hygiene"?hygieneChecklist:closingChecklist;
                const clKey = type;
                return <div>
                  {/* Score summary */}
                  {(()=>{
                    const earned = cl.filter(c=>c.done).reduce((s,c)=>s+(c.score||0),0);
                    return <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,padding:"10px 14px",borderRadius:10,background:"#E8A83808",border:"1px solid #E8A83815"}}>
                      <div style={{fontSize:10,fontWeight:700,color:"#7D8A86",letterSpacing:1}}>SCORE</div>
                      <div style={{fontSize:22,fontWeight:900,color:earned===clDef.totalScore?"#10B981":"#E8A838"}}>{earned}</div>
                      <div style={{fontSize:12,fontWeight:600,color:"#7D8A86"}}>/ {clDef.totalScore} points</div>
                    </div>;
                  })()}
                  {clDef.categories.map((cat,ci)=>{
                    const catItems = cl.filter(c=>c.category===cat.name);
                    const catEarned = catItems.filter(c=>c.done).reduce((s,c)=>s+(c.score||0),0);
                    return <div key={ci} style={{marginBottom:14}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6,padding:"6px 10px",borderRadius:8,background:"rgba(232,168,56,0.04)",border:"1px solid rgba(232,168,56,0.08)"}}>
                        <span style={{fontSize:11,fontWeight:800,color:"#E8A838",letterSpacing:0.5}}>{cat.name}</span>
                        <span style={{fontSize:11,fontWeight:800,color:catEarned===cat.subtotal?"#10B981":"#A8B3AE"}}>{catEarned}/{cat.subtotal} pts</span>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        {catItems.map(item=>(
                          <div key={item.id} style={{
                            padding:"10px 12px",borderRadius:9,
                            background:item.done?"#10B98106":"rgba(26,107,90,0.03)",border:`1px solid ${item.done?"#10B98115":"rgba(26,107,90,0.06)"}`,transition:"all 0.2s",
                            opacity:isSubmitted?0.85:1
                          }}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div onClick={()=>{
                                if(isAdmin||isSubmitted||!canEditCl) return;
                                if(item.cashCheck) return; // must verify via amount
                                if(item.photoAudit && !item.photo && !item.done) return; // must upload photo first
                                setCls(p=>({...p,[clKey]:p[clKey].map(c=>c.id===item.id?{...c,done:!c.done}:c)}));
                              }} style={{display:"flex",alignItems:"center",gap:8,flex:1,cursor:(isAdmin||isSubmitted||!canEditCl||item.cashCheck||(item.photoAudit&&!item.photo&&!item.done))?"default":"pointer"}}>
                                <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${item.done?"#10B981":openingPcVerified===false&&item.cashCheck?"#EF4444":"#2F3836"}`,background:item.done?"#10B98120":openingPcVerified===false&&item.cashCheck?"#EF444420":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
                                  {item.done && <Ic name="check" size={10} color="#10B981"/>}
                                  {!item.done && openingPcVerified===false && item.cashCheck && <Ic name="x" size={10} color="#EF4444"/>}
                                </div>
                                <span style={{fontSize:12,fontWeight:600,color:item.done?"#10B981":openingPcVerified===false&&item.cashCheck?"#EF4444":"#CDD6D2",textDecoration:item.done?"line-through":"none",flex:1}}>{item.text}</span>
                              </div>
                              <span style={{fontSize:10,fontWeight:800,color:item.done?"#10B981":"#5E6764",flexShrink:0}}>{item.score}pt{item.score>1?"s":""}</span>
                              {item.photoAudit && <span style={{fontSize:8,fontWeight:800,color:"#E8A838",background:"#E8A83815",padding:"2px 6px",borderRadius:4,flexShrink:0}}>{isPhotoAuditToday(item.id)?"📷 PHOTO AUDIT":"AUDIT ITEM"}</span>}
                            </div>
                            {/* Photo audit upload — only shown on random audit days */}
                            {item.photoAudit && isPhotoAuditToday(item.id) && !isAdmin && !isSubmitted && canEditCl && (
                              <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}>
                                {item.photo ? (
                                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                                    <img src={item.photo} style={{width:48,height:48,borderRadius:6,objectFit:"cover",border:"1px solid rgba(26,107,90,0.12)"}}/>
                                    <div style={{fontSize:10,fontWeight:600,color:"#10B981"}}>Photo uploaded</div>
                                    <button onClick={()=>setCls(p=>({...p,[clKey]:p[clKey].map(c=>c.id===item.id?{...c,photo:null}:c)}))} style={{...btn("rgba(239,68,68,0.12)"),padding:"3px 8px",fontSize:9,color:"#EF4444"}}>Remove</button>
                                  </div>
                                ) : (
                                  <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",padding:"6px 12px",borderRadius:7,background:"#E8A83808",border:"1px dashed #E8A83830",fontSize:10,fontWeight:700,color:"#E8A838"}}>
                                    <Ic name="edit" size={12} color="#E8A838"/> Upload / Take Photo
                                    <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{
                                      const file=e.target.files?.[0];
                                      if(file){const reader=new FileReader();reader.onload=ev=>setCls(p=>({...p,[clKey]:p[clKey].map(c=>c.id===item.id?{...c,photo:ev.target.result}:c)}));reader.readAsDataURL(file);}
                                    }}/>
                                  </label>
                                )}
                              </div>
                            )}
                            {/* Admin photo view — always show if photo was uploaded */}
                            {isAdmin && item.photoAudit && item.photo && (
                              <div style={{marginTop:8}}>
                                <img src={item.photo} style={{width:80,height:80,borderRadius:8,objectFit:"cover",border:"1px solid rgba(26,107,90,0.12)"}}/>
                              </div>
                            )}
                            {isAdmin && item.photoAudit && isPhotoAuditToday(item.id) && !item.photo && isSubmitted && (
                              <div style={{marginTop:6,fontSize:10,fontWeight:600,color:"#EF4444"}}>📷 Photo audit required — no photo uploaded</div>
                            )}
                            {/* Cash check (opening only) */}
                            {item.cashCheck && !isAdmin && !isSubmitted && canEditCl && (()=>{
                              const pcHist = pettyCashHistory[outletKey]||[];
                              const lastNight = pcHist.length>0?pcHist[pcHist.length-1].amount:null;
                              return <div style={{marginTop:8}}>
                                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                                  <input type="number" value={openingPcAmount} onChange={e=>{setOpeningPcAmount(e.target.value);setOpeningPcVerified(null);}} placeholder="Enter petty cash amount..." style={{...inp,width:"auto",flex:1,minWidth:160,fontSize:12,padding:"8px 12px"}}/>
                                  <button onClick={()=>{
                                    const amt = parseInt(openingPcAmount)||0;
                                    if(!amt) return;
                                    if(lastNight!==null && amt===lastNight){
                                      setOpeningPcVerified(true);
                                      setCls(p=>({...p,opening:p.opening.map(c=>c.id===item.id?{...c,done:true}:c)}));
                                    } else {
                                      setOpeningPcVerified(false);
                                      setCls(p=>({...p,opening:p.opening.map(c=>c.id===item.id?{...c,done:false}:c)}));
                                      addNotif(`⚠ Petty cash mismatch at ${OUTLETS[outletKey].name}: Entered ₹${amt.toLocaleString()}${lastNight!==null?`, expected ₹${lastNight.toLocaleString()}`:", no previous record"}`,"office_edit");
                                    }
                                  }} style={{...btn("#2D8E76"),padding:"8px 16px",fontSize:11}}>Verify</button>
                                </div>
                                {lastNight!==null && <div style={{fontSize:10,color:"#7D8A86",marginTop:4}}>Last night's submitted amount: ₹{lastNight.toLocaleString()}</div>}
                                {lastNight===null && <div style={{fontSize:10,color:"#E8A838",marginTop:4}}>No petty cash submitted last night</div>}
                                {openingPcVerified===true && <div style={{marginTop:6,padding:"6px 10px",borderRadius:6,background:"#10B98110",border:"1px solid #10B98120",fontSize:11,fontWeight:700,color:"#10B981",display:"flex",alignItems:"center",gap:4}}>
                                  <Ic name="check" size={12} color="#10B981"/> Amount matches — verified ✓
                                </div>}
                                {openingPcVerified===false && <div style={{marginTop:6,padding:"6px 10px",borderRadius:6,background:"#EF444410",border:"1px solid #EF444420",fontSize:11,fontWeight:700,color:"#EF4444",display:"flex",alignItems:"center",gap:4}}>
                                  <Ic name="alert" size={12} color="#EF4444"/> Mismatch detected — admin notified. This item has failed.
                                </div>}
                              </div>;
                            })()}
                            {item.cashCheck && isAdmin && isSubmitted && (()=>{
                              const pcHist = pettyCashHistory[outletKey]||[];
                              const lastNight = pcHist.length>0?pcHist[pcHist.length-1].amount:null;
                              return <div style={{marginTop:6,fontSize:10,fontWeight:600,color:item.done?"#10B981":"#EF4444"}}>
                                {item.done ? "Petty cash verified — amount matched" : `Petty cash FAILED — mismatch${lastNight!==null?` (expected ₹${lastNight.toLocaleString()})`:""}`}
                              </div>;
                            })()}
                          </div>
                        ))}
                      </div>
                    </div>;
                  })}
                </div>;
              })() : (
              /* Other checklists: standard grid */
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:5}}>
                {cl.map(item=>(
                  <div key={item.id} style={{
                    display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:9,
                    background:item.done?"#10B98106":"rgba(26,107,90,0.03)",border:`1px solid ${item.done?"#10B98115":"rgba(26,107,90,0.06)"}`,transition:"all 0.2s",
                    opacity:isSubmitted?0.85:1
                  }}>
                    <div onClick={()=>{if(!isAdmin && !isSubmitted && canEditCl) setCls(p=>({...p,[type]:p[type].map(c=>c.id===item.id?{...c,done:!c.done}:c)}));}} style={{display:"flex",alignItems:"center",gap:8,flex:1,cursor:(isAdmin||isSubmitted||!canEditCl)?"default":"pointer"}}>
                      <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${item.done?"#10B981":"#2F3836"}`,background:item.done?"#10B98120":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
                        {item.done && <Ic name="check" size={10} color="#10B981"/>}
                      </div>
                      <span style={{fontSize:12,fontWeight:600,color:item.done?"#10B981":"#CDD6D2",textDecoration:item.done?"line-through":"none"}}>{item.text}</span>
                    </div>
                  </div>
                ))}
              </div>
              )}
              {isSubmitted && <div style={{marginTop:10,padding:"10px 14px",borderRadius:9,background:"#10B98108",border:"1px solid #10B98115",fontSize:11,fontWeight:600,color:"#10B981",display:"flex",alignItems:"center",gap:6}}>
                <Ic name="check" size={14} color="#10B981"/> {type.charAt(0).toUpperCase()+type.slice(1)} checklist locked. Resets tomorrow.
              </div>}
            </Section>
          );
        })}
      </div>}

      {/* ─── COMPLIANCE ─── */}
      {activeTab==="compliance" && <div style={{...glass,padding:20}}>
        <div style={{fontSize:14,fontWeight:800,color:"#EFF4F1",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><Ic name="shield" size={18} color={ac}/> Compliance & Hygiene</div>
        {(userRole==="manager"||isOffice) && <button onClick={()=>setModal("comp")} style={{...btn(ac),marginBottom:14}}>
          <span style={{display:"flex",alignItems:"center",gap:5}}><Ic name="edit" size={13} color="#fff"/> Update Dates</span>
        </button>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:8,marginBottom:14}}>
          {[["FSSAI Expiry",comp.fssai,new Date(comp.fssai)>new Date("2026-06-01")],["Fire Safety",comp.fire,new Date(comp.fire)>new Date()],["Last Pest Control",comp.pestLast,true],["Next Pest Control",comp.pestNext,new Date(comp.pestNext)>new Date()],["Last Deep Clean",comp.deepClean,true]].map(([l,v,ok])=>(
            <div key={l} style={{padding:"10px 14px",borderRadius:9,background:"rgba(26,107,90,0.04)",border:"1px solid rgba(26,107,90,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:11,fontWeight:600,color:"#A8B3AE"}}>{l}</span>
              <span style={{fontSize:11,fontWeight:700,color:ok?"#10B981":"#EF4444"}}>{v}</span>
            </div>
          ))}
        </div>
      </div>}

      {/* ─── FINANCE ─── */}
      {activeTab==="finance" && <div style={{...glass,padding:20}}>
        <div style={{fontSize:14,fontWeight:800,color:"#EFF4F1",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><Ic name="wallet" size={18} color={ac}/> Financial Health</div>

        {isAdmin ? (
          /* ── ADMIN VIEW: full petty cash history ── */
          <div>
            <div style={{fontSize:10,fontWeight:700,color:"#7D8A86",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Petty Cash History (Last 2 Months)</div>
            {(()=>{
              const history = pettyCashHistory[outletKey]||[];
              const sorted = [...history].sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt));
              if(sorted.length===0) return <div style={{padding:20,textAlign:"center",color:"#5E6764",fontSize:12}}>No petty cash submissions yet</div>;
              // Stats
              const avg = Math.round(sorted.reduce((s,e)=>s+e.amount,0)/sorted.length);
              const over = sorted.filter(e=>e.amount>10000).length;
              return <>
                <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                  {[["Submissions",sorted.length,ac],["Average",`₹${avg.toLocaleString()}`,"#2D8E76"],["Over Limit",over,"#EF4444"],["Latest",`₹${sorted[0]?.amount?.toLocaleString()||0}`,sorted[0]?.amount>10000?"#EF4444":"#10B981"]].map(([l,v,c])=>(
                    <div key={l} style={{padding:"8px 14px",borderRadius:9,background:`${c}10`,border:`1px solid ${c}18`,textAlign:"center",flex:1,minWidth:70}}>
                      <div style={{fontSize:16,fontWeight:900,color:c}}>{v}</div>
                      <div style={{fontSize:9,fontWeight:600,color:"#7D8A86"}}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{overflowX:"auto"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 120px 140px",gap:6,padding:"8px 12px",borderRadius:8,background:"rgba(26,107,90,0.05)",marginBottom:4,minWidth:360}}>
                    {["Date","Amount","Submitted At"].map(h=>(
                      <div key={h} style={{fontSize:10,fontWeight:800,color:"#7D8A86",letterSpacing:1,textTransform:"uppercase"}}>{h}</div>
                    ))}
                  </div>
                  {sorted.map((e,i)=>{
                    const overLimit = e.amount>10000;
                    return (
                    <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 120px 140px",gap:6,padding:"8px 12px",borderRadius:8,marginBottom:3,background:overLimit?"#EF444406":"rgba(26,107,90,0.03)",border:`1px solid ${overLimit?"#EF444412":"rgba(26,107,90,0.06)"}`,minWidth:360}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#E5EBE8"}}>{e.date}</span>
                      <span style={{fontSize:13,fontWeight:800,color:overLimit?"#EF4444":"#10B981"}}>₹{e.amount.toLocaleString()}</span>
                      <span style={{fontSize:11,fontWeight:500,color:"#A8B3AE"}}>{new Date(e.submittedAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}</span>
                    </div>
                  );})}
                </div>
              </>;
            })()}
          </div>
        ) : (
          /* ── OUTLET VIEW: submit petty cash with 10PM-2AM window ── */
          <div>
            {/* Deadline banner */}
            <div style={{padding:"10px 14px",borderRadius:10,marginBottom:14,display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:600,
              background:pcSubmitted?"#10B98110":pcPastDeadline?"#EF444410":!inNightWindow&&!nightPastDeadline?"rgba(26,107,90,0.03)":"rgba(26,107,90,0.05)",
              border:`1px solid ${pcSubmitted?"#10B98120":pcPastDeadline?"#EF444420":!inNightWindow&&!nightPastDeadline?"rgba(26,107,90,0.06)":"rgba(26,107,90,0.09)"}`,
              color:pcSubmitted?"#10B981":pcPastDeadline?"#EF4444":!inNightWindow&&!nightPastDeadline?"#5E6764":"#7D8A86"
            }}>
              <Ic name="clock" size={14} color={pcSubmitted?"#10B981":pcPastDeadline?"#EF4444":!inNightWindow&&!nightPastDeadline?"#5E6764":"#7D8A86"}/>
              {pcSubmitted
                ? "✓ Petty cash submitted for today — locked"
                : !inNightWindow&&!nightPastDeadline
                  ? `Opens at 10:00 PM IST • Current: ${istH}:${String(istM).padStart(2,"0")} IST`
                  : pcPastDeadline
                    ? "Deadline passed (2:00 AM) — submit as soon as possible"
                    : `Window: 10:00 PM – 2:00 AM IST • Deadline: 2:00 AM • Current: ${istH}:${String(istM).padStart(2,"0")} IST`
              }
            </div>

            {pcSubmitted ? (
              <div style={{padding:"24px 20px",borderRadius:12,background:"#10B98108",border:"1px solid #10B98115",textAlign:"center"}}>
                <Ic name="check" size={28} color="#10B981"/>
                <div style={{fontSize:14,fontWeight:800,color:"#10B981",marginTop:8}}>Petty Cash Submitted</div>
                <div style={{fontSize:11,color:"#7D8A86",marginTop:4}}>Today's submission is locked. Resets tomorrow.</div>
              </div>
            ) : !inNightWindow&&!nightPastDeadline ? (
              <div style={{padding:"24px 20px",borderRadius:12,background:"rgba(26,107,90,0.03)",border:"1px solid rgba(26,107,90,0.06)",textAlign:"center"}}>
                <Ic name="clock" size={28} color="#5E6764"/>
                <div style={{fontSize:13,fontWeight:700,color:"#5E6764",marginTop:8}}>Petty cash submission opens at 10:00 PM</div>
              </div>
            ) : (
              <div>
                <div style={{padding:"18px 20px",borderRadius:12,background:"rgba(26,107,90,0.05)",border:"1px solid rgba(26,107,90,0.09)"}}>
                  <label style={{fontSize:11,fontWeight:700,color:"#A8B3AE",marginBottom:6,display:"block"}}>Enter today's petty cash balance (₹)</label>
                  <input type="number" value={pcAmount} onChange={e=>setPcAmount(e.target.value)} placeholder="Enter amount..." style={{...inp,fontSize:18,fontWeight:800,textAlign:"center",padding:"14px"}}/>
                  {parseInt(pcAmount)>10000 && <div style={{marginTop:8,fontSize:11,fontWeight:600,color:"#EF4444",display:"flex",alignItems:"center",gap:4}}>
                    <Ic name="alert" size={12} color="#EF4444"/> Exceeds ₹10,000 limit — will affect health score
                  </div>}
                </div>
                <button onClick={()=>{
                  const amt = parseInt(pcAmount)||0;
                  if(amt<=0) return;
                  submitPettyCash(outletKey,amt);
                  setFin({petty:amt});
                  setPcSubmitted(true);
                }} disabled={!pcAmount||parseInt(pcAmount)<=0} style={{...btn(!pcAmount||parseInt(pcAmount)<=0?"#2F3836":ac),marginTop:14,width:"100%",padding:"14px",fontSize:13,opacity:!pcAmount||parseInt(pcAmount)<=0?0.5:1}}>
                  Submit Petty Cash
                </button>
              </div>
            )}
          </div>
        )}
      </div>}

      {/* ─── MAINTENANCE LOG ─── */}
      {activeTab==="maintenance" && <div style={{...glass,padding:20}}>
        <div style={{fontSize:14,fontWeight:800,color:"#EFF4F1",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><Ic name="wrench" size={18} color={ac}/> Maintenance Log</div>
        {(()=>{
          const issues = maint[outletKey];
          const pendingN = issues.filter(m=>m.status==="pending").length;
          const wipN = issues.filter(m=>m.status==="wip").length;
          const doneN = issues.filter(m=>m.status==="finished").length;
          const addIssue = (text) => {
            if(!text.trim()) return;
            const now = new Date();
            setMaint(prev=>({...prev,[outletKey]:[{id:Date.now(),issue:text.trim(),raisedOn:now.toISOString(),status:"pending",statusChangedOn:now.toISOString(),resolvedOn:null},...prev[outletKey]]}));
          };
          const updateStatus = (id,newSt) => {
            const now = new Date();
            setMaint(prev=>({...prev,[outletKey]:prev[outletKey].map(m=>m.id===id?{...m,status:newSt,statusChangedOn:now.toISOString(),resolvedOn:newSt==="finished"?now.toISOString():m.resolvedOn}:m)}));
          };
          const daysBetween = (a,b) => {if(!a||!b) return "-"; const d=Math.ceil((new Date(b)-new Date(a))/(1000*60*60*24)); return d<1?"<1 day":`${d} day${d>1?"s":""}`;};
          const stColor = {pending:"#EF4444",wip:"#E8A838",finished:"#10B981"};
          const stLabel = {pending:"Pending",wip:"Work in Progress",finished:"Finished"};
          return <>
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              {[["Pending",pendingN,"#EF4444"],["In Progress",wipN,"#E8A838"],["Resolved",doneN,"#10B981"]].map(([l,v,c])=>(
                <div key={l} style={{padding:"6px 14px",borderRadius:8,background:`${c}10`,border:`1px solid ${c}18`,display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:c}}/>
                  <span style={{fontSize:12,fontWeight:700,color:c}}>{v}</span>
                  <span style={{fontSize:10,fontWeight:600,color:"#7D8A86"}}>{l}</span>
                </div>
              ))}
            </div>
            {!isAdmin && !isOffice && <div style={{display:"flex",gap:8,marginBottom:16}}>
              <input id={`maint-input-${outletKey}`} placeholder="Describe the maintenance issue..." style={{...inp,flex:1}} onKeyDown={e=>{if(e.key==="Enter"){addIssue(e.target.value);e.target.value="";}}}/>
              <button onClick={()=>{const el=document.getElementById(`maint-input-${outletKey}`);if(el){addIssue(el.value);el.value="";}}} style={btn(ac)}>
                <span style={{display:"flex",alignItems:"center",gap:4}}>+ Add Issue</span>
              </button>
            </div>}
            {issues.length===0 ? (
              <div style={{padding:24,textAlign:"center",color:"#5E6764",fontSize:12,fontWeight:500}}>No maintenance issues logged yet</div>
            ) : (
              <div style={{overflowX:"auto"}}>
                <div style={{display:"grid",gridTemplateColumns:"2fr 130px 120px 130px 90px",gap:8,padding:"8px 12px",borderRadius:8,background:"rgba(26,107,90,0.05)",marginBottom:6,minWidth:640}}>
                  {["Issue","Raised On","Status","Last Updated","Resolution"].map(h=>(
                    <div key={h} style={{fontSize:10,fontWeight:800,color:"#7D8A86",letterSpacing:1,textTransform:"uppercase"}}>{h}</div>
                  ))}
                </div>
                {issues.map(m=>{
                  const raised = new Date(m.raisedOn);
                  const changed = new Date(m.statusChangedOn);
                  const sc = stColor[m.status];
                  return (
                    <div key={m.id} style={{borderRadius:9,marginBottom:6,background:`${sc}06`,border:`1px solid ${sc}12`,overflow:"hidden",minWidth:640}}>
                      <div style={{display:"grid",gridTemplateColumns:"2fr 130px 120px 130px 90px",gap:8,padding:"10px 12px",alignItems:"center"}}>
                        <div style={{fontSize:12,fontWeight:600,color:"#E5EBE8"}}>{m.issue}</div>
                        <div>
                          <div style={{fontSize:11,fontWeight:600,color:"#CDD6D2"}}>{raised.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>
                          <div style={{fontSize:9,color:"#7D8A86"}}>{raised.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}</div>
                        </div>
                        <div style={{overflow:"hidden"}}>
                          <select value={m.status} onChange={e=>updateStatus(m.id,e.target.value)} disabled={isAdmin||isOffice||m.status==="finished"} style={{
                            padding:"5px 6px",borderRadius:6,border:`1px solid ${sc}33`,background:`${sc}15`,color:sc,
                            fontSize:10,fontWeight:700,fontFamily:"Montserrat",cursor:isAdmin||isOffice||m.status==="finished"?"default":"pointer",outline:"none",
                            width:"100%",maxWidth:"110px",boxSizing:"border-box"
                          }}>
                            <option value="pending">Pending</option>
                            <option value="wip">Work in Progress</option>
                            <option value="finished">Finished</option>
                          </select>
                        </div>
                        <div>
                          <div style={{fontSize:11,fontWeight:600,color:"#CDD6D2"}}>{changed.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
                          <div style={{fontSize:9,color:"#7D8A86"}}>{changed.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}</div>
                        </div>
                        <div style={{fontSize:12,fontWeight:700,color:m.status==="finished"?"#10B981":"#5E6764"}}>
                          {m.status==="finished" ? daysBetween(m.raisedOn,m.resolvedOn) : "-"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>;
        })()}
      </div>}

      {/* ─── GUIDEBOOK ─── */}
      {activeTab==="guidebook" && <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{...glass,padding:20}}>
          <div style={{fontSize:14,fontWeight:800,color:"#EFF4F1",marginBottom:4,display:"flex",alignItems:"center",gap:8}}><Ic name="list" size={18} color={ac}/> Operations Guidebook</div>
          <div style={{fontSize:11,color:"#7D8A86",marginBottom:16}}>Standard operating procedures and expectations for all staff. Refer to this manual daily.</div>
        </div>

        {/* Opening Checklist Guide */}
        <Section icon="check" title="Opening Checklist — Guide (15 Points)" accent="#E8A838">
          <div style={{fontSize:11,color:"#7D8A86",marginBottom:10,fontWeight:600}}>Window: 10:00 AM – 12:30 PM IST. Total Score: 15 points. Items marked with 📷 require random photo audit.</div>
          {[
            {cat:"Infrastructure & Utilities (4 pts)",items:[
              ["Lights & AC ON (all zones) — 1pt","Switch on all dining area lights, signage lights, and AC units. Set AC to 22–24°C. Check all bulbs are working. Report any fused bulbs immediately."],
              ["Gas cylinders & connections inspected — 2pts 📷","Open main gas valve. Check all burner connections for leaks using soapy water test. Ensure gas cylinder is not below 20%. Report any smell immediately. Photo proof required."],
              ["Kitchen equipment powered & functional — 1pt","Turn on grills, sizzler plates, fryers, ovens. Verify burner flames are even. Check fridge and freezer temperatures (fridge 1–4°C, freezer below -18°C)."],
            ]},
            {cat:"Front of House Readiness (4 pts)",items:[
              ["Dining area cleaned & tables set — 1pt","Wipe all tables with sanitizer. Place table mats, cutlery sets, napkins, and water glasses. Ensure chairs are aligned and clean. No stains on tablecloth."],
              ["Mirrors, doors & glass cleaned — 1pt 📷","Wipe all glass doors, mirrors, and windows with glass cleaner. No fingerprints or smudges. Ensure door handles are sanitized. Photo proof required."],
              ["Menu cards placed on all tables — 1pt","Place updated menu cards on each table. Check for damage or stains. Remove any out-of-date promotional inserts. Ensure prices match POS system."],
              ["Signage & external lighting working — 1pt","Verify exterior signage and backlit boards are on. Check the Yoko Sizzlers board is visible from the road. Report any flickering or burnt lights."],
            ]},
            {cat:"Staff & Delivery Readiness (4 pts)",items:[
              ["Staff present & in full uniform — 3pts","All staff must be in clean, ironed uniform with name badge. Hairnets for kitchen staff. No open footwear. Nails trimmed. No jewelry in kitchen. This is the highest-weighted single item."],
              ["Delivery & Dining Dashboards online — 1pt","Verify Zomato, Swiggy, and dine-in dashboards are showing live orders. Check that auto-accept is enabled. Check reservations for the day."],
            ]},
            {cat:"POS & Cash Readiness (2 pts)",items:[
              ["POS system tested — 1pt","Run a test transaction on POS. Verify printer is working and has paper. Check UPI QR codes are displayed. Ensure internet connection is stable."],
              ["Opening petty cash verified — 1pt","Enter the current petty cash amount. The system automatically compares it with last night's submitted closing amount. If the amounts match, the item is verified. If there's a mismatch, the item fails and admin is immediately notified. You cannot manually tick this item — it can only be verified through the amount check."],
            ]},
            {cat:"Ambience (1 pt)",items:[
              ["Music system ON — 1pt","Turn on background music system at moderate volume. Play approved playlist only — no explicit lyrics. Adjust volume based on dining area occupancy."],
            ]},
          ].map((section,si)=>(
            <div key={si} style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:800,color:"#E8A838",marginBottom:6,padding:"6px 10px",borderRadius:8,background:"rgba(232,168,56,0.04)",border:"1px solid rgba(232,168,56,0.08)"}}>{section.cat}</div>
              {section.items.map(([item,desc],i)=>(
                <div key={i} style={{padding:"12px 14px",borderRadius:10,marginBottom:6,background:"rgba(26,107,90,0.03)",border:"1px solid rgba(26,107,90,0.06)"}}>
                  <div style={{fontSize:12,fontWeight:800,color:"#E5EBE8",marginBottom:4}}>{item}</div>
                  <div style={{fontSize:11,fontWeight:500,color:"#A8B3AE",lineHeight:1.6}}>{desc}</div>
                </div>
              ))}
            </div>
          ))}
        </Section>

        {/* Closing Checklist Guide */}
        <Section icon="check" title="Closing Checklist — Guide (10 Points)" accent="#EF4444">
          <div style={{fontSize:11,color:"#7D8A86",marginBottom:10,fontWeight:600}}>Deadline: 1:00 AM IST. Total Score: 10 points. Items marked with 📷 require random photo audit.</div>
          {[
            {cat:"Kitchen Shutdown & Food Safety (4 pts)",items:[
              ["Gas cylinders switched off & regulators secured — 2pts 📷","Close all burner knobs first, then shut the main gas valve. Secure regulators. Double-check every station. This is a critical safety step — never skip. Photo proof required."],
              ["Kitchen equipment cleaned after service — 1pt","Scrub grills, sizzler plates, fryers, and prep surfaces. Drain and filter fryer oil if needed. Wipe down all stainless steel surfaces. Cover equipment."],
              ["Leftover food stored properly & labelled — 1pt 📷","Label all leftovers with date and time. Store in airtight containers. Discard anything older than 24 hours. Raw and cooked stored separately. Photo proof of labels required."],
            ]},
            {cat:"Cleaning & Waste (2 pts)",items:[
              ["Dining area cleaned — 1pt","Clear all tables completely. Wipe with sanitizer. Push chairs in. Sweep and mop the entire dining floor. Remove any food debris from under tables."],
              ["Trash disposed & bins cleared — 1pt","Empty all dustbins — kitchen, dining, restroom. Replace liners. Take trash bags to designated disposal area. Do not leave bags near the entrance."],
            ]},
            {cat:"Cash & POS Closure (2 pts)",items:[
              ["POS day-end completed — 1pt","Run day-end report on POS. Print summary. Verify total matches cash + card + UPI. Log any discrepancies. Keep printout in the register folder."],
              ["Closing cash counted & matched — 1pt","Count all cash, segregate denominations. Match with POS day-end total. Secure cash in the safe. Two people must verify the count."],
            ]},
            {cat:"Security & Lockdown (2 pts)",items:[
              ["Premises secured after closing — 2pts 📷","Turn off all AC, lights (leave security lights on), exhaust fans. Lock all doors, pull shutters. Secure gas cylinder area. Verify no one inside. Set alarm. Photo proof of secured premises required."],
            ]},
          ].map((section,si)=>(
            <div key={si} style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:800,color:"#E8A838",marginBottom:6,padding:"6px 10px",borderRadius:8,background:"rgba(232,168,56,0.04)",border:"1px solid rgba(232,168,56,0.08)"}}>{section.cat}</div>
              {section.items.map(([item,desc],i)=>(
                <div key={i} style={{padding:"12px 14px",borderRadius:10,marginBottom:6,background:"rgba(26,107,90,0.03)",border:"1px solid rgba(26,107,90,0.06)"}}>
                  <div style={{fontSize:12,fontWeight:800,color:"#E5EBE8",marginBottom:4}}>{item}</div>
                  <div style={{fontSize:11,fontWeight:500,color:"#A8B3AE",lineHeight:1.6}}>{desc}</div>
                </div>
              ))}
            </div>
          ))}
        </Section>

        {/* Kitchen Checklist Guide */}
        <Section icon="chef" title="Kitchen Checklist — Guide (35 Points)" accent="#2D8E76">
          <div style={{fontSize:11,color:"#7D8A86",marginBottom:10,fontWeight:600}}>Window: 10:00 AM – 12:30 PM IST. Total Score: 35 points. Items marked with 📷 require random photo audit.</div>
          {[
            {cat:"Temperature Control (8 pts)",items:[
              ["Fridge temperature recorded (°C) — 4pts","Check all fridge units: main fridge 1–4°C, display fridge 2–5°C. Record exact reading. If out of range, adjust thermostat and recheck in 15 min. Do not serve from out-of-range fridges."],
              ["Freezer temperature recorded (if applicable) — 4pts","Freezer must be below -18°C. Record exact reading. If temperature is rising, check door seal and defrost cycle. Alert manager if above -15°C."],
            ]},
            {cat:"Food Handling & Preparation (10 pts)",items:[
              ["Prep surfaces sanitized before use — 3pts","Spray food-grade sanitizer on all cutting boards, prep tables, and counters. Wipe down with clean cloth. Allow to air dry. No raw meat residue anywhere."],
              ["Knives & sauce spoons washed and ready — 2pts","All knives must be washed in hot soapy water, rinsed, and placed on the magnetic strip. Sauce spoons cleaned and arranged by station. No cross-contamination."],
              ["FIFO rotation verified (labels visible) — 3pts 📷","Check all storage: first in, first out. Move older stock to front. Check expiry dates. Discard anything expired. Label all items. Photo proof of labels required."],
              ["Veggies washed & cut within SOP limits — 2pts","Wash all vegetables in clean running water. Soak leafy greens for 10 min. Cut and portion per daily prep list. Store in labeled containers. Discard wilted items."],
            ]},
            {cat:"Oil & Fire Safety (9 pts)",items:[
              ["Frying oil quality recorded (TPM %) — 4pts","Test fryer oil using TPM meter. Reading must be below 24%. If above, filter or replace oil. Record reading in oil log. Never mix old and new oil."],
              ["Fire extinguisher accessible & pressure OK — 3pts","Ensure fire extinguisher is accessible — no items blocking it. Check pressure gauge is in green zone. Check expiry. Report if due for service."],
              ["Exhaust filters checked — 2pts","Inspect kitchen exhaust hood filters. If visibly greasy, schedule cleaning. Filters should be degreased weekly. Check exhaust fan pulls properly."],
            ]},
            {cat:"Waste, Plumbing & Handwash (6 pts)",items:[
              ["Grease trap status verified — 3pts 📷","Clean grease trap grate and basket. Remove accumulated grease. Flush with hot water. Weekly deep clean required. Photo proof of trap condition required."],
              ["Waste segregated correctly — 1pt","Separate wet waste (food scraps), dry waste (packaging), and hazardous waste (oil, chemicals). Use color-coded bins. Do not overfill."],
              ["Handwash station stocked (soap & tissue) — 2pts","Verify all kitchen handwash stations have soap, paper towels, and sanitizer. Temperature should allow warm water. Refill any empty dispensers."],
            ]},
            {cat:"Inventory Discipline (2 pts)",items:[
              ["Indent order checked & stored correctly — 2pts","Verify today's delivery against the indent order. Count all items. Check quality — reject damaged or expired goods. Store immediately: frozen first, then chilled, then dry."],
            ]},
          ].map((section,si)=>(
            <div key={si} style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:800,color:"#E8A838",marginBottom:6,padding:"6px 10px",borderRadius:8,background:"rgba(232,168,56,0.04)",border:"1px solid rgba(232,168,56,0.08)"}}>{section.cat}</div>
              {section.items.map(([item,desc],i)=>(
                <div key={i} style={{padding:"12px 14px",borderRadius:10,marginBottom:6,background:"rgba(26,107,90,0.03)",border:"1px solid rgba(26,107,90,0.06)"}}>
                  <div style={{fontSize:12,fontWeight:800,color:"#E5EBE8",marginBottom:4}}>{item}</div>
                  <div style={{fontSize:11,fontWeight:500,color:"#A8B3AE",lineHeight:1.6}}>{desc}</div>
                </div>
              ))}
            </div>
          ))}
        </Section>

        {/* Hygiene Checklist Guide */}
        <Section icon="shield" title="Hygiene Checklist — Guide (25 Points)" accent="#3DA88C">
          <div style={{fontSize:11,color:"#7D8A86",marginBottom:10,fontWeight:600}}>Window: 10:00 AM – 12:30 PM IST. Total Score: 25 points. Items marked with 📷 require random photo audit.</div>
          {[
            {cat:"Staff Hygiene (7 pts)",items:[
              ["Hand hygiene facilities functional (water, soap, tissue) — 3pts","Verify all handwash stations have running water, liquid soap, and paper towels. Temperature should allow warm water. Dispensers must not be empty. Post handwashing instruction signs."],
              ["Hairnets & gloves worn by kitchen staff — 4pts 📷","All kitchen staff must wear hairnets covering all hair. Disposable gloves for food handling — change between raw and cooked items. No bare hand contact with ready-to-eat food. Photo proof required."],
            ]},
            {cat:"Surfaces & Work Areas (7 pts)",items:[
              ["Food-contact surfaces sanitized — 3pts","Spray food-grade sanitizer on all surfaces that touch food: cutting boards, prep tables, slicer blades, mixer bowls. Wipe with clean cloth. Allow to air dry. No chemical residue."],
              ["Prep and cooking counters clean — 2pts","All counters must be wiped down with sanitizer. No food debris, grease buildup, or stains. Check edges and corners. Stainless steel surfaces should be streak-free."],
              ["Floor drains clear (no blockage or smell) — 2pts","Check all floor drains in kitchen and wash area. Remove food debris blocking the grate. Pour hot water to clear buildup. Drains must flow freely — standing water breeds pests."],
            ]},
            {cat:"Washrooms (4 pts)",items:[
              ["Washrooms cleaned and usable — 2pts","Scrub toilet, basin, and floor. Disinfect all surfaces. Check flush is working. Spray air freshener. No odor. Ensure exhaust fan works. Must pass the smell test."],
              ["Washroom handwash stocked (soap & tissue) — 2pts","Replenish soap, tissue, and sanitizer in all washrooms. Check dispensers are functional. Warm water must be available. Replace any broken fixtures immediately."],
            ]},
            {cat:"Waste & Storage Discipline (4 pts)",items:[
              ["Dustbin liners replaced and bins covered — 2pts","Replace all dustbin liners even if not full. Sanitize bin interior with disinfectant. Ensure lids close properly. Kitchen bins should be foot-operated — no hand contact."],
              ["Food containers labelled (item name & date) — 2pts 📷","Every container must have a label: item name, date prepared, use-by date. No unlabeled containers allowed. Clear containers preferred. Discard anything unlabeled. Photo proof required."],
            ]},
            {cat:"Pest & Contamination Control (3 pts)",items:[
              ["Pest traps checked — 2pts 📷","Inspect all pest traps and bait stations — kitchen, storage, dining. Look for signs of rodents or insects. Log and inform pest control if triggered. Replace sticky traps if full. Photo proof required (weekly)."],
              ["Raw & cooked food stored separately — 1pt","Verify raw items stored below cooked in fridge. Separate cutting boards: red for raw meat, green for vegetables, blue for cooked food. Separate utensils per station. No shortcuts."],
            ]},
          ].map((section,si)=>(
            <div key={si} style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:800,color:"#E8A838",marginBottom:6,padding:"6px 10px",borderRadius:8,background:"rgba(232,168,56,0.04)",border:"1px solid rgba(232,168,56,0.08)"}}>{section.cat}</div>
              {section.items.map(([item,desc],i)=>(
                <div key={i} style={{padding:"12px 14px",borderRadius:10,marginBottom:6,background:"rgba(26,107,90,0.03)",border:"1px solid rgba(26,107,90,0.06)"}}>
                  <div style={{fontSize:12,fontWeight:800,color:"#E5EBE8",marginBottom:4}}>{item}</div>
                  <div style={{fontSize:11,fontWeight:500,color:"#A8B3AE",lineHeight:1.6}}>{desc}</div>
                </div>
              ))}
            </div>
          ))}
        </Section>

        {/* General Guidelines */}
        <Section icon="alert" title="General Guidelines & Expectations" accent="#E8A838">
          {[
            ["Attendance","All staff must be present by 11:00 AM. Attendance window is 11:30 AM to 3:00 PM IST. Late arrival affects the outlet health score. Three consecutive absences must be reported to admin."],
            ["Petty Cash","Submit petty cash balance daily by 2:00 AM. Keep receipts for every expense. Do not exceed ₹10,000 balance. Cash must be stored in the safe — never in drawers or bags."],
            ["Maintenance Issues","Report any equipment breakdown, plumbing issue, or structural damage immediately via the Maintenance tab. Include photos if possible. Do not attempt electrical repairs yourself."],
            ["Customer Complaints","Handle politely and offer immediate resolution. Escalate to manager if customer is unsatisfied. Log every complaint in the system. Follow up within 24 hours."],
            ["Food Safety","Follow FSSAI guidelines at all times. Temperature danger zone is 5°C to 60°C — food must not remain in this range for more than 2 hours. When in doubt, throw it out."],
            ["Emergency Procedures","Know the location of fire extinguishers, first aid kit, and emergency exits. In case of fire: alert, evacuate, call fire services. Do not use elevators. Assembly point is outside the main entrance."],
          ].map(([item,desc],i)=>(
            <div key={i} style={{padding:"12px 14px",borderRadius:10,marginBottom:6,background:"rgba(26,107,90,0.03)",border:"1px solid rgba(26,107,90,0.06)"}}>
              <div style={{fontSize:12,fontWeight:800,color:"#E5EBE8",marginBottom:4}}>{item}</div>
              <div style={{fontSize:11,fontWeight:500,color:"#A8B3AE",lineHeight:1.6}}>{desc}</div>
            </div>
          ))}
        </Section>
      </div>}

      {/* ─── SALARY ─── */}
      {activeTab==="salary" && (isAdmin||isOffice) && (()=>{
        const ss = salaryStatus[outletKey]||{status:"draft"};
        const isLocked = ss.status==="submitted"&&isOffice || ss.status==="approved";
        const salOut = salaryData?.[outletKey]||{};
        const hist = attHistory[outletKey]||[];
        const dayCounts = {};
        staff.forEach(s=>{dayCounts[s.id]={present:0,late:0};});
        hist.forEach(r=>{if(dayCounts[r.staffId]){if(r.status==="present")dayCounts[r.staffId].present++;else if(r.status==="late")dayCounts[r.staffId].late++;}});
        const computeRow = (s)=>{
          const sal=salOut[s.id]||{basic:0,ot:0,pf:0,advance:0,extra:0,reviewComm:0,reviewDed:0};
          const perDay=sal.basic>0?Math.round((sal.basic*12/365)*100)/100:0;
          const workDays=(dayCounts[s.id]?.present||0)+(dayCounts[s.id]?.late||0);
          const otAmt=sal.ot*perDay;
          const due=Math.round(((perDay*workDays)+otAmt-sal.pf-sal.advance+sal.extra+sal.reviewComm-sal.reviewDed)*100)/100;
          return {sal,perDay,workDays,due};
        };
        let grandTotal=0;staff.forEach(s=>{grandTotal+=computeRow(s).due;});
        const curMonth=new Date().toLocaleDateString("en-IN",{month:"long",year:"numeric"});
        return <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* Status banner */}
        <div style={{...glass,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,
          borderLeft:`3px solid ${ss.status==="draft"?"#E8A838":ss.status==="submitted"?"#6C5CE7":"#10B981"}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:ss.status==="draft"?"#E8A838":ss.status==="submitted"?"#6C5CE7":"#10B981"}}/>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:"#EFF4F1"}}>
                {ss.status==="draft"?"Draft — Preparing Salary":ss.status==="submitted"?`Submitted for Approval by ${ss.submittedBy||"Office"}`:"Approved & Finalized"}
              </div>
              <div style={{fontSize:10,color:"#7D8A86"}}>{ss.month||curMonth} • {OUTLETS[outletKey].name}
                {ss.submittedAt && ` • Submitted: ${ss.submittedAt}`}
                {ss.approvedAt && ` • Approved: ${ss.approvedAt}`}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {/* Office: Submit for approval */}
            {isOffice && ss.status==="draft" && <button onClick={()=>{
              const snapshot=staff.map(s=>{const r=computeRow(s);return{id:s.id,name:s.name,dept:s.dept,...r.sal,perDay:r.perDay,workDays:r.workDays,due:r.due};});
              const now=new Date().toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",hour12:true});
              setSalaryStatus(p=>({...p,[outletKey]:{status:"submitted",month:curMonth,submittedBy:userName||"Office",submittedAt:now,snapshot}}));
              addNotif(`💰 Salary for ${OUTLETS[outletKey].name} (${curMonth}) submitted for approval by ${userName||"Office"}`,"office_edit");
            }} style={{...btn("#6C5CE7"),padding:"8px 18px",fontSize:11}}>Submit for Approval</button>}
            {/* Admin: Approve */}
            {isAdmin && ss.status==="submitted" && <>
              <button onClick={()=>{
                const now=new Date().toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",hour12:true});
                setSalaryHistory(p=>({...p,[outletKey]:[{month:ss.month||curMonth,snapshot:ss.snapshot||[],total:grandTotal,submittedBy:ss.submittedBy,approvedAt:now},...(p[outletKey]||[])]}));
                setSalaryStatus(p=>({...p,[outletKey]:{status:"approved",month:ss.month,submittedBy:ss.submittedBy,submittedAt:ss.submittedAt,approvedAt:now}}));
                addNotif(`✅ Salary for ${OUTLETS[outletKey].name} (${ss.month||curMonth}) approved`,"office_edit");
              }} style={{...btn("#10B981"),padding:"8px 18px",fontSize:11}}>Approve Salary</button>
              <button onClick={()=>{
                setSalaryStatus(p=>({...p,[outletKey]:{status:"draft"}}));
                addNotif(`↩ Salary for ${OUTLETS[outletKey].name} sent back for revision`,"office_edit");
              }} style={{...btn("rgba(239,68,68,0.15)"),padding:"8px 18px",fontSize:11,color:"#EF4444"}}>Send Back</button>
            </>}
            {/* Reset after approval for next month */}
            {ss.status==="approved" && (isAdmin||isOffice) && <button onClick={()=>{
              setSalaryStatus(p=>({...p,[outletKey]:{status:"draft"}}));
            }} style={{...btn("rgba(232,168,56,0.12)"),padding:"8px 18px",fontSize:11,color:"#E8A838"}}>Start New Month</button>}
          </div>
        </div>

        {/* Salary table */}
        <div style={{...glass,padding:20}}>
          <div style={{fontSize:14,fontWeight:800,color:"#EFF4F1",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><Ic name="wallet" size={18} color={ac}/> Salary — {OUTLETS[outletKey].name}</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"separate",borderSpacing:"0 4px",minWidth:1100,tableLayout:"fixed"}}>
              <thead><tr>
                {["#","Name","Dept","Days","Basic Sal","Per Day","OT","PF","Advance","Extra","Rev Comm","Rev Ded","Salary Due"].map(h=>(
                  <th key={h} style={{padding:"8px 6px",fontSize:9,fontWeight:800,color:"#7D8A86",letterSpacing:1,textTransform:"uppercase",textAlign:h==="Name"||h==="Dept"?"left":"right",borderBottom:"1px solid rgba(26,107,90,0.1)"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {(()=>{
                  let gt=0;
                  const rows=staff.map((s,i)=>{
                    const {sal,perDay,workDays,due}=computeRow(s);gt+=due;
                    const updateField=(field,val)=>setSalaryData(prev=>({...prev,[outletKey]:{...prev[outletKey],[s.id]:{...(prev[outletKey]?.[s.id]||{basic:0,ot:0,pf:0,advance:0,extra:0,reviewComm:0,reviewDed:0}),[field]:parseFloat(val)||0}}}));
                    const cellSt={padding:"6px 4px",fontSize:11,fontWeight:600,color:"#CDD6D2",textAlign:"right"};
                    const inpSt={...inp,padding:"6px 6px",fontSize:11,width:"100%",boxSizing:"border-box",textAlign:"right",fontWeight:600,opacity:isLocked?0.6:1};
                    return <tr key={s.id} style={{background:i%2===0?"rgba(26,107,90,0.02)":"transparent"}}>
                      <td style={{...cellSt,textAlign:"center",color:"#5E6764",width:28}}>{i+1}</td>
                      <td style={{...cellSt,textAlign:"left",color:"#EFF4F1",fontWeight:700}}>{s.name}</td>
                      <td style={{...cellSt,textAlign:"left",color:"#A8B3AE",fontSize:10}}>{s.dept}</td>
                      <td style={{...cellSt,color:workDays>0?"#10B981":"#5E6764"}}>{workDays}</td>
                      <td style={cellSt}><input type="number" value={sal.basic||""} onChange={e=>updateField("basic",e.target.value)} disabled={isLocked} placeholder="0" style={inpSt}/></td>
                      <td style={{...cellSt,color:"#E8A838",fontWeight:700}}>{perDay.toFixed(2)}</td>
                      <td style={cellSt}><input type="number" value={sal.ot||""} onChange={e=>updateField("ot",e.target.value)} disabled={isLocked} placeholder="0" style={inpSt}/></td>
                      <td style={cellSt}><input type="number" value={sal.pf||""} onChange={e=>updateField("pf",e.target.value)} disabled={isLocked} placeholder="0" style={inpSt}/></td>
                      <td style={cellSt}><input type="number" value={sal.advance||""} onChange={e=>updateField("advance",e.target.value)} disabled={isLocked} placeholder="0" style={inpSt}/></td>
                      <td style={cellSt}><input type="number" value={sal.extra||""} onChange={e=>updateField("extra",e.target.value)} disabled={isLocked} placeholder="0" style={inpSt}/></td>
                      <td style={cellSt}><input type="number" value={sal.reviewComm||""} onChange={e=>updateField("reviewComm",e.target.value)} disabled={isLocked} placeholder="0" style={inpSt}/></td>
                      <td style={cellSt}><input type="number" value={sal.reviewDed||""} onChange={e=>updateField("reviewDed",e.target.value)} disabled={isLocked} placeholder="0" style={inpSt}/></td>
                      <td style={{...cellSt,fontWeight:900,fontSize:12,color:due>=0?"#10B981":"#EF4444"}}>₹{due.toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                    </tr>;
                  });
                  return <>{rows}<tr style={{borderTop:"2px solid rgba(232,168,56,0.2)"}}>
                    <td colSpan={12} style={{padding:"10px 6px",fontSize:12,fontWeight:900,color:"#E8A838",textAlign:"right"}}>TOTAL PAYABLE</td>
                    <td style={{padding:"10px 6px",fontSize:14,fontWeight:900,color:gt>=0?"#10B981":"#EF4444",textAlign:"right"}}>₹{gt.toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                  </tr></>;
                })()}
              </tbody>
            </table>
          </div>
          <div style={{marginTop:14,padding:"10px 14px",borderRadius:8,background:"rgba(232,168,56,0.04)",border:"1px solid rgba(232,168,56,0.08)",fontSize:10,color:"#A8B3AE",lineHeight:1.6}}>
            <span style={{fontWeight:700,color:"#E8A838"}}>Formula:</span> Salary Due = (Per Day × Working Days) + (OT × Per Day) − PF − Advance + Extra + Review Commission − Review Deduction. Per Day = (Basic × 12) ÷ 365.
          </div>
        </div>

        {/* Salary History */}
        {(salaryHistory[outletKey]||[]).length>0 && <div style={{...glass,padding:20}}>
          <div style={{fontSize:14,fontWeight:800,color:"#EFF4F1",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><Ic name="list" size={18} color="#10B981"/> Salary History</div>
          {(salaryHistory[outletKey]||[]).map((rec,ri)=>(
            <Section key={ri} icon="check" title={`${rec.month} — ₹${rec.total.toLocaleString("en-IN",{minimumFractionDigits:2})}`} accent="#10B981">
              <div style={{fontSize:10,color:"#7D8A86",marginBottom:8}}>Submitted by {rec.submittedBy} • Approved: {rec.approvedAt}</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"separate",borderSpacing:"0 3px",minWidth:700,tableLayout:"fixed"}}>
                  <thead><tr>
                    {["Name","Dept","Days","Basic","Per Day","OT","PF","Adv","Extra","Comm","Ded","Due"].map(h=>(
                      <th key={h} style={{padding:"6px 4px",fontSize:8,fontWeight:800,color:"#7D8A86",letterSpacing:1,textTransform:"uppercase",textAlign:h==="Name"||h==="Dept"?"left":"right",borderBottom:"1px solid rgba(26,107,90,0.08)"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {rec.snapshot.map((row,si)=>{
                      const c={padding:"5px 4px",fontSize:10,fontWeight:600,color:"#A8B3AE",textAlign:"right"};
                      return <tr key={si} style={{background:si%2===0?"rgba(26,107,90,0.02)":"transparent"}}>
                        <td style={{...c,textAlign:"left",color:"#CDD6D2",fontWeight:700}}>{row.name}</td>
                        <td style={{...c,textAlign:"left",fontSize:9}}>{row.dept}</td>
                        <td style={c}>{row.workDays}</td>
                        <td style={c}>₹{(row.basic||0).toLocaleString()}</td>
                        <td style={{...c,color:"#E8A838"}}>{(row.perDay||0).toFixed(2)}</td>
                        <td style={c}>{row.ot||0}</td>
                        <td style={c}>{row.pf||0}</td>
                        <td style={c}>{row.advance||0}</td>
                        <td style={c}>{row.extra||0}</td>
                        <td style={c}>{row.reviewComm||0}</td>
                        <td style={c}>{row.reviewDed||0}</td>
                        <td style={{...c,fontWeight:900,color:row.due>=0?"#10B981":"#EF4444"}}>₹{row.due.toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          ))}
        </div>}
      </div>;})()}

        </div>{/* end content */}
      </div>{/* end sidebar+content flex */}

      {/* ═══ MODALS ═══ */}

      {/* Staff Management Modals */}
      <Modal open={staffModal?.type==="rename"} onClose={()=>setStaffModal(null)} title="Rename Staff">
        {staffModal?.staff && <div>
            <input value={smName} onChange={e=>setSmName(e.target.value)} style={inp} placeholder="New name"/>
            <button onClick={()=>{const oldName=staffModal.staff.name;setStaff(prev=>prev.map(s=>s.id===staffModal.staff.id?{...s,name:smName}:s));if(!isAdmin)addNotif(`✏ Staff renamed at ${OUTLETS[outletKey].name}: "${oldName}" → "${smName}" by ${userName||"Manager"}`);setStaffModal(null);}} style={{...btn(ac),marginTop:10,width:"100%"}}>Save</button>
          </div>}
      </Modal>

      <Modal open={staffModal?.type==="dept"} onClose={()=>setStaffModal(null)} title={`Change Department — ${staffModal?.staff?.name||""}`}>
        {staffModal?.staff && <div>
            <div style={{fontSize:11,color:"#A8B3AE",marginBottom:8}}>Current: <span style={{fontWeight:700,color:"#E5EBE8"}}>{staffModal.staff.dept||"Staff"}</span></div>
            <select value={smShift} onChange={e=>setSmShift(e.target.value)} style={inp}>
              {["Manager","Counter","Waiter","Main Chef","Asst Chef","Snacks","Drinks","Cleaning","Watchman"].map(d=><option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={()=>{const oldDept=staffModal.staff.dept;setStaff(prev=>prev.map(s=>s.id===staffModal.staff.id?{...s,dept:smShift}:s));if(!isAdmin)addNotif(`🔄 Dept changed at ${OUTLETS[outletKey].name}: ${staffModal.staff.name} "${oldDept}" → "${smShift}" by ${userName||"Manager"}`);setStaffModal(null);}} style={{...btn(ac),marginTop:10,width:"100%"}}>Update Department</button>
          </div>}
      </Modal>

      <Modal open={staffModal?.type==="remove"} onClose={()=>setStaffModal(null)} title="Remove Staff">
        {staffModal?.staff && <div style={{textAlign:"center"}}>
          <div style={{width:50,height:50,borderRadius:12,background:"#EF444415",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><Ic name="alert" size={24} color="#EF4444"/></div>
          <div style={{fontSize:14,fontWeight:700,color:"#EFF4F1",marginBottom:6}}>Do you want to remove this staff?</div>
          <div style={{fontSize:13,fontWeight:800,color:ac,marginBottom:4}}>{staffModal.staff.name}</div>
          <div style={{fontSize:11,color:"#7D8A86",marginBottom:20}}>{staffModal.staff.dept||"Staff"} • {OUTLETS[outletKey].name}</div>
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            <button onClick={()=>setStaffModal(null)} style={{...btn("rgba(26,107,90,0.12)"),flex:1,color:"#A8B3AE"}}>Cancel</button>
            <button onClick={()=>{if(!isAdmin)addNotif(`🗑 Staff removed at ${OUTLETS[outletKey].name}: ${staffModal.staff.name} (${staffModal.staff.dept}) by ${userName||"Manager"}`);setStaff(prev=>prev.filter(x=>x.id!==staffModal.staff.id));setStaffModal(null);}} style={{...btn("#EF4444"),flex:1}}>Remove</button>
          </div>
        </div>}
      </Modal>

      <Modal open={staffModal?.type==="add"} onClose={()=>setStaffModal(null)} title="Add New Staff">
        <div>
            <input value={smName} onChange={e=>setSmName(e.target.value)} style={inp} placeholder="Staff name"/>
            <select value={smShift} onChange={e=>setSmShift(e.target.value)} style={{...inp,marginTop:8}}>
              {["Manager","Counter","Waiter","Main Chef","Asst Chef","Snacks","Drinks","Cleaning","Watchman"].map(d=><option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={()=>{if(smName.trim()){setStaff(prev=>[...prev,{id:`new-${Date.now()}`,name:smName.trim(),status:"not_marked",dept:smShift}]);if(!isAdmin)addNotif(`➕ Staff added at ${OUTLETS[outletKey].name}: ${smName.trim()} (${smShift}) by ${userName||"Manager"}`);setSmName("");setStaffModal(null);}}} style={{...btn(ac),marginTop:10,width:"100%"}}>Add Staff</button>
          </div>
      </Modal>

      <Modal open={staffModal?.type==="transfer"} onClose={()=>setStaffModal(null)} title="Transfer Staff to Another Outlet">
        {(()=>{
          const activeStaff = staff.filter(s=>s.status!=="transferred");
          const otherOutlets = Object.entries(OUTLETS).filter(([k])=>k!==outletKey);
          return <div>
            <select value={smSelStaff} onChange={e=>setSmSelStaff(e.target.value)} style={inp}>
              <option value="">Select staff...</option>
              {activeStaff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={smSelOutlet} onChange={e=>setSmSelOutlet(e.target.value)} style={{...inp,marginTop:8}}>
              <option value="">Select destination outlet...</option>
              {otherOutlets.map(([k,m])=><option key={k} value={k}>{m.name}</option>)}
            </select>
            <button onClick={()=>{
              if(smSelStaff&&smSelOutlet){
                const person=activeStaff.find(s=>s.id===smSelStaff);
                if(person){requestTransfer(person.id,person.name,outletKey,smSelOutlet);setSmSelStaff("");setSmSelOutlet("");setStaffModal(null);}
              }
            }} disabled={!smSelStaff||!smSelOutlet} style={{...btn(!smSelStaff||!smSelOutlet?"#2F3836":ac),marginTop:10,width:"100%",opacity:!smSelStaff||!smSelOutlet?0.5:1}}>Request Transfer</button>
          </div>;
        })()}
      </Modal>

      <Modal open={staffModal?.type==="history"} onClose={()=>setStaffModal(null)} title={`Attendance History — ${staffModal?.staff?.name||""}`} wide>
        {staffModal?.staff && (()=>{
          const sid = staffModal.staff.id;
          const sname = staffModal.staff.name;
          // Find this staff's history across all outlets
          const allHist = Object.entries(attHistory).flatMap(([oKey,records])=>
            records.filter(r=>r.staffId===sid||r.staffName===sname).map(r=>({...r,outletKey:oKey,outletName:OUTLETS[oKey]?.name||oKey}))
          );
          // Group by month
          const months = {};
          allHist.forEach(r=>{
            const key = r.date; // already formatted
            if(!months[key]) months[key]=[];
            months[key].push(r);
          });
          const stC = {present:"#10B981",late:"#E8A838",absent:"#EF4444"};
          // Stats
          const total = allHist.length;
          const pCt = allHist.filter(r=>r.status==="present").length;
          const lCt = allHist.filter(r=>r.status==="late").length;
          const aCt = allHist.filter(r=>r.status==="absent").length;
          return <div>
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              {[["Total Days",total,"#2D8E76"],["Present",pCt,"#10B981"],["Late",lCt,"#E8A838"],["Absent",aCt,"#EF4444"]].map(([l,v,c])=>(
                <div key={l} style={{padding:"8px 16px",borderRadius:9,background:`${c}10`,border:`1px solid ${c}18`,textAlign:"center",flex:1,minWidth:60}}>
                  <div style={{fontSize:18,fontWeight:900,color:c}}>{v}</div>
                  <div style={{fontSize:9,fontWeight:600,color:"#7D8A86"}}>{l}</div>
                </div>
              ))}
            </div>
            {allHist.length===0 ? (
              <div style={{padding:20,textAlign:"center",color:"#5E6764",fontSize:12}}>No attendance history recorded yet</div>
            ) : (
              <div style={{maxHeight:400,overflow:"auto"}}>
                {Object.entries(months).map(([date,records])=>(
                  <div key={date} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,marginBottom:4,background:"rgba(26,107,90,0.04)",border:"1px solid rgba(26,107,90,0.06)"}}>
                    <span style={{fontSize:12,fontWeight:700,color:"#E5EBE8",minWidth:120}}>{date}</span>
                    <span style={{fontSize:11,fontWeight:600,color:OUTLETS[records[0].outletKey]?.accent||"#A8B3AE"}}>{records[0].outletName}</span>
                    {records.map((r,i)=>(
                      <span key={i} style={{...badge((stC[r.status]||"#5E6764")+"18",stC[r.status]||"#5E6764")}}>{r.status==="present"?"Present":r.status==="late"?"Late":"Absent"}</span>
                    ))}
                    {records[0].editedBy && <span style={{fontSize:9,fontWeight:600,color:"#E8A838"}}>edited by {records[0].editedBy}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>;
        })()}
      </Modal>

      <Modal open={modal==="comp"} onClose={()=>setModal(null)} title="Compliance Dates">
        {[["FSSAI Expiry","fssai"],["Fire Safety","fire"],["Last Pest Control","pestLast"],["Next Pest Control","pestNext"],["Last Deep Clean","deepClean"]].map(([l,k])=>(
          <div key={k} style={{marginBottom:10}}>
            <label style={{fontSize:11,fontWeight:600,color:"#A8B3AE",marginBottom:3,display:"block"}}>{l}</label>
            <input type="date" value={comp[k]} onChange={e=>setComp(p=>({...p,[k]:e.target.value}))} style={inp}/>
          </div>
        ))}
        <button onClick={()=>setModal(null)} style={{...btn(ac),marginTop:6}}>Save</button>
      </Modal>

    </div>
  );
};

// ═══ AUDIT HISTORY ═══

const AuditHistory = ({extScores, accent="#2D8E76"}) => {
  const [filter,setFilter]=useState("all");
  // Merge all audits across outlets with outlet key attached, sort by date desc
  const allAudits = Object.entries(extScores).flatMap(([key,arr])=>
    (arr||[]).map(a=>({...a,outletKey:key,outletName:OUTLETS[key].name}))
  ).sort((a,b)=>new Date(b.date)-new Date(a.date));

  // Filter last 12 months
  const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth()-12);
  const filtered = allAudits
    .filter(a=>new Date(a.date)>=cutoff)
    .filter(a=>filter==="all"||a.outletKey===filter);

  if(allAudits.length===0) return (
    <div style={{...glass,padding:24,textAlign:"center",marginTop:18}}>
      <div style={{fontSize:13,fontWeight:700,color:"#5E6764"}}>No audit history yet</div>
    </div>
  );

  const gradeC = (s)=>s>=90?"#10B981":s>=75?"#2D8E76":s>=60?"#E8A838":"#EF4444";

  return (
    <div style={{...glass,padding:20,marginTop:18}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Ic name="list" size={16} color={accent}/>
          <span style={{fontSize:14,fontWeight:800,color:"#EFF4F1"}}>Audit History</span>
          <span style={{fontSize:10,fontWeight:600,color:"#7D8A86"}}>(Last 12 months)</span>
        </div>
        <div style={{display:"flex",gap:4}}>
          {[["all","All Outlets"],["santacruz","Santacruz"],["bandra","Bandra"],["oshiwara","Oshiwara"]].map(([k,l])=>(
            <button key={k} onClick={()=>setFilter(k)} style={{
              padding:"7px 16px",borderRadius:10,fontSize:10,fontWeight:700,cursor:"pointer",
              border:filter===k?`1px solid ${accent}30`:"1px solid rgba(26,107,90,0.09)",
              background:filter===k?`linear-gradient(135deg,${accent}18,${accent}06)`:"rgba(26,107,90,0.03)",
              backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
              boxShadow:filter===k?`0 2px 12px ${accent}15, inset 0 1px 0 rgba(255,255,255,0.06)`:"none",
              color:filter===k?accent:"#7D8A86",transition:"all 0.2s"
            }}>{l}</button>
          ))}
        </div>
      </div>
      {/* Stats summary */}
      {filtered.length>0 && (()=>{
        const avg = Math.round(filtered.reduce((s,a)=>s+a.score,0)/filtered.length);
        const best = Math.max(...filtered.map(a=>a.score));
        const worst = Math.min(...filtered.map(a=>a.score));
        const fails = filtered.filter(a=>a.score<60).length;
        return (
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            {[["Audits",filtered.length,accent],["Avg Score",avg,gradeC(avg)],["Best",best,"#10B981"],["Worst",worst,gradeC(worst)],["Fails",fails,fails>0?"#EF4444":"#10B981"]].map(([l,v,c])=>(
              <div key={l} style={{padding:"8px 16px",borderRadius:9,background:`${c}10`,border:`1px solid ${c}18`,textAlign:"center",flex:1,minWidth:70}}>
                <div style={{fontSize:18,fontWeight:900,color:c}}>{v}</div>
                <div style={{fontSize:9,fontWeight:600,color:"#7D8A86"}}>{l}</div>
              </div>
            ))}
          </div>
        );
      })()}
      {/* Table */}
      <div style={{overflowX:"auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"110px 1fr 80px 80px 140px",gap:8,padding:"8px 12px",borderRadius:8,background:"rgba(26,107,90,0.05)",marginBottom:6,minWidth:520}}>
          {["Outlet","Auditor","Score","Grade","Date & Time"].map(h=>(
            <div key={h} style={{fontSize:10,fontWeight:800,color:"#7D8A86",letterSpacing:1,textTransform:"uppercase"}}>{h}</div>
          ))}
        </div>
        {filtered.length===0 ? (
          <div style={{padding:20,textAlign:"center",color:"#5E6764",fontSize:12}}>No audits found for this filter</div>
        ) : filtered.map((a,i)=>{
          const d=new Date(a.date);
          const sc=gradeC(a.score);
          return (
            <div key={i} style={{display:"grid",gridTemplateColumns:"110px 1fr 80px 80px 140px",gap:8,padding:"10px 12px",borderRadius:9,marginBottom:4,
              background:`${sc}06`,border:`1px solid ${sc}10`,alignItems:"center",minWidth:520}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:OUTLETS[a.outletKey].accent,flexShrink:0}}/>
                <span style={{fontSize:12,fontWeight:700,color:"#E5EBE8"}}>{a.outletName}</span>
              </div>
              <div style={{fontSize:12,fontWeight:600,color:"#CDD6D2"}}>{a.auditor||"Unknown"}</div>
              <div style={{fontSize:16,fontWeight:900,color:sc}}>{a.score}</div>
              <div style={{fontSize:11,fontWeight:700,color:sc}}>{a.grade}</div>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:"#CDD6D2"}}>{d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>
                <div style={{fontSize:9,color:"#7D8A86"}}>{d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══ SUPERVISOR ═══

const SupervisorHome = ({onSelect, extScores}) => {
  const [mt,setMt]=useState(false);
  useEffect(()=>{setTimeout(()=>setMt(true),50);},[]);
  return (
    <div style={{opacity:mt?1:0,transform:mt?"translateY(0)":"translateY(16px)",transition:"all 0.5s cubic-bezier(0.16,1,0.3,1)"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:11,fontWeight:900,letterSpacing:6,color:"#2D8E76",textTransform:"uppercase",marginBottom:4}}>SUPERVISION PORTAL</div>
        <h1 style={{fontSize:28,fontWeight:900,margin:"0 0 4px",background:"linear-gradient(135deg,#F5F9F7,#E8A838)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:-0.5}}>External Audit</h1>
        <p style={{color:"#5E6764",fontSize:12,fontWeight:500}}>Select an outlet to conduct supervision</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:18}}>
        {Object.entries(OUTLETS).map(([key,meta],idx)=>{
          const ext = (extScores[key]||[])[0] || null;
          const eC = ext?(ext.score>=80?"#10B981":ext.score>=60?"#E8A838":"#EF4444"):"#2F3836";
          return (
            <div key={key} onClick={()=>onSelect(key)} style={{
              ...glass,padding:24,cursor:"pointer",borderTop:`3px solid ${meta.accent}`,boxShadow:"inset 0 -1px 0 rgba(232,168,56,0.06),0 6px 32px rgba(0,0,0,0.35)",position:"relative",overflow:"hidden",
              transition:"all 0.3s",opacity:mt?1:0,transform:mt?"translateY(0)":"translateY(24px)",transitionDelay:`${idx*80}ms`
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 14px 44px ${meta.accent}22`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=glass.boxShadow;}}>
              <div style={{position:"absolute",top:-35,right:-35,width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle,${meta.accent}11 0%,transparent 70%)`}}/>
              <h3 style={{fontSize:20,fontWeight:900,margin:"0 0 12px",color:"#EFF4F1"}}>{meta.name}</h3>
              {ext ? (
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{fontSize:36,fontWeight:900,color:eC,textShadow:`0 0 24px ${eC}44`}}>{ext.score}</div>
                    <div style={{fontSize:10,fontWeight:700,color:"#2D8E76",letterSpacing:1,textTransform:"uppercase"}}>Last<br/>Score</div>
                  </div>
                  <div style={{fontSize:10,fontWeight:600,color:"#A8B3AE"}}>
                    {ext.auditor && <span style={{color:"#2D8E76",fontWeight:700}}>By: {ext.auditor} • </span>}
                    {new Date(ext.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})} at {new Date(ext.date).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}
                  </div>
                </div>
              ) : (
                <div style={{padding:"14px 0",color:"#5E6764",fontSize:12,fontWeight:500}}>No audit conducted yet</div>
              )}
              <div style={{marginTop:14,textAlign:"center"}}><span style={{fontSize:11,fontWeight:700,color:meta.accent,letterSpacing:1}}>{ext?"RE-AUDIT":"START AUDIT"} →</span></div>
            </div>
          );
        })}
      </div>
      <AuditHistory extScores={extScores}/>
    </div>
  );
};


// Inspection scorecard definition — tick = full marks, unticked = 0
const SCORECARD = [
  {id:1, title:"Staff Discipline & Presentation", max:10, icon:"staff",
    note:"Auto-deduction: Manager without blazer during service = minus 4",
    items:[
      {text:"Manager wearing proper blazer and formal appearance",max:4},
      {text:"Service staff in full, clean uniform",max:3},
      {text:"Kitchen staff in complete uniform",max:3},
    ]},
  {id:2, title:"Personal Hygiene & Food Handling", max:20, icon:"shield",
    note:"Auto-fail: Bare-hand food handling = zero for this section",
    items:[
      {text:"All kitchen staff wearing gloves",max:7},
      {text:"Hair nets / caps worn correctly",max:5},
      {text:"No bare-hand contact with ready food",max:5,autoFail:true},
      {text:"Clean aprons and personal hygiene",max:3},
    ]},
  {id:3, title:"Kitchen Cleanliness & Discipline", max:15, icon:"chef",
    items:[
      {text:"Floors dry and non-greasy",max:4},
      {text:"Prep counters and workstations clean",max:4},
      {text:"Walls, tiles, exhaust reasonably clean",max:4},
      {text:"No stagnant water or clutter",max:3},
    ]},
  {id:4, title:"Food Prep, Storage & Inventory Control", max:15, icon:"list",
    note:"Red flag: Large tubs of pre-cut vegetables = deliberate overproduction",
    items:[
      {text:"No excess vegetables pre-cut",max:8},
      {text:"FIFO followed with proper labeling",max:4},
      {text:"Raw and cooked food segregated correctly",max:3},
    ]},
  {id:5, title:"Portion Control & Service Consistency", max:8, icon:"check",
    items:[
      {text:"Veggie portion consistency",max:4},
      {text:"Sauces not free-poured",max:2},
      {text:"No unauthorized extras",max:2},
    ]},
  {id:6, title:"POS, Cash & Billing Control", max:10, icon:"wallet",
    note:"Critical: CID mismatch = immediate escalation",
    items:[
      {text:"CID (Cash in Drawer) matches system",max:6},
      {text:"All POS devices functioning properly",max:4},
    ]},
  {id:7, title:"Service Area & Dining Hygiene", max:7, icon:"star",
    items:[
      {text:"Tables and chairs clean",max:2},
      {text:"Cutlery and crockery spotless",max:2},
      {text:"Menus clean and presentable",max:1},
      {text:"AC and lighting working properly",max:2},
    ]},
  {id:8, title:"Washroom Hygiene", max:5, icon:"alert",
    note:"Dirty washroom = brand damage",
    items:[
      {text:"Cleanliness and smell",max:2},
      {text:"Flush and water working",max:1},
      {text:"Soap available",max:1},
      {text:"Floor dry and safe",max:1},
    ]},
  {id:9, title:"Pest Control & Safety", max:10, icon:"alert",
    note:"Auto-fail: Rodents or infestation = FAIL regardless of total score",
    items:[
      {text:"No visible cockroaches, flies, rodents",max:5,autoFailSection:true},
      {text:"Active and effective pest control measures",max:3},
      {text:"Garbage covered and disposed timely",max:2},
    ]},
];

const SupervisorAudit = ({outletKey, onBack, extScores, setExtScores}) => {
  const meta = OUTLETS[outletKey];
  const ac = meta.accent;
  const [mt,setMt]=useState(false);
  const [auditorName,setAuditorName]=useState("");
  const [started,setStarted]=useState(false);
  useEffect(()=>{setTimeout(()=>setMt(true),50);},[]);

  // Each item is true (pass=full marks) or false (fail=0) or null (unmarked)
  const [checks,setChecks]=useState(()=>{
    const s={};
    SCORECARD.forEach(sec=>{s[sec.id]={};sec.items.forEach((_,i)=>{s[sec.id][i]=null;});});
    return s;
  });
  const [submitted,setSubmitted]=useState(false);

  const toggle = (secId,idx) => {
    if(submitted) return;
    setChecks(prev=>({...prev,[secId]:{...prev[secId],[idx]:prev[secId][idx]===true?false:true}}));
  };

  // Section score: ticked=full marks, unticked=0
  const getSectionScore = (sec) => {
    // Auto-fail: bare-hand food (section 2 item 2) not ticked => entire section 0
    if(sec.id===2 && checks[sec.id][2]===false) return 0;
    return sec.items.reduce((s,item,i)=>s+(checks[sec.id][i]===true?item.max:0),0);
  };

  const totalScore = SCORECARD.reduce((s,sec)=>s+getSectionScore(sec),0);
  const totalItems = SCORECARD.reduce((s,sec)=>s+sec.items.length,0);
  const markedCount = SCORECARD.reduce((s,sec)=>s+sec.items.filter((_,i)=>checks[sec.id][i]!==null).length,0);
  const allFilled = markedCount===totalItems;

  // Auto-fail: pest infestation not ticked
  const pestFail = allFilled && checks[9]?.[0]===false;
  const hygieneFail = checks[2]?.[2]===false;
  const finalScore = pestFail ? Math.min(totalScore,59) : totalScore;
  const grade = finalScore>=90?"Excellent":finalScore>=75?"Acceptable":finalScore>=60?"Warning":"FAIL";
  const gradeC = finalScore>=90?"#10B981":finalScore>=75?"#2D8E76":finalScore>=60?"#E8A838":"#EF4444";

  const handleSubmit = () => {
    const now = new Date();
    setExtScores(prev=>({...prev,[outletKey]:[{score:finalScore,date:now.toISOString(),auditor:auditorName,grade},...(prev[outletKey]||[])]}));
    setSubmitted(true);
  };

  // Name prompt screen
  if(!started) return (
    <div style={{opacity:mt?1:0,transform:mt?"translateY(0)":"translateY(16px)",transition:"all 0.5s cubic-bezier(0.16,1,0.3,1)",maxWidth:420,margin:"60px auto",textAlign:"center"}}>
      <div style={{...glass,padding:32}}>
        <div style={{width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,#1A6B5A,#14503F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:"#fff",margin:"0 auto 16px",boxShadow:"0 4px 20px rgba(26,107,90,0.3)"}}>S</div>
        <h2 style={{fontSize:20,fontWeight:900,margin:"0 0 4px",color:"#EFF4F1"}}>Internal Inspection</h2>
        <div style={{fontSize:12,fontWeight:600,color:ac,marginBottom:4}}>{meta.name} Outlet</div>
        <div style={{fontSize:10,color:"#7D8A86",marginBottom:20}}>100-Point Scorecard</div>
        <div style={{marginBottom:16,textAlign:"left"}}>
          <label style={{fontSize:11,fontWeight:700,color:"#A8B3AE",marginBottom:6,display:"block",letterSpacing:1,textTransform:"uppercase"}}>Auditor Name</label>
          <input value={auditorName} onChange={e=>setAuditorName(e.target.value)} placeholder="Enter your full name..."
            style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid rgba(26,107,90,0.14)",background:"rgba(21,28,25,0.6)",color:"#EFF4F1",fontSize:14,fontWeight:600,fontFamily:"Montserrat",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <button onClick={()=>{if(auditorName.trim()) setStarted(true);}} disabled={!auditorName.trim()}
          style={{...btn(auditorName.trim()?"#2D8E76":"#2F3836"),width:"100%",padding:"12px",fontSize:13,opacity:auditorName.trim()?1:0.5,cursor:auditorName.trim()?"pointer":"not-allowed"}}>
          Begin Inspection →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{opacity:mt?1:0,transform:mt?"translateY(0)":"translateY(16px)",transition:"all 0.5s cubic-bezier(0.16,1,0.3,1)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onBack} style={{width:38,height:38,borderRadius:10,border:"1px solid rgba(26,107,90,0.12)",background:"rgba(21,28,25,0.6)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#A8B3AE",fontSize:16}}>←</button>
          <div>
            <div style={{fontSize:11,fontWeight:800,color:"#2D8E76",letterSpacing:4,textTransform:"uppercase"}}>Inspection Scorecard</div>
            <h2 style={{fontSize:20,fontWeight:900,margin:0,color:"#EFF4F1"}}>{meta.name} Outlet</h2>
          </div>
        </div>
        <div style={{...badge("#2D8E7618","#2D8E76"),fontSize:11,padding:"6px 14px"}}>
          <Ic name="staff" size={13} color="#2D8E76"/> Auditor: {auditorName}
        </div>
      </div>

      {/* Score summary */}
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:14,marginBottom:18}}>
        <div style={{...glass,padding:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <Gauge score={allFilled?finalScore:0}/>
          {allFilled && <div style={{marginTop:6,fontSize:13,fontWeight:900,color:gradeC,letterSpacing:1}}>{grade}</div>}
          {submitted && <div style={{marginTop:2,fontSize:9,fontWeight:700,color:"#10B981",letterSpacing:1}}>SUBMITTED</div>}
        </div>
        <div style={{...glass,padding:20}}>
          <div style={{fontSize:12,fontWeight:800,color:"#EFF4F1",letterSpacing:1,marginBottom:10}}>SECTION BREAKDOWN</div>
          <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
            {[["90\u2013100","Excellent","#10B981"],["75\u201389","Acceptable","#2D8E76"],["60\u201374","Warning","#E8A838"],["<60","FAIL","#EF4444"]].map(([r,l,c])=>(
              <div key={l} style={{padding:"4px 10px",borderRadius:6,background:`${c}10`,border:`1px solid ${c}18`,fontSize:9,fontWeight:700,color:c}}>{r} {l}</div>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:200,overflow:"auto"}}>
            {SCORECARD.map(sec=>{
              const secScore = getSectionScore(sec);
              const filled = sec.items.every((_,i)=>checks[sec.id][i]!==null);
              const pct = sec.max>0?(secScore/sec.max)*100:0;
              const sc = pct>=80?"#10B981":pct>=60?"#E8A838":"#EF4444";
              return (
                <div key={sec.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:7,background:"rgba(26,107,90,0.04)"}}>
                  <span style={{fontSize:10,fontWeight:600,color:"#A8B3AE",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sec.id}. {sec.title}</span>
                  <div style={{width:50,height:4,borderRadius:2,background:"#1E2926",flexShrink:0}}><div style={{width:`${filled?pct:0}%`,height:"100%",borderRadius:2,background:filled?sc:"#2F3836",transition:"width 0.3s"}}/></div>
                  <span style={{fontSize:11,fontWeight:800,color:filled?sc:"#5E6764",minWidth:40,textAlign:"right"}}>{filled?secScore:"\u2014"}/{sec.max}</span>
                </div>
              );
            })}
          </div>
          <div style={{borderTop:"1px solid rgba(26,107,90,0.09)",marginTop:10,paddingTop:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:13,fontWeight:900,color:"#EFF4F1"}}>Total</span>
            <span style={{fontSize:18,fontWeight:900,color:allFilled?gradeC:"#5E6764"}}>{allFilled?finalScore:"\u2014"}/100</span>
          </div>
          {hygieneFail && <div style={{marginTop:8,padding:"8px 12px",borderRadius:8,background:"#EF444410",border:"1px solid #EF444420",fontSize:11,fontWeight:700,color:"#EF4444",display:"flex",alignItems:"center",gap:6}}>
            <Ic name="alert" size={12} color="#EF4444"/> AUTO-FAIL: Bare-hand food handling — Section 2 zeroed
          </div>}
          {pestFail && <div style={{marginTop:8,padding:"8px 12px",borderRadius:8,background:"#EF444410",border:"1px solid #EF444420",fontSize:11,fontWeight:700,color:"#EF4444",display:"flex",alignItems:"center",gap:6}}>
            <Ic name="alert" size={12} color="#EF4444"/> AUTO-FAIL: Pest/infestation — score capped at 59
          </div>}
          {!submitted ? (
            <button onClick={handleSubmit} disabled={!allFilled} style={{...btn(!allFilled?"#2F3836":"#2D8E76"),opacity:!allFilled?0.5:1,cursor:!allFilled?"not-allowed":"pointer",width:"100%",marginTop:10}}>
              {!allFilled?`Complete all items (${markedCount}/${totalItems})`:`Submit Inspection \u2014 ${finalScore}/100`}
            </button>
          ) : (
            <div style={{marginTop:10,padding:"10px 14px",borderRadius:9,background:"#10B98108",border:"1px solid #10B98115",fontSize:12,fontWeight:600,color:"#10B981",textAlign:"center"}}>
              ✓ Submitted by {auditorName} — {finalScore}/100 ({grade})
            </div>
          )}
        </div>
      </div>

      {/* Scorecard sections — tick-based */}
      {SCORECARD.map(sec=>{
        const secScore = getSectionScore(sec);
        const filled = sec.items.every((_,i)=>checks[sec.id][i]!==null);
        return (
          <Section key={sec.id} icon={sec.icon} title={`${sec.id}. ${sec.title}`} accent="#2D8E76" count={`${filled?secScore:"\u2014"}/${sec.max}`} open={true}>
            {sec.note && <div style={{padding:"8px 12px",borderRadius:8,background:"rgba(26,107,90,0.04)",border:"1px solid rgba(26,107,90,0.08)",marginBottom:12,fontSize:11,fontWeight:600,color:"#E8A838",display:"flex",alignItems:"center",gap:6}}>
              <Ic name="alert" size={12} color="#E8A838"/> {sec.note}
            </div>}
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {sec.items.map((item,idx)=>{
                const val = checks[sec.id][idx];
                const pass = val===true;
                const fail = val===false;
                return (
                  <div key={idx} onClick={()=>toggle(sec.id,idx)} style={{
                    display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,cursor:submitted?"default":"pointer",
                    background:pass?"#10B98108":fail?"#EF444408":"rgba(26,107,90,0.03)",
                    border:`1px solid ${pass?"#10B98118":fail?"#EF444418":"rgba(26,107,90,0.06)"}`,
                    opacity:submitted?0.85:1, transition:"all 0.2s"
                  }}>
                    <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${pass?"#10B981":fail?"#EF4444":"#2F3836"}`,
                      background:pass?"#10B98125":fail?"#EF444415":"transparent",
                      display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
                      {pass && <Ic name="check" size={12} color="#10B981"/>}
                      {fail && <span style={{fontSize:12,fontWeight:900,color:"#EF4444",lineHeight:1}}>✗</span>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:600,color:pass?"#10B981":fail?"#EF4444":"#CDD6D2"}}>{item.text}</div>
                      {item.autoFail && <div style={{fontSize:9,fontWeight:600,color:"#EF4444",marginTop:1}}>⚠ Unticked = section zeroed</div>}
                      {item.autoFailSection && <div style={{fontSize:9,fontWeight:600,color:"#EF4444",marginTop:1}}>⚠ Unticked = FAIL regardless of total</div>}
                    </div>
                    <div style={{textAlign:"right",minWidth:44}}>
                      <div style={{fontSize:14,fontWeight:900,color:pass?"#10B981":fail?"#EF4444":"#2F3836"}}>{pass?item.max:fail?0:"\u2014"}</div>
                      <div style={{fontSize:9,fontWeight:600,color:"#7D8A86"}}>/{item.max}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        );
      })}
    </div>
  );
};

// ═══ OFFICE HOME ═══

const OfficeHome = ({onSelect, extScores}) => {
  const [mt,setMt]=useState(false);
  useEffect(()=>{setTimeout(()=>setMt(true),50);},[]);
  return (
    <div style={{opacity:mt?1:0,transform:mt?"translateY(0)":"translateY(16px)",transition:"all 0.5s cubic-bezier(0.16,1,0.3,1)"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:10,fontWeight:900,letterSpacing:8,color:"#3DA88C",textTransform:"uppercase",marginBottom:4}}>OFFICE PORTAL</div>
        <h1 style={{fontSize:28,fontWeight:900,margin:"0 0 4px",background:"linear-gradient(135deg,#F5F9F7,#E8A838)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:-0.5}}>Yoko Sizzlers</h1>
        <p style={{color:"#5E6764",fontSize:12,fontWeight:500}}>Attendance • Reviews • Compliance • Maintenance</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:18}}>
        {Object.entries(OUTLETS).map(([key,meta],idx)=>(
          <div key={key} onClick={()=>onSelect(key)} style={{
            ...glass,padding:24,cursor:"pointer",borderTop:`3px solid ${meta.accent}`,boxShadow:"inset 0 -1px 0 rgba(232,168,56,0.06),0 6px 32px rgba(0,0,0,0.35)",position:"relative",overflow:"hidden",
            transition:"all 0.3s",opacity:mt?1:0,transform:mt?"translateY(0)":"translateY(24px)",transitionDelay:`${idx*80}ms`
          }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 14px 44px ${meta.accent}22`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=glass.boxShadow;}}>
            <div style={{position:"absolute",top:-35,right:-35,width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle,${meta.accent}11 0%,transparent 70%)`}}/>
            <h3 style={{fontSize:20,fontWeight:900,margin:"0 0 6px",color:"#EFF4F1"}}>{meta.name}</h3>
            <div style={{fontSize:11,color:"#7D8A86",fontWeight:500}}>Click to view outlet details</div>
            <div style={{marginTop:14,textAlign:"center"}}><span style={{fontSize:11,fontWeight:700,color:meta.accent,letterSpacing:1}}>OPEN →</span></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══ ADMIN ═══

const Admin = ({onSelect, maint, extScores, onPDFUpload, pdfLoading, pdfStatus, revData, notifications, setNotifications, staffData, attHistory, transfers, pettyCashHistory, compData, outletHealth, healthHistory}) => {
  const [mt,setMt]=useState(false);
  const [maintFilter,setMaintFilter]=useState("all");
  const [hFilter,setHFilter]=useState("all");
  useEffect(()=>{setTimeout(()=>setMt(true),50);},[]);

  // Compute live info per outlet from lifted state
  const info = {};
  Object.keys(OUTLETS).forEach(key=>{
    const oStaff = (staffData[key]||[]).filter(s=>s.status!=="transferred");
    const pres = oStaff.filter(s=>s.status==="present"||s.status==="late").length;
    const rev = revData[key]?.current||{del:{zomato:0,swiggy:0},din:{zomato:0,google:0}};
    const avg = ((rev.del.zomato||0)+(rev.del.swiggy||0)+(rev.din.zomato||0)+(rev.din.google||0))/4;
    const comp = compData[key]||{amcs:[]};
    const latestPc = (pettyCashHistory[key]||[]).length>0?(pettyCashHistory[key]||[])[(pettyCashHistory[key]||[]).length-1].amount:0;
    // Use reported health from OutletDash if available, otherwise estimate
    const sc = outletHealth[key] || 0;
    // Alerts count
    let alerts = 0;
    if(oStaff.filter(s=>s.status==="absent").length>0) alerts++;
    if((comp.amcs||[]).filter(a=>new Date(a.due)<new Date()).length>0) alerts++;
    if(latestPc>10000) alerts++;
    if(maint[key]?.filter(m=>m.status==="pending").length>0) alerts++;
    const ext = (extScores[key]||[])[0]||null;
    if(ext && ext.score<75) alerts++;
    info[key] = {sc,staff:`${pres}/${oStaff.length}`,alerts,rating:avg?avg.toFixed(1):"—"};
  });

  // Gather all maintenance issues across outlets
  const allMaint = Object.entries(maint).flatMap(([outlet,issues])=>issues.map(m=>({...m,outlet})));
  const filteredMaint = maintFilter==="all" ? allMaint : allMaint.filter(m=>m.outlet===maintFilter);
  const stColor = {pending:"#EF4444",wip:"#E8A838",finished:"#10B981"};
  const stLabel = {pending:"Pending",wip:"Work in Progress",finished:"Finished"};
  const daysBetween = (a,b) => {if(!a||!b) return "-"; const d=Math.ceil((new Date(b)-new Date(a))/(1000*60*60*24)); return d<1?"<1 day":`${d} day${d>1?"s":""}`;};
  const totalPending = allMaint.filter(m=>m.status==="pending").length;
  const totalWip = allMaint.filter(m=>m.status==="wip").length;

  return (
    <div style={{opacity:mt?1:0,transform:mt?"translateY(0)":"translateY(16px)",transition:"all 0.5s cubic-bezier(0.16,1,0.3,1)"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:10,fontWeight:900,letterSpacing:8,color:"#E8A838",textTransform:"uppercase",marginBottom:4}}>YOKO SIZZLERS</div>
        <h1 style={{fontSize:28,fontWeight:900,margin:"0 0 4px",background:"linear-gradient(135deg,#F5F9F7,#E8A838)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:-0.5}}>Operations Command Center</h1>
        <p style={{color:"#5E6764",fontSize:12,fontWeight:500}}>Click an outlet to drill into details</p>
      </div>
      {/* Restaverse PDF Upload */}
      <div style={{...glass,padding:18,marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Ic name="upload" size={18} color="#E8A838"/>
          <div>
            <div style={{fontSize:13,fontWeight:800,color:"#EFF4F1"}}>Restaverse Weekly Report</div>
            <div style={{fontSize:10,color:"#7D8A86",fontWeight:500}}>Upload PDF — AI extracts reviews for all outlets automatically</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {pdfStatus && <span style={{fontSize:11,fontWeight:600,color:pdfStatus.startsWith("✓")?"#10B981":pdfStatus.startsWith("Error")?"#EF4444":"#2D8E76"}}>{pdfStatus}</span>}
          <label style={{position:"relative",cursor:pdfLoading?"wait":"pointer",opacity:pdfLoading?0.7:1,padding:"12px 28px",borderRadius:14,border:"1px solid rgba(232,168,56,0.25)",background:"linear-gradient(135deg,rgba(232,168,56,0.15) 0%,rgba(232,168,56,0.05) 50%,rgba(26,107,90,0.1) 100%)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",boxShadow:"0 4px 24px rgba(232,168,56,0.15), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.05)",overflow:"hidden",transition:"all 0.3s"}}>
            <span style={{display:"flex",alignItems:"center",gap:7,fontSize:13,fontWeight:800,color:"#E8A838",letterSpacing:0.5,position:"relative",zIndex:1,textShadow:"0 1px 8px rgba(232,168,56,0.3)"}}><Ic name="upload" size={15} color="#E8A838"/> {pdfLoading?"Processing...":"UPLOAD PDF"}</span>
            <input type="file" accept=".pdf" onChange={e=>{if(e.target.files?.[0]) onPDFUpload(e.target.files[0]);e.target.value="";}} disabled={pdfLoading}
              style={{position:"absolute",inset:0,opacity:0,cursor:"pointer"}}/>
          </label>
        </div>
      </div>
      {/* Review Performance Highlights */}
      {(()=>{
        const highlights = [];
        Object.entries(OUTLETS).forEach(([key,meta])=>{
          const cur = revData[key]?.current;
          const prev = revData[key]?.lastWeek;
          if(!cur || !prev || cur.weekly?.total===0) return;
          const cAvg = (cur.del.zomato+cur.del.swiggy+cur.din.zomato+cur.din.google)/4;
          const pAvg = (prev.del.zomato+prev.del.swiggy+prev.din.zomato+prev.din.google)/4;
          const diff = cAvg-pAvg;
          if(Math.abs(diff)>=0.05) highlights.push({outlet:meta.name,accent:meta.accent,diff,cAvg,pAvg,reviews:cur.weekly.total,prevReviews:prev.weekly.total});
        });
        if(highlights.length===0) return null;
        return (
          <div style={{display:"grid",gridTemplateColumns:`repeat(auto-fit,minmax(240px,1fr))`,gap:12,marginBottom:20}}>
            {highlights.map(h=>{
              const up=h.diff>0; const c=up?"#10B981":"#EF4444";
              return (
                <div key={h.outlet} style={{...glass,padding:16,borderLeft:`3px solid ${h.accent}`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontSize:13,fontWeight:800,color:"#EFF4F1"}}>{h.outlet}</span>
                    <span style={{fontSize:12,fontWeight:800,color:c}}>{up?"↑":"↓"} {up?"+":""}{h.diff.toFixed(2)}</span>
                  </div>
                  <div style={{fontSize:11,color:"#A8B3AE",fontWeight:600}}>
                    Avg rating: <span style={{color:c,fontWeight:800}}>{h.cAvg.toFixed(2)}</span> (was {h.pAvg.toFixed(2)}) • {h.reviews} reviews (was {h.prevReviews})
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
      {/* Notifications */}
      {notifications.length>0 && <div style={{...glass,padding:22,marginBottom:20,borderLeft:"4px solid #E8A838"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,rgba(232,168,56,0.15),rgba(232,168,56,0.05))",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic name="alert" size={18} color="#E8A838"/></div>
            <div>
              <div style={{fontSize:16,fontWeight:900,color:"#EFF4F1",letterSpacing:0.5}}>Notifications</div>
              <div style={{fontSize:11,color:"#7D8A86",fontWeight:600}}>{notifications.filter(n=>!n.read).length} unread of {notifications.length} total</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setNotifications(prev=>prev.map(n=>({...n,read:true})))} style={{...btn("rgba(26,107,90,0.09)"),padding:"6px 14px",fontSize:10}}>Mark all read</button>
            <button onClick={()=>setNotifications(prev=>prev.filter(n=>!n.read))} style={{...btn("rgba(239,68,68,0.12)"),padding:"6px 14px",fontSize:10,color:"#EF4444"}}>Clear read</button>
          </div>
        </div>
        <div style={{maxHeight:320,overflow:"auto",display:"flex",flexDirection:"column",gap:6}}>
          {notifications.slice(0,30).map((n,idx)=>(
            <div key={n.id} style={{padding:"10px 14px",borderRadius:10,background:n.read?"rgba(26,107,90,0.03)":"rgba(232,168,56,0.04)",border:`1px solid ${n.read?"rgba(26,107,90,0.06)":"rgba(232,168,56,0.12)"}`,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:24,height:24,borderRadius:6,background:n.read?"rgba(93,103,100,0.15)":"rgba(232,168,56,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:n.read?"#7D8A86":"#E8A838",flexShrink:0}}>{idx+1}</div>
              <div style={{width:7,height:7,borderRadius:"50%",background:n.type==="transfer"?"#2D8E76":n.type==="office_edit"?"#E8A838":"#3DA88C",flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:n.read?500:700,color:n.read?"#A8B3AE":"#EFF4F1",flex:1,lineHeight:1.4}}>{n.msg}</span>
              <span style={{fontSize:10,color:"#5E6764",fontWeight:600,flexShrink:0}}>{new Date(n.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>
              <div onClick={()=>setNotifications(prev=>prev.filter(x=>x.id!==n.id))} style={{cursor:"pointer",padding:3,flexShrink:0}} title="Dismiss"><Ic name="x" size={13} color="#7D8A86"/></div>
            </div>
          ))}
        </div>
      </div>}

      {/* Pending Transfers */}
      {transfers.filter(t=>t.status==="pending").length>0 && <div style={{...glass,padding:18,marginBottom:20,borderLeft:"3px solid #E8A838"}}>
        <div style={{fontSize:13,fontWeight:800,color:"#EFF4F1",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
          <Ic name="staff" size={16} color="#E8A838"/> Pending Transfers
        </div>
        {transfers.filter(t=>t.status==="pending").map(t=>(
          <div key={t.id} style={{padding:"8px 12px",borderRadius:8,marginBottom:4,background:"#E8A83808",border:"1px solid #E8A83815",fontSize:12,fontWeight:600,color:"#CDD6D2"}}>
            <span style={{fontWeight:800,color:"#E8A838"}}>{t.staffName}</span> — {OUTLETS[t.from].name} → {OUTLETS[t.to].name} <span style={{fontSize:10,color:"#7D8A86"}}>(awaiting acceptance)</span>
          </div>
        ))}
      </div>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:18}}>
        {Object.entries(OUTLETS).map(([key,meta],idx)=>{
          const d=info[key]; const scC=d.sc>=80?"#10B981":d.sc>=60?"#E8A838":"#EF4444";
          return (
            <div key={key} onClick={()=>onSelect(key)} style={{
              ...glass,padding:22,cursor:"pointer",borderTop:`3px solid ${meta.accent}`,boxShadow:"inset 0 -1px 0 rgba(232,168,56,0.06),0 6px 32px rgba(0,0,0,0.35)",position:"relative",overflow:"hidden",
              transition:"all 0.3s",opacity:mt?1:0,transform:mt?"translateY(0)":"translateY(24px)",transitionDelay:`${idx*80}ms`
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 14px 44px ${meta.accent}22`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=glass.boxShadow;}}>
              <div style={{position:"absolute",top:-35,right:-35,width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle,${meta.accent}11 0%,transparent 70%)`}}/>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <div>
                  <h3 style={{fontSize:18,fontWeight:900,margin:0,color:"#EFF4F1"}}>{meta.name}</h3>
                  <div style={{fontSize:10,color:"#7D8A86",fontWeight:600,marginTop:2}}>{d.staff} staff • {d.alerts} alerts</div>
                </div>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:28,fontWeight:900,color:scC,textShadow:`0 0 20px ${scC}44`,letterSpacing:-2}}>{d.sc}</div>
                    <div style={{fontSize:7,fontWeight:700,color:"#7D8A86",letterSpacing:1.5,textTransform:"uppercase"}}>Internal</div>
                  </div>
                  {(()=>{const ext=(extScores[key]||[])[0]||null;const eC=ext?(ext.score>=80?"#10B981":ext.score>=60?"#E8A838":"#EF4444"):"#2F3836";return (
                    <div style={{textAlign:"center",opacity:ext?1:0.35}}>
                      <div style={{fontSize:28,fontWeight:900,color:ext?eC:"#2F3836",textShadow:ext?`0 0 20px ${eC}44`:"none",letterSpacing:-2}}>{ext?ext.score:"—"}</div>
                      <div style={{fontSize:7,fontWeight:700,color:"#2D8E76",letterSpacing:1.5,textTransform:"uppercase"}}>External</div>
                    </div>
                  );})()}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
                {[["Rating",d.rating,"star"],["Staff",d.staff,"staff"],["Alerts",d.alerts,"alert"]].map(([l,v,ic])=>(
                  <div key={l} style={{textAlign:"center",padding:"8px 0",borderRadius:8,background:"rgba(26,107,90,0.04)"}}>
                    <Ic name={ic} size={12} color={meta.accent}/>
                    <div style={{fontSize:14,fontWeight:800,color:"#EFF4F1",marginTop:1}}>{v}</div>
                    <div style={{fontSize:8,color:"#7D8A86",fontWeight:600,letterSpacing:0.5,textTransform:"uppercase"}}>{l}</div>
                  </div>
                ))}
              </div>
              <Spark data={[d.sc,d.sc,d.sc,d.sc,d.sc,d.sc,d.sc]} color={meta.accent} w={250} h={35}/>
              {d.alerts>2 && <div style={{marginTop:10,...badge("#EF444418","#FCA5A5"),fontSize:10}}><Ic name="alert" size={10} color="#EF4444"/>{d.alerts} alerts — needs attention</div>}
              <div style={{marginTop:12,textAlign:"center"}}><span style={{fontSize:11,fontWeight:700,color:meta.accent,letterSpacing:1}}>VIEW DETAILS →</span></div>
            </div>
          );
        })}
      </div>

      {/* ─── ADMIN MAINTENANCE LOG ─── */}
      <div style={{marginTop:24}}>
      {/* Daily Health History */}
      <Section icon="trend" title="Daily Internal Health History (2 Months)" accent="#2D8E76">
        {(()=>{
          const allEntries = Object.entries(healthHistory).flatMap(([key,entries])=>
            entries.map(e=>({...e,outlet:key,outletName:OUTLETS[key].name,accent:OUTLETS[key].accent}))
          );
          const filtered = hFilter==="all"?allEntries:allEntries.filter(e=>e.outlet===hFilter);
          const sorted = [...filtered].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
          return <>
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
              {[["all","All Outlets"],["santacruz","Santacruz"],["bandra","Bandra"],["oshiwara","Oshiwara"]].map(([k,l])=>(
                <button key={k} onClick={()=>setHFilter(k)} style={{
                  padding:"7px 16px",borderRadius:10,fontSize:10,fontWeight:700,cursor:"pointer",
                  border:hFilter===k?"1px solid #2D8E7630":"1px solid rgba(26,107,90,0.09)",
                  background:hFilter===k?"linear-gradient(135deg,#2D8E7618,#2D8E7606)":"rgba(26,107,90,0.03)",
                  backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
                  boxShadow:hFilter===k?"0 2px 12px #2D8E7615, inset 0 1px 0 rgba(255,255,255,0.06)":"none",
                  color:hFilter===k?"#2D8E76":"#A8B3AE",transition:"all 0.2s"
                }}>{l}</button>
              ))}
            </div>
            {sorted.length===0 ? (
              <div style={{padding:20,textAlign:"center",color:"#5E6764",fontSize:12}}>No health data recorded yet. Visit an outlet to start recording.</div>
            ) : (
              <div style={{overflowX:"auto"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 100px 90px 130px",gap:6,padding:"8px 12px",borderRadius:8,background:"rgba(26,107,90,0.05)",marginBottom:4,minWidth:420}}>
                  {["Date","Outlet","Score","Recorded At"].map(h=>(
                    <div key={h} style={{fontSize:10,fontWeight:800,color:"#7D8A86",letterSpacing:1,textTransform:"uppercase"}}>{h}</div>
                  ))}
                </div>
                {sorted.slice(0,60).map((e,i)=>{
                  const sc = e.score; const scC = sc>=80?"#10B981":sc>=60?"#E8A838":"#EF4444";
                  return (
                    <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 100px 90px 130px",gap:6,padding:"8px 12px",borderRadius:8,marginBottom:3,background:`${scC}06`,border:`1px solid ${scC}10`,minWidth:420}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#E5EBE8"}}>{e.date}</span>
                      <span style={{fontSize:11,fontWeight:700,color:e.accent}}>{e.outletName}</span>
                      <span style={{fontSize:14,fontWeight:900,color:scC}}>{sc}</span>
                      <span style={{fontSize:11,fontWeight:500,color:"#A8B3AE"}}>{new Date(e.timestamp).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>;
        })()}
      </Section>

      <Section icon="wrench" title="Maintenance Log — All Outlets" accent="#E8A838" count={totalPending+totalWip||undefined} alertN={totalPending}>
        {/* Outlet filter */}
        <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
          {[["all","All Outlets"],["santacruz","Santacruz"],["bandra","Bandra"],["oshiwara","Oshiwara"]].map(([k,l])=>(
            <button key={k} onClick={()=>setMaintFilter(k)} style={{
              padding:"7px 16px",borderRadius:10,fontSize:11,fontWeight:700,cursor:"pointer",
              border:maintFilter===k?"1px solid #E8A83830":"1px solid rgba(26,107,90,0.09)",
              background:maintFilter===k?"linear-gradient(135deg,#E8A83818,#E8A83806)":"rgba(26,107,90,0.03)",
              backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
              boxShadow:maintFilter===k?"0 2px 12px #E8A83815, inset 0 1px 0 rgba(255,255,255,0.06)":"none",
              color:maintFilter===k?"#E8A838":"#A8B3AE",transition:"all 0.2s"
            }}>{l}</button>
          ))}
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            {[["Pending",totalPending,"#EF4444"],["WIP",totalWip,"#E8A838"]].map(([l,v,c])=>(
              <span key={l} style={badge(`${c}18`,c)}>{v} {l}</span>
            ))}
          </div>
        </div>

        {filteredMaint.length===0 ? (
          <div style={{padding:24,textAlign:"center",color:"#5E6764",fontSize:12,fontWeight:500}}>No maintenance issues logged across outlets</div>
        ) : (
          <div style={{overflowX:"auto"}}>
            <div style={{display:"grid",gridTemplateColumns:"100px 2fr 120px 110px 120px 80px",gap:8,padding:"8px 12px",borderRadius:8,background:"rgba(26,107,90,0.05)",marginBottom:6,minWidth:700}}>
              {["Outlet","Issue","Raised On","Status","Last Updated","Resolution"].map(h=>(
                <div key={h} style={{fontSize:10,fontWeight:800,color:"#7D8A86",letterSpacing:1,textTransform:"uppercase"}}>{h}</div>
              ))}
            </div>
            {filteredMaint.sort((a,b)=>{const ord={pending:0,wip:1,finished:2};return ord[a.status]-ord[b.status]||new Date(b.raisedOn)-new Date(a.raisedOn);}).map(m=>{
              const raised = new Date(m.raisedOn);
              const changed = new Date(m.statusChangedOn);
              const sc = stColor[m.status];
              const outMeta = OUTLETS[m.outlet];
              return (
                <div key={m.id} style={{display:"grid",gridTemplateColumns:"100px 2fr 120px 110px 120px 80px",gap:8,padding:"10px 12px",borderRadius:9,marginBottom:4,background:`${sc}06`,border:`1px solid ${sc}12`,alignItems:"center",minWidth:700}}>
                  <span style={badge(`${outMeta.accent}18`,outMeta.accent)}>{outMeta.name}</span>
                  <div style={{fontSize:12,fontWeight:600,color:"#E5EBE8"}}>{m.issue}</div>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:"#CDD6D2"}}>{raised.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
                    <div style={{fontSize:9,color:"#7D8A86"}}>{raised.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}</div>
                  </div>
                  <span style={{...badge(`${sc}18`,sc),fontSize:10}}>{stLabel[m.status]}</span>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:"#CDD6D2"}}>{changed.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
                    <div style={{fontSize:9,color:"#7D8A86"}}>{changed.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}</div>
                  </div>
                  <div style={{fontSize:12,fontWeight:700,color:m.status==="finished"?"#10B981":"#5E6764"}}>
                    {m.status==="finished" ? daysBetween(m.raisedOn,m.resolvedOn) : "-"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
      </div>

      <AuditHistory extScores={extScores} accent="#E8A838"/>

    </div>
  );
};

// ═══ APP ═══

export default function App() {
  const [user,setUser]=useState(null);
  const [sel,setSel]=useState(null);
  const [time,setTime]=useState(new Date());
  const [maint,setMaint]=useState({santacruz:[],bandra:[],oshiwara:[]});
  const [extScores,setExtScores]=useState({santacruz:[],bandra:[],oshiwara:[]});
  const defaultRev = {del:{zomato:0,swiggy:0},din:{zomato:0,google:0},weekly:{total:0,dist:{"1":0,"2":0,"3":0,"4":0,"5":0},sent:{Quality:[0,0],Taste:[0,0],Ambience:[0,0],Music:[0,0],Service:[0,0],Delay:[0,0],Misc:[0,0]}}};
  const [revData,setRevData]=useState({
    santacruz:{current:{...defaultRev},lastWeek:null},
    bandra:{current:{...defaultRev},lastWeek:null},
    oshiwara:{current:{...defaultRev},lastWeek:null},
  });
  const [pdfLoading,setPdfLoading]=useState(false);
  const [pdfStatus,setPdfStatus]=useState(null);

  // Lifted staff state per outlet
  const DEPTS = ["Manager","Counter","Waiter","Main Chef","Asst Chef","Snacks","Drinks","Cleaning","Watchman"];
  const [staffData,setStaffData]=useState({
    santacruz:staffNames.santacruz.map((n,i)=>({id:`sc-${i}`,name:n,status:"not_marked",dept:["Manager","Manager","Waiter","Waiter","Waiter","Waiter","Waiter","Waiter","Waiter","Waiter","Waiter","Main Chef","Asst Chef","Asst Chef","Asst Chef","Snacks","Snacks","Drinks","Drinks","Cleaning","Cleaning","Cleaning","Cleaning","Cleaning","Watchman"][i]||"Waiter"})),
    bandra:staffNames.bandra.map((n,i)=>({id:`bd-${i}`,name:n,status:"not_marked",dept:["Manager","Manager","Waiter","Waiter","Waiter","Waiter","Waiter","Main Chef","Asst Chef","Asst Chef","Snacks","Snacks","Drinks","Drinks","Cleaning","Cleaning","Cleaning","Cleaning","Watchman"][i]||"Waiter"})),
    oshiwara:staffNames.oshiwara.map((n,i)=>({id:`ow-${i}`,name:n,status:"not_marked",dept:["Manager","Manager","Manager","Manager","Waiter","Waiter","Waiter","Waiter","Waiter","Waiter","Main Chef","Asst Chef","Asst Chef","Snacks","Snacks","Drinks","Drinks","Cleaning","Cleaning","Cleaning","Cleaning","Watchman"][i]||"Waiter"})),
  });

  // Salary structure per staff: {outletKey: {staffId: {basic,ot,pf,advance,extra,reviewComm,reviewDed}}}
  const [salaryData,setSalaryData]=useState(()=>{
    const scBasic={
      "sc-0":20000,"sc-1":20000,"sc-2":9100,"sc-3":8500,"sc-4":8500,"sc-5":7000,"sc-6":7000,"sc-7":6000,"sc-8":7000,"sc-9":6000,"sc-10":7000,
      "sc-11":18500,"sc-12":19500,"sc-13":21000,"sc-14":14000,"sc-15":13000,"sc-16":10000,"sc-17":12000,"sc-18":13000,"sc-19":20000,"sc-20":14000,"sc-21":15000,"sc-22":10000,"sc-23":14000,"sc-24":16000
    };
    const sd={};
    Object.entries(staffData).forEach(([key,staffList])=>{
      sd[key]={};
      staffList.forEach(s=>{
        const basic = key==="santacruz"&&scBasic[s.id]?scBasic[s.id]:0;
        sd[key][s.id]={basic,ot:0,pf:0,advance:0,extra:0,reviewComm:0,reviewDed:0};
      });
    });
    return sd;
  });

  // Salary workflow: {outletKey: {status:"draft"|"submitted"|"approved", month, submittedBy, submittedAt, approvedAt, snapshot[]}}
  const [salaryStatus,setSalaryStatus]=useState({santacruz:{status:"draft"},bandra:{status:"draft"},oshiwara:{status:"draft"}});
  // Salary history: {outletKey: [{month,snapshot,total,submittedBy,approvedAt}]}
  const [salaryHistory,setSalaryHistory]=useState({santacruz:[],bandra:[],oshiwara:[]});

  // 1st of month notification for office
  const [salaryNotifSent,setSalaryNotifSent]=useState(false);
  useEffect(()=>{
    const now=new Date();
    if(now.getDate()===1 && !salaryNotifSent){
      const mo=now.toLocaleDateString("en-IN",{month:"long",year:"numeric"});
      addNotif(`📋 Prepare salary for ${mo} — all outlets`,"office_edit");
      setSalaryNotifSent(true);
    }
  },[salaryNotifSent]);

  // Lifted compliance state per outlet
  const [compData,setCompData]=useState({
    santacruz:{fssai:"2026-08-15",fire:"2026-12-01",pestLast:"2026-01-28",pestNext:"2026-02-28",deepClean:"2026-02-08",amcs:[{eq:"AC Units",due:"2026-03-15",st:"upcoming"},{eq:"Refrigeration",due:"2026-04-01",st:"upcoming"}]},
    bandra:{fssai:"2026-07-20",fire:"2026-11-15",pestLast:"2026-01-20",pestNext:"2026-02-20",deepClean:"2026-02-05",amcs:[{eq:"AC Units",due:"2026-04-10",st:"upcoming"}]},
    oshiwara:{fssai:"2026-09-01",fire:"2026-10-30",pestLast:"2026-02-01",pestNext:"2026-03-01",deepClean:"2026-02-10",amcs:[{eq:"AC Units",due:"2026-03-20",st:"upcoming"}]},
  });

  // Notifications for admin
  const [notifications,setNotifications]=useState([]);
  const addNotif = (msg,type="info") => setNotifications(prev=>[{id:Date.now(),msg,type,date:new Date().toISOString(),read:false},...prev]);

  // Attendance history: {outletKey: [{date,staffId,staffName,status,editedBy?}]}
  const [attHistory,setAttHistory]=useState({santacruz:[],bandra:[],oshiwara:[]});
  const recordAttendance = (outletKey,staffList,editedBy) => {
    const today = new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
    const records = staffList.filter(s=>s.status!=="not_marked").map(s=>({date:today,staffId:s.id,staffName:s.name,status:s.status,editedBy:editedBy||null,outlet:outletKey}));
    setAttHistory(prev=>({...prev,[outletKey]:[...records,...prev[outletKey]]}));
  };

  // Transfer requests: [{id,staffId,staffName,from,to,status:"pending"|"accepted"|"rejected",date}]
  const [transfers,setTransfers]=useState([]);
  // Live health scores reported by each OutletDash
  // Initialize by computing from available state (checklists start incomplete = -32)
  const [outletHealth,setOutletHealth]=useState(()=>{
    const h = {};
    Object.keys(OUTLETS).forEach(key=>{ h[key] = 0; }); // starts at 0, computed dynamically by OutletDash
    return h;
  });

  // Daily internal health history: {outletKey: [{date, score, timestamp}]}
  const [healthHistory,setHealthHistory]=useState({santacruz:[],bandra:[],oshiwara:[]});
  const recordHealthSnapshot = (outletKey,score) => {
    const now = new Date();
    const dateKey = now.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
    const cutoff = new Date(now.getFullYear(),now.getMonth()-2,1);
    setHealthHistory(prev=>{
      const existing = prev[outletKey]||[];
      // Update today's entry or add new
      const todayIdx = existing.findIndex(e=>e.date===dateKey);
      let updated;
      if(todayIdx>=0){
        updated = [...existing];
        updated[todayIdx] = {date:dateKey,score,timestamp:now.toISOString()};
      } else {
        updated = [...existing,{date:dateKey,score,timestamp:now.toISOString()}];
      }
      return {...prev,[outletKey]:updated.filter(e=>new Date(e.timestamp)>=cutoff)};
    });
  };
  // Petty cash history: {outletKey: [{amount, date, submittedAt}]}
  const [pettyCashHistory,setPettyCashHistory]=useState({santacruz:[],bandra:[],oshiwara:[]});
  const submitPettyCash = (outletKey,amount) => {
    const now = new Date();
    const entry = {amount,date:now.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}),submittedAt:now.toISOString(),outlet:outletKey};
    setPettyCashHistory(prev=>{
      // Keep only last 2 months
      const cutoff = new Date(now.getFullYear(),now.getMonth()-2,1);
      const filtered = [...prev[outletKey],entry].filter(e=>new Date(e.submittedAt)>=cutoff);
      return {...prev,[outletKey]:filtered};
    });
  };
  const requestTransfer = (staffId,staffName,from,to) => {
    const t = {id:Date.now(),staffId,staffName,from,to,status:"pending",date:new Date().toISOString()};
    setTransfers(prev=>[t,...prev]);
    addNotif(`${staffName} transfer requested: ${OUTLETS[from].name} → ${OUTLETS[to].name}`,"transfer");
  };
  const acceptTransfer = (tId) => {
    setTransfers(prev=>prev.map(t=>{
      if(t.id!==tId) return t;
      // Move staff
      setStaffData(sd=>{
        const fromStaff = sd[t.from];
        const person = fromStaff.find(s=>s.id===t.staffId);
        if(!person) return sd;
        return {...sd,
          [t.from]:fromStaff.map(s=>s.id===t.staffId?{...s,status:"transferred",transferTo:OUTLETS[t.to].name}:s),
          [t.to]:[...sd[t.to],{...person,id:`tr-${Date.now()}`,status:"not_marked",transferFrom:OUTLETS[t.from].name}]
        };
      });
      addNotif(`${t.staffName} transferred from ${OUTLETS[t.from].name} to ${OUTLETS[t.to].name}`,"transfer");
      return {...t,status:"accepted"};
    }));
  };
  const rejectTransfer = (tId) => setTransfers(prev=>prev.map(t=>t.id===tId?{...t,status:"rejected"}:t));
  useEffect(()=>{const i=setInterval(()=>setTime(new Date()),60000);return()=>clearInterval(i);},[]);

  const handleRestaversePDF = async (file) => {
    setPdfLoading(true); setPdfStatus("Reading PDF...");
    try {
      const b64 = await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=()=>rej(new Error("Read failed"));r.readAsDataURL(file);});
      setPdfStatus("AI extracting review data...");
      const resp = await fetch("/api/parse-pdf",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ b64 })
      });
      const data = await resp.json();
      if(data.error) throw new Error(data.error);
      if(!data.content) throw new Error("No content in response: "+JSON.stringify(data).slice(0,200));
      const text = data.content?.map(i=>i.text||"").join("").replace(/```json|```/g,"").trim();
      if(!text) throw new Error("Empty text from AI");
      const parsed = JSON.parse(text);
      setPdfStatus("Updating outlets...");
      setRevData(prev=>{
        const next = {...prev};
        ["santacruz","bandra","oshiwara"].forEach(key=>{
          if(parsed[key]){
            next[key] = {current:parsed[key], lastWeek:prev[key].current.weekly?.total>0 ? prev[key].current : prev[key].lastWeek};
          }
        });
        return next;
      });
      setPdfStatus("✓ Reviews updated for all outlets");
      setTimeout(()=>setPdfStatus(null),4000);
    } catch(err){
      console.error("PDF parse error:",err);
      setPdfStatus("Error parsing PDF — try again");
      setTimeout(()=>setPdfStatus(null),4000);
    }
    setPdfLoading(false);
  };

  if(!user) return <Login onLogin={setUser} staffData={staffData}/>;
  const isAdmin = user.role==="admin";
  const isSupervisor = user.role==="supervisor";
  const isOffice = user.role==="office";
  const outlet = isAdmin ? sel : isSupervisor ? sel : isOffice ? sel : user.outlet;

  return (
    <div style={{minHeight:"100vh",background:"#0C0F0E",fontFamily:"'Montserrat',sans-serif",color:"#E5EBE8"}}>
      <div style={{position:"fixed",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(26,107,90,0.04) 0%,transparent 70%)",top:-180,right:-180,pointerEvents:"none"}}/>
      <div style={{position:"fixed",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(181,139,60,0.04) 0%,transparent 70%)",bottom:-120,left:-120,pointerEvents:"none"}}/>

      <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(12,15,14,0.88)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(232,168,56,0.1)",padding:"10px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:isSupervisor?"linear-gradient(135deg,#1A6B5A,#14503F)":isOffice?"linear-gradient(135deg,#3DA88C,#2D8E76)":"linear-gradient(135deg,#1A6B5A,#14503F)",boxShadow:"0 0 0 2px rgba(232,168,56,0.2),0 2px 10px rgba(26,107,90,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:isSupervisor||isOffice?"#fff":"#0C0F0E",boxShadow:isSupervisor?"0 2px 10px rgba(26,107,90,0.3)":isOffice?"0 2px 10px rgba(56,189,248,0.3)":"0 2px 10px rgba(245,158,11,0.3)"}}>{isSupervisor?"S":isOffice?"O":"Y"}</div>
          <div>
            <div style={{fontSize:13,fontWeight:800,color:"#EFF4F1"}}>{isSupervisor?"Supervision Portal":isOffice?"Office Portal":"Yoko Sizzlers"}</div>
            <div style={{fontSize:9,color:"#5E6764",fontWeight:600}}>{time.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"})} • {time.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#E5EBE8"}}>{user.name}</div>
            <div style={{fontSize:9,color:"#5E6764",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{user.role}</div>
          </div>
          <button onClick={()=>{setUser(null);setSel(null);}} style={{width:34,height:34,borderRadius:9,border:"1px solid rgba(232,168,56,0.15)",background:"rgba(239,68,68,0.08)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            <Ic name="logout" size={14} color="#EF4444"/>
          </button>
        </div>
      </div>

      <div style={{maxWidth:1400,margin:"0 auto",padding:"14px 24px 40px"}}>
        {isSupervisor ? (
          sel ? <SupervisorAudit outletKey={sel} onBack={()=>setSel(null)} extScores={extScores} setExtScores={setExtScores}/>
              : <SupervisorHome onSelect={setSel} extScores={extScores}/>
        ) : isAdmin && !outlet ? (
          <Admin onSelect={setSel} maint={maint} extScores={extScores} onPDFUpload={handleRestaversePDF} pdfLoading={pdfLoading} pdfStatus={pdfStatus} revData={revData} notifications={notifications} setNotifications={setNotifications} staffData={staffData} attHistory={attHistory} transfers={transfers} pettyCashHistory={pettyCashHistory} compData={compData} outletHealth={outletHealth} healthHistory={healthHistory}/>
        ) : isOffice && !outlet ? (
          <OfficeHome onSelect={setSel} extScores={extScores}/>
        ) : outlet ? (
          <OutletDash outletKey={outlet} onBack={()=>setSel(null)} isAdmin={isAdmin} isOffice={isOffice} maint={maint} setMaint={setMaint} extScores={extScores} revData={revData} staffData={staffData} setStaffData={setStaffData} compData={compData} setCompData={setCompData} notifications={notifications} addNotif={addNotif} attHistory={attHistory} recordAttendance={recordAttendance} transfers={transfers} requestTransfer={requestTransfer} acceptTransfer={acceptTransfer} rejectTransfer={rejectTransfer} submitPettyCash={submitPettyCash} pettyCashHistory={pettyCashHistory} setOutletHealth={setOutletHealth} recordHealthSnapshot={recordHealthSnapshot} userName={user.name} salaryData={salaryData} setSalaryData={setSalaryData} salaryStatus={salaryStatus} setSalaryStatus={setSalaryStatus} salaryHistory={salaryHistory} setSalaryHistory={setSalaryHistory}/>
        ) : null}
      </div>
    </div>
  );
}
