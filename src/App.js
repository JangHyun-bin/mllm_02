import { useState } from 'react';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

const anthropic = new Anthropic({
    apiKey: process.env.REACT_APP_CLAUDE_API_KEY,
    dangerouslyAllowBrowser: true
});

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState({
    gpt: false,
    claude: false,
    gemini: false
  });
  const [pages, setPages] = useState([{ id: 1, name: 'Chat 1', messages: [] }]);
  const [currentPage, setCurrentPage] = useState(1);

  // LoadingIndicator 컴포넌트 추가
  const LoadingIndicator = () => (
    <div className="flex space-x-1 items-center h-6">
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );

  // 새 페이지 추가
  const addNewPage = () => {
    const newPage = {
      id: pages.length + 1,
      name: `Chat ${pages.length + 1}`,
      messages: []
    };
    setPages([...pages, newPage]);
    setCurrentPage(newPage.id);
    setMessages([]);
  };

  // 페이지 변경
  const changePage = (pageId) => {
    setCurrentPage(pageId);
    const page = pages.find(p => p.id === pageId);
    if (page) {
      setMessages(page.messages);
    }
  };

  // 메시지 저장 시 현재 페이지에도 저장
  const updateMessages = (newMessages) => {
    setMessages(newMessages);
    const updatedPages = pages.map(page => 
      page.id === currentPage 
        ? { ...page, messages: newMessages }
        : page
    );
    setPages(updatedPages);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    updateMessages(newMessages);
    setInput('');

    setIsLoading({
      gpt: true,
      claude: true,
      gemini: true
    });

    try {
      // 각 API 호출을 개별적으로 처리
      const responses = await Promise.allSettled([
        openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [...messages, userMessage]
        }),
        anthropic.messages.create({
          model: "claude-3-opus-20240229",
          max_tokens: 1024,
          messages: [{ role: "user", content: input }]
        }),
        geminiModel.generateContent(input)
      ]);

      console.log('API Responses:', responses); // 디버깅용

      let updatedMessages = [...newMessages];

      // GPT 응답 처리
      if (responses[0].status === 'fulfilled') {
        updatedMessages.push({
          role: 'assistant',
          content: responses[0].value.choices[0].message.content,
          model: 'gpt'
        });
      }

      // Claude 응답 처리
      if (responses[1].status === 'fulfilled') {
        updatedMessages.push({
          role: 'assistant',
          content: responses[1].value.content[0].text,
          model: 'claude'
        });
      }

      // Gemini 응답 처리
      if (responses[2].status === 'fulfilled') {
        const geminiResult = await responses[2].value.response.text();
        updatedMessages.push({
          role: 'assistant',
          content: geminiResult,
          model: 'gemini'
        });
      }

      updateMessages(updatedMessages);

    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    } finally {
      setIsLoading({
        gpt: false,
        claude: false,
        gemini: false
      });
    }
  }

  return (
    <div className="h-screen flex">
      {/* 사이드바 */}
      <div className="w-64 bg-gray-100 border-r border-gray-300 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Chats</h2>
          <button
            onClick={addNewPage}
            className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
          >
            +
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {pages.map(page => (
            <div
              key={page.id}
              onClick={() => changePage(page.id)}
              className={`p-3 mb-2 rounded-lg cursor-pointer ${
                currentPage === page.id
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-200'
              }`}
            >
              {page.name}
            </div>
          ))}
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col">
        {/* 응답 영역 */}
        <div className="flex-1 flex min-h-0">
          {/* GPT 응답 */}
          <div className="flex-1 border-r border-gray-300 p-4 overflow-y-auto">
            <div className="text-lg font-bold mb-4 sticky top-0 bg-white">GPT Response</div>
            <div className="space-y-4">
              {messages.map((message, index) => (
                message.model === 'gpt' && (
                  <div key={index} className="bg-gray-200 text-gray-800 rounded-lg p-3">
                    {message.content}
                  </div>
                )
              ))}
              {isLoading.gpt && <LoadingIndicator />}
            </div>
          </div>

          {/* Claude 응답 */}
          <div className="flex-1 border-r border-gray-300 p-4 overflow-y-auto">
            <div className="text-lg font-bold mb-4 sticky top-0 bg-white">Claude Response</div>
            <div className="space-y-4">
              {messages.map((message, index) => (
                message.model === 'claude' && (
                  <div key={index} className="bg-purple-100 rounded-lg p-3">
                    {message.content}
                  </div>
                )
              ))}
              {isLoading.claude && <LoadingIndicator />}
            </div>
          </div>

          {/* Gemini 응답 */}
          <div className="flex-1 border-r border-gray-300 p-4 overflow-y-auto">
            <div className="text-lg font-bold mb-4 sticky top-0 bg-white">Gemini Response</div>
            <div className="space-y-4">
              {messages.map((message, index) => (
                message.model === 'gemini' && (
                  <div key={index} className="bg-green-100 rounded-lg p-3">
                    {message.content}
                  </div>
                )
              ))}
              {isLoading.gemini && <LoadingIndicator />}
            </div>
          </div>

          {/* 사용자 입력 표시 영역 */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="text-lg font-bold mb-4 sticky top-0 bg-white">User Messages</div>
            <div className="space-y-4">
              {messages.map((message, index) => (
                message.role === 'user' && (
                  <div key={index} className="bg-blue-500 text-white rounded-lg p-3">
                    {message.content}
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* 입력 폼 */}
        <div className="border-t border-gray-300 p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="메시지를 입력하세요..."
            />
            <button 
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              전송
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;