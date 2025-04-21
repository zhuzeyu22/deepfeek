<script setup>
import { ref, onMounted } from 'vue';

const messages = ref([
  { 
    role: 'assistant', 
    content: 'Hello! I am your DeepSeek AI assistant. How can I help you today?' 
  }
]);
const userInput = ref('');
const chatContainer = ref(null);
const isLoading = ref(false);

// Function to handle sending messages
const sendMessage = async () => {
  if (!userInput.value.trim()) return;
  
  // Add user message to chat
  messages.value.push({ 
    role: 'user', 
    content: userInput.value 
  });
  
  // Clear input field
  const userMessage = userInput.value;
  userInput.value = '';
  
  // Set loading state
  isLoading.value = true;
  
  try {
    // In a real application, you would make an API call to DeepSeek here
    // For now, we'll simulate a response after a short delay
    setTimeout(() => {
      messages.value.push({ 
        role: 'assistant', 
        content: `I received your message: "${userMessage}". This is a simulated response from DeepSeek AI. In a real application, this would be replaced with an actual API call to DeepSeek's services.` 
      });
      isLoading.value = false;
    }, 1000);
    
    // Example of how the actual API call might look:
    /*
    const response = await fetch('https://api.deepseek.com/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify({
        messages: messages.value.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      })
    });
    
    const data = await response.json();
    messages.value.push({
      role: 'assistant',
      content: data.message
    });
    isLoading.value = false;
    */
  } catch (error) {
    console.error('Error sending message:', error);
    messages.value.push({ 
      role: 'assistant', 
      content: 'Sorry, there was an error processing your request. Please try again.' 
    });
    isLoading.value = false;
  }
};

// Auto-scroll to the bottom of the chat when new messages arrive
const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

// Watch for changes to messages and scroll to bottom
onMounted(() => {
  scrollToBottom();
});
</script>

<template>
  <div class="chat-container">
    <div class="chat-header">
      <h2>DeepSeek AI Chatbot</h2>
    </div>
    
    <div class="chat-messages" ref="chatContainer">
      <div 
        v-for="(message, index) in messages" 
        :key="index" 
        :class="['message', message.role === 'user' ? 'user-message' : 'assistant-message']"
      >
        <div class="message-content">
          <div class="message-avatar">
            <div v-if="message.role === 'user'" class="user-avatar">U</div>
            <div v-else class="assistant-avatar">AI</div>
          </div>
          <div class="message-text">{{ message.content }}</div>
        </div>
      </div>
      
      <div v-if="isLoading" class="message assistant-message">
        <div class="message-content">
          <div class="message-avatar">
            <div class="assistant-avatar">AI</div>
          </div>
          <div class="message-text typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <input 
        v-model="userInput" 
        @keyup.enter="sendMessage" 
        placeholder="Type your message here..." 
        :disabled="isLoading"
      />
      <button @click="sendMessage" :disabled="isLoading || !userInput.trim()">
        <span v-if="!isLoading">Send</span>
        <span v-else>...</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 600px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

.chat-header {
  padding: 15px;
  background-color: #4a56e2;
  color: white;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
}

.chat-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  background-color: #f9f9f9;
}

.message {
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 18px;
  line-height: 1.5;
  word-wrap: break-word;
}

.user-message {
  align-self: flex-end;
  background-color: #4a56e2;
  color: white;
}

.assistant-message {
  align-self: flex-start;
  background-color: #e9e9eb;
  color: #333;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.message-avatar {
  flex-shrink: 0;
}

.user-avatar, .assistant-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.user-avatar {
  background-color: #2a3990;
  color: white;
}

.assistant-avatar {
  background-color: #6c757d;
  color: white;
}

.message-text {
  flex: 1;
}

.chat-input {
  display: flex;
  padding: 15px;
  background-color: white;
  border-top: 1px solid #e0e0e0;
}

.chat-input input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  margin-right: 10px;
  font-size: 1rem;
}

.chat-input button {
  padding: 10px 20px;
  background-color: #4a56e2;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.chat-input button:hover {
  background-color: #3a46c2;
}

.chat-input button:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background-color: #6c757d;
  border-radius: 50%;
  display: inline-block;
  animation: typing 1.4s infinite both;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
