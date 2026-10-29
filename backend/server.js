const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/matches', (req,res)=>{
  res.json([
    { id: 1, home: 'Hearts of Oak', away: 'Asante Kotoko', odd1: '2.45', oddX: '2.90', odd2: '2.80', league: 'Ghana Premier', time: 'Today 15:00' },
    { id: 2, home: 'Man City', away: 'Arsenal', odd1: '1.85', oddX: '3.40', odd2: '4.10', league: 'Premier League', time: 'Today 17:30' },
    { id: 3, home: 'Barcelona', away: 'Real Madrid', odd1: '2.10', oddX: '3.20', odd2: '3.50', league: 'La Liga', time: 'Today 20:00' }
  ]);
});
app.post('/api/register', (req,res)=> res.json({msg:'Registered! Now Login'}));
app.post('/api/login', (req,res)=> res.json({msg:'Logged in'}));
app.post('/api/place-bet', (req,res)=> res.json({msg:'Bet placed'}));

app.listen(5000, ()=> console.log('FIXED Backend running on 5000 - Odds OK'));