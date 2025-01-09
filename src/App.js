import { useState, useEffect } from 'react';
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

  // LLM 활성화 상태 관리
  const [activeLLMs, setActiveLLMs] = useState({
    gpt: true,
    claude: true,
    gemini: true
  });

  // 각 LLM의 사용 가능한 모델 목록
  const models = {
    gpt: [
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ],
    claude: [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      { id: 'claude-2.1', name: 'Claude 2.1' }
    ],
    gemini: [
      { id: 'gemini-pro', name: 'Gemini Pro' },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision' }
    ]
  };

  // 선택된 모델 상태
  const [selectedModels, setSelectedModels] = useState({
    gpt: 'gpt-3.5-turbo',
    claude: 'claude-3-opus-20240229',
    gemini: 'gemini-pro'
  });

  // 모델 선택 핸들러
  const handleModelChange = (llm, modelId) => {
    setSelectedModels(prev => ({
      ...prev,
      [llm]: modelId
    }));
  };

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

  // ModelSelector 컴포넌트
  const ModelSelector = ({ llm, models, selected, onChange }) => (
    <select
      value={selected}
      onChange={(e) => onChange(llm, e.target.value)}
      className="text-sm border rounded-md px-2 py-1 bg-white"
    >
      {models.map(model => (
        <option key={model.id} value={model.id}>
          {model.name}
        </option>
      ))}
    </select>
  );

  // 토글 스위치 컴포넌트
  const ToggleSwitch = ({ llm, isActive, onToggle }) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onToggle(llm)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300
          ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300
            ${isActive ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
      <span className="text-sm font-medium">{llm.toUpperCase()}</span>
    </div>
  );

  // API 호출 시 활성화된 LLM만 처리
  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    updateMessages(newMessages);
    setInput('');

    setIsLoading({
      gpt: activeLLMs.gpt,
      claude: activeLLMs.claude,
      gemini: activeLLMs.gemini
    });

    try {
      const apiCalls = [];
      
      if (activeLLMs.gpt) {
        apiCalls.push(
          openai.chat.completions.create({
            model: selectedModels.gpt,
            messages: [...messages, userMessage]
          })
        );
      }
      
      if (activeLLMs.claude) {
        apiCalls.push(
          anthropic.messages.create({
            model: selectedModels.claude,
            max_tokens: 1024,
            messages: [{ role: "user", content: input }]
          })
        );
      }
      
      if (activeLLMs.gemini) {
        apiCalls.push(geminiModel.generateContent(input));
      }

      const responses = await Promise.allSettled(apiCalls);
      let updatedMessages = [...newMessages];
      let responseIndex = 0;

      if (activeLLMs.gpt && responses[responseIndex]?.status === 'fulfilled') {
        updatedMessages.push({
          role: 'assistant',
          content: responses[responseIndex].value.choices[0].message.content,
          model: 'gpt'
        });
        responseIndex++;
      }

      if (activeLLMs.claude && responses[responseIndex]?.status === 'fulfilled') {
        updatedMessages.push({
          role: 'assistant',
          content: responses[responseIndex].value.content[0].text,
          model: 'claude'
        });
        responseIndex++;
      }

      if (activeLLMs.gemini && responses[responseIndex]?.status === 'fulfilled') {
        const geminiResult = await responses[responseIndex].value.response.text();
        updatedMessages.push({
          role: 'assistant',
          content: geminiResult,
          model: 'gemini'
        });
      }

      updateMessages(updatedMessages);

    } catch (error) {
      console.error('Error details:', error);
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
        
        {/* 채팅 목록 */}
        <div className="flex-1 overflow-y-auto mb-4">
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

        {/* 구분선 */}
        <div className="border-t border-gray-300 my-4"></div>

        {/* LLM 토글 */}
        <div className="space-y-3">
          <ToggleSwitch
            llm="gpt"
            isActive={activeLLMs.gpt}
            onToggle={(llm) => setActiveLLMs(prev => ({ ...prev, [llm]: !prev[llm] }))}
          />
          <ToggleSwitch
            llm="claude"
            isActive={activeLLMs.claude}
            onToggle={(llm) => setActiveLLMs(prev => ({ ...prev, [llm]: !prev[llm] }))}
          />
          <ToggleSwitch
            llm="gemini"
            isActive={activeLLMs.gemini}
            onToggle={(llm) => setActiveLLMs(prev => ({ ...prev, [llm]: !prev[llm] }))}
          />
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex min-h-0">
          {/* GPT 응답 */}
          <div 
            className={`transition-all duration-300 ease-in-out flex flex-col ${
              activeLLMs.gpt 
                ? 'flex-1 opacity-100 visible' 
                : 'w-0 opacity-0 invisible'
            } border-r border-gray-300 overflow-hidden`}
          >
            <div className="h-full overflow-y-auto">
              <div className="sticky top-0 bg-white z-10 p-4 border-b">
                <div className="text-lg font-bold flex justify-between items-center">
                  <span className="whitespace-nowrap">GPT</span>
                  <ModelSelector
                    llm="gpt"
                    models={models.gpt}
                    selected={selectedModels.gpt}
                    onChange={handleModelChange}
                  />
                </div>
              </div>
              <div className="p-4 space-y-4">
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
          </div>

          {/* Claude 응답 */}
          <div 
            className={`transition-all duration-300 ease-in-out flex flex-col ${
              activeLLMs.claude 
                ? 'flex-1 opacity-100 visible' 
                : 'w-0 opacity-0 invisible'
            } border-r border-gray-300 overflow-hidden`}
          >
            <div className="h-full overflow-y-auto">
              <div className="sticky top-0 bg-white z-10 p-4 border-b">
                <div className="text-lg font-bold flex justify-between items-center">
                  <span className="whitespace-nowrap">Claude</span>
                  <ModelSelector
                    llm="claude"
                    models={models.claude}
                    selected={selectedModels.claude}
                    onChange={handleModelChange}
                  />
                </div>
              </div>
              <div className="p-4 space-y-4">
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
          </div>

          {/* Gemini 응답 */}
          <div 
            className={`transition-all duration-300 ease-in-out flex flex-col ${
              activeLLMs.gemini 
                ? 'flex-1 opacity-100 visible' 
                : 'w-0 opacity-0 invisible'
            } border-r border-gray-300 overflow-hidden`}
          >
            <div className="h-full overflow-y-auto">
              <div className="sticky top-0 bg-white z-10 p-4 border-b">
                <div className="text-lg font-bold flex justify-between items-center">
                  <span className="whitespace-nowrap">Gemini</span>
                  <ModelSelector
                    llm="gemini"
                    models={models.gemini}
                    selected={selectedModels.gemini}
                    onChange={handleModelChange}
                  />
                </div>
              </div>
              <div className="p-4 space-y-4">
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