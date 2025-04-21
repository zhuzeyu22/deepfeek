<script setup>
import ChatBot from './components/ChatBot.vue'
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <h1>DeepSeek AI Chatbot</h1>
      <p>A Vue.js application powered by DeepSeek AI</p>
    </div>
  </header>

  <main>
    <ChatBot />
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
  margin-bottom: 2rem;
  text-align: center;
}

.logo {
  display: block;
  margin: 0 auto 1rem;
}

.wrapper h1 {
  font-size: 2rem;
  color: #4a56e2;
  margin-bottom: 0.5rem;
}

.wrapper p {
  color: #666;
  font-size: 1.1rem;
}

main {
  padding: 0 1rem;
}

@media (min-width: 1024px) {
  header {
    text-align: center;
    padding: 2rem 0;
  }

  .logo {
    margin: 0 auto 1rem;
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
  }
}
</style>
