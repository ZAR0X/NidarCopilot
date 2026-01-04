require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { processUserMessage } = require("./services/agentService");

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = [
  'https://zarox.is-a.dev', 
  'http://zarox.is-a.dev',
  'https://www.zarox.is-a.dev',
  'http://www.zarox.is-a.dev'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed domains
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Allow any localhost
    if (origin.match(/^http:\/\/localhost:[0-9]+$/) || origin.match(/^http:\/\/127\.0\.0\.1:[0-9]+$/)) {
      return callback(null, true);
    }

    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true
}));
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

app.get("/", (req, res) => {
  res.send("Compliance Copilot Backend is running");
});

// --- CHAT HISTORY ENDPOINTS ---

/**
 * GET /api/chats
 * List all chats for a user (summary)
 */
app.get("/api/chats", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Fetch Chats Error:", err);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

/**
 * GET /api/chats/:chatId
 * Get full history for a specific chat
 */
app.get("/api/chats/:chatId", async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.query; // Security check

  try {
    // optional: verify ownership
    if (userId) {
      const { data: chat } = await supabase.from('chats').select('user_id').eq('id', chatId).single();
      if (!chat || chat.user_id !== userId) {
        return res.status(403).json({ error: "Unauthorized access to this chat" });
      }
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Fetch Messages Error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

/**
 * DELETE /api/chats/:chatId
 * Delete a specific chat
 */
app.delete("/api/chats/:chatId", async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.query;

  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', userId); // Ensure ownership

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Delete Chat Error:", err);
    res.status(500).json({ error: "Failed to delete chat" });
  }
});

/**
 * POST /api/chat
 * Main interaction endpoint
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { message, userId, chatId: existingChatId } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: "Message and userId are required" });
    }

    let chatId = existingChatId;

    // 1. Create or Update Chat Session
    if (!chatId) {
      const { data, error } = await supabase
        .from('chats')
        .insert({ 
          user_id: userId, 
          title: message.substring(0, 30) + "..." 
        })
        .select()
        .single();
      
      if (error) throw error;
      chatId = data.id;
    } else {
      // Update 'updated_at'
      await supabase.from('chats').update({ updated_at: new Date() }).eq('id', chatId);
    }

    // 2. Determine Chat History for Context
    // We fetch the last 10 messages for context
    const { data: historyData } = await supabase
      .from('messages')
      .select('role, content')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false }) // Get latest first
      .limit(10);
    
    // Reverse because agent needs chronological order
    const history = historyData ? historyData.reverse() : [];

    // 3. Save USER Message
    await supabase.from('messages').insert({
      chat_id: chatId,
      role: 'user',
      content: message
    });

    // 4. Run Agent Logic
    const authHeader = req.headers.authorization;
    const response = await processUserMessage(userId, message, history, authHeader);

    // 5. Save AI Message
    const aiMessageData = {
      chat_id: chatId,
      role: 'ai',
      content: response.text
    };
    if (response.action) {
      aiMessageData.meta = response.action;
    }
    await supabase.from('messages').insert(aiMessageData);

    // 6. Return Response
    res.json({
      chatId,
      answer: response.text,
      action: response.action
    });

  } catch (err) {
    console.error("Chat Error:", err);
    
    // Handle Gemini Rate Limits
    if (err.message && (err.message.includes('429') || err.message.toLowerCase().includes('resource exhausted') || err.message.toLowerCase().includes('too many requests'))) {
        return res.status(429).json({ error: "Too Many Requests. Please wait a moment." });
    }

    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
