// 配置模块
const config = {
    API_KEY: localStorage.getItem('deepseekApiKey') || 'YOUR_DEEPSEEK_API_KEY',
    API_URL: 'https://api.deepseek.com/v1/chat/completions',
    MESSAGE_HISTORY_KEY: 'chatHistory',
    MAX_HISTORY: 50,
    apiKey: '',
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 2000,
    totalTokens: 0
};

// 日志模块
const logger = {
    info(message, data = null) {
        console.log(`%c[INFO] ${message}`, 'color: #409eff', data || '');
    },
    error(message, error = null) {
        console.error(`%c[ERROR] ${message}`, 'color: #f56c6c', error || '');
    },
    warn(message, data = null) {
        console.warn(`%c[WARN] ${message}`, 'color: #e6a23c', data || '');
    },
    debug(message, data = null) {
        console.debug(`%c[DEBUG] ${message}`, 'color: #909399', data || '');
    }
};

// 工具函数模块
const utils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    saveToLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            logger.debug(`保存到本地存储: ${key}`, value);
        } catch (error) {
            logger.error('LocalStorage 错误', error);
        }
    },

    loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            const parsedData = data ? JSON.parse(data) : null;
            logger.debug(`从本地存储加载: ${key}`, parsedData);
            return parsedData;
        } catch (error) {
            logger.error('LocalStorage 错误', error);
            return null;
        }
    }
};

// Token 计算工具
const tokenCalculator = {
    // 计算文本的 token 数量
    calculateTokens(text) {
        // 中文和英文的 token 计算比例
        const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
        const englishChars = text.match(/[a-zA-Z]/g) || [];
        const numbers = text.match(/[0-9]/g) || [];
        const symbols = text.match(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g) || [];
        
        // 计算 token 数量
        const chineseTokens = chineseChars.length * 0.6;
        const englishTokens = englishChars.length * 0.3;
        const otherTokens = numbers.length + symbols.length;
        
        return Math.ceil(chineseTokens + englishTokens + otherTokens);
    },

    // 计算消息列表的总 token 数量
    calculateMessagesTokens(messages) {
        return messages.reduce((total, message) => {
            return total + this.calculateTokens(message.content);
        }, 0);
    }
};

// 使用量计算工具
const priceCalculator = {
    // 模型使用量（元/百万token）
    prices: {
        'deepseek-chat': {
            standard: {
                input: 2,    // 缓存未命中
                output: 8
            },
            discount: {
                input: 1,    // 缓存未命中
                output: 4
            }
        },
        'deepseek-reasoner': {
            standard: {
                input: 4,
                output: 16
            },
            discount: {
                input: 1,
                output: 4
            }
        }
    },

    // 检查是否在优惠时段（北京时间 00:30-08:30）
    isDiscountTime() {
        const now = new Date();
        const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // 转换为北京时间
        const hour = beijingTime.getUTCHours();
        return hour >= 0 && hour < 8;
    },

    // 计算使用量
    calculatePrice(tokens, isInput, model) {
        const isDiscount = this.isDiscountTime();
        const priceConfig = isDiscount ? this.prices[model].discount : this.prices[model].standard;
        const pricePerMillion = isInput ? priceConfig.input : priceConfig.output;
        return (tokens / 1000000) * pricePerMillion;
    }
};

// 消息管理模块
const messageManager = {
    messages: [],

    init() {
        this.messages = utils.loadFromLocalStorage(config.MESSAGE_HISTORY_KEY) || [];
        this.renderMessages();
        this.updateTotalTokens();
        logger.info('消息管理器初始化完成', { messageCount: this.messages.length });
    },

    addMessage(message, isUser, tokens = 0) {
        const messageData = {
            content: message,
            isUser,
            timestamp: new Date().toISOString(),
            tokens: tokens
        };

        this.messages.push(messageData);
        if (this.messages.length > config.MAX_HISTORY) {
            const removedMessage = this.messages.shift();
            logger.debug('消息历史达到上限，移除最早的消息', removedMessage);
        }

        utils.saveToLocalStorage(config.MESSAGE_HISTORY_KEY, this.messages);
        this.renderMessage(messageData);
        this.updateTotalTokens();
        logger.info(`添加新消息: ${isUser ? '用户' : '机器人'}`, messageData);
    },

    updateTotalTokens() {
        const totalTokens = tokenCalculator.calculateMessagesTokens(this.messages);
        document.getElementById('tokenCount').textContent = totalTokens;
        
        // 计算预估使用量
        const inputTokens = totalTokens;
        const outputTokens = totalTokens;
        const inputPrice = priceCalculator.calculatePrice(inputTokens, true, config.model);
        const outputPrice = priceCalculator.calculatePrice(outputTokens, false, config.model);
        const totalPrice = inputPrice + outputPrice;
        
        document.getElementById('priceCount').textContent = totalPrice.toFixed(4) + ' 元';
        localStorage.setItem('totalTokens', totalTokens);
    },

    renderMessage(messageData) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', messageData.isUser ? 'user-message' : 'bot-message');

        const avatarElement = document.createElement('div');
        avatarElement.classList.add('message-avatar', messageData.isUser ? 'user-avatar' : 'bot-avatar');
        avatarElement.textContent = messageData.isUser ? 'U' : 'B';

        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        contentElement.textContent = messageData.content;

        // 添加 token 显示
        const tokenElement = document.createElement('div');
        tokenElement.classList.add('message-token');
        const messageTokens = tokenCalculator.calculateTokens(messageData.content);
        const messagePrice = priceCalculator.calculatePrice(messageTokens, messageData.isUser, config.model);
        tokenElement.textContent = `Token 使用量: ${messageTokens} (约 ${messagePrice} 元)`;
        contentElement.appendChild(tokenElement);

        messageElement.appendChild(avatarElement);
        messageElement.appendChild(contentElement);

        const chatMessages = document.getElementById('chatMessages');
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    },

    renderMessages() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        this.messages.forEach(message => this.renderMessage(message));
        this.updateTotalTokens();
        logger.debug('渲染所有消息完成', { messageCount: this.messages.length });
    }
};

// API 请求模块
const apiManager = {
    async sendRequest(prompt) {
        const temperatureSelect = document.getElementById('temperatureSelect');
        const loadingIndicator = document.createElement('div');
        loadingIndicator.classList.add('loading-indicator');
        document.getElementById('chatMessages').appendChild(loadingIndicator);

        const requestData = {
            model: 'deepseek-chat',
            temperature: parseFloat(temperatureSelect.value),
            messages: [{ role: 'user', content: prompt }]
        };

        logger.info('发送 API 请求', {
            temperature: requestData.temperature,
            promptLength: prompt.length
        });

        try {
            const response = await fetch(config.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.API_KEY}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            if (data.choices && data.choices.length > 0) {
                const botResponse = data.choices[0].message.content;
                logger.info('收到 API 响应', {
                    responseLength: botResponse.length,
                    temperature: requestData.temperature
                });
                return botResponse;
            }
            throw new Error('No valid response from the API.');
        } catch (error) {
            logger.error('API 请求失败', error);
            throw error;
        } finally {
            loadingIndicator.remove();
        }
    }
};

// 事件处理模块
const eventHandlers = {
    init() {
        const saveApiKeyButton = document.getElementById('saveApiKeyButton');
        const sendButton = document.getElementById('sendButton');
        const userInput = document.getElementById('userInput');

        saveApiKeyButton.addEventListener('click', this.handleSaveApiKey);
        sendButton.addEventListener('click', this.handleSendMessage);
        userInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.handleSendMessage();
            }
        });

        // 模型选择事件
        document.getElementById('modelSelect').addEventListener('change', (e) => {
            const model = e.target.value;
            this.saveModel(model);
            logger.info(`模型已切换为: ${model}`);
        });

        // 添加重置 token 计数的按钮事件
        document.getElementById('resetTokenButton').addEventListener('click', this.resetTokenCount);

        logger.info('事件处理器初始化完成');
    },

    handleSaveApiKey() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        const newApiKey = apiKeyInput.value.trim();
        
        if (newApiKey) {
            config.API_KEY = newApiKey;
            localStorage.setItem('deepseekApiKey', newApiKey);
            messageManager.addMessage('API key saved successfully.', false);
            logger.info('API Key 已更新');
        } else {
            messageManager.addMessage('Please enter a valid API key.', false);
            logger.warn('尝试保存空的 API Key');
        }
    },

    async handleSendMessage() {
        const userInput = document.getElementById('userInput');
        const userMessage = userInput.value.trim();
        
        if (!userMessage) {
            logger.debug('尝试发送空消息');
            return;
        }

        messageManager.addMessage(userMessage, true);
        userInput.value = '';

        try {
            logger.info(`发送消息到模型: ${config.model}`);
            const botResponse = await apiManager.sendRequest(userMessage);
            messageManager.addMessage(botResponse, false);
        } catch (error) {
            let errorMessage = 'An unexpected error occurred. Please try again later.';
            if (error.message.includes('NetworkError')) {
                errorMessage = 'Network error. Please check your internet connection.';
                logger.error('网络错误', error);
            } else if (error.message.includes('API Error')) {
                errorMessage = `API error: ${error.message.replace('API Error: ', '')}`;
                logger.error('API 错误', error);
            } else {
                logger.error('未知错误', error);
            }
            messageManager.addMessage(errorMessage, false);
        }
    },

    // 加载模型设置
    loadModel() {
        const savedModel = localStorage.getItem('model');
        if (savedModel) {
            config.model = savedModel;
            document.getElementById('modelSelect').value = savedModel;
            logger.info(`已加载模型设置: ${savedModel}`);
        }
    },

    // 保存模型设置
    saveModel(model) {
        config.model = model;
        localStorage.setItem('model', model);
        logger.info(`已保存模型设置: ${model}`);
    },

    // 重置 token 计数
    resetTokenCount() {
        config.totalTokens = 0;
        document.getElementById('tokenCount').textContent = '0';
        localStorage.setItem('totalTokens', '0');
    }
};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    logger.info('应用初始化开始');
    messageManager.init();
    eventHandlers.init();
    logger.info('应用初始化完成');
});
