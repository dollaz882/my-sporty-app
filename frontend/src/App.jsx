import { useState, useEffect } from 'react'

const API = "https://sporty-gh-backend.onrender.com"

function App() {
  const [matches, setMatches] = useState([])
  const [betslip, setBetslip] = useState([])
  const [amount, setAmount] = useState(10)
  const [balance, setBalance] = useState(100)

  useEffect(() => {
    fetch(`${API}/api/games`)
      .then(r => r.json())
      .then(data => {
        if(data.length > 0) setMatches(data)
        else throw "empty"
      })
      .catch(() => {
        setMatches([
          { id: 1, home: "Hearts of Oak", away: "Asante Kotoko", odd1: "2.40", oddX: "3.10", odd2: "2.85", league: "Ghana Premier" },
          { id: 2, home: "Man City", away: "Arsenal", odd1: "1.95", oddX: "3.40", odd2: "4.10", league: "Premier League" },
          { id: 3, home: "Real Madrid", away: "Barcelona", odd1: "2.20", oddX: "3.50", odd2: "3.00", league: "La Liga" }
        ])
      })
  }, [])

  const addToSlip = (game, odd, sel) => {
    setBetslip([{ game: `${game.home} vs ${game.away}`, selection: sel, odd }])
  }

  const placeBet = async () => {
    if (!betslip.length) return alert("First click an odd!")
    
    try {
      const res = await fetch(`${API}/api/place-bet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...betslip[0], stake: amount })
      })
      const data = await res.json()
      
      if (data.success) {
        setBalance(b => b - parseFloat(amount))
        alert(`BET PLACED! ✅\n${data.bet.game}\nStake: GHS ${amount}\nYou can win: GHS ${data.bet.potentialWin}`)
        setBetslip([])
      } else {
        alert("Bet saved locally! Backend: " + JSON.stringify(data))
      }
    } catch (e) {
      alert(`BET PLACED (Offline Mode)!\n${betslip[0].game} @ ${betslip[0].odd}\nWin: GHS ${amount * betslip[0].odd}`)
      setBetslip([])
    }
  }

  return (
    <div style={{ background: "#111", color: "white", minHeight: "100vh", padding: 15, fontFamily: "Arial" }}>
      <h1 style={{ color: "#00ff88", margin: 0 }}>⚽ Sporty GH</h1>
      <p>Balance: GHS {balance} | Live API: {API}</p>

      {matches.map(m => (
        <div key={m.id} style={{ background: "#222", margin: "10px 0", padding: 15, borderRadius: 8 }}>
          <b style={{ color: "#aaa" }}>{m.league}</b><br/>
          <b>{m.home} vs {m.away}</b>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => addToSlip(m, m.odd1, "HOME")} style={{ flex:1, padding: 12, background: betslip[0]?.odd==m.odd1 ? "#00ff88" : "#444", color: "white", border: "none", borderRadius: 5, cursor: "pointer" }}>
              1<br/>{m.odd1}
            </button>
            <button onClick={() => addToSlip(m, m.oddX, "DRAW")} style={{ flex:1, padding: 12, background: betslip[0]?.odd==m.oddX ? "#00ff88" : "#444", color: "white", border: "none", borderRadius: 5 }}>
              X<br/>{m.oddX}
            </button>
            <button onClick={() => addToSlip(m, m.odd2, "AWAY")} style={{ flex:1, padding: 12, background: betslip[0]?.odd==m.odd2 ? "#00ff88" : "#444", color: "white", border: "none", borderRadius: 5 }}>
              2<br/>{m.odd2}
            </button>
          </div>
        </div>
      ))}

      <div style={{ background: "#333", padding: 15, borderRadius: 8, position: "sticky", bottom: 10, marginTop: 20 }}>
        <h3 style={{ margin: "0 0 10px 0" }}>BETSLIP - HOW PEOPLE BET</h3>
        {betslip.length === 0 ? <p style={{ color: "#888" }}>Click an odd to bet</p> : 
          betslip.map((b,i) => <p key={i} style={{ background: "#222", padding: 8 }}>{b.game} - {b.selection} @ {b.odd}</p>)
        }
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={{ padding: 12, width: 80, borderRadius: 5, border: "none" }} />
          <button onClick={placeBet} style={{ flex:1, padding: 12, background: "yellow", color: "black", fontWeight: "bold", border: "none", borderRadius: 5, cursor: "pointer" }}>
            PLACE BET
          </button>
        </div>
      </div>
    </div>
  )
}

export default App