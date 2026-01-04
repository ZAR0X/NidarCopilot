// Run this script with: node test_manual.js
// MAKE SURE YOUR SERVER IS RUNNING (node index.js)

// --- CONFIGURATION ---
// IMPORTANT: Replace this with a valid UUID from your Supabase auth.users table
// or the 'users' table if you are verifying locally.
const USER_ID = "REPLACE_WITH_VALID_UUID"; 
const BASE_URL = "http://localhost:5000/api";

async function runTests() {
  if (USER_ID === "REPLACE_WITH_VALID_UUID") {
    console.error("❌ ERROR: Please open 'test_manual.js' and set a valid USER_ID on line 5.");
    return;
  }

  console.log("🚀 Starting Backend Query Tests...\n");

  try {
    // TEST 1: START NEW CHAT (Simple Query)
    console.log("--- 1. Testing POST /api/chat (New Session) ---");
    const res1 = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: USER_ID,
        message: "What is the GST limit for a freelance developer?"
      })
    });
    const data1 = await res1.json();
    console.log("Status:", res1.status);
    console.log("Response:", JSON.stringify(data1, null, 2));

    if (!data1.chatId) {
      console.error("❌ Failed to get chatId. Stopping tests.");
      return;
    }
    const chatId = data1.chatId;

    // TEST 2: FOLLOW-UP (Context Awareness)
    console.log("\n--- 2. Testing POST /api/chat (Follow-up) ---");
    const res2 = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: USER_ID,
        chatId: chatId,
        message: "Does this apply if I live in Maharashtra?"
      })
    });
    const data2 = await res2.json();
    console.log("Status:", res2.status);
    console.log("Response:", JSON.stringify(data2, null, 2));


    // TEST 3: FETCH CHAT LIST
    console.log("\n--- 3. Testing GET /api/chats (Sidebar List) ---");
    const res3 = await fetch(`${BASE_URL}/chats?userId=${USER_ID}`);
    const data3 = await res3.json();
    console.log("Status:", res3.status);
    console.log("Recents Count:", data3.length);
    console.log("First Item:", data3[0]);

    // TEST 4: FETCH SINGLE CHAT HISTORY
    console.log(`\n--- 4. Testing GET /api/chats/${chatId} (Message History) ---`);
    const res4 = await fetch(`${BASE_URL}/chats/${chatId}?userId=${USER_ID}`);
    const data4 = await res4.json();
    console.log("Status:", res4.status);
    console.log("Message Count:", data4.length);
    console.log("Last Message:", data4[data4.length - 1]);

    console.log("\n✅ Tests Completed!");

  } catch (err) {
    console.error("\n❌ Request Failed:", err);
  }
}

runTests();
