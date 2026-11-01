require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = process.env.JWT_SECRET || 'sporty_gh_secret_123';
let users = []; // {id, phone, password, balance, bets}
let bets = [];

// ===== GAMES =====
const GAMES = [
  {id:1, home:"Hearts of Oak", away:"Asante Kotoko", league:"Ghana Premier League", time:"15:00", odds:{home:3.00, draw:3.57, away:4.27}},
  {id:2, home:"Man City", away:"Arsenal", league:"Premier League", time:"17:30", odds:{home:2.94, draw:2.95, away:2.06}},
  {id:3, home:"Barcelona", away:"Real Madrid", league:"La Liga", time:"20:00", odds:{home:3.15, draw:3.78, away:3.37}},
  {id:4, home:"Bayern", away:"Dortmund", league:"Bundesliga", time:"18:30", odds:{home:2.37, draw:4.16, away:4.09}},
];

app.get('/api/games', (req, res) => res.json(GAMES));

// ===== AUTH =====
app.post('/api/register', async (req, res) => {
  const {phone, password} = req.body;
  if(users.find(u=>u.phone===phone)) return res.status(400).json({error:"User exists"});
  const hash = await bcrypt.hash(password, 10);
  const user = {id:uuidv4(), phone, password:hash, balance:0, bets:[]};
  users.push(user);
  const token = jwt.sign({id:user.id, phone}, SECRET);
  res.json({token, user:{phone, balance:0}});
});

app.post('/api/login', async (req, res) => {
  const {phone, password} = req.body;
  const user = users.find(u=>u.phone===phone);
  if(!user) return res.status(400).json({error:"Not found"});
  const ok = await bcrypt.compare(password, user.password);
  if(!ok) return res.status(400).json({error:"Wrong password"});
  const token = jwt.sign({id:user.id, phone}, SECRET);
  res.json({token, user:{phone, balance:user.balance}});
});

function auth(req, res, next){
  try{
    const token = req.headers.authorization?.split(' ')[1];
    const data = jwt.verify(token, SECRET);
    req.user = users.find(u=>u.id===data.id);
    next();
  }catch{ res.status(401).json({error:"Unauthorized"}) }
}

app.get('/api/me', auth, (req,res)=>{
  res.json({phone:req.user.phone, balance:req.user.balance, bets:req.user.bets})
})

// ===== BETS =====
app.post('/api/bets', auth, (req,res)=>{
  const {selections, stake, totalOdds} = req.body;
  if(req.user.balance < stake) return res.status(400).json({error:"Insufficient balance"});
  req.user.balance -= stake;
  const bet = {id:uuidv4(), userId:req.user.id, selections, stake, totalOdds, potentialWin: stake*totalOdds, status:"pending", date:new Date()};
  bets.push(bet);
  req.user.bets.unshift(bet);
  res.json({success:true, balance:req.user.balance, bet});
})

// ===== MOMO DEPOSIT - MTN =====
const BASE_URL = 'https://sandbox.momodeveloper.mtn.com';
app.post('/api/deposit', auth, async (req,res)=>{
  const {amount, phone} = req.body;
  try{
    // Step 1: get token
    const tokenRes = await axios.post(`${BASE_URL}/collection/token/`, {}, {
      headers:{'Ocp-Apim-Subscription-Key':process.env.MOMO_SUBSCRIPTION_KEY, 'Authorization':`Basic ${Buffer.from(`${process.env.MOMO_USER_ID}:${process.env.MOMO_API_KEY}`).toString('base64')}`},
    });
    const access_token = tokenRes.data.access_token;
    const ref = uuidv4();
    await axios.post(`${BASE_URL}/collection/v1_0/requesttopay`, {
      amount, currency:"EUR", externalId:"123", payer:{partyIdType:"MSISDN", partyId:phone}, payerMessage:"SportyGH deposit", payeeNote:"Deposit"
    }, {
      headers:{'X-Reference-Id':ref, 'X-Target-Environment':'sandbox', 'Ocp-Apim-Subscription-Key':process.env.MOMO_SUBSCRIPTION_KEY, 'Authorization':`Bearer ${access_token}`}
    });
    // For sandbox, we credit immediately
    req.user.balance += Number(amount);
    res.json({success:true, message:"Deposit successful (sandbox)", balance:req.user.balance, ref});
  }catch(e){
    console.log(e.response?.data || e.message);
    // Sandbox fallback - still credit for demo
    req.user.balance += Number(amount);
    res.json({success:true, message:"Sandbox deposit credited", balance:req.user.balance});
  }
})

// ===== AVIATOR =====
app.get('/api/aviator/crash', (req,res)=>{
  // Random crash 1.05x to 20x
  const crash = (Math.random()*19 + 1.05).toFixed(2);
  res.json({crashPoint: Number(crash)});
})

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>console.log(`SportyGH API on ${PORT}`));