import { useState, useEffect, useRef } from 'react';
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

// 스타일 정의를 App 컴포넌트 위에 추가
const styles = `
  @keyframes scaleUp {
    0% { transform: scale(1); }
    100% { transform: scale(1.05); }
  }

  @keyframes scaleDown {
    0% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  .message-animate {
    animation: scaleDown 0.5s ease-in-out forwards;
  }

  .message-animate.hovered {
    animation: scaleUp 0.5s ease-in-out forwards;
  }
`;

function App() {
  // localStorage에서 데이터를 불러와서 초기 상태 설정
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState({
    gpt: false,
    claude: false,
    gemini: false
  });
  const [pages, setPages] = useState(() => {
    const savedPages = localStorage.getItem('chatPages');
    return savedPages ? JSON.parse(savedPages) : [{ id: 1, name: 'Chat 1', messages: [] }];
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const savedCurrentPage = localStorage.getItem('currentPage');
    return savedCurrentPage ? JSON.parse(savedCurrentPage) : 1;
  });

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

  // 상태가 변경될 때마다 localStorage에 저장하기 위한 useEffect
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chatPages', JSON.stringify(pages));
  }, [pages]);

  useEffect(() => {
    localStorage.setItem('currentPage', JSON.stringify(currentPage));
  }, [currentPage]);

  // 기존의 updateMessages 함수 수정
  const updateMessages = (newMessages) => {
    setMessages(newMessages);
    const updatedPages = pages.map(page =>
      page.id === currentPage
        ? { ...page, messages: newMessages }
        : page
    );
    setPages(updatedPages);
    // localStorage에 직접 저장
    localStorage.setItem('chatMessages', JSON.stringify(newMessages));
    localStorage.setItem('chatPages', JSON.stringify(updatedPages));
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

  // 현재 호버된 그룹 ID를 추적
  const [hoveredGroupId, setHoveredGroupId] = useState(null);

  // API 호출 시 활성화된 LLM만 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const groupId = messages.length > 0 ? messages[messages.length - 1].groupId + 1 : 0;

    // 사용자 메시지 추가
    const userMessage = {
      role: 'user',
      content: input,
      groupId: groupId
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    // 활성화된 각 AI 모델에 대해 응답 처리
    if (activeLLMs.gpt) {
      const gptResponse = await handleGPTResponse(input, groupId);
      if (gptResponse) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: gptResponse,
          model: 'gpt',
          groupId: groupId
        }]);
      }
    }

    if (activeLLMs.claude) {
      const claudeResponse = await handleClaudeResponse(input, groupId);
      if (claudeResponse) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: claudeResponse,
          model: 'claude',
          groupId: groupId
        }]);
      }
    }

    if (activeLLMs.gemini) {
      const geminiResponse = await handleGeminiResponse(input, groupId);
      if (geminiResponse) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: geminiResponse,
          model: 'gemini',
          groupId: groupId
        }]);
      }
    }

    // localStorage 업데이트
    const currentPageData = pages.find(p => p.id === currentPage);
    if (currentPageData) {
      const updatedPages = pages.map(page =>
        page.id === currentPage
          ? { ...page, messages: messages }
          : page
      );
      setPages(updatedPages);
      localStorage.setItem('chatPages', JSON.stringify(updatedPages));
    }
  };

  // AI 응답 메시지 컴포넌트
  const ResponseMessage = ({ message }) => (
    <div
      onMouseEnter={() => setHoveredGroupId(message.groupId)}
      onMouseLeave={() => setHoveredGroupId(null)}
      className={`rounded-lg p-3 transition-transform duration-1500 ease-in-out transform
        ${message.model === 'gpt'
          ? 'bg-gray-200 text-gray-800'
          : message.model === 'claude'
          ? 'bg-purple-100'
          : 'bg-green-100'
        }
        ${hoveredGroupId === message.groupId ? 'scale-105' : 'scale-100'}
      `}
    >
      {message.content}
    </div>
  );

  // 사용자 메시지 컴포넌트
  const UserMessage = ({ message }) => (
    <div
      onMouseEnter={() => setHoveredGroupId(message.groupId)}
      onMouseLeave={() => setHoveredGroupId(null)}
      className={`bg-blue-500 text-white rounded-lg p-3 transition-transform duration-1500 ease-in-out transform
        ${hoveredGroupId === message.groupId ? 'scale-105' : 'scale-100'}
      `}
    >
      {message.content}
    </div>
  );

  // export 함수 추가
  const exportCurrentPageMessages = () => {
    // localStorage에서 최신 데이터를 가져옴
    const savedPages = JSON.parse(localStorage.getItem('chatPages') || '[]');
    const currentPageData = savedPages.find(p => p.id === currentPage) || pages.find(p => p.id === currentPage);
    
    // 현재 메모리의 messages 상태를 사용
    const exportData = {
      pageName: currentPageData.name,
      exportDate: new Date().toISOString(),
      messages: messages.map(msg => ({
        timestamp: new Date().toISOString(),
        role: msg.role,
        content: msg.content,
        model: msg.model || null,
        groupId: msg.groupId
      }))
    };

    // JSON 파일 다운로드
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-${currentPageData.name}-${new Date().toLocaleDateString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 삭제된 페이지 상태 추가
  const [deletedPages, setDeletedPages] = useState({});
  const [restoreCountdowns, setRestoreCountdowns] = useState({});

  // 페이머 ID를 저장할 ref 추가
  const timerRefs = useRef({});

  // 페이지 삭제 함수 수정
  const deletePage = (pageId, e) => {
    e.stopPropagation();
    
    // 마지막 페이지는 삭제 불가
    if (pages.length === 1) return;

    // 이전 타이머가 있다면 정리
    if (timerRefs.current[pageId]) {
      clearInterval(timerRefs.current[pageId]);
    }

    // 삭제할 페이지 정보 저장 (null check 추가)
    const pageToDelete = pages.find(page => page.id === pageId);
    if (!pageToDelete) return; // 페이지가 없으면 함수 종료

    setDeletedPages(prev => ({
      ...prev,
      [pageId]: pageToDelete
    }));

    // 페이지 삭제
    const updatedPages = pages.filter(page => page.id !== pageId);
    setPages(updatedPages);

    // 현재 페이지였다면 다른 페이지로 이동 (안전 체크 추가)
    if (currentPage === pageId && updatedPages.length > 0) {
      const newCurrentPage = updatedPages[0].id;
      setCurrentPage(newCurrentPage);
      const newPageMessages = updatedPages[0].messages || [];
      setMessages(newPageMessages);
    }

    // 복원 카운트다운 시작
    let countdown = 15;
    setRestoreCountdowns(prev => ({
      ...prev,
      [pageId]: countdown
    }));

    // 새로운 타이머 설정 및 저장
    const countdownInterval = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        clearInterval(timerRefs.current[pageId]);
        // 복원 옵션 제거
        setDeletedPages(prev => {
          const newDeletedPages = { ...prev };
          delete newDeletedPages[pageId];
          return newDeletedPages;
        });
        setRestoreCountdowns(prev => {
          const newCountdowns = { ...prev };
          delete newCountdowns[pageId];
          return newCountdowns;
        });
        // 타이머 ref 제거
        delete timerRefs.current[pageId];
        return;
      }

      setRestoreCountdowns(prev => ({
        ...prev,
        [pageId]: countdown
      }));
    }, 1000);

    // 타이머 ID 저장
    timerRefs.current[pageId] = countdownInterval;

    // localStorage 업데이트 (안전 체크 추가)
    if (updatedPages.length > 0) {
      localStorage.setItem('chatPages', JSON.stringify(updatedPages));
    }
  };

  // 페이지 복원 함수
  const restorePage = (pageId, e) => {
    e.stopPropagation();
    
    // 타이머 정리
    if (timerRefs.current[pageId]) {
      clearInterval(timerRefs.current[pageId]);
      delete timerRefs.current[pageId];
    }

    const pageToRestore = deletedPages[pageId];
    if (!pageToRestore) return;

    // 페이지 복원
    const updatedPages = [...pages, pageToRestore];
    setPages(updatedPages);
    
    // 복원 상태 제거
    setDeletedPages(prev => {
      const newDeletedPages = { ...prev };
      delete newDeletedPages[pageId];
      return newDeletedPages;
    });
    setRestoreCountdowns(prev => {
      const newCountdowns = { ...prev };
      delete newCountdowns[pageId];
      return newCountdowns;
    });

    localStorage.setItem('chatPages', JSON.stringify(updatedPages));
  };

  // 컴포넌트 언마운트 시 모든 타이머 정리
  useEffect(() => {
    return () => {
      Object.values(timerRefs.current).forEach(timerId => {
        clearInterval(timerId);
      });
    };
  }, []);

  // GPT API 호출 함수 추가
  const handleGPTResponse = async (input, groupId) => {
    try {
      const conversationHistory = messages
        .filter(msg => msg.groupId === groupId)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant.' },
            ...conversationHistory,
            { role: 'user', content: input }
          ],
          max_tokens: 1000
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('GPT Error:', error);
      return 'Error occurred while processing your request.';
    }
  };

  // Claude API 호출 함수 (기존 코드)
  const handleClaudeResponse = async (input, groupId) => {
    try {
      const conversationHistory = messages
        .filter(msg => msg.groupId === groupId)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        system: "You are a helpful AI assistant. Maintain context of the conversation and provide relevant responses.",
        messages: [
          ...conversationHistory,
          { role: 'user', content: input }
        ]
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Claude Error:', error);
      return 'Error occurred while processing your request.';
    }
  };

  // Gemini API 호출 함수 (기존 코드)
  const handleGeminiResponse = async (input, groupId) => {
    try {
      const history = messages
        .filter(msg => msg.groupId === groupId)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

      const chat = geminiModel.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      const result = await chat.sendMessage(input);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini Error:', error);
      return 'Error occurred while processing your request.';
    }
  };

  return (
    <>
      <style>{styles}</style>
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
            {[...pages, ...Object.values(deletedPages)].sort((a, b) => a.id - b.id).map(page => {
              const isDeleted = deletedPages[page.id];
              
              if (isDeleted) {
                // Restore 버튼 표시
                return (
                  <div
                    key={`restore-${page.id}`}
                    className="p-3 mb-2 rounded-lg bg-gray-200 flex items-center"
                  >
                    <button
                      onClick={(e) => restorePage(page.id, e)}
                      className="text-blue-500 hover:text-blue-700 whitespace-nowrap"
                    >
                      Restore {page.name}
                    </button>
                    {/* 진행 막대 */}
                    <div className="ml-3 flex-1 bg-gray-300 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{
                          width: `${(restoreCountdowns[page.id] / 15) * 100}%`,
                          transition: 'width 1s linear'
                        }}
                      />
                    </div>
                  </div>
                );
              }

              // 일반 채팅 항목 표시
              return (
                <div
                  key={page.id}
                  onClick={() => changePage(page.id)}
                  className={`p-3 mb-2 rounded-lg cursor-pointer flex justify-between items-center ${
                    currentPage === page.id
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <span>{page.name}</span>
                  {pages.length > 1 && (
                    <button
                      onClick={(e) => deletePage(page.id, e)}
                      className={`px-2 rounded-full hover:bg-red-500 hover:text-white
                        ${currentPage === page.id ? 'text-white' : 'text-gray-500'}
                      `}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* 새 채팅 버튼 */}
          <button
            onClick={addNewPage}
            className="mb-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            New Chat
          </button>

          {/* 구분선 */}
          <div className="border-t border-gray-300 my-4"></div>

          {/* Export 버튼 */}
          <button
            onClick={exportCurrentPageMessages}
            className="mb-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <span>Export Messages</span>
          </button>

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
                  {messages
                    .filter(message => message.model === 'gpt')
                    .map((message, index) => (
                      <ResponseMessage
                        key={`gpt-${index}`}
                        message={message}
                      />
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
                  {messages
                    .filter(message => message.model === 'claude')
                    .map((message, index) => (
                      <ResponseMessage
                        key={`claude-${index}`}
                        message={message}
                      />
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
                  {messages
                    .filter(message => message.model === 'gemini')
                    .map((message, index) => (
                      <ResponseMessage
                        key={`gemini-${index}`}
                        message={message}
                      />
                    ))}
                  {isLoading.gemini && <LoadingIndicator />}
                </div>
              </div>
            </div>

            {/* 사용자 메시지 */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="text-lg font-bold mb-4 sticky top-0 bg-white">User Messages</div>
              <div className="space-y-4">
                {messages
                  .filter(message => message.role === 'user')
                  .map((message, index) => (
                    <UserMessage
                      key={`user-${index}`}
                      message={message}
                    />
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
    </>
  );
}

export default App;