import React, { useState, useMemo } from 'react';

// Cleaned & fixed Pos With Calendar component
// - Fixed unterminated JSX issue (paddingTop stray quote)
// - Billing includes customer name & phone
// - Phone lookup (mock DB) auto-sets membership (silver/hour-wise, gold/discount)

const SERVICES = [
  { id: 1, title: 'Spearmint oil therapy', duration: 120, price: 5499 },
  { id: 2, title: 'Melting candle therapy', duration: 60, price: 3499 },
  { id: 3, title: 'Chocolate massage', duration: 90, price: 4499 },
  { id: 4, title: 'Deep cleaning facial', duration: 45, price: 2499 }
];
const THERAPISTS = ['Anita', 'Ravi', 'Sana', 'Imran'];

const MEMBER_DB = {
  '9876543210': { level: 'silver', name: 'Priya Sharma' },
  '9123456780': { level: 'gold', name: 'Amit Kumar' }
};

function fmtINR(n){ return n.toLocaleString('en-IN', {style:'currency', currency:'INR'}); }
function pad(n){ return n.toString().padStart(2,'0'); }
function minsToTime(m){ if (typeof m !== 'number' || isNaN(m)) return '-'; const hh=Math.floor(m/60); const mm=m%60; const period=hh>=12?'PM':'AM'; const hh12=((hh+11)%12)+1; return `${hh12}:${pad(mm)} ${period}`; }
function overlaps(aS,aE,bS,bE){return aS<bE && bS<aE;}

const DAY_START = 9*60; const DAY_END = 20*60; const STEP = 15;

function findNextAvailableStart(bookings, candidateStart, duration, step=STEP){
  for(let t=candidateStart; t+duration<=DAY_END; t+=step){
    let ok=true;
    for(const b of bookings){ if(overlaps(t,t+duration,b.start,b.end)){ ok=false; break; } }
    if(ok && t>=DAY_START) return t;
  }
  return null;
}
function nextAvailableStartsFor(bookings,duration,count=3,step=STEP){ const arr=[]; for(let t=DAY_START; t+duration<=DAY_END && arr.length<count; t+=step){ let ok=true; for(const b of bookings){ if(overlaps(t,t+duration,b.start,b.end)){ ok=false; break; } } if(ok) arr.push(t); } return arr; }
function generateGrid(year,month){ const first=new Date(year,month,1); const sd=first.getDay(); const start=new Date(year,month,1-sd); const arr=[]; for(let i=0;i<35;i++){ const d=new Date(start); d.setDate(start.getDate()+i); arr.push(d); } return arr; }

export default function Calender(){
  const [step,setStep]=useState(1);
  const [selectedDate,setSelectedDate]=useState(new Date());
  const [viewMonth,setViewMonth]=useState(new Date().getMonth());
  const [viewYear,setViewYear]=useState(new Date().getFullYear());

  const [bookings,setBookings]=useState([
    {therapist:'Ravi',date:new Date().toDateString(),start:14*60+30,end:15*60+30,title:'Walk-in'},
    {therapist:'Anita',date:new Date().toDateString(),start:10*60,end:11*60,title:'Service'},
    {therapist:'Ravi',date:new Date().toDateString(),start:16*60,end:17*60,title:'Booked online'},
    {therapist:'Sana',date:new Date(new Date().setDate(new Date().getDate()+1)).toDateString(),start:11*60,end:12*60,title:'Tomorrow booking'}
  ]);

  const [selectedServices,setSelectedServices]=useState([]);
  const [selectedTherapist,setSelectedTherapist]=useState(null);
  const [selectedStart,setSelectedStart]=useState(null);
  const [cart,setCart]=useState([]); // cart entries: {therapist,date,start,services: [{... , qty}]}

  const [customerName,setCustomerName]=useState('');
  const [customerPhone,setCustomerPhone]=useState('');

  const [useGST,setUseGST]=useState(false);
  const [gstPercent,setGstPercent]=useState(18);
  const [membership,setMembership]=useState('none');
  const [discountValue,setDiscountValue]=useState(0);

  const days = useMemo(()=>generateGrid(viewYear,viewMonth),[viewMonth,viewYear]);

  function toggleService(service){ setSelectedServices(prev=> prev.some(s=>s.id===service.id) ? prev.filter(s=>s.id!==service.id) : [...prev,service]); }
  function totalDuration(){ return selectedServices.reduce((s,it)=>s+it.duration,0); }
  function effectiveDuration(){ const td=totalDuration(); if(membership==='silver') return Math.ceil(td/60)*60; return td; }
  function bookingsForTherapistOnDate(therapist){ const ds=new Date(selectedDate).toDateString(); return bookings.filter(b=>b.therapist===therapist && b.date===ds).sort((a,b)=>a.start-b.start); }

  function lookupMembershipByPhone(phone){ const cleaned=String(phone).replace(/[^0-9]/g,''); if(cleaned.length===10 && MEMBER_DB[cleaned]){ const info=MEMBER_DB[cleaned]; setMembership(info.level); if(!customerName) setCustomerName(info.name||''); return info.level; } setMembership('none'); return 'none'; }
  function onPhoneChange(v){ setCustomerPhone(v); if(String(v).replace(/[^0-9]/g,'').length===10) lookupMembershipByPhone(v); }

  function chooseTherapist(therapist){ setSelectedTherapist(therapist); const b=bookingsForTherapistOnDate(therapist); const stepToUse = membership==='silver'?60:STEP; const earliest=findNextAvailableStart(b,DAY_START,effectiveDuration(),stepToUse); setSelectedStart(earliest); const servicesWithQty=selectedServices.map(s=>({...s,qty:1})); setCart([{therapist,date:new Date(selectedDate).toDateString(),start:earliest,services:servicesWithQty}]); }
  function pickSuggestedStart(therapist,startMin){ setSelectedTherapist(therapist); setSelectedStart(startMin); const servicesWithQty=selectedServices.map(s=>({...s,qty:1})); setCart([{therapist,date:new Date(selectedDate).toDateString(),start:startMin,services:servicesWithQty}]); setStep(4); }

  function addToCart(){ if(!selectedTherapist || selectedServices.length===0 || selectedStart===null) return alert('Select therapist, date, and services'); const combinedBooking={ therapist:selectedTherapist, date:new Date(selectedDate).toDateString(), start:selectedStart, end:selectedStart+effectiveDuration(), title:selectedServices.map(s=>s.title).join(', ') }; setBookings(prev=>[...prev,combinedBooking]); const servicesWithQty=selectedServices.map(s=>({...s,qty:1})); setCart([{therapist:selectedTherapist,date:new Date(selectedDate).toDateString(),start:selectedStart,services:servicesWithQty}]); setStep(4); }

  function changeQty(index,delta){ setCart(prev=>{ if(prev.length===0) return prev; const newCart=JSON.parse(JSON.stringify(prev)); const svc=newCart[0].services[index]; svc.qty=Math.max(1,(svc.qty||1)+delta); return newCart; }); }
  function setQty(index,value){ const v=Math.max(1,Number(value)||1); setCart(prev=>{ if(prev.length===0) return prev; const newCart=JSON.parse(JSON.stringify(prev)); newCart[0].services[index].qty=v; return newCart; }); }
  function removeFromCart(idx){ const it=cart[idx]; setBookings(prev=>prev.filter(b=>!(b.therapist===it.therapist && b.date===new Date(it.date).toDateString() && b.start===it.start && b.title===it.services.map(s=>s.title).join(', ')))); setCart(prev=>prev.filter((_,i)=>i!==idx)); }

  const itemsTotal = cart.length>0 ? cart[0].services.reduce((s,it)=>s+(it.price*(it.qty||1)),0) : 0;
  const membershipDiscount = membership==='silver'?0.05:membership==='gold'?0.1:0;
  const afterMembership = Math.max(0, itemsTotal*(1-membershipDiscount));
  const afterDiscount = Math.max(0, afterMembership - Number(discountValue||0));
  const gstAmount = useGST ? (afterDiscount * (Number(gstPercent)||0) / 100) : 0;
  const finalTotal = afterDiscount + gstAmount;

  return (
    <div style={{minHeight:'100vh',padding:24,background:'linear-gradient(135deg,#E6FFFA,#FFEFF5)'}}>
      <div style={{maxWidth:980,margin:'0 auto',background:'rgba(255,255,255,0.6)',backdropFilter:'blur(6px)',borderRadius:20,padding:20}}>
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:56,height:56,borderRadius:28,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,background:'linear-gradient(90deg,#0EA5A4,#F43F5E)'}}>SPA</div>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:'#065F46'}}>Aura Spa — POS</div>
              <div style={{fontSize:12,color:'#065F46'}}>Smooth bookings • Relaxing experience</div>
            </div>
          </div>
          <div style={{color:'#065F46'}}>Step {step} of 4</div>
        </header>

        <main style={{display:'grid',gap:20}}>
          {/* Step 1: Date */}
          {step===1 && (
            <section style={{background:'#fff',padding:16,borderRadius:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{fontWeight:700,color:'#065F46'}}>Choose Date</div>
                <div style={{fontSize:12,color:'#065F46'}}>Select appointment date</div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8,marginBottom:12,fontSize:12,textAlign:'center',color:'#065F46'}}>
                {['S','M','T','W','T','F','S'].map(d=> <div key={d}>{d}</div>)}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8}}>
                {days.map((d,i)=>{ const cur=d.getMonth()===viewMonth; const sel=d.toDateString()===selectedDate.toDateString(); return (
                  <button key={i} onClick={()=>setSelectedDate(new Date(d))} style={{padding:10,borderRadius:10,height:52,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,background:cur?'#ECFDF5':'#fff',boxShadow:sel?'0 0 0 4px rgba(255,209,220,0.6)':undefined}}>
                    <div style={{color: sel? '#F43F5E':'#065F46'}}>{d.getDate()}</div>
                  </button>
                );})}
              </div>

              <div style={{display:'flex',justifyContent:'flex-end',marginTop:12}}>
                <button onClick={()=>setStep(2)} style={{padding:'10px 16px',borderRadius:8,background:'linear-gradient(90deg,#0EA5A4,#F43F5E)',color:'#fff',fontWeight:700}}>Next: Services</button>
              </div>
            </section>
          )}

          {/* Step 2: Services */}
          {step===2 && (
            <section style={{background:'#fff',padding:16,borderRadius:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{fontWeight:700,color:'#065F46'}}>Choose Services</div>
                <div style={{fontSize:12,color:'#065F46'}}>Select one or more treatments</div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
                {SERVICES.map(s=>{ const isSel=selectedServices.some(x=>x.id===s.id); return (
                  <div key={s.id} style={{padding:12,borderRadius:12,display:'flex',justifyContent:'space-between',alignItems:'center',background:isSel?'#FFF1F2':'#fff',border:'1px solid #ECFDF5'}}>
                    <div>
                      <div style={{fontWeight:700,color:'#065F46'}}>{s.title}</div>
                      <div style={{fontSize:12,color:'#065F46'}}>{s.duration} min</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:700,color:'#F43F5E'}}>{fmtINR(s.price)}</div>
                      <button onClick={()=>toggleService(s)} style={{marginTop:8,padding:'6px 10px',borderRadius:8,background:isSel?'#F43F5E':'#ECFDF5',color:isSel?'#fff':'#065F46',fontWeight:700}}>{isSel?'Selected':'Select'}</button>
                    </div>
                  </div>
                );})}
              </div>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
                <button onClick={()=>setStep(1)} style={{padding:'8px 12px',borderRadius:8,border:'1px solid #ECFDF5'}}>Back</button>
                <button onClick={()=>setStep(3)} disabled={selectedServices.length===0} style={{padding:'10px 16px',borderRadius:8,background:'linear-gradient(90deg,#0EA5A4,#F43F5E)',color:'#fff',fontWeight:700}}>Next: Therapists</button>
              </div>
            </section>
          )}

          {/* Step 3: Therapists */}
          {step===3 && (
            <section style={{background:'#fff',padding:16,borderRadius:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{fontWeight:700,color:'#065F46'}}>Available Therapists</div>
                <div style={{fontSize:12,color:'#065F46'}}>Based on total duration {totalDuration()} min</div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
                {THERAPISTS.map(t=>{ const bookingsFor=bookingsForTherapistOnDate(t); const stepToUse=membership==='silver'?60:STEP; const earliest=findNextAvailableStart(bookingsFor,DAY_START,effectiveDuration(),stepToUse); const suggestions=nextAvailableStartsFor(bookingsFor,effectiveDuration(),3,stepToUse); return (
                  <div key={t} style={{padding:12,borderRadius:12,border:'1px solid #ECFDF5'}}>
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <div>
                        <div style={{fontWeight:700,color:'#065F46'}}>{t}</div>
                        <div style={{fontSize:12,color:'#065F46'}}>Working: {minsToTime(DAY_START)} - {minsToTime(DAY_END)}</div>

                        <div style={{marginTop:8,fontSize:13}}>
                          <div style={{fontWeight:700,color:'#F43F5E'}}>Booked</div>
                          {bookingsFor.length===0 && <div style={{fontSize:12,color:'#9CA3AF'}}>No bookings</div>}
                          {bookingsFor.map((b,idx)=> <div key={idx} style={{display:'inline-block',marginTop:6,marginRight:6,background:'#FFF1F2',color:'#B91C1C',padding:'6px 8px',borderRadius:999,fontSize:12}}>{b.title} • {minsToTime(b.start)} - {minsToTime(b.end)}</div>)}
                        </div>
                      </div>

                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:13}}>{earliest? <span style={{fontWeight:700,color:'#065F46'}}>Next: {minsToTime(earliest)}</span> : <span style={{color:'#DC2626'}}>No slot</span>}</div>
                        <button onClick={()=>chooseTherapist(t)} style={{marginTop:8,padding:'8px 10px',borderRadius:8,background:'linear-gradient(90deg,#0EA5A4,#F43F5E)',color:'#fff',fontWeight:700}}>Choose</button>
                      </div>
                    </div>

                    <div style={{marginTop:10}}>
                      <div style={{fontSize:12,color:'#065F46',marginBottom:6}}>Suggested starts</div>
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        {suggestions.length===0 && <div style={{fontSize:12,color:'#9CA3AF'}}>No available starts</div>}
                        {suggestions.map(st=> <button key={st} onClick={()=>pickSuggestedStart(t,st)} style={{padding:'6px 10px',borderRadius:999,background:'#ECFDF5',border:'1px solid #D1FAE5'}}>{minsToTime(st)}</button>)}
                      </div>
                    </div>
                  </div>
                );})}
              </div>

              <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}>
                <button onClick={()=>setStep(2)} style={{padding:'8px 12px',borderRadius:8,border:'1px solid #ECFDF5'}}>Back</button>
                <button onClick={()=>addToCart()} disabled={!selectedTherapist} style={{padding:'10px 16px',borderRadius:8,background:'linear-gradient(90deg,#0EA5A4,#F43F5E)',color:'#fff',fontWeight:700}}>Next: Billing</button>
              </div>
            </section>
          )}

          {/* Step 4: Billing */}
          {step===4 && (
            <section style={{background:'#fff',padding:16,borderRadius:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{fontWeight:700,color:'#065F46'}}>Billing & Review</div>
                <div style={{fontSize:12,color:'#065F46'}}>Confirm appointment & payment</div>
              </div>

              <div style={{padding:12,background:'#ECFDF5',borderRadius:8,marginBottom:12}}>
                <div style={{fontWeight:700}}>Therapist: {cart[0]?.therapist || selectedTherapist || '-'}</div>
                <div style={{fontSize:12,color:'#065F46'}}>{(cart[0]?.date? new Date(cart[0].date).toDateString(): new Date(selectedDate).toDateString())} • {minsToTime(cart[0]?.start ?? selectedStart ?? 0)}</div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div>
                  <label style={{display:'block',fontSize:13,fontWeight:700}}>Customer name</label>
                  <input value={customerName} onChange={e=>setCustomerName(e.target.value)} placeholder="Full name" style={{width:'100%',padding:10,borderRadius:8,border:'1px solid #E6E6E6'}} />
                </div>
                <div>
                  <label style={{display:'block',fontSize:13,fontWeight:700}}>Phone</label>
                  <input value={customerPhone} onChange={e=>onPhoneChange(e.target.value)} placeholder="10-digit phone" style={{width:'100%',padding:10,borderRadius:8,border:'1px solid #E6E6E6'}} />
                  <div style={{fontSize:12,color:'#065F46',marginTop:6}}>Detected membership: <strong>{membership}</strong></div>
                </div>
              </div>

              <div style={{padding:12,borderRadius:8,border:'1px solid #E6E6E6',marginBottom:12}}>
                <div style={{fontWeight:700,marginBottom:8}}>Selected Services</div>
                {(cart[0]?.services ?? selectedServices.map(s=>({...s, qty:1}))).map((s,i)=> (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0'}}>
                    <div>
                      <div style={{fontWeight:700,color:'#065F46'}}>{s.title}</div>
                      <div style={{fontSize:12,color:'#065F46'}}>{s.duration} min</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{fontSize:14}}>{fmtINR(s.price)}</div>
                      <div style={{display:'flex',alignItems:'center',border:'1px solid #E6E6E6',borderRadius:6}}>
                        <button onClick={()=>changeQty(i,-1)} style={{padding:'6px 8px'}}>-</button>
                        <input type="number" value={s.qty ?? 1} onChange={e=>setQty(i,e.target.value)} style={{width:56,textAlign:'center',border:'none'}} />
                        <button onClick={()=>changeQty(i,1)} style={{padding:'6px 8px'}}>+</button>
                      </div>
                      <div style={{fontWeight:700}}>{fmtINR(s.price * ((s.qty ?? 1)))}</div>
                    </div>
                  </div>
                ))}

                <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,marginTop:12,borderTop:'1px solid #F3F4F6',paddingTop:12}}>
                  <div>Subtotal</div>
                  <div>{fmtINR(itemsTotal)}</div>
                </div>
              </div>

              <div style={{padding:12,borderRadius:8,border:'1px solid #E6E6E6'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <label style={{fontSize:13}}>Membership</label>
                  <select value={membership} onChange={e=>setMembership(e.target.value)} style={{padding:8,borderRadius:6}}><option value="none">None</option><option value="silver">Silver (hour-wise)</option><option value="gold">Gold (10% off)</option></select>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <label style={{fontSize:13}}>Discount</label>
                  <input type="number" value={discountValue} onChange={e=>setDiscountValue(e.target.value)} style={{padding:8,borderRadius:6,width:120}} placeholder="Flat amount" />
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                  <input id="gst" type="checkbox" checked={useGST} onChange={e=>setUseGST(e.target.checked)} />
                  <label htmlFor="gst">Apply GST</label>
                  {useGST && <input type="number" value={gstPercent} onChange={e=>setGstPercent(e.target.value)} style={{width:80,padding:6,borderRadius:6}} />}
                </div>

                <div style={{display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:18}}><div>Total</div><div>{fmtINR(finalTotal)}</div></div>

                <div style={{display:'flex',gap:8,marginTop:12}}>
                  <button onClick={()=>{ alert('Payment successful!'); setCart([]); setStep(1); }} style={{flex:1,padding:12,borderRadius:8,background:'linear-gradient(90deg,#0EA5A4,#F43F5E)',color:'#fff',fontWeight:800}}>Pay & Confirm</button>
                  <button onClick={()=>{ setCart([]); setStep(1); }} style={{padding:12,borderRadius:8,border:'1px solid #E6E6E6'}}>Cancel</button>
                </div>
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}
