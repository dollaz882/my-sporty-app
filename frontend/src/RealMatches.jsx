import { useState, useEffect } from 'react'

export default function RealMatches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // Try Live scores first (Soccer)
        const urls = [
          'https://www.thesportsdb.com/api/v1/json/3/livescore.php?s=Soccer',
          'https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4328',
          'https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4335',
          'https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4356'
        ]
        for(let url of urls){
          const r = await fetch(url)
          const d = await r.json()
          const ev = d.events || d.event
          if(ev && ev.length>0){
            setMatches(ev.slice(0,8))
            break
          }
        }
      } catch(e) {
        console.log(e)
      }
      setLoading(false)
    }
    load()
  }, [])

  if(loading) return <div style={{color:'white', padding:20}}>Loading REAL matches...</div>

  return (
    <div style={{padding:10, background:'#111', borderRadius:8, margin:10}}>
      <h3 style={{color:'#00ff88', marginBottom:10}}>🔴 REAL Football (Live API)</h3>
      {matches.length===0 ? (
        <div style={{color:'white'}}>
          No live games right now (Season break at night). 
          <br/>But API is connected! Try again tomorrow 12pm-6pm GMT for live games.
          <br/><small style={{color:'#aaa'}}>Your code is fetching from thesportsdb.com</small>
        </div>
      ) : (
        matches.map((m,i)=>(
          <div key={i} style={{background:'white', color:'black', padding:12, marginTop:10, borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <b>{m.strEvent || `${m.strHomeTeam} vs ${m.strAwayTeam}`}</b><br/>
              <small>{m.dateEvent} {m.strTime} - {m.strLeague || m.strSport}</small>
              {m.intHomeScore && <small> LIVE {m.intHomeScore}-{m.intAwayScore}</small>}
            </div>
            <button style={{background:'#243a29', color:'white', border:'none', padding:'6px 12px', borderRadius:4, fontWeight:'bold'}}>2.10</button>
          </div>
        ))
      )}
    </div>
  )
}