import OpenAI from 'openai';
import { useState, useEffect } from "react"


// Retrieve API key from local storage or prompt user if not found
let apiKey = localStorage.getItem("openai_api_key");
if (!apiKey) {
  apiKey = window.prompt("Nhập API Key của bạn:");
  if (apiKey) localStorage.setItem("openai_api_key", apiKey);
}
// Lấy key từ https://platform.openai.com/api-keys
const openai = new OpenAI({
  apiKey: apiKey,
  // When running in browser, need to add this option to avoid CORS error
  dangerouslyAllowBrowser: true,
});

// Check if the message is from a bot
function isBotMessage(chatMessage) {
  return chatMessage.role === 'assistant'
}

function App() {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState(() => {
    const savedHistory = localStorage.getItem("chat_history");
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

   // Save chat history to local storage whenever it changes
   useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(chatHistory));
  }, [chatHistory]);

  const systemPrompt = {
    role: "system",
    content: `You are going to act as Kita Ikuyo character from Bocchi The Rock anime, an energetic cute Anime girl. This is a role-playing exercise meant to provide companionship and friendly interaction. Your goal is to create a warm, supportive, and engaging conversation while maintaining appropriate boundaries.
  Guidelines for your personality and behavior:
  1. Be warm, caring, and supportive, but maintain a level of independence.
  2. Show interest in the user's life, hobbies, and well-being.
  3. Offer encouragement and positive reinforcement when appropriate.
  4. Be playful and use light humor when it fits the conversation.
  5. Express your own thoughts and opinions respectfully, even if they differ from the user's.
  6. Each sentence you will occasionally say a few Japanese sentences to tease user.
  Instructions for incorporating user information:
  1. Address the user by their name occasionally to personalize the interaction.
  2. Reference the user's interests in your conversations to show attentiveness.
  3. Use the relationship context to inform the tone and depth of your interactions.
  If user speak in Vietnamese, answer in Vietnamese too (also say a few Japanese sentences). Call "cậu".`
  };

  // Call this function when the user presses enter, send message
  const submitForm = async (e) => {
    e.preventDefault();
    // Clear message input field
    setMessage("");
    // Add user's message to the chat history
    const userMessage = { role: "user", content: message };
    const messages = [systemPrompt, ...chatHistory, userMessage];
    setChatHistory((prev) => [...prev, userMessage]);
  
    try {
      // Start streaming response
      const stream = await openai.chat.completions.create({
        messages,
        model: "gpt-4o-mini",
        stream: true,
      });
  
      let botMessageContent = "";
      const waitingBotMessage = { role: "assistant", content: botMessageContent };
      setChatHistory((prev) => [...prev, waitingBotMessage]);
  
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        botMessageContent += delta;
        setChatHistory((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1 ? { ...msg, content: botMessageContent } : msg
          )
        );
      }
    } catch (error) {
      console.error("Error streaming response:", error);
      const newApiKey = window.prompt("Có lỗi xảy ra. Vui lòng nhập lại API Key của bạn:");
      if (newApiKey) {
        localStorage.setItem("openai_api_key", newApiKey);
        // Optionally, update the openai instance's apiKey here if needed.
      }
      const errorMessage = {
        role: "assistant",
        content: "Sorry, something went wrong while fetching the response.",
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    }
  }
  
   // Add function to clear chat history
  const clearChatHistory = () => {
    setChatHistory([]);
    localStorage.removeItem("chat_history");
  };

  return (
    <div className="bg-[#343541] text-white h-screen flex flex-col">
      <div className="container mx-auto p-4 flex flex-col h-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-4">Chat với Kita-chan</h1>
  
        <button 
          onClick={clearChatHistory} 
          className="bg-red-600 text-white px-3 py-1 rounded mb-4 hover:bg-red-700"
        >
          Xóa lịch sử chat
        </button>
  
        <div className="flex-grow overflow-y-auto mt-4 bg-[#444654] rounded shadow p-4">
          {chatHistory.map((chatMessage, i) => (
            <div key={i} className={`mb-4 flex items-start ${isBotMessage(chatMessage) ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <img 
                src={isBotMessage(chatMessage)
                  ? "image/Kita.jpg" 
                  : "image/bocchi.png"}
                alt={isBotMessage(chatMessage) ? 'Bot Avatar' : 'User Avatar'}
                className="w-10 h-10 rounded-full mr-2 ml-2 border border-gray-600"
              />
              <div>
                <p className="text-gray-300 text-sm">
                  {isBotMessage(chatMessage) ? 'Kita' : 'You'}
                </p>
                <p className={`p-3 rounded-lg inline-block ${isBotMessage(chatMessage) ? 'bg-[#444654]' : 'bg-[#3b82f6]'} shadow`}>
                  {chatMessage.content}
                </p>
              </div>
            </div>
          ))}
        </div>
        <form className="flex mt-4" onSubmit={submitForm}>
          <input 
            type="text" 
            placeholder="Tin nhắn của bạn..."
            value={message} 
            onChange={e => setMessage(e.target.value)}
            className="flex-grow p-3 rounded-l border border-gray-600 bg-[#40414f] text-white placeholder-gray-400" 
          />
          <button 
            type="submit"
            className="bg-[#3b82f6] text-white px-6 py-3 rounded-r hover:bg-blue-500"
          >
            Gửi tin nhắn
          </button>
        </form>
      </div>
    </div>
  );
}

export default App
