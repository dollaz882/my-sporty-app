const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

async function run() {
  const PRIMARY_KEY = "984bbeb4708a46d28bd1d487215671cd";
  const userId = uuidv4();
  console.log("Creating user:", userId);
  try {
    await axios.post('https://sandbox.momodeveloper.mtn.com/v1_0/apiuser',
      { providerCallbackHost: "example.com" },
      { headers: { 'X-Reference-Id': userId, 'Ocp-Apim-Subscription-Key': PRIMARY_KEY, 'Content-Type': 'application/json' } }
    );
    console.log("User created!");
    const res = await axios.post(`https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/${userId}/apikey`, {}, 
      { headers: { 'Ocp-Apim-Subscription-Key': PRIMARY_KEY } });
    console.log("\n=== SAVE THESE ===");
    console.log("MOMO_SUBSCRIPTION_KEY=" + PRIMARY_KEY);
    console.log("MOMO_USER_ID=" + userId);
    console.log("MOMO_API_KEY=" + res.data.apiKey);
  } catch (e) {
    console.log("ERROR:", e.response ? JSON.stringify(e.response.data) : e.message);
  }
}
run();