import { useState, useEffect, useCallback } from "react";

// ==================== SUPABASE ====================
const SB="https://yuvhvafqbldybssowjlg.supabase.co/rest/v1";
const SK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dmh2YWZxYmxkeWJzc293amxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDgzOTIsImV4cCI6MjA4NjgyNDM5Mn0.3SigmIjBW0vTBm4mOX7aFufb_bw0MzvWV4G_Ld4RkLA";
const SH={"apikey":SK,"Authorization":"Bearer "+SK,"Content-Type":"application/json","Prefer":"return=representation"};
const db={
  get:async(t,q="")=>{try{const r=await fetch(SB+"/"+t+"?"+q,{headers:SH});return r.ok?r.json():[]}catch{return[]}},
  post:async(t,d)=>{try{const r=await fetch(SB+"/"+t,{method:"POST",headers:SH,body:JSON.stringify(d)});return r.ok?r.json():null}catch{return null}},
  patch:async(t,q,d)=>{try{const r=await fetch(SB+"/"+t+"?"+q,{method:"PATCH",headers:SH,body:JSON.stringify(d)});return r.ok?r.json():null}catch{return null}},
  del:async(t,q)=>{try{const r=await fetch(SB+"/"+t+"?"+q,{method:"DELETE",headers:SH});return r.ok}catch{return false}},
};

const HOUSEHOLDS = [
  { id: "3F", name: "3rd Floor", pin: "3333", icon: "apartment", color: "#E8B4B8" },
  { id: "4F", name: "4th Floor", pin: "4444", icon: "home", color: "#A7C7E7" },
  { id: "5F", name: "5th Floor", pin: "5555", icon: "cottage", color: "#B5D8A8" },
  { id: "6F", name: "6th Floor", pin: "6666", icon: "villa", color: "#F2D98B" },
  { id: "OF", name: "Office", pin: "0000", icon: "business", color: "#C4B5D4" },
];
const KITCHEN = { id: "CK", name: "Central Kitchen", pin: "1234", icon: "restaurant" };

// Minimal fallback items (only used if Supabase is unreachable)
const DEFAULT_ITEMS = [
  {id:1,name:"Onion",price:0,category:"Vegetable",unit:"kg"},
  {id:2,name:"Potato",price:0,category:"Vegetable",unit:"kg"},
  {id:3,name:"Tomato",price:0,category:"Vegetable",unit:"kg"},
  {id:4,name:"Rice",price:0,category:"Grains",unit:"kg"},
  {id:5,name:"Eggs",price:0,category:"Dairy",unit:"pcs"},
  {id:6,name:"Bread",price:0,category:"Bakery",unit:"pkt"},
];
// Categories are derived dynamically from items
function getToday() { return new Date().toISOString().split("T")[0]; }
function getActualTotal(order) {
  return order.items.reduce((s, it) => s + it.price * (it.sentQty != null ? it.sentQty : it.qty), 0);
}

const glassCSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
body{margin:0;font-family:'Montserrat',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
input,select,button,textarea{font-family:inherit}
.micon{font-family:'Material Symbols Rounded';font-weight:normal;font-style:normal;font-size:20px;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;font-variation-settings:'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24}

/* Neumorphic surfaces */
.glass{background:#e8edf2;border:none;border-radius:18px;box-shadow:6px 6px 14px rgba(163,177,198,0.35),-6px -6px 14px rgba(255,255,255,0.8)}
.glass-strong{background:#e8edf2;border:none;border-radius:18px;box-shadow:8px 8px 16px rgba(163,177,198,0.4),-8px -8px 16px rgba(255,255,255,0.85)}
.glass-vibrant{background:#e8edf2;border:none;border-radius:18px;box-shadow:6px 6px 14px rgba(163,177,198,0.35),-6px -6px 14px rgba(255,255,255,0.8)}

/* Inset / pressed surface */
.neu-inset{background:#e8edf2;border:none;border-radius:14px;box-shadow:inset 3px 3px 8px rgba(163,177,198,0.35),inset -3px -3px 8px rgba(255,255,255,0.7)}

/* Soft aurora orbs — very subtle on light bg */
.bg-orb{position:fixed;border-radius:50%;pointer-events:none;z-index:0}
.bg-orb-1{width:280px;height:280px;background:radial-gradient(circle,rgba(180,220,255,0.25),transparent 70%);filter:blur(70px);top:-30px;right:-50px}
.bg-orb-2{width:240px;height:240px;background:radial-gradient(circle,rgba(210,180,255,0.2),transparent 70%);filter:blur(70px);bottom:120px;left:-40px}
.bg-orb-3{width:180px;height:180px;background:radial-gradient(circle,rgba(180,255,210,0.2),transparent 70%);filter:blur(60px);top:40%;right:-20px}
.bg-orb-4{width:220px;height:220px;background:radial-gradient(circle,rgba(255,200,220,0.18),transparent 70%);filter:blur(60px);bottom:-10px;left:30%}

/* Kitchen Orbs */
.bg-orb-k1{width:260px;height:260px;background:radial-gradient(circle,rgba(255,220,180,0.25),transparent 70%);filter:blur(70px);top:-30px;left:-50px}
.bg-orb-k2{width:220px;height:220px;background:radial-gradient(circle,rgba(255,190,190,0.2),transparent 70%);filter:blur(60px);bottom:150px;right:-40px}
.bg-orb-k3{width:180px;height:180px;background:radial-gradient(circle,rgba(180,230,210,0.22),transparent 70%);filter:blur(60px);top:35%;left:-30px}

/* Animations */
@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-20px) scale(0.9)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes orbDrift{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(8px,-10px) scale(1.03)}50%{transform:translate(-6px,6px) scale(0.97)}75%{transform:translate(5px,3px) scale(1.01)}}
@keyframes staggerIn{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes orderPlacedPulse{0%{transform:translateX(-50%) scale(1)}15%{transform:translateX(-50%) scale(1.06)}30%{transform:translateX(-50%) scale(1)}100%{transform:translateX(-50%) scale(1)}}
.modal-enter{animation:slideUp 0.4s cubic-bezier(0.32,0.72,0,1) forwards}
.card-enter{animation:staggerIn 0.35s cubic-bezier(0.32,0.72,0,1) both}
.toast-enter{animation:toastIn 0.4s cubic-bezier(0.32,0.72,0,1) forwards}
.hover-lift{transition:transform 0.2s cubic-bezier(0.32,0.72,0,1),box-shadow 0.2s ease}
.hover-lift:active{transform:scale(0.96);box-shadow:inset 2px 2px 6px rgba(163,177,198,0.3),inset -2px -2px 6px rgba(255,255,255,0.6)!important}
.orb-float{animation:orbDrift 18s ease-in-out infinite}
input:focus,select:focus,textarea:focus{outline:none;box-shadow:inset 3px 3px 8px rgba(163,177,198,0.4),inset -3px -3px 8px rgba(255,255,255,0.7),0 0 0 2px rgba(0,122,255,0.15)!important}
::-webkit-scrollbar{display:none}
`;

function GlassStyle() {
  useEffect(() => {
    const el = document.createElement("style"); el.textContent = glassCSS;
    document.head.appendChild(el); return () => document.head.removeChild(el);
  }, []);
  return null;
}

// Material Symbols icon component
const I = ({name, size, color, style}) => (
  <span className="micon" style={{fontSize:size||20,color:color||"inherit",...(style||{})}}>{name}</span>
);

// Bottom Tab Bar — neumorphic
const BottomTabBar = ({tabs, active, onChange}) => (
  <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,display:"flex",alignItems:"stretch",justifyContent:"space-around",zIndex:150,padding:"10px 12px env(safe-area-inset-bottom, 12px)",background:"#e8edf2"}}>
    {tabs.map(t=>(
      <div key={t.key} onClick={()=>onChange(t.key)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 0",cursor:"pointer",position:"relative",borderRadius:16,background:active===t.key?"#e8edf2":"transparent",boxShadow:active===t.key?"inset 3px 3px 6px rgba(163,177,198,0.35),inset -3px -3px 6px rgba(255,255,255,0.7)":"none",transition:"all 0.25s",margin:"0 3px"}}>
        <I name={t.icon} size={22} color={active===t.key?"#4a6fa5":"rgba(0,0,0,0.2)"}/>
        <span style={{fontSize:9,fontWeight:active===t.key?600:400,color:active===t.key?"#4a6fa5":"rgba(0,0,0,0.2)",letterSpacing:1.2,textTransform:"uppercase"}}>{t.label}</span>
        {t.badge>0&&<span style={{position:"absolute",top:2,marginLeft:22,minWidth:17,height:17,borderRadius:9,background:"linear-gradient(135deg,#FF6B81,#FF9F0A)",color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 5px",boxShadow:"2px 2px 6px rgba(255,100,130,0.3)"}}>{t.badge}</span>}
      </div>
    ))}
  </div>
);

// Shared components — neumorphic
const GlassModal = ({ children, onClose }) => (
  <div style={{position:"fixed",inset:0,background:"rgba(200,210,220,0.6)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={(e)=>e.target===e.currentTarget&&onClose()}>
    <div className="modal-enter" style={{borderRadius:"28px 28px 0 0",padding:"6px 22px 36px",width:"100%",maxWidth:430,maxHeight:"88vh",overflowY:"auto",background:"#e8edf2",boxShadow:"0 -10px 40px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,0.6)"}}>
      <div style={{width:36,height:4,borderRadius:2,background:"rgba(0,0,0,0.08)",margin:"10px auto 20px"}}/>
      {children}
    </div>
  </div>
);

const GlassInput = (props) => (
  <input {...props} style={{width:"100%",padding:"14px 16px",borderRadius:14,border:"none",fontSize:15,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:10,background:"#e8edf2",color:"#2d3748",boxShadow:"inset 3px 3px 8px rgba(163,177,198,0.35),inset -3px -3px 8px rgba(255,255,255,0.7)",transition:"all 0.25s",...(props.style||{})}}/>
);

const GlassSelect = (props) => (
  <select {...props} style={{width:"100%",padding:"14px 16px",borderRadius:14,border:"none",fontSize:15,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:10,background:"#e8edf2",color:"#2d3748",boxShadow:"inset 3px 3px 8px rgba(163,177,198,0.35),inset -3px -3px 8px rgba(255,255,255,0.7)",appearance:"auto",...(props.style||{})}}/>
);

const PrimaryBtn = ({children,...props}) => (
  <button className="hover-lift" {...props} style={{width:"100%",padding:15,borderRadius:16,border:"none",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",fontSize:15,fontWeight:600,cursor:"pointer",marginTop:8,boxShadow:"4px 4px 12px rgba(163,177,198,0.4),-4px -4px 12px rgba(255,255,255,0.7),0 4px 16px rgba(102,126,234,0.25)",letterSpacing:0.3,...(props.style||{})}}>{children}</button>
);

const Badge = ({status}) => {
  const c = {Pending:{bg:"linear-gradient(135deg,#FF6B81,#FF453A)",fg:"#fff"},Preparing:{bg:"linear-gradient(135deg,#FFB840,#FF9F0A)",fg:"#fff"},Sent:{bg:"linear-gradient(135deg,#5BE07A,#28A745)",fg:"#fff"},Modified:{bg:"linear-gradient(135deg,#7B79E8,#5856D6)",fg:"#fff"},Delivered:{bg:"linear-gradient(135deg,#5BE07A,#28A745)",fg:"#fff"}}[status]||{bg:"linear-gradient(135deg,#FF6B81,#FF453A)",fg:"#fff"};
  return <span style={{display:"inline-block",padding:"4px 10px",borderRadius:10,fontSize:10,fontWeight:600,background:c.bg,color:c.fg,letterSpacing:0.8,textTransform:"uppercase",boxShadow:"2px 2px 6px rgba(163,177,198,0.3)"}}>{status==="Delivered"?"Sent":status}</span>;
};

const Stepper = ({qty,onMinus,onPlus}) => (
  <div style={{display:"flex",alignItems:"center",background:"#e8edf2",borderRadius:14,boxShadow:"inset 2px 2px 5px rgba(163,177,198,0.3),inset -2px -2px 5px rgba(255,255,255,0.6)",overflow:"hidden"}}>
    <button style={{width:34,height:34,border:"none",background:"transparent",fontSize:18,fontWeight:500,color:"#4a6fa5",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onMinus}>−</button>
    <div style={{width:26,textAlign:"center",fontSize:15,fontWeight:700,color:"#2d3748"}}>{qty}</div>
    <button style={{width:34,height:34,border:"none",background:"transparent",fontSize:18,fontWeight:500,color:"#4a6fa5",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onPlus}>+</button>
  </div>
);

const CAT_COLOR_MAP = {
  "All":{bg:"linear-gradient(135deg,#007AFF,#5856D6)",shadow:"rgba(0,122,255,0.3)"},
  "Vegetables & Greens":{bg:"linear-gradient(135deg,#30D158,#00C853)",shadow:"rgba(48,209,88,0.3)"},
  "Poultry, Meat & Seafood":{bg:"linear-gradient(135deg,#FF453A,#FF6B6B)",shadow:"rgba(255,69,58,0.3)"},
  "Eggs & Dairy":{bg:"linear-gradient(135deg,#C7B299,#E8DDD0)",shadow:"rgba(199,178,153,0.3)"},
  "Grains, Staples & Dry Goods":{bg:"linear-gradient(135deg,#FF9F0A,#FFB840)",shadow:"rgba(255,159,10,0.3)"},
  "Bakery & Bread":{bg:"linear-gradient(135deg,#BF5AF2,#9B59B6)",shadow:"rgba(191,90,242,0.3)"},
  "Sauces, Condiments & Oils":{bg:"linear-gradient(135deg,#FF375F,#FF6B81)",shadow:"rgba(255,55,95,0.3)"},
  "Packaging & Miscellaneous":{bg:"linear-gradient(135deg,#64D2FF,#5AC8FA)",shadow:"rgba(100,210,255,0.3)"},
};
const CAT_COLOR_DEFAULT = {bg:"linear-gradient(135deg,#007AFF,#5856D6)",shadow:"rgba(0,122,255,0.3)"};

const CatPill = ({active,children,catName,...props}) => {
  const col = CAT_COLOR_MAP[catName] || CAT_COLOR_DEFAULT;
  return <button className="hover-lift" {...props} style={{padding:"8px 18px",borderRadius:22,fontSize:12,fontWeight:active?600:500,whiteSpace:"nowrap",cursor:"pointer",border:"none",background:active?col.bg:"#e8edf2",color:active?"#fff":"rgba(45,55,72,0.5)",boxShadow:active?`3px 3px 10px ${col.shadow},-2px -2px 8px rgba(255,255,255,0.5),0 0 20px ${col.shadow}`:"4px 4px 10px rgba(163,177,198,0.3),-4px -4px 10px rgba(255,255,255,0.7)",transition:"all 0.3s cubic-bezier(0.32,0.72,0,1)",letterSpacing:0.3}}>{children}</button>;
};


// Login Screen — Deep liquid glass
function LoginScreen({ onLogin, pins }) {
  const [step, setStep] = useState("username");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [successUser, setSuccessUser] = useState(null);
  const [cardAnim, setCardAnim] = useState("cardAppear");
  const allUsers = [...HOUSEHOLDS, KITCHEN];
  const USERNAMES = {"3rd":"3F","4th":"4F","5th":"5F","6th":"6F","office":"OF","ck":"CK"};

  const resolvedUser = ()=>{
    const uid = USERNAMES[username.toLowerCase().trim()];
    return uid ? allUsers.find(u=>u.id===uid) : null;
  };

  const handleUsernameSubmit = () => {
    const user = resolvedUser();
    if(!user){setError("User not found");triggerShake();return}
    setError("");
    setCardAnim("cardSlideOut");
    setTimeout(()=>{setStep("pin");setCardAnim("cardSlideIn")},400);
  };

  const handleNum = (n) => {
    if(pin.length>=4) return;
    const next = pin + n;
    setPin(next);
    setError("");
    if(next.length===4){
      const uid = USERNAMES[username.toLowerCase().trim()];
      if(pins[uid]===next){
        const user = allUsers.find(u=>u.id===uid);
        setSuccessUser(user);
        setCardAnim("cardLift");
        setTimeout(()=>setStep("success"),500);
        setTimeout(()=>onLogin(user),1800);
      } else {
        setError("Incorrect PIN");
        triggerShake();
        setTimeout(()=>setPin(""),400);
      }
    }
  };

  const handleBack = ()=>{
    setPin("");setError("");
    setCardAnim("cardSlideOutRight");
    setTimeout(()=>{setStep("username");setCardAnim("cardSlideIn")},400);
  };

  const triggerShake = ()=>{setShaking(true);setTimeout(()=>setShaking(false),500)};
  const handleKeyDown = (e)=>{if(e.key==="Enter"&&step==="username") handleUsernameSubmit()};

  return (
    <div style={{minHeight:"100vh",background:"#050507",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,position:"relative",overflow:"hidden"}}>
      <GlassStyle/>
      <style>{`
        @keyframes shake{0%,100%{transform:translateX(0)}15%,45%,75%{transform:translateX(-6px)}30%,60%,90%{transform:translateX(6px)}}
        @keyframes cardAppear{0%{opacity:0;transform:scale(0.92) translateY(30px)}100%{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes cardSlideOut{0%{opacity:1;transform:translateX(0) scale(1)}100%{opacity:0;transform:translateX(-50px) scale(0.96)}}
        @keyframes cardSlideOutRight{0%{opacity:1;transform:translateX(0) scale(1)}100%{opacity:0;transform:translateX(50px) scale(0.96)}}
        @keyframes cardSlideIn{0%{opacity:0;transform:translateX(50px) scale(0.96)}100%{opacity:1;transform:translateX(0) scale(1)}}
        @keyframes cardLift{0%{transform:translateY(0) scale(1);opacity:1}50%{transform:translateY(-20px) scale(1.03);opacity:0.7}100%{transform:translateY(10px) scale(0.92);opacity:0}}
        @keyframes auroraMove{0%{transform:translateX(-50%) rotate(0deg) scale(1)}33%{transform:translateX(-45%) rotate(3deg) scale(1.05)}66%{transform:translateX(-55%) rotate(-2deg) scale(0.95)}100%{transform:translateX(-50%) rotate(0deg) scale(1)}}
        @keyframes sheenSlide{0%{transform:translateX(-100%) rotate(-15deg)}100%{transform:translateX(200%) rotate(-15deg)}}
        @keyframes checkDraw{0%{stroke-dashoffset:24}100%{stroke-dashoffset:0}}
        @keyframes ringPulse{0%{transform:translate(-50%,-50%) scale(0.5);opacity:0}30%{opacity:0.7}100%{transform:translate(-50%,-50%) scale(3.5);opacity:0}}
        @keyframes welcomeUp{0%{opacity:0;transform:translate(-50%,-50%) scale(0.9) translateY(24px)}100%{opacity:1;transform:translate(-50%,-50%) scale(1) translateY(0)}}
        @keyframes glowPulse{0%{opacity:0;transform:translate(-50%,-50%) scale(0.3)}40%{opacity:0.8}100%{opacity:0;transform:translate(-50%,-50%) scale(3)}}
        @keyframes dotBounce{0%{transform:scale(0) translateY(4px)}60%{transform:scale(1.25) translateY(-2px)}100%{transform:scale(1) translateY(0)}}
        @keyframes numPress{0%{transform:scale(1)}50%{transform:scale(0.92)}100%{transform:scale(1)}}
        .shake-anim{animation:shake 0.45s ease}
      `}</style>

      {/* Ambient aurora blobs */}
      <div style={{position:"fixed",top:"-10%",left:"50%",width:500,height:280,transform:"translateX(-50%)",background:"conic-gradient(from 180deg,rgba(48,209,88,0.18),rgba(0,180,255,0.12),rgba(130,80,255,0.08),rgba(48,209,88,0.18))",filter:"blur(90px)",borderRadius:"50%",animation:"auroraMove 10s ease-in-out infinite",opacity:0.8}}/>
      <div style={{position:"fixed",top:"15%",left:"30%",width:200,height:200,background:"radial-gradient(circle,rgba(0,200,150,0.12),transparent 70%)",filter:"blur(60px)",borderRadius:"50%"}}/>
      <div style={{position:"fixed",top:"10%",right:"20%",width:160,height:160,background:"radial-gradient(circle,rgba(80,120,255,0.1),transparent 70%)",filter:"blur(50px)",borderRadius:"50%"}}/>

      {/* ======= SUCCESS OVERLAY ======= */}
      {step==="success"&&<>
        <div style={{position:"fixed",top:"50%",left:"50%",width:100,height:100,borderRadius:"50%",border:"2px solid rgba(48,209,88,0.5)",transform:"translate(-50%,-50%)",animation:"ringPulse 1.1s ease-out forwards",zIndex:10}}/>
        <div style={{position:"fixed",top:"50%",left:"50%",width:100,height:100,borderRadius:"50%",border:"1.5px solid rgba(100,220,255,0.35)",transform:"translate(-50%,-50%)",animation:"ringPulse 1.1s 0.2s ease-out forwards",zIndex:10}}/>
        <div style={{position:"fixed",top:"50%",left:"50%",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(48,209,88,0.15),transparent 65%)",transform:"translate(-50%,-50%)",animation:"glowPulse 1.4s ease-out forwards",zIndex:9}}/>
        <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:20,textAlign:"center",animation:"welcomeUp 0.7s 0.35s cubic-bezier(0.32,0.72,0,1) both"}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,rgba(48,209,88,0.15),rgba(0,180,200,0.1))",border:"1px solid rgba(48,209,88,0.25)",backdropFilter:"blur(30px)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:"0 0 40px rgba(48,209,88,0.15),inset 0 1px 0 rgba(255,255,255,0.1)"}}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#30D158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{strokeDasharray:24,animation:"checkDraw 0.4s 0.5s ease forwards",strokeDashoffset:24}}/></svg>
          </div>
          <div style={{fontSize:26,fontWeight:700,color:"#fff",letterSpacing:-0.5}}>Welcome, {successUser?.name}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.3)",marginTop:10,fontWeight:400}}>Loading your dashboard...</div>
        </div>
      </>}

      {/* ======= GLASS CARD ======= */}
      {step!=="success"&&<div
        className={shaking?"shake-anim":""}
        style={{
          width:"100%",maxWidth:380,borderRadius:32,position:"relative",zIndex:1,overflow:"hidden",
          background:"linear-gradient(170deg,rgba(255,255,255,0.09) 0%,rgba(255,255,255,0.03) 40%,rgba(0,0,0,0.02) 100%)",
          backdropFilter:"blur(60px) saturate(180%)",WebkitBackdropFilter:"blur(60px) saturate(180%)",
          border:"1px solid rgba(255,255,255,0.12)",
          boxShadow:"0 30px 100px rgba(0,0,0,0.5),0 0 0 0.5px rgba(255,255,255,0.08) inset,0 1px 0 rgba(255,255,255,0.12) inset",
          animation:`${cardAnim} 0.4s cubic-bezier(0.32,0.72,0,1) both`
        }}
      >
        {/* Glass sheen / reflection at top */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:120,background:"linear-gradient(180deg,rgba(255,255,255,0.06) 0%,transparent 100%)",pointerEvents:"none",borderRadius:"32px 32px 0 0"}}/>
        {/* Animated sheen sweep */}
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,overflow:"hidden",borderRadius:32,pointerEvents:"none"}}>
          <div style={{position:"absolute",top:-20,width:60,height:"150%",background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)",animation:"sheenSlide 6s 1s ease-in-out infinite"}}/>
        </div>
        {/* Top aurora edge - brighter */}
        <div style={{position:"absolute",top:-1,left:"50%",transform:"translateX(-50%)",width:"60%",height:4,borderRadius:"0 0 4px 4px",background:"linear-gradient(90deg,transparent,rgba(48,209,88,0.6),rgba(0,180,255,0.4),rgba(130,80,255,0.2),transparent)",filter:"blur(1px)"}}/>

        <div style={{padding:"42px 28px 36px",position:"relative",zIndex:1}}>

          {/* === USERNAME STEP === */}
          {step==="username"&&<>
            <div style={{textAlign:"center",marginBottom:36}}>
              <div style={{fontSize:30,fontWeight:700,color:"#fff",letterSpacing:-1}}>Welcome back</div>
              <div style={{fontSize:14,color:"rgba(255,255,255,0.3)",fontWeight:400,marginTop:8}}>Sign in to your account</div>
            </div>

            {/* Input container - glass pill */}
            <div style={{
              borderRadius:18,padding:"14px 18px",marginBottom:16,position:"relative",
              background:"linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))",
              border:"1px solid rgba(255,255,255,0.08)",
              boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06),0 2px 8px rgba(0,0,0,0.2)"
            }}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",fontWeight:500,marginBottom:6,letterSpacing:0.5}}>Username</div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <input
                  type="text" placeholder="Enter username"
                  value={username} onChange={e=>{setUsername(e.target.value);setError("")}}
                  onKeyDown={handleKeyDown} autoFocus autoCapitalize="none" autoCorrect="off"
                  style={{flex:1,background:"none",border:"none",color:"#fff",fontSize:17,fontWeight:500,fontFamily:"inherit",outline:"none",padding:0}}
                />
                {/* Circular submit button */}
                <button className="hover-lift" onClick={handleUsernameSubmit} style={{
                  width:44,height:44,borderRadius:"50%",border:"none",cursor:"pointer",flexShrink:0,
                  background:"linear-gradient(135deg,#30D158,#00C9A7)",
                  boxShadow:"0 4px 16px rgba(48,209,88,0.35),inset 0 1px 0 rgba(255,255,255,0.2)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  color:"#fff",fontSize:20,fontWeight:600
                }}>→</button>
              </div>
            </div>

            {error&&<div style={{color:"#FF453A",fontSize:13,fontWeight:600,textAlign:"center",marginTop:4}}>{error}</div>}
          </>}

          {/* === PIN STEP === */}
          {step==="pin"&&<>
            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{fontSize:24,fontWeight:700,color:"#fff",letterSpacing:-0.5,marginBottom:4}}>{resolvedUser()?.name}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.25)",letterSpacing:2,textTransform:"uppercase",fontWeight:500}}>Enter PIN</div>
            </div>

            {/* PIN dots in glass container */}
            <div style={{
              borderRadius:18,padding:"18px 24px",marginBottom:20,
              background:"linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))",
              border:"1px solid rgba(255,255,255,0.07)",
              boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05),0 2px 8px rgba(0,0,0,0.15)",
              display:"flex",justifyContent:"center",gap:18
            }}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{
                  width:44,height:44,borderRadius:14,
                  background:pin.length>i?"rgba(48,209,88,0.12)":"rgba(255,255,255,0.03)",
                  border:`1.5px solid ${pin.length>i?"rgba(48,209,88,0.45)":"rgba(255,255,255,0.06)"}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"all 0.2s cubic-bezier(0.32,0.72,0,1)",
                  boxShadow:pin.length>i?"0 0 16px rgba(48,209,88,0.08),inset 0 1px 0 rgba(48,209,88,0.1)":"inset 0 1px 0 rgba(255,255,255,0.03)"
                }}>
                  {pin.length>i&&<div style={{width:12,height:12,borderRadius:"50%",background:"linear-gradient(135deg,#30D158,#00C9A7)",animation:"dotBounce 0.25s ease",boxShadow:"0 0 10px rgba(48,209,88,0.4)"}}/>}
                </div>
              ))}
            </div>

            {error&&<div style={{color:"#FF453A",fontSize:13,fontWeight:600,textAlign:"center",marginBottom:10}}>{error}</div>}

            {/* Numpad - glass buttons */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:264,margin:"0 auto"}}>
              {[1,2,3,4,5,6,7,8,9].map(n=>(
                <button key={n} className="hover-lift" style={{
                  height:56,borderRadius:16,cursor:"pointer",
                  background:"linear-gradient(170deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))",
                  border:"1px solid rgba(255,255,255,0.08)",
                  boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06),0 2px 6px rgba(0,0,0,0.2)",
                  color:"#fff",fontSize:22,fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"all 0.12s"
                }} onClick={()=>handleNum(String(n))}>{n}</button>
              ))}
              <button className="hover-lift" style={{
                height:56,borderRadius:16,cursor:"pointer",
                background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",
                color:"rgba(255,255,255,0.35)",fontSize:13,fontWeight:600,
                display:"flex",alignItems:"center",justifyContent:"center",gap:4
              }} onClick={handleBack}><span style={{fontSize:15}}>←</span> Back</button>
              <button className="hover-lift" style={{
                height:56,borderRadius:16,cursor:"pointer",
                background:"linear-gradient(170deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))",
                border:"1px solid rgba(255,255,255,0.08)",
                boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06),0 2px 6px rgba(0,0,0,0.2)",
                color:"#fff",fontSize:22,fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center"
              }} onClick={()=>handleNum("0")}>0</button>
              <button className="hover-lift" style={{
                height:56,borderRadius:16,cursor:"pointer",
                background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",
                color:"rgba(255,255,255,0.35)",fontSize:18,
                display:"flex",alignItems:"center",justifyContent:"center"
              }} onClick={()=>{setPin(p=>p.slice(0,-1));setError("")}}>⌫</button>
            </div>
          </>}
        </div>
      </div>}

      {/* Footer */}
      <div style={{color:"rgba(255,255,255,0.08)",fontSize:10,marginTop:36,textAlign:"center",zIndex:1,fontWeight:400}}>
        Central Kitchen Ordering System
      </div>
    </div>
  );
}

// Household Order History with time period filters
const TIME_PERIODS = [
  {key:"today",label:"Today"},
  {key:"week",label:"This Week"},
  {key:"lastweek",label:"Last Week"},
  {key:"month",label:"This Month"},
  {key:"6months",label:"Last 6 Months"},
];

const KITCHEN_TIME_PERIODS = [
  {key:"today",label:"Today"},
  {key:"yesterday",label:"Yesterday"},
  {key:"week",label:"This Week"},
  {key:"lastweek",label:"Last Week"},
  {key:"month",label:"This Month"},
  {key:"lastmonth",label:"Last Month"},
  {key:"6months",label:"6 Months"},
];

function getDateRange(key) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eod = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  const dayOfWeek = today.getDay() || 7;
  switch (key) {
    case "today": return { from: today, to: eod };
    case "yesterday": {
      const y = new Date(today); y.setDate(y.getDate() - 1);
      return { from: y, to: new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59) };
    }
    case "week": {
      const mon = new Date(today); mon.setDate(today.getDate() - (dayOfWeek - 1));
      return { from: mon, to: eod };
    }
    case "lastweek": {
      const mon = new Date(today); mon.setDate(today.getDate() - (dayOfWeek - 1) - 7);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59);
      return { from: mon, to: sun };
    }
    case "month": {
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: eod };
    }
    case "lastmonth": {
      const fm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lm = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { from: fm, to: lm };
    }
    case "6months": {
      const d = new Date(now); d.setMonth(d.getMonth() - 6);
      return { from: d, to: eod };
    }
    default: return { from: today, to: eod };
  }
}

function HouseholdOrderHistory({ orders, onDispute }) {
  const [period, setPeriod] = useState("today");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [disputeModal, setDisputeModal] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");

  const range = getDateRange(period);
  const filteredOrders = orders.filter(o => {
    const parts = o.date.split("-");
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    return d >= range.from && d <= range.to;
  }).sort((a, b) => b.id - a.id);

  const totalCost = filteredOrders.reduce((s, o) => s + getActualTotal(o), 0);

  return (
    <div style={{padding:"6px 16px 90px",minHeight:"50vh"}}>
      {/* Period filter pills */}
      <div style={{display:"flex",gap:6,padding:"10px 0 8px",overflowX:"auto"}}>
        {TIME_PERIODS.map(tp=>(
          <CatPill key={tp.key} active={period===tp.key} onClick={()=>setPeriod(tp.key)}>{tp.label}</CatPill>
        ))}
      </div>

      {/* Summary bar */}
      {filteredOrders.length>0&&<div className="glass" style={{borderRadius:14,padding:"12px 16px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><span style={{fontSize:14,fontWeight:700,color:"#1a1a1a"}}>{filteredOrders.length}</span><span style={{fontSize:12,color:"rgba(0,0,0,0.35)",marginLeft:4}}>order{filteredOrders.length!==1?"s":""}</span></div>
        <div><span style={{fontSize:12,color:"rgba(0,0,0,0.35)"}}>Total: </span><span style={{fontSize:16,fontWeight:800,color:"#30A050"}}>₹{totalCost}</span></div>
      </div>}

      {filteredOrders.length===0?<div style={{textAlign:"center",padding:"60px 20px",color:"rgba(0,0,0,0.28)"}}><I name="inbox" size={52} color="rgba(0,0,0,0.18)" style={{marginBottom:12}}/><div style={{fontWeight:600,color:"rgba(0,0,0,0.45)"}}>No orders in this period</div><div style={{fontSize:13,marginTop:4}}>Try selecting a different time range</div></div>
      :filteredOrders.map(order=>{
        const isExpanded = expandedOrder === order.id;
        return (
        <div key={order.id} className="glass card-enter" style={{borderRadius:16,marginBottom:10,overflow:"hidden",borderLeft:`4px solid ${order.status==="Sent"?"#30D158":order.status==="Preparing"?"#FF9F0A":"#FF453A"}`}}>
          {/* Collapsed header - always visible */}
          <div style={{padding:"14px 16px",cursor:"pointer"}} onClick={()=>setExpandedOrder(isExpanded?null:order.id)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a"}}>{order.orderNumber||`#${String(order.id).slice(-4)}`}</div>
                <Badge status={order.status}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:15,fontWeight:700,color:"#30A050"}}>₹{getActualTotal(order)}</span>
                <span style={{fontSize:16,color:"rgba(0,0,0,0.2)",transition:"transform 0.2s",transform:isExpanded?"rotate(90deg)":"rotate(0deg)"}}>›</span>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:12,color:"rgba(0,0,0,0.28)"}}>{new Date(order.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:period!=="today"&&period!=="week"?"numeric":undefined})} · {order.time}</div>
              {order.deliveredBy&&<div style={{fontSize:11,color:"#30A050",fontWeight:600,display:"flex",alignItems:"center",gap:3}}>
                <I name="local_shipping" size={14} color="#30A050"/> {order.deliveredBy}
              </div>}
            </div>
          </div>

          {/* Expanded detail */}
          {isExpanded&&<div style={{padding:"0 16px 14px",borderTop:"none"}}>
            {/* Timestamps */}
            <div style={{display:"flex",gap:12,padding:"10px 0",flexWrap:"wrap"}}>
              {order.placedAt&&<div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"rgba(0,0,0,0.35)"}}><I name="schedule" size={13} color="rgba(0,0,0,0.3)"/>Placed: {new Date(order.placedAt).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>}
              {order.deliveredAt&&<div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#30A050"}}><I name="check_circle" size={13} color="#30A050"/>Delivered: {new Date(order.deliveredAt).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>}
            </div>
            {/* Item detail table */}
            <div style={{padding:"10px 0 2px"}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:600,color:"rgba(0,0,0,0.3)",textTransform:"uppercase",letterSpacing:0.5,padding:"0 0 6px",borderBottom:"none"}}>
                <span style={{flex:2}}>Item</span>
                <span style={{flex:0.5,textAlign:"center"}}>Qty</span>
                <span style={{flex:0.7,textAlign:"right"}}>Price</span>
                <span style={{flex:0.7,textAlign:"right"}}>Total</span>
              </div>
              {order.items.map((it,i)=>{
                const mod=it.sentQty!=null&&it.sentQty!==it.qty;
                const effectiveQty = it.sentQty!=null?it.sentQty:it.qty;
                return(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,padding:"8px 0",borderBottom:"none",color:"rgba(0,0,0,0.55)"}}>
                  <span style={{flex:2,fontWeight:500}}>{it.name}</span>
                  <span style={{flex:0.5,textAlign:"center"}}>
                    {mod?<><span style={{textDecoration:"line-through",color:"rgba(0,0,0,0.25)",fontSize:11}}>{it.qty}</span><span style={{color:"#007AFF",fontWeight:700,marginLeft:2}}>{it.sentQty}</span></>:it.qty}
                  </span>
                  <span style={{flex:0.7,textAlign:"right",color:"rgba(0,0,0,0.35)"}}>₹{it.price}</span>
                  <span style={{flex:0.7,textAlign:"right",fontWeight:700,color:"#1a1a1a"}}>₹{it.price*effectiveQty}</span>
                </div>
              )})}
            </div>

            {/* Modification reasons */}
            {order.items.some(it=>it.modifyReason)&&<div style={{marginTop:8,padding:"8px 10px",borderRadius:10,background:"rgba(0,122,255,0.05)",border:"none"}}>
              {order.items.filter(it=>it.modifyReason).map((it,i)=><div key={i} style={{fontSize:11,color:"#007AFF",fontWeight:500,lineHeight:1.5}}><b>{it.name}:</b> {it.modifyReason}</div>)}
            </div>}

            {/* Delivered by */}
            {order.deliveredBy&&<div style={{marginTop:8,padding:"10px 12px",borderRadius:12,background:"rgba(48,209,88,0.06)",border:"none",display:"flex",alignItems:"center",gap:8}}>
              <I name="local_shipping" size={24} color="#30A050"/>
              <div><div style={{fontSize:12,color:"rgba(0,0,0,0.35)",fontWeight:500}}>Delivered by</div><div style={{fontSize:14,fontWeight:700,color:"#30A050"}}>{order.deliveredBy}</div></div>
            </div>}

            {/* Note */}
            {order.note&&<div style={{marginTop:8,padding:"10px 12px",borderRadius:12,background:"rgba(255,159,10,0.06)",border:"none",display:"flex",alignItems:"flex-start",gap:8}}>
              <I name="sticky_note_2" size={18} color="#FF9F0A" style={{marginTop:1}}/>
              <div><div style={{fontSize:11,color:"rgba(0,0,0,0.35)",fontWeight:600,marginBottom:2}}>Note</div><div style={{fontSize:13,color:"rgba(0,0,0,0.6)",lineHeight:1.4}}>{order.note}</div></div>
            </div>}

            {/* Order total */}
            <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:700,paddingTop:10,borderTop:"none",marginTop:10,color:"#1a1a1a"}}>
              <span>Order Total</span><span style={{color:"#30A050"}}>₹{getActualTotal(order)}</span>
            </div>
          </div>}
        </div>
      )})}
    </div>
  );
}

// Household Dashboard
function HouseholdDashboard({ user, items, orders, onOrder, onDispute, onLogout, pins, onPinChange }) {
  const [tab, setTab] = useState("order");
  const [cart, setCart] = useState({});
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  // PIN change state
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinMsg, setPinMsg] = useState(null);

  const myOrders = orders.filter(o => o.householdId === user.id);
  const filteredItems = items.filter(it => (category==="All"||it.category===category) && it.name.toLowerCase().includes(search.toLowerCase()));
  const cartItems = Object.entries(cart).filter(([,q])=>q>0);
  const cartTotal = cartItems.reduce((s,[id,q])=>{const it=items.find(i=>i.id===Number(id));return s+(it?it.price*q:0)},0);
  const cartCount = cartItems.reduce((s,[,q])=>s+q,0);

  const setQty = (id,d) => setCart(c=>{const cur=c[id]||0;const next=Math.max(0,cur+d);if(next===0){const{[id]:_,...rest}=c;return rest}return{...c,[id]:next}});

  const placeOrder = () => {
    const oi = cartItems.map(([id,qty])=>{const item=items.find(i=>i.id===Number(id));return{...item,qty,sentQty:qty}});
    const orderData = {id:Date.now(),householdId:user.id,householdName:user.name,items:oi,total:cartTotal,date:getToday(),time:new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}),status:"Pending"};
    if(orderNote.trim()) orderData.note = orderNote.trim();
    onOrder(orderData);
    setCart({});setShowCart(false);setOrderNote("");setOrderSuccess(true);setTimeout(()=>setOrderSuccess(false),2800);
  };

  const handlePinChange = () => {
    setPinMsg(null);
    if(currentPin !== pins[user.id]){setPinMsg({type:"error",text:"Current PIN is incorrect"});return}
    if(newPin.length!==4||!/^\d{4}$/.test(newPin)){setPinMsg({type:"error",text:"New PIN must be 4 digits"});return}
    if(newPin!==confirmPin){setPinMsg({type:"error",text:"PINs do not match"});return}
    onPinChange(user.id, newPin);
    setCurrentPin("");setNewPin("");setConfirmPin("");
    setPinMsg({type:"success",text:"PIN changed successfully!"});
    setTimeout(()=>setPinMsg(null),3000);
  };

  const appStyle = {fontFamily:"'Montserrat',sans-serif",maxWidth:430,margin:"0 auto",minHeight:"100vh",background:"#e8edf2",position:"relative",overflow:"hidden"};

  const Orbs = ()=><>{[1,2,3,4].map(i=><div key={i} className={`bg-orb bg-orb-${i} orb-float`} style={{animationDelay:`${i*3}s`}}/>)}</>;

  return (
    <div style={appStyle}>
      <Orbs/>
      <GlassStyle/>
      <style>{`
        @keyframes orderCheckDraw{0%{stroke-dashoffset:24}100%{stroke-dashoffset:0}}
        @keyframes orderRing{0%{transform:translate(-50%,-50%) scale(0.5);opacity:0}30%{opacity:0.5}100%{transform:translate(-50%,-50%) scale(3.5);opacity:0}}
        @keyframes orderFadeIn{0%{opacity:0;transform:translate(-50%,-50%) scale(0.85) translateY(20px)}100%{opacity:1;transform:translate(-50%,-50%) scale(1) translateY(0)}}
        @keyframes orderGlow{0%{opacity:0;transform:translate(-50%,-50%) scale(0.3)}30%{opacity:0.8}100%{opacity:0;transform:translate(-50%,-50%) scale(3)}}
        @keyframes orderOverlayIn{0%{opacity:0}100%{opacity:1}}
        @keyframes orderDot{0%{opacity:0;transform:translate(-50%,-50%) scale(0)}40%{opacity:0.7}100%{opacity:0;transform:translate(-50%,-50%) translateY(-80px) scale(0)}}
        @keyframes orderDot2{0%{opacity:0;transform:translate(-50%,-50%) scale(0)}40%{opacity:0.5}100%{opacity:0;transform:translate(-50%,-50%) translate(60px,-50px) scale(0)}}
        @keyframes orderDot3{0%{opacity:0;transform:translate(-50%,-50%) scale(0)}40%{opacity:0.5}100%{opacity:0;transform:translate(-50%,-50%) translate(-60px,-50px) scale(0)}}
        @keyframes iconBounce{0%{transform:scale(0)}50%{transform:scale(1.15)}70%{transform:scale(0.95)}100%{transform:scale(1)}}
      `}</style>

      {/* Order Success Overlay */}
      {orderSuccess&&<div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(232,237,242,0.92)",backdropFilter:"blur(30px)",WebkitBackdropFilter:"blur(30px)",animation:"orderOverlayIn 0.3s ease both"}}>
        {/* Soft aurora glows */}
        <div style={{position:"absolute",top:"50%",left:"50%",width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(102,126,234,0.1),transparent 70%)",transform:"translate(-50%,-50%)",animation:"orderGlow 1.8s ease-out forwards"}}/>
        <div style={{position:"absolute",top:"50%",left:"45%",width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(48,209,88,0.08),transparent 70%)",transform:"translate(-50%,-50%)",animation:"orderGlow 1.8s 0.2s ease-out forwards"}}/>
        {/* Expanding rings */}
        <div style={{position:"absolute",top:"50%",left:"50%",width:80,height:80,borderRadius:"50%",border:"1.5px solid rgba(102,126,234,0.15)",transform:"translate(-50%,-50%)",animation:"orderRing 1.4s 0.1s ease-out forwards"}}/>
        <div style={{position:"absolute",top:"50%",left:"50%",width:80,height:80,borderRadius:"50%",border:"1px solid rgba(48,209,88,0.12)",transform:"translate(-50%,-50%)",animation:"orderRing 1.4s 0.3s ease-out forwards"}}/>
        <div style={{position:"absolute",top:"50%",left:"50%",width:80,height:80,borderRadius:"50%",border:"1px solid rgba(220,180,255,0.1)",transform:"translate(-50%,-50%)",animation:"orderRing 1.4s 0.5s ease-out forwards"}}/>
        {/* Floating particles */}
        <div style={{position:"absolute",top:"50%",left:"50%",width:8,height:8,borderRadius:"50%",background:"rgba(102,126,234,0.4)",animation:"orderDot 1.2s 0.3s ease-out forwards"}}/>
        <div style={{position:"absolute",top:"50%",left:"50%",width:6,height:6,borderRadius:"50%",background:"rgba(48,209,88,0.35)",animation:"orderDot2 1.2s 0.4s ease-out forwards"}}/>
        <div style={{position:"absolute",top:"50%",left:"50%",width:6,height:6,borderRadius:"50%",background:"rgba(220,180,255,0.35)",animation:"orderDot3 1.2s 0.5s ease-out forwards"}}/>
        {/* Center content — neumorphic icon */}
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",animation:"orderFadeIn 0.6s 0.15s cubic-bezier(0.32,0.72,0,1) both"}}>
          <div style={{width:80,height:80,borderRadius:24,background:"#e8edf2",boxShadow:"8px 8px 18px rgba(163,177,198,0.4),-8px -8px 18px rgba(255,255,255,0.85)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 28px",animation:"iconBounce 0.5s 0.2s cubic-bezier(0.32,0.72,0,1) both"}}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="url(#checkGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{strokeDasharray:24,animation:"orderCheckDraw 0.4s 0.5s ease forwards",strokeDashoffset:24}}/><defs><linearGradient id="checkGrad" x1="5" y1="7" x2="19" y2="17"><stop offset="0%" stopColor="#667eea"/><stop offset="100%" stopColor="#28A745"/></linearGradient></defs></svg>
          </div>
          <div style={{fontSize:11,fontWeight:500,color:"rgba(45,55,72,0.3)",letterSpacing:4,textTransform:"uppercase",marginBottom:10}}>Order Placed</div>
          <div style={{fontSize:28,fontWeight:700,color:"#2d3748",letterSpacing:-0.8}}>Sent to Kitchen</div>
          <div style={{fontSize:13,color:"rgba(45,55,72,0.3)",marginTop:14,fontWeight:400}}>You'll be notified when it's ready</div>
        </div>
      </div>}

      {/* Header */}
      <div style={{padding:"22px 20px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:10}}>
        <div>
          <div style={{fontSize:13,fontWeight:500,color:"rgba(0,0,0,0.3)",letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>{new Date().toLocaleDateString("en-IN",{weekday:"long"})}</div>
          <div style={{fontSize:22,fontWeight:700,color:"#2d3748",letterSpacing:-0.5}}>{user.name}</div>
        </div>
        <button className="hover-lift" style={{background:"linear-gradient(135deg,#FF6B81,#FF453A)",border:"none",color:"#fff",fontSize:12,cursor:"pointer",fontWeight:600,padding:"8px 16px",borderRadius:14,boxShadow:"3px 3px 8px rgba(163,177,198,0.35),-3px -3px 8px rgba(255,255,255,0.7),0 3px 10px rgba(255,69,58,0.2)"}} onClick={onLogout}>Sign Out</button>
      </div>

      {tab==="order"&&<>
        <div style={{padding:"14px 16px 0",position:"relative"}}>
          <I name="search" size={18} color="rgba(0,0,0,0.28)" style={{position:"absolute",left:30,top:24,pointerEvents:"none"}}/>
          <GlassInput placeholder="Search items..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:40,marginBottom:0}}/>
        </div>
        <div style={{display:"flex",gap:8,padding:"12px 16px 6px",overflowX:"auto"}}>
          {["All",...[...new Set(items.map(i=>i.category).filter(Boolean))]].map(c=><CatPill key={c} active={category===c} catName={c} onClick={()=>setCategory(c)}>{c}</CatPill>)}
        </div>
        <div style={{padding:"6px 16px 160px",minHeight:"50vh"}}>
          {filteredItems.length===0?<div style={{textAlign:"center",padding:"60px 20px",color:"rgba(0,0,0,0.2)"}}><I name="search_off" size={40} color="rgba(0,0,0,0.1)" style={{marginBottom:8}}/><div style={{fontSize:14,fontWeight:500}}>No items found</div></div>
          :filteredItems.map((item,idx)=>(
            <div key={item.id} className="glass card-enter hover-lift" style={{borderRadius:16,padding:"14px 16px",marginBottom:10,animationDelay:`${idx*0.04}s`}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:600,color:"#2d3748"}}>{item.name}</div>
                  <div style={{fontSize:12,color:"rgba(0,0,0,0.28)",marginTop:1}}>{item.category} · {item.unit}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{fontSize:17,fontWeight:700,color:"#30A050"}}>₹{item.price}</div>
                  {cart[item.id]?<Stepper qty={cart[item.id]} onMinus={()=>setQty(item.id,-1)} onPlus={()=>setQty(item.id,1)}/>
                  :<button className="hover-lift" style={{padding:"7px 18px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#667eea,#764ba2)",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",boxShadow:"3px 3px 8px rgba(163,177,198,0.35),-3px -3px 8px rgba(255,255,255,0.7),0 3px 10px rgba(102,126,234,0.2)"}} onClick={()=>setQty(item.id,1)}>Add</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
        {cartCount>0&&<div style={{position:"fixed",bottom:72,left:"50%",transform:"translateX(-50%)",width:"calc(100% - 32px)",maxWidth:398,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:100,borderRadius:20,background:"#e8edf2",boxShadow:"6px 6px 14px rgba(163,177,198,0.35),-6px -6px 14px rgba(255,255,255,0.8)"}}>
          <div><div style={{fontSize:15,fontWeight:600,color:"#2d3748"}}>{cartCount} item{cartCount>1?"s":""}</div><div style={{fontSize:14,fontWeight:700,color:"#28A745",marginTop:1}}>₹{cartTotal}</div></div>
          <button className="hover-lift" style={{background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:14,padding:"12px 22px",fontSize:14,fontWeight:600,cursor:"pointer",boxShadow:"3px 3px 10px rgba(163,177,198,0.3),-2px -2px 8px rgba(255,255,255,0.5),0 4px 14px rgba(102,126,234,0.25)"}} onClick={()=>setShowCart(true)}>View Cart</button>
        </div>}
        {showCart&&<GlassModal onClose={()=>setShowCart(false)}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:20,fontWeight:700,color:"#1a1a1a"}}>Your Cart</div>
            <button style={{background:"none",border:"none",fontSize:24,cursor:"pointer",color:"rgba(0,0,0,0.28)",padding:4}} onClick={()=>setShowCart(false)}><I name="close" size={22}/></button>
          </div>
          {cartItems.map(([id,qty])=>{const item=items.find(i=>i.id===Number(id));if(!item)return null;return(
            <div key={id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"none"}}>
              <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600}}>{item.name}</div><div style={{fontSize:13,color:"rgba(0,0,0,0.28)"}}>₹{item.price} × {qty}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontWeight:700,color:"#30A050",fontSize:16}}>₹{item.price*qty}</div>
                <Stepper qty={qty} onMinus={()=>setQty(item.id,-1)} onPlus={()=>setQty(item.id,1)}/>
              </div>
            </div>
          )})}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0 8px",borderTop:"none",marginTop:12}}>
            <div style={{fontSize:17,fontWeight:600}}>Total</div>
            <div style={{fontSize:24,fontWeight:800,color:"#30A050"}}>₹{cartTotal}</div>
          </div>
          <div style={{marginBottom:4}}>
            <label style={{fontSize:12,fontWeight:600,color:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",gap:4,marginBottom:5}}><I name="sticky_note_2" size={14} color="rgba(0,0,0,0.3)"/>Add a note (optional)</label>
            <textarea placeholder="e.g. Please send ripe tomatoes, no plastic bags..." value={orderNote} onChange={e=>setOrderNote(e.target.value)} rows={2} style={{width:"100%",padding:"11px 14px",borderRadius:12,border:"none",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:"rgba(255,255,255,0.6)",backdropFilter:"blur(10px)",resize:"none",transition:"border-color 0.2s,box-shadow 0.2s"}}/>
          </div>
          <PrimaryBtn onClick={placeOrder}>Place Order</PrimaryBtn>
        </GlassModal>}
      </>}

      {tab==="orders"&&<HouseholdOrderHistory orders={myOrders} onDispute={onDispute}/>}

      {tab==="settings"&&<div style={{padding:"16px 16px 90px",minHeight:"50vh"}}>
        <div style={{fontSize:18,fontWeight:700,color:"#1a1a1a",marginBottom:16}}>Settings</div>

        {/* Change PIN */}
        <div className="glass" style={{borderRadius:16,padding:20,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <I name="lock" size={22} color="#007AFF"/>
            <div style={{fontSize:16,fontWeight:700,color:"#1a1a1a"}}>Change PIN</div>
          </div>

          {pinMsg&&<div style={{padding:"10px 14px",borderRadius:12,marginBottom:12,fontSize:13,fontWeight:600,background:pinMsg.type==="error"?"rgba(255,69,58,0.08)":"rgba(48,209,88,0.08)",color:pinMsg.type==="error"?"#FF453A":"#30D158",border:`1px solid ${pinMsg.type==="error"?"rgba(255,69,58,0.15)":"rgba(48,209,88,0.15)"}`}}>
            <I name={pinMsg.type==="error"?"error":"check_circle"} size={14} style={{verticalAlign:"middle",marginRight:4}}/>{pinMsg.text}
          </div>}

          <label style={{fontSize:12,fontWeight:600,color:"rgba(0,0,0,0.45)",display:"block",marginBottom:4}}>Current PIN</label>
          <GlassInput type="password" maxLength={4} placeholder="••••" value={currentPin} onChange={e=>setCurrentPin(e.target.value.replace(/\D/g,"").slice(0,4))} style={{letterSpacing:8,textAlign:"center",fontSize:20}}/>

          <label style={{fontSize:12,fontWeight:600,color:"rgba(0,0,0,0.45)",display:"block",marginBottom:4}}>New PIN</label>
          <GlassInput type="password" maxLength={4} placeholder="••••" value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,"").slice(0,4))} style={{letterSpacing:8,textAlign:"center",fontSize:20}}/>

          <label style={{fontSize:12,fontWeight:600,color:"rgba(0,0,0,0.45)",display:"block",marginBottom:4}}>Confirm New PIN</label>
          <GlassInput type="password" maxLength={4} placeholder="••••" value={confirmPin} onChange={e=>setConfirmPin(e.target.value.replace(/\D/g,"").slice(0,4))} style={{letterSpacing:8,textAlign:"center",fontSize:20}}/>

          <PrimaryBtn onClick={handlePinChange} style={{marginTop:4}}>
            <I name="lock_reset" size={16} color="#fff" style={{verticalAlign:"middle",marginRight:4}}/> Update PIN
          </PrimaryBtn>
        </div>

        {/* Sign out */}
        <button className="hover-lift" onClick={onLogout} style={{width:"100%",padding:14,borderRadius:14,border:"none",background:"rgba(255,69,58,0.06)",color:"#FF453A",fontSize:15,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <I name="logout" size={18} color="#FF453A"/> Sign Out
        </button>
      </div>}

      <BottomTabBar active={tab} onChange={setTab} tabs={[
        {key:"order",icon:"shopping_cart",label:"Order"},
        {key:"orders",icon:"receipt_long",label:"My Orders",badge:myOrders.filter(o=>o.date===getToday()).length||0},
        {key:"settings",icon:"settings",label:"Settings"},
      ]}/>
    </div>
  );
}

// Kitchen Order History with time period + household filters
function KitchenOrderHistory({ orders }) {
  const [period, setPeriod] = useState("today");
  const [filterHH, setFilterHH] = useState("All");
  const [expandedOrder, setExpandedOrder] = useState(null);

  const range = getDateRange(period);
  const periodOrders = orders.filter(o => {
    const parts = o.date.split("-");
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    return d >= range.from && d <= range.to;
  });
  const filteredOrders = (filterHH === "All" ? periodOrders : periodOrders.filter(o => o.householdId === filterHH)).sort((a, b) => b.id - a.id);
  const totalCost = filteredOrders.reduce((s, o) => s + getActualTotal(o), 0);

  // Bifurcation by household
  const costByHH = HOUSEHOLDS.map(h => {
    const ho = periodOrders.filter(o => o.householdId === h.id);
    return { ...h, total: ho.reduce((s, o) => s + getActualTotal(o), 0), orderCount: ho.length };
  });

  return (
    <div style={{padding:"6px 16px 90px",minHeight:"50vh"}}>
      {/* Period pills */}
      <div style={{display:"flex",gap:6,padding:"10px 0 8px",overflowX:"auto"}}>
        {KITCHEN_TIME_PERIODS.map(tp=>(
          <CatPill key={tp.key} active={period===tp.key} onClick={()=>setPeriod(tp.key)}>{tp.label}</CatPill>
        ))}
      </div>

      {/* Household filter */}
      <div style={{display:"flex",gap:6,padding:"2px 0 10px",overflowX:"auto"}}>
        <button className="hover-lift" onClick={()=>setFilterHH("All")} style={{padding:"5px 14px",borderRadius:12,fontSize:12,fontWeight:600,whiteSpace:"nowrap",cursor:"pointer",border:`1px solid ${filterHH==="All"?"rgba(0,0,0,0.7)":"rgba(0,0,0,0.08)"}`,background:filterHH==="All"?"#1a1a1a":"rgba(255,255,255,0.6)",color:filterHH==="All"?"#fff":"rgba(0,0,0,0.4)",transition:"all 0.2s"}}>All Floors</button>
        {HOUSEHOLDS.map(h=>(
          <button key={h.id} className="hover-lift" onClick={()=>setFilterHH(h.id)} style={{padding:"5px 12px",borderRadius:12,fontSize:12,fontWeight:600,whiteSpace:"nowrap",cursor:"pointer",display:"flex",alignItems:"center",gap:4,border:`1px solid ${filterHH===h.id?`${h.color}`:"rgba(0,0,0,0.08)"}`,background:filterHH===h.id?`${h.color}30`:"rgba(255,255,255,0.6)",color:filterHH===h.id?"#1a1a1a":"rgba(0,0,0,0.4)",transition:"all 0.2s"}}><I name={h.icon} size={13}/>{h.name.replace(" Floor","F")}</button>
        ))}
      </div>

      {/* Cost Summary Cards */}
      {filterHH==="All"&&periodOrders.length>0&&<div className="glass" style={{borderRadius:16,padding:16,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a"}}>Cost Bifurcation</div>
          <div style={{fontSize:11,color:"rgba(0,0,0,0.35)",fontWeight:500}}>{periodOrders.length} order{periodOrders.length!==1?"s":""}</div>
        </div>
        {costByHH.filter(h=>h.orderCount>0).map(h=>(
          <div key={h.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:10,background:`${h.color}28`,border:`1px solid ${h.color}40`,display:"flex",alignItems:"center",justifyContent:"center"}}><I name={h.icon} size={16}/></div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{h.name}</div>
                <div style={{fontSize:11,color:"rgba(0,0,0,0.28)"}}>{h.orderCount} order{h.orderCount!==1?"s":""}</div>
              </div>
            </div>
            <div style={{fontSize:16,fontWeight:800,color:"#30A050"}}>₹{h.total}</div>
          </div>
        ))}
        {costByHH.filter(h=>h.orderCount>0).length===0&&<div style={{fontSize:13,color:"rgba(0,0,0,0.3)",textAlign:"center",padding:8}}>No orders</div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,marginTop:4,borderTop:"none"}}>
          <div style={{fontSize:15,fontWeight:700,color:"#1a1a1a"}}>Total</div>
          <div style={{fontSize:22,fontWeight:800,color:"#30A050"}}>₹{periodOrders.reduce((s,o)=>s+getActualTotal(o),0)}</div>
        </div>
      </div>}

      {/* Filtered summary when viewing single household */}
      {filterHH!=="All"&&filteredOrders.length>0&&<div className="glass" style={{borderRadius:14,padding:"12px 16px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><span style={{fontSize:14,fontWeight:700,color:"#1a1a1a"}}>{filteredOrders.length}</span><span style={{fontSize:12,color:"rgba(0,0,0,0.35)",marginLeft:4}}>order{filteredOrders.length!==1?"s":""}</span></div>
        <div><span style={{fontSize:12,color:"rgba(0,0,0,0.35)"}}>Total: </span><span style={{fontSize:16,fontWeight:800,color:"#30A050"}}>₹{totalCost}</span></div>
      </div>}

      {/* Order list */}
      {filteredOrders.length===0?<div style={{textAlign:"center",padding:"50px 20px",color:"rgba(0,0,0,0.28)"}}><I name="inbox" size={48} color="rgba(0,0,0,0.15)" style={{marginBottom:10}}/><div style={{fontWeight:600,color:"rgba(0,0,0,0.4)"}}>No orders in this period</div></div>
      :filteredOrders.map(order=>{
        const hh = HOUSEHOLDS.find(h=>h.id===order.householdId);
        const isExp = expandedOrder===order.id;
        return(
        <div key={order.id} className="glass card-enter" style={{borderRadius:16,marginBottom:10,overflow:"hidden",borderLeft:`4px solid ${order.status==="Sent"?"#30D158":order.status==="Preparing"?"#FF9F0A":"#FF453A"}`}}>
          {/* Collapsed */}
          <div style={{padding:"14px 16px",cursor:"pointer"}} onClick={()=>setExpandedOrder(isExp?null:order.id)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 8px",borderRadius:8,fontSize:11,fontWeight:600,background:`${hh?.color}25`,border:`1px solid ${hh?.color}40`,color:"#1a1a1a"}}><I name={hh?.icon} size={12}/>{order.householdName}</span>
                <span style={{fontSize:11,color:"rgba(0,0,0,0.25)"}}>{order.orderNumber||"#"+String(order.id).slice(-4)}</span>
                <Badge status={order.status}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontSize:15,fontWeight:700,color:"#30A050"}}>₹{getActualTotal(order)}</span>
                <span style={{fontSize:16,color:"rgba(0,0,0,0.2)",transition:"transform 0.2s",transform:isExp?"rotate(90deg)":"rotate(0deg)"}}>›</span>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:11,color:"rgba(0,0,0,0.28)"}}>{new Date(order.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:period!=="today"&&period!=="yesterday"?"numeric":undefined})} · {order.time}</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:11,color:"rgba(0,0,0,0.3)"}}>{order.items.length} item{order.items.length!==1?"s":""}</span>
                {order.deliveredBy&&<span style={{fontSize:11,color:"#30A050",fontWeight:600,display:"flex",alignItems:"center",gap:2}}><I name="local_shipping" size={12} color="#30A050"/>{order.deliveredBy}</span>}
              </div>
            </div>
          </div>
          {/* Expanded */}
          {isExp&&<div style={{padding:"0 16px 14px",borderTop:"none"}}>
            {/* Timestamps */}
            <div style={{display:"flex",gap:12,padding:"10px 0",flexWrap:"wrap"}}>
              {order.placedAt&&<div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"rgba(0,0,0,0.35)"}}><I name="schedule" size={13} color="rgba(0,0,0,0.3)"/>Placed: {new Date(order.placedAt).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>}
              {order.deliveredAt&&<div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#30A050"}}><I name="check_circle" size={13} color="#30A050"/>Delivered: {new Date(order.deliveredAt).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>}
            </div>
            <div style={{padding:"0 0 2px"}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,fontWeight:700,color:"rgba(0,0,0,0.3)",textTransform:"uppercase",letterSpacing:0.5,padding:"0 0 6px",borderBottom:"none"}}>
                <span style={{flex:2}}>Item</span><span style={{flex:0.5,textAlign:"center"}}>Qty</span><span style={{flex:0.7,textAlign:"right"}}>Rate</span><span style={{flex:0.7,textAlign:"right"}}>Total</span>
              </div>
              {order.items.map((it,i)=>{const mod=it.sentQty!=null&&it.sentQty!==it.qty;const eq=it.sentQty!=null?it.sentQty:it.qty;return(
                <div key={i} style={{display:"flex",alignItems:"center",fontSize:13,padding:"7px 0",borderBottom:"none",color:"rgba(0,0,0,0.55)"}}>
                  <span style={{flex:2,fontWeight:500}}>{it.name}</span>
                  <span style={{flex:0.5,textAlign:"center"}}>{mod?<><span style={{textDecoration:"line-through",color:"rgba(0,0,0,0.2)",fontSize:11}}>{it.qty}</span><span style={{color:"#007AFF",fontWeight:700,marginLeft:2}}>{it.sentQty}</span></>:it.qty}</span>
                  <span style={{flex:0.7,textAlign:"right",color:"rgba(0,0,0,0.35)"}}>₹{it.price}</span>
                  <span style={{flex:0.7,textAlign:"right",fontWeight:700,color:"#1a1a1a"}}>₹{it.price*eq}</span>
                </div>
              )})}
            </div>
            {order.items.some(it=>it.modifyReason)&&<div style={{marginTop:6,padding:"6px 10px",borderRadius:10,background:"rgba(0,122,255,0.05)",border:"none"}}>
              {order.items.filter(it=>it.modifyReason).map((it,i)=><div key={i} style={{fontSize:11,color:"#007AFF",fontWeight:500,lineHeight:1.5}}><b>{it.name}:</b> {it.modifyReason}</div>)}
            </div>}
            {order.deliveredBy&&<div style={{marginTop:8,padding:"8px 12px",borderRadius:10,background:"rgba(48,209,88,0.06)",border:"none",display:"flex",alignItems:"center",gap:8}}>
              <I name="local_shipping" size={20} color="#30A050"/>
              <div><div style={{fontSize:11,color:"rgba(0,0,0,0.3)"}}>Delivered by</div><div style={{fontSize:13,fontWeight:700,color:"#30A050"}}>{order.deliveredBy}</div></div>
            </div>}
            {order.note&&<div style={{marginTop:6,padding:"8px 12px",borderRadius:10,background:"rgba(255,159,10,0.06)",border:"none",display:"flex",alignItems:"flex-start",gap:6}}>
              <I name="sticky_note_2" size={16} color="#FF9F0A" style={{marginTop:1}}/>
              <div><div style={{fontSize:10,color:"rgba(0,0,0,0.3)",fontWeight:600}}>Note</div><div style={{fontSize:12,color:"rgba(0,0,0,0.55)",lineHeight:1.4}}>{order.note}</div></div>
            </div>}
            <div style={{display:"flex",justifyContent:"space-between",fontSize:15,fontWeight:700,paddingTop:10,borderTop:"none",marginTop:8,color:"#1a1a1a"}}><span>Order Total</span><span style={{color:"#30A050"}}>₹{getActualTotal(order)}</span></div>
            {/* Dispute info (view only for CK) */}
            {order.disputeStatus==="Disputed"&&<div style={{marginTop:8,padding:"8px 12px",borderRadius:10,background:"rgba(255,69,58,0.06)",border:"none",display:"flex",alignItems:"center",gap:6}}>
              <I name="warning" size={16} color="#FF453A"/><span style={{fontSize:12,fontWeight:600,color:"#FF453A"}}>Disputed: {order.disputeReason}</span>
            </div>}
            {order.disputeStatus==="Resolved"&&<div style={{marginTop:8,padding:"8px 12px",borderRadius:10,background:"rgba(48,209,88,0.06)",border:"none",display:"flex",alignItems:"center",gap:6}}>
              <I name="check_circle" size={16} color="#30D158"/><span style={{fontSize:12,fontWeight:600,color:"#30D158"}}>Dispute Resolved</span>
            </div>}
          </div>}
        </div>
      )})}
    </div>
  );
}

// Kitchen Settings - Driver Management
function KitchenSettings({ drivers, setDrivers, onLogout, loadDrivers }) {
  const [newDriver, setNewDriver] = useState("");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editName, setEditName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const driverName = (d) => typeof d === "string" ? d : d?.name || "";
  const driverId = (d) => typeof d === "string" ? null : d?.id;

  const handleAdd = async() => {
    const n = newDriver.trim();
    if (!n) return;
    setSaving(true);
    const result = await db.post("drivers", {name: n});
    if(result) { if(loadDrivers) await loadDrivers(); else setDrivers(p => [...p, result[0]||{id:Date.now(),name:n}]); }
    setNewDriver("");
    setSaving(false);
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditName(driverName(drivers[idx]));
    setConfirmDelete(null);
  };

  const saveEdit = async() => {
    const n = editName.trim();
    if (!n || editingIdx === null) return;
    setSaving(true);
    const id = driverId(drivers[editingIdx]);
    if(id) { await db.patch("drivers", "id=eq."+id, {name: n}); if(loadDrivers) await loadDrivers(); }
    else setDrivers(p => p.map((d, i) => i === editingIdx ? (typeof d==="string"?n:{...d,name:n}) : d));
    setEditingIdx(null); setEditName(""); setSaving(false);
  };

  const removeDriver = async(idx) => {
    setSaving(true);
    const id = driverId(drivers[idx]);
    if(id) { await db.del("drivers", "id=eq."+id); if(loadDrivers) await loadDrivers(); }
    else setDrivers(p => p.filter((_, i) => i !== idx));
    setConfirmDelete(null); setEditingIdx(null); setSaving(false);
  };

  return (
    <div style={{padding:"16px 16px 90px",minHeight:"50vh"}}>
      <div style={{fontSize:18,fontWeight:700,color:"#1a1a1a",marginBottom:16}}>Settings</div>

      {/* Driver Management */}
      <div className="glass" style={{borderRadius:16,padding:20,marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <I name="local_shipping" size={22} color="#007AFF"/>
          <div style={{fontSize:16,fontWeight:700,color:"#1a1a1a"}}>Manage Drivers</div>
          <span style={{marginLeft:"auto",fontSize:12,color:"rgba(0,0,0,0.3)",fontWeight:500}}>{drivers.length} driver{drivers.length!==1?"s":""}</span>
        </div>

        {/* Add new driver */}
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <GlassInput placeholder="Add new driver..." value={newDriver} onChange={e=>setNewDriver(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdd()} style={{flex:1,marginBottom:0}}/>
          <button className="hover-lift" onClick={handleAdd} style={{padding:"0 18px",borderRadius:14,border:"none",background:newDriver.trim()?"linear-gradient(135deg,#007AFF,#0055D4)":"rgba(0,0,0,0.06)",color:newDriver.trim()?"#fff":"rgba(0,0,0,0.25)",fontSize:14,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.2s"}}><I name="person_add" size={18} style={{verticalAlign:"middle"}}/></button>
        </div>

        {/* Driver list */}
        {drivers.length===0&&<div style={{textAlign:"center",padding:"24px 0",color:"rgba(0,0,0,0.3)"}}>
          <I name="person_off" size={36} color="rgba(0,0,0,0.15)" style={{marginBottom:8}}/>
          <div style={{fontSize:13,fontWeight:500}}>No drivers added yet</div>
        </div>}

        {drivers.map((d, idx) => (
          <div key={idx} className="card-enter" style={{borderRadius:14,marginBottom:8,overflow:"hidden",border:"none",background:"rgba(255,255,255,0.5)"}}>
            {editingIdx===idx ? (
              <div style={{padding:12}}>
                <label style={{fontSize:11,fontWeight:600,color:"rgba(0,0,0,0.35)",display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Rename Driver</label>
                <GlassInput value={editName} onChange={e=>setEditName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveEdit()} autoFocus style={{marginBottom:8}}/>
                <div style={{display:"flex",gap:8}}>
                  <button className="hover-lift" onClick={saveEdit} style={{flex:1,padding:"10px 0",borderRadius:12,border:"none",background:"linear-gradient(135deg,#007AFF,#0055D4)",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}><I name="check" size={15} style={{verticalAlign:"middle",marginRight:3}}/>Save</button>
                  <button className="hover-lift" onClick={()=>setEditingIdx(null)} style={{flex:1,padding:"10px 0",borderRadius:12,border:"none",background:"rgba(0,0,0,0.03)",color:"rgba(0,0,0,0.5)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
                </div>
              </div>
            ) : confirmDelete===idx ? (
              <div style={{padding:12}}>
                <div style={{fontSize:13,fontWeight:600,color:"#FF453A",marginBottom:10,display:"flex",alignItems:"center",gap:4}}><I name="warning" size={16} color="#FF453A"/>Remove "{driverName(d)}"?</div>
                <div style={{display:"flex",gap:8}}>
                  <button className="hover-lift" onClick={()=>removeDriver(idx)} style={{flex:1,padding:"10px 0",borderRadius:12,border:"none",background:"linear-gradient(135deg,#FF453A,#D63031)",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}><I name="delete" size={15} style={{verticalAlign:"middle",marginRight:3}}/>Remove</button>
                  <button className="hover-lift" onClick={()=>setConfirmDelete(null)} style={{flex:1,padding:"10px 0",borderRadius:12,border:"none",background:"rgba(0,0,0,0.03)",color:"rgba(0,0,0,0.5)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:12,background:"rgba(0,122,255,0.08)",border:"none",display:"flex",alignItems:"center",justifyContent:"center"}}><I name="person" size={20} color="#007AFF"/></div>
                  <div style={{fontSize:15,fontWeight:600,color:"#2d3748"}}>{driverName(d)}</div>
                </div>
                <div style={{display:"flex",gap:4}}>
                  <button className="hover-lift" onClick={()=>startEdit(idx)} style={{width:34,height:34,borderRadius:10,border:"none",background:"rgba(0,0,0,0.02)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I name="edit" size={16} color="rgba(0,0,0,0.4)"/></button>
                  <button className="hover-lift" onClick={()=>setConfirmDelete(idx)} style={{width:34,height:34,borderRadius:10,border:"none",background:"rgba(255,69,58,0.04)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I name="delete" size={16} color="#FF453A"/></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sign out */}
      <button className="hover-lift" onClick={onLogout} style={{width:"100%",padding:14,borderRadius:14,border:"none",background:"rgba(255,69,58,0.06)",color:"#FF453A",fontSize:15,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
        <I name="logout" size={18} color="#FF453A"/> Sign Out
      </button>
    </div>
  );
}

// Kitchen Dashboard
function KitchenDashboard({ items, setItems, orders, setOrders, onLogout, drivers, setDrivers, addDriver, onStatusUpdate, onDelivery, onModifyQty, onResolveDispute, loadDrivers, loadOrders, categories, loadCategories, loadItems }) {
  const [tab, setTab] = useState("orders");
  const [editItem, setEditItem] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({name:"",price:"",category_id:"",unit:"kg"});
  const [filterHousehold, setFilterHousehold] = useState("All");
  const [searchItems, setSearchItems] = useState("");
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [showOrdersList, setShowOrdersList] = useState(null); // "all" | "pending" | "disputed"
  const [modifying, setModifying] = useState(null);
  const [modQty, setModQty] = useState("");
  const [modReason, setModReason] = useState("");
  const [driverModal, setDriverModal] = useState(null);
  const [driverName, setDriverName] = useState("");
  const [addingNewDriver, setAddingNewDriver] = useState(false);
  const [newDriverName, setNewDriverName] = useState("");
  // Category management
  const [showCatMgmt, setShowCatMgmt] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [editingCat, setEditingCat] = useState(null);
  const [editCatName, setEditCatName] = useState("");
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null);
  const [catSaving, setCatSaving] = useState(false);
  // Item filter by category
  const [itemCatFilter, setItemCatFilter] = useState("All");
  // Bulk price update
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const todayOrders = orders.filter(o=>o.date===getToday());
  const filtered = filterHousehold==="All"?todayOrders:todayOrders.filter(o=>o.householdId===filterHousehold);
  const grandTotal = todayOrders.reduce((s,o)=>s+getActualTotal(o),0);
  const disputedOrders = orders.filter(o=>o.disputeStatus==="Disputed");

  const costByHousehold = HOUSEHOLDS.map(h=>{
    const ho=todayOrders.filter(o=>o.householdId===h.id);
    return{...h,total:ho.reduce((s,o)=>s+getActualTotal(o),0),orderCount:ho.length};
  });

  const updateStatus=async(oid,st)=>{
    if(st==="Sent"){setDriverModal(oid);setDriverName("");return;}
    setOrders(p=>p.map(o=>o.id===oid?{...o,status:st}:o));
    if(onStatusUpdate) onStatusUpdate(oid,st);
  };
  const confirmDelivery=async()=>{
    const dn = addingNewDriver ? newDriverName.trim() : (typeof driverName==="string"?driverName:"");
    if(!dn)return;
    if(addingNewDriver && dn) { if(addDriver) await addDriver(dn); }
    const now = new Date().toISOString();
    setOrders(p=>p.map(o=>o.id===driverModal?{...o,status:"Sent",deliveredBy:dn,deliveredAt:now}:o));
    if(onDelivery) onDelivery(driverModal, dn);
    setDriverModal(null);setDriverName("");setAddingNewDriver(false);setNewDriverName("");
  };

  const applyMod=async()=>{
    if(!modQty||!modReason.trim())return;
    const order=orders.find(o=>o.id===modifying.orderId);
    const item=(order?.items||[])[modifying.itemIndex];
    setOrders(p=>p.map(o=>{
      if(o.id!==modifying.orderId)return o;
      const ni=[...o.items];ni[modifying.itemIndex]={...ni[modifying.itemIndex],sentQty:Number(modQty),modifyReason:modReason.trim()};
      return{...o,items:ni,total:ni.reduce((s,it)=>s+it.price*(it.sentQty!=null?it.sentQty:it.qty),0)};
    }));
    if(onModifyQty&&item) onModifyQty(modifying.orderId, item, Number(modQty), modReason.trim());
    setModifying(null);setModQty("");setModReason("");
  };

  // --- Item CRUD ---
  const addItem=async()=>{
    if(!newItem.name||!newItem.price||!newItem.category_id)return;
    await db.post("items",{name:newItem.name,price:Number(newItem.price),unit:newItem.unit,category_id:Number(newItem.category_id)});
    setNewItem({name:"",price:"",category_id:"",unit:"kg"});setShowAdd(false);
    if(loadItems) await loadItems();
  };
  const saveEdit=async()=>{
    if(!editItem)return;
    await db.patch("items","id=eq."+editItem.id,{name:editItem.name,price:Number(editItem.price),unit:editItem.unit,category_id:Number(editItem.category_id)});
    setEditItem(null);
    if(loadItems) await loadItems();
  };
  const deleteItem=async(id)=>{
    await db.del("items","id=eq."+id);
    setEditItem(null);
    if(loadItems) await loadItems();
  };

  // --- Category CRUD ---
  const addCategory=async()=>{
    const n=newCatName.trim();if(!n)return;
    setCatSaving(true);
    await db.post("categories",{name:n,description:newCatDesc.trim()||null});
    setNewCatName("");setNewCatDesc("");
    if(loadCategories) await loadCategories();
    setCatSaving(false);
  };
  const saveCatEdit=async()=>{
    const n=editCatName.trim();if(!n||!editingCat)return;
    setCatSaving(true);
    await db.patch("categories","id=eq."+editingCat.id,{name:n});
    setEditingCat(null);setEditCatName("");
    if(loadCategories) await loadCategories();
    if(loadItems) await loadItems();
    setCatSaving(false);
  };
  const deleteCategory=async(catId)=>{
    setCatSaving(true);
    await db.del("categories","id=eq."+catId);
    setConfirmDeleteCat(null);
    if(loadCategories) await loadCategories();
    if(loadItems) await loadItems();
    setCatSaving(false);
  };

  // --- Bulk Price Update ---
  const parseBulkText=(text)=>{
    const lines=text.split("\n").filter(l=>l.trim());
    const parsed=[];
    for(const line of lines){
      let match = line.match(/^(.+?)[\t\-,:|]+\s*₹?\s*(\d+\.?\d*)\s*$/);
      if(!match) match = line.match(/^(.+?)\s+₹?\s*(\d+\.?\d*)\s*$/);
      if(match){
        const name=match[1].trim();
        const price=parseFloat(match[2]);
        if(name&&!isNaN(price)) parsed.push({name,price});
      }
    }
    return parsed;
  };

  const executeBulkUpdate=async()=>{
    const parsed=parseBulkText(bulkText);
    if(parsed.length===0){setBulkResult({type:"error",msg:"No valid entries found. Use format: Item Name - Price"});return}
    setBulkUpdating(true);
    let updated=0,notFound=[];
    for(const p of parsed){
      const item=items.find(i=>i.name.toLowerCase()===p.name.toLowerCase());
      if(item){
        await db.patch("items","id=eq."+item.id,{price:p.price});
        updated++;
      } else notFound.push(p.name);
    }
    await loadItems();
    setBulkUpdating(false);
    const msg=`Updated ${updated} item${updated!==1?"s":""}${notFound.length>0?" · Not found: "+notFound.join(", "):""}`;
    setBulkResult({type:notFound.length>0?"warning":"success",msg});
  };

  const filteredCatalog=items.filter(i=>{
    const matchSearch=i.name.toLowerCase().includes(searchItems.toLowerCase());
    const matchCat=itemCatFilter==="All"||i.category===itemCatFilter;
    return matchSearch&&matchCat;
  });

  const appStyle={fontFamily:"'Montserrat',sans-serif",maxWidth:430,margin:"0 auto",minHeight:"100vh",background:"#e8edf2",position:"relative",overflow:"hidden"};

  const KitchenOrbs=()=><>{[1,2,3].map(i=><div key={i} className={`bg-orb bg-orb-k${i} orb-float`} style={{animationDelay:`${i*4}s`}}/>)}</>;

  return (
    <div style={appStyle}>
      <KitchenOrbs/>
      <GlassStyle/>

      {/* Header */}
      <div style={{padding:"22px 20px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:10}}>
        <div>
          <div style={{fontSize:13,fontWeight:500,color:"rgba(0,0,0,0.3)",letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>{new Date().toLocaleDateString("en-IN",{weekday:"long"})}</div>
          <div style={{fontSize:22,fontWeight:700,color:"#2d3748",letterSpacing:-0.5}}>Central Kitchen</div>
        </div>
        <button className="hover-lift" style={{background:"linear-gradient(135deg,#FF6B81,#FF453A)",border:"none",color:"#fff",fontSize:12,cursor:"pointer",fontWeight:600,padding:"8px 16px",borderRadius:14,boxShadow:"3px 3px 8px rgba(163,177,198,0.35),-3px -3px 8px rgba(255,255,255,0.7),0 3px 10px rgba(255,69,58,0.2)"}} onClick={onLogout}>Sign Out</button>
      </div>

      {/* Stats - only on orders tab */}
      {tab==="orders"&&<div style={{display:"grid",gridTemplateColumns:disputedOrders.length>0?"1fr 1fr 1fr 1fr":"1fr 1fr 1fr",gap:12,padding:"14px 16px",position:"relative",zIndex:1}}>
        <div className="hover-lift" style={{borderRadius:18,padding:"16px 12px",textAlign:"center",cursor:"pointer",background:"#e8edf2",boxShadow:"6px 6px 14px rgba(163,177,198,0.35),-6px -6px 14px rgba(255,255,255,0.8)"}} onClick={()=>setShowOrdersList("all")}>
          <div style={{fontSize:26,fontWeight:700,color:"#2d3748",lineHeight:1}}>{todayOrders.length}</div>
          <div style={{fontSize:9,fontWeight:500,color:"rgba(45,55,72,0.35)",textTransform:"uppercase",letterSpacing:2,marginTop:6}}>Orders</div>
        </div>
        <div className="hover-lift" style={{borderRadius:18,padding:"16px 12px",textAlign:"center",cursor:"pointer",background:"#e8edf2",boxShadow:"6px 6px 14px rgba(163,177,198,0.35),-6px -6px 14px rgba(255,255,255,0.8)"}} onClick={()=>setShowCostBreakdown(true)}>
          <div style={{fontSize:26,fontWeight:700,color:"#28A745",lineHeight:1}}>₹{grandTotal}</div>
          <div style={{fontSize:9,fontWeight:500,color:"rgba(45,55,72,0.35)",textTransform:"uppercase",letterSpacing:2,marginTop:6}}>Cost</div>
        </div>
        <div className="hover-lift" style={{borderRadius:18,padding:"16px 12px",textAlign:"center",cursor:"pointer",background:"#e8edf2",boxShadow:"6px 6px 14px rgba(163,177,198,0.35),-6px -6px 14px rgba(255,255,255,0.8)"}} onClick={()=>setShowOrdersList("pending")}>
          <div style={{fontSize:26,fontWeight:700,color:"#E8900C",lineHeight:1}}>{todayOrders.filter(o=>o.status==="Pending").length}</div>
          <div style={{fontSize:9,fontWeight:500,color:"rgba(45,55,72,0.35)",textTransform:"uppercase",letterSpacing:2,marginTop:6}}>Pending</div>
        </div>
        {disputedOrders.length>0&&<div className="hover-lift" style={{borderRadius:18,padding:"16px 12px",textAlign:"center",cursor:"pointer",background:"#e8edf2",boxShadow:"6px 6px 14px rgba(163,177,198,0.35),-6px -6px 14px rgba(255,255,255,0.8)"}} onClick={()=>setShowOrdersList("disputed")}>
          <div style={{fontSize:26,fontWeight:700,color:"#FF453A",lineHeight:1}}>{disputedOrders.length}</div>
          <div style={{fontSize:9,fontWeight:500,color:"rgba(45,55,72,0.35)",textTransform:"uppercase",letterSpacing:2,marginTop:6}}>Disputes</div>
        </div>}
      </div>}

      {/* Cost Breakdown Modal */}
      {showCostBreakdown&&<GlassModal onClose={()=>setShowCostBreakdown(false)}>
        <div style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>Cost Breakdown</div>
        <div style={{fontSize:13,color:"rgba(0,0,0,0.28)",marginBottom:18}}>Today's cost bifurcated by household</div>
        {costByHousehold.map(h=>(
          <div key={h.id} className="glass" style={{borderRadius:14,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:42,height:42,borderRadius:14,background:`${h.color}30`,border:`1px solid ${h.color}50`,display:"flex",alignItems:"center",justifyContent:"center"}}><I name={h.icon} size={22}/></div>
              <div><div style={{fontSize:15,fontWeight:600,color:"#2d3748"}}>{h.name}</div><div style={{fontSize:12,color:"rgba(0,0,0,0.28)"}}>{h.orderCount} order{h.orderCount!==1?"s":""}</div></div>
            </div>
            <div style={{fontSize:20,fontWeight:800,color:h.total>0?"#30A050":"rgba(0,0,0,0.28)"}}>₹{h.total}</div>
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 4px 4px",borderTop:"none",marginTop:8}}>

      {/* Orders List Modal (for clickable stat cards) */}
      {showOrdersList&&<GlassModal onClose={()=>setShowOrdersList(null)}>
        <div style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>
          {showOrdersList==="all"?"Today's Orders":showOrdersList==="pending"?"Pending Orders":"Disputed Orders"}
        </div>
        <div style={{fontSize:13,color:"rgba(0,0,0,0.28)",marginBottom:18}}>
          {showOrdersList==="all"?`${todayOrders.length} orders today`:showOrdersList==="pending"?`${todayOrders.filter(o=>o.status==="Pending").length} awaiting action`:`${disputedOrders.length} unresolved disputes`}
        </div>
        {(showOrdersList==="all"?todayOrders:showOrdersList==="pending"?todayOrders.filter(o=>o.status==="Pending"):disputedOrders).sort((a,b)=>b.id-a.id).map(order=>{
          const hh=HOUSEHOLDS.find(h=>h.id===order.householdId);
          return(
          <div key={order.id} style={{borderRadius:14,padding:"12px 14px",marginBottom:8,background:"rgba(255,255,255,0.5)",border:"0.5px solid rgba(0,0,0,0.04)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{order.householdName}</span>
                <span style={{fontSize:11,color:"rgba(0,0,0,0.25)"}}>{order.orderNumber}</span>
              </div>
              <div style={{display:"flex",gap:4}}>
                <Badge status={order.status}/>
                {order.disputeStatus==="Disputed"&&<span style={{padding:"3px 8px",borderRadius:6,fontSize:10,fontWeight:600,background:"rgba(255,69,58,0.1)",color:"#FF453A"}}>Disputed</span>}
              </div>
            </div>
            <div style={{fontSize:12,color:"rgba(0,0,0,0.3)",marginBottom:4}}>{order.time} · {order.items.length} items · ₹{getActualTotal(order)}</div>
            {order.disputeReason&&<div style={{fontSize:12,color:"#FF453A",fontWeight:500}}><I name="flag" size={12} color="#FF453A" style={{verticalAlign:"middle",marginRight:3}}/>{order.disputeReason}</div>}
            {order.disputeStatus==="Disputed"&&onResolveDispute&&<button className="hover-lift" onClick={()=>onResolveDispute(order.id)} style={{marginTop:6,padding:"6px 14px",borderRadius:8,border:"none",background:"#30D158",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Mark Resolved</button>}
          </div>
        )})}
      </GlassModal>}
          <div style={{fontSize:17,fontWeight:600,color:"#1a1a1a"}}>Total Cost</div>
          <div style={{fontSize:26,fontWeight:800,color:"#30A050"}}>₹{grandTotal}</div>
        </div>
      </GlassModal>}

      {/* Modify Qty Modal */}
      {modifying&&(()=>{const order=orders.find(o=>o.id===modifying.orderId);const item=order?.items[modifying.itemIndex];if(!item)return null;return(
        <GlassModal onClose={()=>{setModifying(null);setModQty("");setModReason("")}}>
          <div style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>Modify Quantity</div>
          <div style={{fontSize:13,color:"rgba(0,0,0,0.28)",marginBottom:18}}>Adjust the sent quantity for this item</div>
          <div className="glass" style={{borderRadius:14,padding:"14px 16px",marginBottom:16}}>
            <div style={{fontSize:15,fontWeight:600,color:"#2d3748"}}>{item.name}</div>
            <div style={{fontSize:13,color:"rgba(0,0,0,0.28)",marginTop:2}}>
              Ordered: <span style={{fontWeight:700,color:"#1a1a1a"}}>{item.qty}</span>
              {item.sentQty!=null&&item.sentQty!==item.qty&&<span> · Previously sent: <span style={{fontWeight:700,color:"#007AFF"}}>{item.sentQty}</span></span>}
            </div>
          </div>
          <label style={{fontSize:13,fontWeight:600,color:"rgba(0,0,0,0.45)",display:"block",marginBottom:5}}>Quantity Sent</label>
          <GlassInput type="number" placeholder={String(item.qty)} value={modQty} onChange={e=>setModQty(e.target.value)} min="0"/>
          <label style={{fontSize:13,fontWeight:600,color:"rgba(0,0,0,0.45)",display:"block",marginBottom:5}}>Reason for Change</label>
          <textarea placeholder="e.g. Only 3 available in stock..." value={modReason} onChange={e=>setModReason(e.target.value)} rows={3} style={{width:"100%",padding:"13px 16px",borderRadius:14,border:"none",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:10,background:"rgba(255,255,255,0.6)",backdropFilter:"blur(10px)",resize:"none"}}/>
          {modQty&&Number(modQty)!==item.qty&&<div className="glass" style={{borderRadius:12,padding:"10px 14px",marginBottom:8,fontSize:13}}>
            <span style={{color:"rgba(0,0,0,0.45)"}}>Cost change: </span>
            <span style={{textDecoration:"line-through",color:"rgba(0,0,0,0.28)"}}>₹{item.price*item.qty}</span>
            <span style={{color:"#007AFF",fontWeight:700}}> → ₹{item.price*Number(modQty)}</span>
          </div>}
          <PrimaryBtn onClick={applyMod} style={{opacity:modQty&&modReason.trim()?1:0.5}}>Apply Modification</PrimaryBtn>
        </GlassModal>
      )})()}

      {/* Driver Name Modal */}
      {driverModal&&(()=>{const activeDriver=addingNewDriver?newDriverName.trim():driverName;return(
      <GlassModal onClose={()=>{setDriverModal(null);setDriverName("");setAddingNewDriver(false);setNewDriverName("")}}>
        <div style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>Mark as Delivered</div>
        <div style={{fontSize:13,color:"rgba(0,0,0,0.28)",marginBottom:18}}>Select or add a delivery person</div>
        <div style={{textAlign:"center",marginBottom:12}}><I name="local_shipping" size={52} color="#30D158"/></div>

        <label style={{fontSize:13,fontWeight:600,color:"rgba(0,0,0,0.45)",display:"block",marginBottom:5}}>Select Driver</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
          {drivers.map(d=>{const dn=typeof d==="string"?d:d?.name||"";return(
            <button key={dn} className="hover-lift" onClick={()=>{setDriverName(dn);setAddingNewDriver(false)}} style={{padding:"8px 16px",borderRadius:12,fontSize:13,fontWeight:600,cursor:"pointer",border:`1.5px solid ${!addingNewDriver&&driverName===dn?"#30D158":"rgba(0,0,0,0.08)"}`,background:!addingNewDriver&&driverName===dn?"rgba(48,209,88,0.1)":"rgba(255,255,255,0.6)",color:!addingNewDriver&&driverName===dn?"#30A050":"rgba(0,0,0,0.5)",transition:"all 0.2s"}}>{dn}</button>
          )})}
          <button className="hover-lift" onClick={()=>{setAddingNewDriver(true);setDriverName("")}} style={{padding:"8px 16px",borderRadius:12,fontSize:13,fontWeight:600,cursor:"pointer",border:`1.5px solid ${addingNewDriver?"#007AFF":"rgba(0,0,0,0.08)"}`,background:addingNewDriver?"rgba(0,122,255,0.08)":"rgba(255,255,255,0.6)",color:addingNewDriver?"#007AFF":"rgba(0,0,0,0.4)",transition:"all 0.2s",display:"flex",alignItems:"center",gap:4}}><I name="person_add" size={16}/> Add New</button>
        </div>

        {addingNewDriver&&<>
          <label style={{fontSize:13,fontWeight:600,color:"rgba(0,0,0,0.45)",display:"block",marginBottom:5}}>New Driver Name</label>
          <GlassInput placeholder="Enter driver name..." value={newDriverName} onChange={e=>setNewDriverName(e.target.value)} autoFocus/>
        </>}

        <PrimaryBtn onClick={confirmDelivery} style={{opacity:activeDriver?1:0.5,background:activeDriver?"linear-gradient(135deg,#30D158,#28A745)":"linear-gradient(135deg,#aaa,#999)",boxShadow:activeDriver?"0 4px 16px rgba(48,209,88,0.3)":"none"}}><I name="check_circle" size={18} color="#fff" style={{verticalAlign:"middle",marginRight:4}}/> Confirm Delivery</PrimaryBtn>
      </GlassModal>)})()}

      {/* Tabs moved to bottom */}

      {tab==="orders"&&<div style={{padding:"0 16px 90px",minHeight:"50vh"}}>
        <div style={{display:"flex",gap:8,padding:"12px 0 6px",overflowX:"auto"}}>
          <CatPill active={filterHousehold==="All"} catName="All" onClick={()=>setFilterHousehold("All")}>All</CatPill>
          {HOUSEHOLDS.map(h=><CatPill key={h.id} active={filterHousehold===h.id} catName={h.name} onClick={()=>setFilterHousehold(h.id)}><I name={h.icon} size={14}/> {h.name.replace(" Floor","F")}</CatPill>)}
        </div>
        {filtered.length===0?<div style={{textAlign:"center",padding:"60px 20px",color:"rgba(0,0,0,0.28)"}}><I name="inbox" size={52} color="rgba(0,0,0,0.18)" style={{marginBottom:12}}/><div style={{fontWeight:600,color:"rgba(0,0,0,0.45)"}}>No orders today</div></div>
        :filtered.sort((a,b)=>b.id-a.id).map(order=>{const hh=HOUSEHOLDS.find(h=>h.id===order.householdId);return(
          <div key={order.id} className="glass card-enter" style={{borderRadius:16,padding:16,marginBottom:10,borderLeft:`4px solid ${order.status==="Sent"?"#30D158":order.status==="Preparing"?"#FF9F0A":order.status==="Modified"?"#007AFF":"#FF453A"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:10,fontSize:12,fontWeight:600,background:`${hh?.color}25`,border:`1px solid ${hh?.color}40`,color:"#1a1a1a"}}><I name={hh?.icon} size={14} style={{verticalAlign:"middle"}}/> {order.householdName}</span>
                <span style={{fontSize:12,color:"rgba(0,0,0,0.28)"}}>{order.orderNumber||"#"+String(order.id).slice(-4)}</span>
              </div>
              <Badge status={order.status}/>
            </div>
            <div style={{fontSize:12,color:"rgba(0,0,0,0.28)",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
              <span style={{display:"flex",alignItems:"center",gap:3}}><I name="schedule" size={12} color="rgba(0,0,0,0.25)"/>{order.time}</span>
              {order.deliveredAt&&<span style={{display:"flex",alignItems:"center",gap:3,color:"#30A050",fontWeight:600}}><I name="check_circle" size={12} color="#30A050"/>{new Date(order.deliveredAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span>}
            </div>
            {order.items.map((it,i)=>{const mod=it.sentQty!=null&&it.sentQty!==it.qty;return(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,padding:"4px 0",color:"rgba(0,0,0,0.45)"}}>
                <span style={{flex:1}}>{it.name} × {it.qty}{mod&&<span style={{color:"#007AFF",fontWeight:600,fontSize:12}}> → {it.sentQty} sent</span>}</span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontWeight:600}}>₹{it.price*(it.sentQty!=null?it.sentQty:it.qty)}</span>
                  <button className="hover-lift" style={{padding:"3px 8px",borderRadius:8,border:"none",background:"rgba(0,122,255,0.06)",fontSize:11,fontWeight:600,color:"#007AFF",cursor:"pointer",whiteSpace:"nowrap"}} onClick={()=>{setModifying({orderId:order.id,itemIndex:i});setModQty(String(it.sentQty!=null?it.sentQty:it.qty));setModReason(it.modifyReason||"")}}><I name="edit" size={12} color="#007AFF" style={{verticalAlign:"middle",marginRight:2}}/>Qty</button>
                </div>
              </div>
            )})}
            {order.items.some(it=>it.modifyReason)&&<div style={{marginTop:6,padding:"8px 10px",borderRadius:10,background:"rgba(0,122,255,0.05)",border:"none"}}>
              {order.items.filter(it=>it.modifyReason).map((it,i)=><div key={i} style={{fontSize:11,color:"#007AFF",fontWeight:500,lineHeight:1.5}}><b>{it.name}:</b> {it.modifyReason}</div>)}
            </div>}
            {order.deliveredBy&&<div style={{marginTop:6,padding:"8px 12px",borderRadius:10,background:"rgba(48,209,88,0.06)",border:"none",display:"flex",alignItems:"center",gap:6}}>
              <I name="local_shipping" size={16} color="#30A050"/><span style={{fontSize:12,fontWeight:600,color:"#30A050"}}>Delivered by {order.deliveredBy}</span>
            </div>}
            {order.note&&<div style={{marginTop:6,padding:"8px 12px",borderRadius:10,background:"rgba(255,159,10,0.06)",border:"none",display:"flex",alignItems:"flex-start",gap:6}}>
              <I name="sticky_note_2" size={15} color="#FF9F0A" style={{marginTop:1}}/><div><span style={{fontSize:10,fontWeight:600,color:"rgba(0,0,0,0.3)"}}>Note: </span><span style={{fontSize:12,color:"rgba(0,0,0,0.55)"}}>{order.note}</span></div>
            </div>}
            {order.disputeStatus==="Disputed"&&<div style={{marginTop:6,padding:"8px 12px",borderRadius:10,background:"rgba(255,69,58,0.06)",border:"none",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><I name="flag" size={16} color="#FF453A"/><span style={{fontSize:12,fontWeight:600,color:"#FF453A"}}>Dispute: {order.disputeReason}</span></div>
              {onResolveDispute&&<button className="hover-lift" onClick={()=>onResolveDispute(order.id)} style={{padding:"4px 12px",borderRadius:8,border:"none",background:"#30D158",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>Resolve</button>}
            </div>}
            {order.disputeStatus==="Resolved"&&<div style={{marginTop:6,padding:"8px 12px",borderRadius:10,background:"rgba(48,209,88,0.06)",border:"none",display:"flex",alignItems:"center",gap:6}}>
              <I name="check_circle" size={16} color="#30D158"/><span style={{fontSize:12,fontWeight:600,color:"#30D158"}}>Dispute Resolved</span>
            </div>}
            <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:700,paddingTop:10,borderTop:"none",marginTop:8,color:"#1a1a1a"}}><span>Total</span><span>₹{getActualTotal(order)}</span></div>
            <div style={{display:"flex",gap:8,marginTop:10}}>
              {["Pending","Preparing","Sent"].map(st=>{const active=order.status===st;const cols={Pending:{bg:"linear-gradient(135deg,#FF6B81,#FF453A)",sh:"rgba(255,69,58,0.2)"},Preparing:{bg:"linear-gradient(135deg,#FFB840,#FF9F0A)",sh:"rgba(255,159,10,0.2)"},Sent:{bg:"linear-gradient(135deg,#5BE07A,#28A745)",sh:"rgba(48,209,88,0.2)"}};const c=cols[st];return(
                <button key={st} className="hover-lift" onClick={()=>updateStatus(order.id,st)} style={{flex:1,padding:"9px 0",borderRadius:14,fontSize:12,fontWeight:active?600:500,cursor:"pointer",background:active?c.bg:"#e8edf2",color:active?"#fff":"rgba(45,55,72,0.4)",border:"none",boxShadow:active?`3px 3px 8px ${c.sh},-2px -2px 6px rgba(255,255,255,0.5),0 0 12px ${c.sh}`:"4px 4px 10px rgba(163,177,198,0.3),-4px -4px 10px rgba(255,255,255,0.7)",transition:"all 0.3s",letterSpacing:0.5}}>{st}</button>
              )})}
            </div>
          </div>
        )})}
      </div>}

      {tab==="items"&&<div style={{padding:"0 16px 90px",minHeight:"50vh"}}>
        {/* Category Management Toggle */}
        <div style={{display:"flex",gap:8,padding:"14px 0 8px",alignItems:"center"}}>
          <div style={{flex:1,position:"relative"}}>
            <I name="search" size={18} color="rgba(0,0,0,0.28)" style={{position:"absolute",left:14,top:14,pointerEvents:"none"}}/>
            <GlassInput placeholder="Search catalog..." value={searchItems} onChange={e=>setSearchItems(e.target.value)} style={{paddingLeft:38,marginBottom:0}}/>
          </div>
          <button className="hover-lift" style={{background:"linear-gradient(135deg,#007AFF,#5856D6)",color:"#fff",border:"none",borderRadius:14,padding:"13px 18px",fontSize:14,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",boxShadow:"0 6px 20px rgba(0,122,255,0.3)"}} onClick={()=>setShowAdd(true)}>+ Add</button>
        </div>

        {/* Category filter pills */}
        <div style={{display:"flex",gap:6,padding:"4px 0 6px",overflowX:"auto"}}>
          <CatPill active={itemCatFilter==="All"} catName="All" onClick={()=>setItemCatFilter("All")}>All</CatPill>
          {(categories||[]).map(c=><CatPill key={c.id} active={itemCatFilter===c.name} catName={c.name} onClick={()=>setItemCatFilter(c.name)}>{c.name}</CatPill>)}
        </div>

        {/* Manage Categories & Bulk Update buttons */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0 10px"}}>
          <div style={{fontSize:12,color:"rgba(0,0,0,0.28)"}}>{filteredCatalog.length} items</div>
          <div style={{display:"flex",gap:6}}>
            <button className="hover-lift" onClick={()=>{setShowBulkUpdate(true);setBulkText("");setBulkResult(null)}} style={{padding:"6px 14px",borderRadius:10,border:"none",background:"rgba(48,209,88,0.06)",fontSize:12,fontWeight:600,color:"#30D158",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><I name="upload" size={14} color="#30D158"/>Bulk Prices</button>
            <button className="hover-lift" onClick={()=>setShowCatMgmt(true)} style={{padding:"6px 14px",borderRadius:10,border:"none",background:"rgba(88,86,214,0.06)",fontSize:12,fontWeight:600,color:"#5856D6",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><I name="category" size={14} color="#5856D6"/>Categories</button>
          </div>
        </div>

        {/* Item list */}
        {filteredCatalog.map(item=>(
          <div key={item.id} className="glass hover-lift card-enter" style={{borderRadius:16,padding:"14px 16px",marginBottom:10,cursor:"pointer"}} onClick={()=>setEditItem({...item,category_id:item.category_id||(categories||[]).find(c=>c.name===item.category)?.id||""})}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:"#2d3748",marginBottom:2}}>{item.name}</div><div style={{fontSize:12,color:"rgba(0,0,0,0.28)"}}>{item.category} · per {item.unit}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{fontSize:17,fontWeight:700,color:"#30A050"}}>₹{item.price}</div><div style={{fontSize:16,color:"rgba(0,0,0,0.28)"}}>›</div></div>
            </div>
          </div>
        ))}

        {/* Add Item Modal */}
        {showAdd&&<GlassModal onClose={()=>setShowAdd(false)}>
          <div style={{fontSize:20,fontWeight:700,marginBottom:16,color:"#1a1a1a"}}>Add New Item</div>
          <label style={{fontSize:13,fontWeight:600,color:"rgba(0,0,0,0.45)",display:"block",marginBottom:5}}>Item Name</label>
          <GlassInput placeholder="e.g. Ghee (500ml)" value={newItem.name} onChange={e=>setNewItem({...newItem,name:e.target.value})}/>
          <label style={{fontSize:13,fontWeight:600,color:"rgba(0,0,0,0.45)",display:"block",marginBottom:5}}>Price (₹)</label>
          <GlassInput type="number" placeholder="0" value={newItem.price} onChange={e=>setNewItem({...newItem,price:e.target.value})}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={{fontSize:13,fontWeight:600,color:"rgba(0,0,0,0.45)",display:"block",marginBottom:5}}>Category</label><GlassSelect value={newItem.category_id} onChange={e=>setNewItem({...newItem,category_id:e.target.value})}><option value="">Select...</option>{(categories||[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</GlassSelect></div>
            <div><label style={{fontSize:13,fontWeight:600,color:"rgba(0,0,0,0.45)",display:"block",marginBottom:5}}>Unit</label><GlassSelect value={newItem.unit} onChange={e=>setNewItem({...newItem,unit:e.target.value})}>{["kg","g","L","ml","pcs","pkt","dozen","loaf","bunch","btl","jar","box","roll","unit"].map(u=><option key={u}>{u}</option>)}</GlassSelect></div>
          </div>
          <PrimaryBtn onClick={addItem} style={{opacity:newItem.name&&newItem.price&&newItem.category_id?1:0.5}}>Add Item</PrimaryBtn>
        </GlassModal>}

        {/* Edit Item Modal */}
        {editItem&&<GlassModal onClose={()=>setEditItem(null)}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:20,fontWeight:700,color:"#1a1a1a"}}>Edit Item</div>
            <button className="hover-lift" style={{padding:"8px 14px",borderRadius:12,border:"none",background:"rgba(255,69,58,0.08)",color:"#FF453A",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}} onClick={()=>deleteItem(editItem.id)}><I name="delete" size={14} color="#FF453A"/>Delete</button>
          </div>
          <label style={{fontSize:13,fontWeight:600,color:"rgba(0,0,0,0.45)",display:"block",marginBottom:5}}>Item Name</label>
          <GlassInput value={editItem.name} onChange={e=>setEditItem({...editItem,name:e.target.value})}/>
          <label style={{fontSize:13,fontWeight:600,color:"rgba(0,0,0,0.45)",display:"block",marginBottom:5}}>Price (₹)</label>
          <GlassInput type="number" value={editItem.price} onChange={e=>setEditItem({...editItem,price:e.target.value})}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={{fontSize:13,fontWeight:600,color:"rgba(0,0,0,0.45)",display:"block",marginBottom:5}}>Category</label><GlassSelect value={editItem.category_id} onChange={e=>setEditItem({...editItem,category_id:e.target.value})}>{(categories||[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</GlassSelect></div>
            <div><label style={{fontSize:13,fontWeight:600,color:"rgba(0,0,0,0.45)",display:"block",marginBottom:5}}>Unit</label><GlassSelect value={editItem.unit} onChange={e=>setEditItem({...editItem,unit:e.target.value})}>{["kg","g","L","ml","pcs","pkt","dozen","loaf","bunch","btl","jar","box","roll","unit"].map(u=><option key={u}>{u}</option>)}</GlassSelect></div>
          </div>
          <PrimaryBtn onClick={saveEdit}>Save Changes</PrimaryBtn>
        </GlassModal>}

        {/* Bulk Price Update Modal */}
        {showBulkUpdate&&<GlassModal onClose={()=>setShowBulkUpdate(false)}>
          <div style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>Bulk Price Update</div>
          <div style={{fontSize:13,color:"rgba(0,0,0,0.3)",marginBottom:12}}>Paste item names with prices, one per line</div>
          <div style={{fontSize:11,color:"rgba(0,0,0,0.25)",marginBottom:12,padding:"10px 12px",borderRadius:10,background:"rgba(0,0,0,0.03)",fontFamily:"monospace",lineHeight:1.6}}>
            Onion - 45<br/>Potato - 30<br/>Tomato, 50<br/>Rice : 80<br/>Chicken	250
          </div>
          <textarea value={bulkText} onChange={e=>setBulkText(e.target.value)} placeholder={"Paste your price list here...\nItem Name - Price\nItem Name - Price"} style={{width:"100%",minHeight:180,padding:14,borderRadius:14,border:"none",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:10,background:"rgba(255,255,255,0.45)",backdropFilter:"blur(20px)",resize:"vertical",lineHeight:1.6}}/>
          {bulkText.trim()&&<div style={{fontSize:12,color:"rgba(0,0,0,0.3)",marginBottom:8}}>{parseBulkText(bulkText).length} items detected</div>}
          {bulkResult&&<div style={{padding:"10px 14px",borderRadius:12,marginBottom:10,fontSize:13,fontWeight:500,background:bulkResult.type==="success"?"rgba(48,209,88,0.1)":bulkResult.type==="warning"?"rgba(255,159,10,0.1)":"rgba(255,69,58,0.1)",color:bulkResult.type==="success"?"#30D158":bulkResult.type==="warning"?"#FF9F0A":"#FF453A",border:`1px solid ${bulkResult.type==="success"?"rgba(48,209,88,0.2)":bulkResult.type==="warning"?"rgba(255,159,10,0.2)":"rgba(255,69,58,0.2)"}`}}>{bulkResult.msg}</div>}
          <PrimaryBtn onClick={executeBulkUpdate} style={{opacity:bulkText.trim()&&!bulkUpdating?1:0.5,background:bulkUpdating?"rgba(0,0,0,0.1)":"linear-gradient(135deg,#30D158,#28A745)",boxShadow:"0 6px 20px rgba(48,209,88,0.3)"}}>
            {bulkUpdating?"Updating...":"Update Prices"}
          </PrimaryBtn>
        </GlassModal>}

        {/* Category Management Modal */}
        {showCatMgmt&&<GlassModal onClose={()=>{setShowCatMgmt(false);setEditingCat(null);setConfirmDeleteCat(null)}}>
          <div style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>Manage Categories</div>
          <div style={{fontSize:13,color:"rgba(0,0,0,0.3)",marginBottom:16}}>Add, rename or remove item categories</div>

          {/* Add new category */}
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            <GlassInput placeholder="New category name..." value={newCatName} onChange={e=>setNewCatName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCategory()} style={{flex:1,marginBottom:0}}/>
            <button className="hover-lift" onClick={addCategory} disabled={catSaving} style={{padding:"0 18px",borderRadius:14,border:"none",background:newCatName.trim()?"linear-gradient(135deg,#007AFF,#5856D6)":"rgba(0,0,0,0.06)",color:newCatName.trim()?"#fff":"rgba(0,0,0,0.25)",fontSize:14,fontWeight:600,cursor:"pointer"}}><I name="add" size={18} style={{verticalAlign:"middle"}}/></button>
          </div>

          {/* Category list */}
          {(categories||[]).length===0&&<div style={{textAlign:"center",padding:"24px 0",color:"rgba(0,0,0,0.3)"}}><I name="category" size={36} color="rgba(0,0,0,0.15)" style={{marginBottom:8}}/><div style={{fontSize:13,fontWeight:500}}>No categories yet</div></div>}
          {(categories||[]).map(cat=>(
            <div key={cat.id} className="card-enter" style={{borderRadius:14,marginBottom:8,overflow:"hidden",border:"none",background:"rgba(255,255,255,0.5)"}}>
              {editingCat?.id===cat.id?(
                <div style={{padding:12}}>
                  <label style={{fontSize:11,fontWeight:600,color:"rgba(0,0,0,0.35)",display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Rename</label>
                  <GlassInput value={editCatName} onChange={e=>setEditCatName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveCatEdit()} autoFocus style={{marginBottom:8}}/>
                  <div style={{display:"flex",gap:8}}>
                    <button className="hover-lift" onClick={saveCatEdit} disabled={catSaving} style={{flex:1,padding:"10px 0",borderRadius:12,border:"none",background:"linear-gradient(135deg,#007AFF,#5856D6)",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>Save</button>
                    <button className="hover-lift" onClick={()=>setEditingCat(null)} style={{flex:1,padding:"10px 0",borderRadius:12,border:"none",background:"rgba(0,0,0,0.03)",color:"rgba(0,0,0,0.5)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
                  </div>
                </div>
              ):confirmDeleteCat===cat.id?(
                <div style={{padding:12}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#FF453A",marginBottom:4}}><I name="warning" size={16} color="#FF453A"/> Remove "{cat.name}"?</div>
                  <div style={{fontSize:11,color:"rgba(0,0,0,0.35)",marginBottom:10}}>Items in this category will lose their category.</div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="hover-lift" onClick={()=>deleteCategory(cat.id)} disabled={catSaving} style={{flex:1,padding:"10px 0",borderRadius:12,border:"none",background:"linear-gradient(135deg,#FF453A,#D63031)",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>Remove</button>
                    <button className="hover-lift" onClick={()=>setConfirmDeleteCat(null)} style={{flex:1,padding:"10px 0",borderRadius:12,border:"none",background:"rgba(0,0,0,0.03)",color:"rgba(0,0,0,0.5)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
                  </div>
                </div>
              ):(
                <div style={{padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:12,background:"rgba(88,86,214,0.08)",border:"none",display:"flex",alignItems:"center",justifyContent:"center"}}><I name="category" size={18} color="#5856D6"/></div>
                    <div><div style={{fontSize:15,fontWeight:600,color:"#2d3748"}}>{cat.name}</div>{cat.description&&<div style={{fontSize:11,color:"rgba(0,0,0,0.3)"}}>{cat.description}</div>}</div>
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    <button className="hover-lift" onClick={()=>{setEditingCat(cat);setEditCatName(cat.name);setConfirmDeleteCat(null)}} style={{width:34,height:34,borderRadius:10,border:"none",background:"rgba(0,0,0,0.02)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I name="edit" size={16} color="rgba(0,0,0,0.4)"/></button>
                    <button className="hover-lift" onClick={()=>{setConfirmDeleteCat(cat.id);setEditingCat(null)}} style={{width:34,height:34,borderRadius:10,border:"none",background:"rgba(255,69,58,0.04)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I name="delete" size={16} color="#FF453A"/></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </GlassModal>}
      </div>}

      {tab==="history"&&<KitchenOrderHistory orders={orders}/>}

      {tab==="settings"&&<KitchenSettings drivers={drivers} setDrivers={setDrivers} onLogout={onLogout} loadDrivers={loadDrivers}/>}

      <BottomTabBar active={tab} onChange={setTab} tabs={[
        {key:"orders",icon:"receipt_long",label:"Orders",badge:todayOrders.filter(o=>o.status==="Pending").length||0},
        {key:"items",icon:"inventory_2",label:"Items"},
        {key:"history",icon:"history",label:"History"},
        {key:"settings",icon:"settings",label:"Settings"},
      ]}/>
    </div>
  );
}

// Order number prefixes per household
const ORDER_PREFIX = {"3F":"Y03","4F":"Y04","5F":"Y05","6F":"Y06","OF":"YOF"};

// Helper to normalize DB order into app format
function normalizeOrder(o, ois){
  const items=(ois||[]).map(oi=>({id:oi.item_id,name:oi.name,price:Number(oi.price),category:oi.category,unit:oi.unit,qty:oi.qty,sentQty:oi.sent_qty,modifyReason:oi.modify_reason,dbId:oi.id}));
  return{id:o.id,orderNumber:o.order_number,householdId:o.household_id,householdName:o.household_name,status:o.status,deliveredBy:o.delivered_by,placedAt:o.placed_at,deliveredAt:o.delivered_at,date:String(o.date||o.placed_at).split("T")[0],time:o.placed_at?new Date(o.placed_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):"",items,total:getActualTotal({items}),note:o.note||null,disputeStatus:o.dispute_status||null,disputeReason:o.dispute_reason||null,disputedAt:o.disputed_at||null};
}

// Spinner
const LoadingScreen=()=><div style={{minHeight:"100vh",background:"#e8edf2",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}><GlassStyle/><div style={{width:48,height:48,borderRadius:16,background:"#e8edf2",boxShadow:"6px 6px 14px rgba(163,177,198,0.35),-6px -6px 14px rgba(255,255,255,0.8)",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:24,height:24,border:"2.5px solid rgba(163,177,198,0.3)",borderTopColor:"#667eea",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/></div><div style={{color:"rgba(45,55,72,0.3)",fontSize:11,marginTop:18,fontFamily:"Montserrat",letterSpacing:3,textTransform:"uppercase"}}>Loading</div></div>;

// Main App
export default function App() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHouseholds = useCallback(async()=>{
    const hh = await db.get("households","select=*&order=id.asc");
    if(hh.length>0) setHouseholds(hh);
    else setHouseholds([...HOUSEHOLDS.map(h=>({...h,order_counter:0})),{...KITCHEN,order_counter:0}]);
  },[]);

  // READ items from Yoko's existing items table (joined with categories)
  const loadItems = useCallback(async()=>{
    const raw = await db.get("items","select=id,name,unit,price,category_id&order=name.asc&limit=1000");
    const cats = await db.get("categories","select=id,name&order=name.asc");
    const catMap = {};
    cats.forEach(c=>catMap[c.id]=c.name);
    if(raw.length>0){
      setItems(raw.map(it=>({...it, price:Number(it.price)||0, category:catMap[it.category_id]||"Uncategorized"})));
    } else setItems(DEFAULT_ITEMS);
  },[]);

  const loadCategories = useCallback(async()=>{
    const cats = await db.get("categories","select=*&order=name.asc");
    setCategories(cats||[]);
  },[]);

  const loadOrders = useCallback(async()=>{
    const ords = await db.get("orders","select=*&order=id.desc");
    const ois = await db.get("order_items","select=*&order=id.asc");
    if(ords.length>0||ois.length>0){
      const grouped={};ois.forEach(oi=>{if(!grouped[oi.order_id])grouped[oi.order_id]=[];grouped[oi.order_id].push(oi)});
      setOrders(ords.map(o=>normalizeOrder(o,grouped[o.id]||[])));
    }
  },[]);

  const loadDrivers = useCallback(async()=>{
    const d = await db.get("drivers","select=*&order=name.asc");
    if(d.length>0) setDrivers(d);
    else setDrivers([{id:1,name:"Ramesh"},{id:2,name:"Sunil"},{id:3,name:"Arjun"}]);
  },[]);

  useEffect(()=>{
    const init=async()=>{setLoading(true);await Promise.all([loadHouseholds(),loadItems(),loadCategories(),loadOrders(),loadDrivers()]);setLoading(false)};
    init();
    const iv=setInterval(loadItems,60000); // Refresh prices every 60s
    const ov=setInterval(loadOrders,10000); // Refresh orders every 10s (live sync across devices)
    return()=>{clearInterval(iv);clearInterval(ov)};
  },[loadHouseholds,loadItems,loadCategories,loadOrders,loadDrivers]);

  const handleOrder = async(order) => {
    const hid = order.householdId;
    const hh = households.find(h=>h.id===hid);
    const nextNum = (hh?.order_counter||0)+1;
    const prefix = ORDER_PREFIX[hid]||"Y00";
    const orderNumber = prefix + String(nextNum).padStart(3,"0");

    const orderPayload = {order_number:orderNumber,household_id:hid,household_name:order.householdName,status:"Pending",total:order.total,date:getToday(),placed_at:new Date().toISOString()};
    if(order.note) orderPayload.note = order.note;
    const result = await db.post("orders",orderPayload);
    if(result&&result[0]){
      const orderId=result[0].id;
      const ois=order.items.map(it=>({order_id:orderId,item_id:it.id,name:it.name,price:it.price,category:it.category,unit:it.unit,qty:it.qty,sent_qty:it.qty}));
      await db.post("order_items",ois);
      await db.patch("households","id=eq."+hid,{order_counter:nextNum});
      await loadHouseholds();
    }
    // Also update local state immediately for responsiveness
    setOrders(p=>[{id:Date.now(),orderNumber,householdId:hid,householdName:order.householdName,items:order.items.map(it=>({...it,sentQty:it.qty})),total:order.total,date:getToday(),time:new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}),status:"Pending",placedAt:new Date().toISOString(),note:order.note||null},...p]);
    loadOrders(); // Refresh from DB
  };

  const handleLogout = () => setUser(null);

  const handlePinChange = async(userId, newPin) => {
    await db.patch("households","id=eq."+userId,{pin:newPin});
    await loadHouseholds();
  };

  const handleStatusUpdate = async(orderId, status) => {
    await db.patch("orders","id=eq."+orderId,{status});
    await loadOrders();
  };

  const handleDelivery = async(orderId, driverName) => {
    await db.patch("orders","id=eq."+orderId,{status:"Sent",delivered_by:driverName,delivered_at:new Date().toISOString()});
    await loadOrders();
  };

  const handleModifyQty = async(orderId, item, newQty, reason) => {
    if(item.dbId) await db.patch("order_items","id=eq."+item.dbId,{sent_qty:newQty,modify_reason:reason});
    const order=orders.find(o=>o.id===orderId);
    if(order){
      const updItems=(order.items||[]).map(it=>it===item?{...it,sentQty:newQty,modifyReason:reason}:it);
      const newTotal=updItems.reduce((s,it)=>s+(Number(it.price)||0)*(it.sentQty!=null?it.sentQty:it.qty),0);
      await db.patch("orders","id=eq."+orderId,{total:newTotal});
    }
    await loadOrders();
  };

  const handleDispute = async(orderId, reason) => {
    await db.patch("orders","id=eq."+orderId,{dispute_status:"Disputed",dispute_reason:reason,disputed_at:new Date().toISOString()});
    setOrders(p=>p.map(o=>o.id===orderId?{...o,disputeStatus:"Disputed",disputeReason:reason,disputedAt:new Date().toISOString()}:o));
    await loadOrders();
  };

  const handleResolveDispute = async(orderId) => {
    await db.patch("orders","id=eq."+orderId,{dispute_status:"Resolved"});
    await loadOrders();
  };

  // Construct pins object from households for LoginScreen
  const pins = {};
  households.forEach(h=>pins[h.id]=h.pin);

  if(loading) return <LoadingScreen/>;
  if(!user) return <LoginScreen onLogin={setUser} pins={pins}/>;
  if(user.id==="CK") return <KitchenDashboard items={items} setItems={setItems} orders={orders} setOrders={setOrders} onLogout={handleLogout} drivers={drivers} setDrivers={setDrivers} addDriver={async(n)=>{await db.post("drivers",{name:n});await loadDrivers()}} onStatusUpdate={handleStatusUpdate} onDelivery={handleDelivery} onModifyQty={handleModifyQty} onResolveDispute={handleResolveDispute} loadDrivers={loadDrivers} loadOrders={loadOrders} categories={categories} loadCategories={loadCategories} loadItems={loadItems}/>;
  return <HouseholdDashboard user={user} items={items} orders={orders} onOrder={handleOrder} onDispute={handleDispute} onLogout={handleLogout} pins={pins} onPinChange={handlePinChange}/>;
}
