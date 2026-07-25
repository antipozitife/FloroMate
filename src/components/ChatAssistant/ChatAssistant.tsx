import React, { useState, useRef, useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import './ChatAssistant.css';
import { apiUrl } from '../../config/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Привет! Я AI-помощник по растениям 🌿 Задайте мне вопрос о уходе за растениями!'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const userSubscription = user?.subscription;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (!isAuthenticated) {
      setMessages([...messages, {
        role: 'assistant',
        content: '🔒 Пожалуйста, войдите в систему, чтобы использовать AI-ассистента.'
      }]);
      return;
    }

    if (userSubscription && userSubscription.usedRequests >= userSubscription.dailyRequests) {
      setMessages([...messages, {
        role: 'assistant',
        content: `🚫 Достигнут лимит запросов на сегодня (${userSubscription.dailyRequests}). Обновите подписку для продолжения.`
      }]);
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          userId: user?.id
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessages([...newMessages, {
        role: 'assistant',
        content: data.response
      }]);

    } catch (error) {
      console.error('Ошибка:', error);
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Извините, произошла ошибка. Попробуйте позже.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions: string[] = [
    'Как ухаживать за монстерой?',
    'Какие растения подходят для дома?',
    'Почему желтеют листья?',
    'Как часто поливать кактус?'
  ];

  return (
    <>
      {!isOpen && (
        <button
          className="plant-assistant-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Открыть чат"
        >
          🌿Ai
        </button>
      )}

      {isOpen && (
        <div className="plant-assistant-container">
          <div className="plant-assistant-header">
            <div>
              <div className="plant-assistant-title">Растительный AI</div>
              <div className="plant-assistant-status">● Онлайн</div>
              {isAuthenticated && userSubscription && (
                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>
                  Запросов: {userSubscription.usedRequests}/{userSubscription.dailyRequests}
                </div>
              )}
            </div>
            <button
              className="plant-assistant-close"
              onClick={() => setIsOpen(false)}
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>

          <div className="plant-assistant-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`plant-assistant-message ${msg.role}`}>
                <div className="plant-assistant-message-avatar">
                  {msg.role === 'user' ? '👤' : '🌿'}
                </div>
                <div className="plant-assistant-message-content">{msg.content}</div>
              </div>
            ))}

            {isLoading && (
              <div className="plant-assistant-message assistant">
                <div className="plant-assistant-message-avatar">🌿</div>
                <div className="plant-assistant-message-loading">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            {messages.length === 1 && (
              <div className="plant-assistant-quick-questions">
                <div className="plant-assistant-quick-questions-title">Популярные вопросы:</div>
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="plant-assistant-quick-question-btn"
                    onClick={() => {
                      setInputValue(question);
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="plant-assistant-input-container">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Задайте вопрос о растениях..."
              rows={1}
              disabled={isLoading}
              className="plant-assistant-input"
            />
            <button
              className="plant-assistant-send-btn"
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
            >
              ➤
            </button>
          </div>

          <div className="plant-assistant-footer">Powered by GigaChat AI</div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;
