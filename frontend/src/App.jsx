import RealMatches from './RealMatches.jsx'
import { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const MARKETS_TABS = ["3 Way & O/U", "Double Chance", "GG/NG", "Draw No Bet", "Other Markets"];
const TOP_LEAGUES = [
  {name:"Ghana Premier League", count:28}, {name:"England Premier League", count:92},
  {name:"Spain La Liga", count:117}, {name:"Italy Serie A", count:150},
  {name:"Germany Bundesliga", count:39},
];

const INITIAL_GAMES = {
  today: [],
  tomorrow: [],
  future: []
};
const VIRTUAL_GAMES = [];

export default function App(){
  const [mainTab,setMainTab]=useState('Sports');
  const [gameDay,setGameDay]=useState('today');
  const [leagueFilter,setLeagueFilter]=useState('All');
  const [marketTab,setMarketTab]=useState('3 Way & O/U');
  const [gamesData,setGamesData]=useState(INITIAL_GAMES);
  const [liveScores,setLiveScores]=useState(true);
  const [betslip,setBetslip]=useState([]);
  const [showBetslip,setShowBetslip]=useState(false);
  const [stake,setStake]=useState(0.10);
  const [user,setUser]=useState(null);
  const [balance,setBalance]=useState(0.03);
  const [showAuth,setShowAuth]=useState(false);
  const [authMode,setAuthMode]=useState('login');
  const [phone,setPhone]=useState('');
  const [password,setPassword]=useState('');
  const [showDeposit,setShowDeposit]=useState(false);
  const [depositAmt,setDepositAmt]=useState('');
  const [myBets,setMyBets]=useState([]);
  const [betslipView,setBetslipView]=useState('betslip');
  const [tab,setTab]=useState('football');
  const [showAdmin,setShowAdmin]=useState(false);
  const [adminOdds,setAdminOdds]=useState({id:'', h:'', d:'', a:''});
  const [multiplier,setMultiplier]=useState(1.00);
  const [isFlying,setIsFlying]=useState(false);
  const [crashPoint,setCrashPoint]=useState(null);
  const [aviatorBet,setAviatorBet]=useState(10);
  const [autoCashout,setAutoCashout]=useState(2.0);
  const [autoOn,setAutoOn]=useState(false);
  const [cashed,setCashed]=useState(false);
  const [virtualScore,setVirtualScore]=useState("1-0");
  const [realMode,setRealMode]=useState(false);
  const [animationGame,setAnimationGame]=useState(null);

  const ADMIN_PHONES = ["0550000000"];
  const isAdmin = user && ADMIN_PHONES.includes(user.phone);

  const baseGames = tab==='virtual' ? {today: VIRTUAL_GAMES, tomorrow:[], future:[]} : gamesData;
  const filteredGames = (baseGames[gameDay]||[]).filter(g=> leagueFilter==='All' || g.league.includes(leagueFilter.split(' ')[0]));
  const totalOdds=betslip.reduce((a,b)=>a*parseFloat(b.oddValue||'1'),1)||1.00;
  const potWin=(stake*totalOdds).toFixed(2);

 
  useEffect(()=>{
    const t=localStorage.getItem('sporty_token');
    if(t) fetch(API_URL+"/api/me",{headers:{Authorization:"Bearer "+t}}).then(r=>r.json()).then(d=>{if(d.phone){setUser(d); setBalance(d.balance); setMyBets(d.bets||[])}});
  },[]);

 useEffect(()=>{
  if(!realMode) return;
  fetch(API_URL+"/api/real-games").then(r=>r.json()).then(data=>{
    const realGames = data.games || data;
    if(realGames && realGames.length>0){
      setGamesData(prev=>({...prev, today: realGames}));
    }
  }).catch(()=>{});
},[realMode]);
  const handleAuth=async()=>{const r=await fetch(API_URL+"/api/"+authMode,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({phone,password})}); const d=await r.json(); if(d.token){localStorage.setItem('sporty_token',d.token); setUser(d.user); setBalance(d.user.balance); setShowAuth(false);} else alert(d.error);};
  const handleDeposit=async()=>{const r=await fetch(API_URL+"/api/deposit",{method:'POST', headers:{'Content-Type':'application/json', Authorization:"Bearer "+localStorage.getItem('sporty_token')}, body:JSON.stringify({amount:depositAmt, phone:"0550000000"})}); const d=await r.json(); if(d.success){setBalance(d.balance); setShowDeposit(false);}};
  const placeBet=async()=>{if(!user) return setShowAuth(true); const r=await fetch(API_URL+"/api/bets",{method:'POST', headers:{'Content-Type':'application/json', Authorization:"Bearer "+localStorage.getItem('sporty_token')}, body:JSON.stringify({selections:betslip, stake, totalOdds})}); const d=await r.json(); if(d.success){setBalance(d.balance); setMyBets([d.bet, ...myBets]); setBetslip([]); setBetslipView('cashout');}};
  const settleBet=async(b,result)=>{const r=await fetch(API_URL+"/api/bets/"+b.id+"/settle",{method:'POST', headers:{'Content-Type':'application/json', Authorization:"Bearer "+localStorage.getItem('sporty_token')}, body:JSON.stringify({result})}); const d=await r.json(); setBalance(d.balance); setMyBets(myBets.map(x=>x.id===b.id?d.bet:x));};
  const autoSettleAll=async()=>{for(const b of myBets.filter(x=>x.status==='pending')){await settleBet(b, Math.random()>0.5?'won':'lost');}};
  const updateOdds=()=>{setGamesData(prev=>{const next=JSON.parse(JSON.stringify(prev)); Object.keys(next).forEach(day=>{next[day].forEach(g=>{if(g.id==adminOdds.id){if(adminOdds.h) g.odds.h=adminOdds.h; if(adminOdds.d) g.odds.d=adminOdds.d; if(adminOdds.a) g.odds.a=adminOdds.a;}})}); return next;}); setAdminOdds({id:'',h:'',d:'',a:''}); alert('Odds updated!');};
  const startAviator=async()=>{const r=await fetch(API_URL+"/api/aviator/crash"); const d=await r.json(); setCrashPoint(d.crashPoint); setIsFlying(true); setMultiplier(1.00); setCashed(false); let m=1.00; const interval=setInterval(()=>{m+=0.05; setMultiplier(Number(m.toFixed(2))); if(autoOn && m>=autoCashout && !cashed){setCashed(true); clearInterval(interval); setIsFlying(false); setBalance(b=>b+aviatorBet*m); return;} if(m>=d.crashPoint){clearInterval(interval); setIsFlying(false); setTimeout(()=>setMultiplier(1.00),2000);}},100);};

  const renderContent = () => {
    if(tab==='aviator'){
      return <div style={{background:'#243a29', padding:15, borderRadius:8, textAlign:'center'}}><h2 style={{color:'#ffcc00', fontSize:40}}>{multiplier.toFixed(2)}x</h2><div style={{fontSize:50}}>{isFlying?'✈️':cashed?'💰':'💥'}</div><div style={{display:'flex', gap:6, justifyContent:'center', marginTop:10}}><input type="number" value={aviatorBet} onChange={e=>setAviatorBet(e.target.value)} style={{width:60, padding:6, borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', color:'black'}}/><input type="number" value={autoCashout} onChange={e=>setAutoCashout(parseFloat(e.target.value))} style={{width:50, padding:6, borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', color:'black'}}/></div><div style={{display:'flex', gap:6, justifyContent:'center', marginTop:10}}><button onClick={startAviator} disabled={isFlying} style={{background:isFlying?'#555':'#ffcc00', color:'black', padding:'8px 20px', borderRadius:5, fontWeight:'bold'}}>BET</button><button onClick={()=>{setCashed(true); setIsFlying(false); setBalance(b=>b+aviatorBet*multiplier)}} disabled={!isFlying} style={{background:'#2ecc71', padding:'8px 15px', borderRadius:5}}>Cashout</button></div></div>;
    }
    if(mainTab==='Promotions'){
      return <div style={{background:'#243a29', padding:15, borderRadius:8}}><h3 style={{color:'#ffcc00'}}>🔥 Promotions</h3><div style={{background:'#1e2d24', padding:12, borderRadius:6, marginTop:10}}><b>Welcome 100%</b><div style={{fontSize:11, color:'#aaa'}}>Deposit GHS 50 get GHS 50 free</div></div></div>;
    }
    if(mainTab==='Jackpot'){
      return <div style={{background:'#243a29', padding:15, borderRadius:8, textAlign:'center'}}><h3 style={{color:'#ffcc00'}}>💰 Jackpot GHS 500,000</h3>{gamesData.today.slice(0,3).map(g=><div key={g.id} style={{display:'flex', justifyContent:'space-between', padding:8, background:'#1e2d24', marginTop:6, borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black'}}><span style={{fontSize:11}}>{g.home}</span><button onClick={()=>addBet(g,'1',g.odds.h)} style={{background:'#5fcf46', padding:'2px 6px', borderRadius:3, fontSize:10}}>{g.odds.h}</button></div>)}</div>;
    }
    if(mainTab==='Livescore'){
      return <div style={{background:'#243a29', padding:12, borderRadius:8}}><h3 style={{color:'#8fdf82'}}>🔴 Livescore</h3>{gamesData.today.filter(g=>g.minute.includes("'")).map(g=><div key={g.id} style={{display:'flex', justifyContent:'space-between', padding:10, borderBottom:'1px solid #1e2d24'}}><span>{g.home}</span><span style={{color:'#ffcc00', fontWeight:'bold'}}>{g.score} {g.minute}</span></div>)}</div>;
    }
    if(mainTab==='Results'){
      return <div style={{background:'#243a29', padding:12, borderRadius:8}}><h3>📊 Results</h3>{myBets.filter(b=>b.status!=='pending').map(b=><div key={b.id} style={{background: b.status==='won'?'#e8f5e9':'#ffebee', padding:8, marginTop:6, borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', color:'black'}}>{b.selections?.map(s=>s.game).join(', ')} — {b.status}</div>)}</div>;
    }
    if(mainTab==='Instant Football' || mainTab==='Scheduled Virtuals' || tab==='virtual'){
      return <div style={{background:'#1a1a1a', padding:15, borderRadius:8, textAlign:'center', border:'1px solid #5fcf46'}}><div style={{color:'#8fdf82'}}>🔴 LIVE ANIMATION</div><div style={{fontSize:22, fontWeight:'bold', margin:'10px 0'}}>{VIRTUAL_GAMES[0].home} <span style={{color:'#ffcc00'}}>{virtualScore}</span></div><div style={{fontSize:11, color:'#aaa'}}>⚽ Ball moving... Goal!</div><div style={{height:6, background:'#333', marginTop:10}}><div style={{width:'70%', height:'100%', background:'#8fdf82'}}></div></div><div style={{display:'flex', gap:6, justifyContent:'center', marginTop:10}}><button onClick={()=>addBet(VIRTUAL_GAMES[0],'1',VIRTUAL_GAMES[0].odds.h)} style={{background:'#5fcf46', color:'black', padding:'6px 12px', borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black'}}>{VIRTUAL_GAMES[0].odds.h}</button><button onClick={()=>addBet(VIRTUAL_GAMES[0],'X',VIRTUAL_GAMES[0].odds.d)} style={{background:'#5fcf46', color:'black', padding:'6px 12px', borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black'}}>{VIRTUAL_GAMES[0].odds.d}</button><button onClick={()=>addBet(VIRTUAL_GAMES[0],'2',VIRTUAL_GAMES[0].odds.a)} style={{background:'#5fcf46', color:'black', padding:'6px 12px', borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black'}}>{VIRTUAL_GAMES[0].odds.a}</button></div></div>;
    }
    return (
      <><RealMatches />
        <div style={{background:'#243a29', padding:'8px 12px', borderRadius:6, display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:8}}><span>🔴 Live {filteredGames.filter(g=>g.minute.includes("'")).length} {liveScores?'●':'○'} {realMode?'REAL':'REAL'}</span><button onClick={()=>setRealMode(!realMode)} style={{background:realMode?'#2ecc71':'#555', color:'white', padding:'3px 8px', borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', fontSize:10}}>{realMode?'REAL ON':'REAL OFF'}</button></div>
        {filteredGames.map(g=>(
          <div key={g.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderBottom:'1px solid #1e2d24', background: g.minute.includes("'")?'#2a3d2f':'#243a29', marginBottom:4, borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:10, color:'#2ecc71'}}>{g.minute} {g.score} {g.isReal && <span style={{background:'#ffcc00', color:'black', padding:'1px 4px', borderRadius:3}}>REAL</span>}</div>
              <div style={{fontWeight:'bold', fontSize:11, cursor:'pointer'}} onClick={()=>setAnimationGame(animationGame===g.id?null:g.id)}>{g.home} {animationGame===g.id?'▼':'▶'}</div>
              <div style={{fontSize:9, color:'#aaa'}}>{g.league}</div>
              {animationGame===g.id && (
                <div style={{background:'#1e2d24', padding:8, borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', marginTop:6, border:'1px solid #5fcf46'}}>
                  <div style={{fontSize:10, color:'#8fdf82'}}>⚽ LIVE ANIMATION</div>
                  <div style={{fontSize:20, textAlign:'center', margin:'6px 0'}}>⚽ ➡️ 🥅 {Math.random()>0.5?'GOAL!':'Saved!'}</div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:9, color:'#aaa'}}><span>Possession 58%</span><span>Shots 5-3</span></div>
                  <div style={{height:4, background:'#333', borderRadius:2, marginTop:4}}><div style={{width:Math.floor(Math.random()*80+20)+'%', height:'100%', background:'#8fdf82', transition:'width 1s'}}></div></div>
                </div>
              )}
            </div>
            <div style={{display:'flex', gap:4}}>
              <button onClick={()=>addBet(g,'1',g.odds.h)} style={{background:'#5fcf46', color:'black', padding:'6px 10px', borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', fontSize:11, fontWeight:'bold'}}>{g.odds.h}</button>
              <button onClick={()=>addBet(g,'X',g.odds.d)} style={{background:'#5fcf46', color:'black', padding:'6px 10px', borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', fontSize:11, fontWeight:'bold'}}>{g.odds.d}</button>
              <button onClick={()=>addBet(g,'2',g.odds.a)} style={{background:'#5fcf46', color:'black', padding:'6px 10px', borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', fontSize:11, fontWeight:'bold'}}>{g.odds.a}</button>
            </div>
          </div>
        ))}
        <div style={{padding:8, fontSize:10, color:'#aaa', background:'#1e2d24', marginTop:8}}>
          <div style={{fontWeight:'bold', color:'#8fdf82'}}>Top Leagues</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:4, marginTop:4}}>{TOP_LEAGUES.map(l=><button key={l.name} onClick={()=>setLeagueFilter(l.name===leagueFilter?'All':l.name)} style={{background: leagueFilter===l.name?'#8fdf82':'#2d4a32', color: leagueFilter===l.name?'black':'white', padding:'3px 8px', borderRadius:12, fontSize:10}}>{l.name}</button>)}</div>
        </div>
      </>
    );
  };

  return(
    <div style={{background:'#1e2d24', minHeight:'100vh', color:'white', fontFamily:'Arial', maxWidth:1100, margin:'0 auto'}}>
      <div style={{background:'#1e2d24', borderBottom:'2px solid #5fcf46', padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:20}}>
        <div style={{fontWeight:'bold', fontSize:20, color:'#8fdf82'}}>⚽ 233BET <span style={{background:'#ffcc00', color:'black', fontSize:10, padding:'2px 6px', borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black'}}>LIVE</span></div>
        <div style={{fontSize:11, display:'flex', gap:6, alignItems:'center'}}>
          <span style={{color:'#8fdf82'}}>GHS {balance.toFixed(2)}</span>
          <button onClick={()=>setShowDeposit(true)} style={{background:'#ffcc00', color:'black', padding:'5px 8px', borderRadius:5, fontWeight:'bold'}}>Deposit</button>
          {isAdmin && <button onClick={()=>setShowAdmin(!showAdmin)} style={{background:'#ff8c00', color:'black', padding:'5px 8px', borderRadius:5, fontWeight:'bold'}}>Admin</button>}
          <button onClick={()=>setShowAuth(true)} style={{background: user?'#2d4a32':'#5fcf46', color: user?'white':'black', padding:'5px 8px', borderRadius:5, fontWeight:'bold'}}>{user?user.phone.slice(-4):'Login'}</button>
        </div>
      </div>

      <div style={{background:'#243a29', display:'flex', gap:2, overflowX:'auto', padding:'6px', fontSize:11}}>{["Sports","Games","Live Betting","Instant Football","Scheduled Virtuals","Jackpot","Livescore","Results","Promotions"].map(t=><button key={t} onClick={()=>{setMainTab(t); if(t.includes('Instant')||t.includes('Virtual')) setTab('virtual'); else if(t==='Games') setTab('aviator'); else setTab('football')}} style={{background: mainTab===t?'#8fdf82':'#1e2d24', color: mainTab===t?'black':'white', padding:'6px 10px', borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', flexShrink:0}}>{t}</button>)}</div>

      {showAdmin && isAdmin && (
        <div style={{background:'#2d4a32', padding:12, margin:8, borderRadius:8, border:'2px solid #ff8c00'}}>
          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
            <input placeholder="ID" value={adminOdds.id} onChange={e=>setAdminOdds({...adminOdds,id:e.target.value})} style={{width:50, padding:6, borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', color:'black'}}/>
            <input placeholder="H" value={adminOdds.h} onChange={e=>setAdminOdds({...adminOdds,h:e.target.value})} style={{width:50, padding:6, borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', color:'black'}}/>
            <input placeholder="D" value={adminOdds.d} onChange={e=>setAdminOdds({...adminOdds,d:e.target.value})} style={{width:50, padding:6, borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', color:'black'}}/>
            <input placeholder="A" value={adminOdds.a} onChange={e=>setAdminOdds({...adminOdds,a:e.target.value})} style={{width:50, padding:6, borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', color:'black'}}/>
            <button onClick={updateOdds} style={{background:'#8fdf82', color:'black', padding:'6px 10px', borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black'}}>Update</button>
            <button onClick={()=>setLiveScores(!liveScores)} style={{background:liveScores?'#2ecc71':'#555', padding:'6px 10px', borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black'}}>{liveScores?'Live ON':'OFF'}</button>
            <button onClick={autoSettleAll} style={{background:'#ffcc00', color:'black', padding:'6px 10px', borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black'}}>Settle All</button>
          </div>
        </div>
      )}

      <div style={{display:'flex', gap:8, padding:8}}>
        <div style={{flex:1}}>
          <div style={{display:'flex', gap:4, marginBottom:8}}>
            <button onClick={()=>setGameDay('today')} style={{background:gameDay==='today'?'#8fdf82':'#2d4a32', color:gameDay==='today'?'black':'white', padding:'5px 10px', borderRadius:15, fontSize:11}}>Today {gamesData.today.length}</button>
            <button onClick={()=>setGameDay('tomorrow')} style={{background:gameDay==='tomorrow'?'#ff8c00':'#2d4a32', color:gameDay==='tomorrow'?'black':'white', padding:'5px 10px', borderRadius:15, fontSize:11}}>Tomorrow {gamesData.tomorrow.length}</button>
            <button onClick={()=>setGameDay('future')} style={{background:gameDay==='future'?'#8fdf82':'#2d4a32', color:gameDay==='future'?'black':'white', padding:'5px 10px', borderRadius:15, fontSize:11}}>Future {gamesData.future.length}</button>
          </div>
          {renderContent()}
        </div>
        <div style={{width:280, background:'white', borderRadius:8, height:'fit-content', position:'sticky', top:70}}>
          <div style={{display:'flex', background:'#f0f0f0'}}><button onClick={()=>setBetslipView('betslip')} style={{flex:1, padding:10, fontWeight:'bold', fontSize:12, color:'black', background:betslipView==='betslip'?'white':'#f0f0f0'}}>Betslip {betslip.length}</button><button onClick={()=>setBetslipView('cashout')} style={{flex:1, padding:10, fontWeight:'bold', fontSize:12, background:betslipView==='cashout'?'white':'#f0f0f0', color:'#666'}}>My Bets {myBets.length}</button></div>
          {betslipView==='betslip' ? <div style={{padding:10, color:'black'}}>{betslip.length===0?<div style={{padding:20, textAlign:'center', color:'#888', fontSize:11}}>Click odds to add — Click ▶ on game for animation!</div>:<><div style={{fontSize:11, fontWeight:'bold'}}>Multiple @{totalOdds.toFixed(2)}</div>{betslip.map((b,i)=><div key={i} style={{display:'flex', justifyContent:'space-between', padding:8, borderBottom:'1px solid #eee', fontSize:11}}><div>{b.game} {b.type} @{b.oddValue}</div><button onClick={()=>{const n=[...betslip]; n.splice(i,1); setBetslip(n)}}>✕</button></div>)}<button onClick={placeBet} style={{width:'100%', background:'#2ecc71', color:'white', padding:12, borderRadius:6, fontWeight:'bold', marginTop:8}}>Place Bet GHS {potWin}</button></>}</div> : <div style={{padding:10, color:'black'}}>{myBets.map(b=><div key={b.id} style={{border:'1px solid #eee', padding:8, marginBottom:6, borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', background: b.status==='won'?'#e8f5e9':'#ffebee'}}><div style={{fontSize:11, display:'flex', justifyContent:'space-between'}}><span>{b.status.toUpperCase()}</span><span style={{color:b.status==='won'?'green':'red'}}>{b.status==='won'?'+'+b.potentialWin?.toFixed(2):'-'+b.stake}</span></div>{b.status==='pending' && isAdmin && <div style={{display:'flex', gap:4, marginTop:4}}><button onClick={()=>settleBet(b,'won')} style={{flex:1, background:'#2ecc71', color:'white', padding:4, borderRadius:3, fontSize:10}}>Win</button><button onClick={()=>settleBet(b,'lost')} style={{flex:1, background:'#ff5555', color:'white', padding:4, borderRadius:3, fontSize:10}}>Lose</button></div>}</div>)}</div>}
        </div>
      </div>
      {showAuth && <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99}}><div style={{background:'#243a29', padding:20, borderRadius:8, width:280}}><h3>{authMode}</h3><input placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} style={{backgroundColor:'white', color:'black', width:'100%', padding:8, marginTop:10, borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', color:'black'}}/><input type="password" placeholder="Pass" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%', padding:8, marginTop:8, borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', color:'black'}}/><button onClick={handleAuth} style={{width:'100%', background:'#2ecc71', padding:8, borderRadius:5, marginTop:8}}>Go</button><button onClick={()=>setShowAuth(false)} style={{width:'100%', background:'#444', padding:6, marginTop:6, borderRadius:5}}>Close</button></div></div>}
      {showDeposit && <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99}}><div style={{background:'#243a29', padding:20, borderRadius:8, width:280}}><h3>Deposit</h3><input placeholder="Amount" value={depositAmt} onChange={e=>setDepositAmt(e.target.value)} type="number" style={{width:'100%', backgroundColor:'white', color:'black', padding:8, marginTop:10, borderRadius:4, backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black', backgroundColor:'white',color:'black'}}/><button onClick={handleDeposit} style={{width:'100%', background:'#ffcc00', color:'black', padding:8, borderRadius:5, marginTop:8, fontWeight:'bold'}}>Deposit Demo</button><button onClick={()=>setShowDeposit(false)} style={{width:'100%', background:'#444', padding:6, marginTop:6, borderRadius:5}}>Close</button></div></div>}
    </div>
  )
}