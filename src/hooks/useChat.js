import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { handleGPTResponse, handleClaudeResponse, handleGeminiResponse } from '../services/aiService';
import { TOKEN_LIMITS, estimateTokenCount } from '../utils/tokenLimits';

export const useChat = () => {
    const [pages, setPages] = useState([{ id: 1, name: 'New Chat', messages: [] }]);
    const [currentPage, setCurrentPage] = useState(1);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState({ gpt: false, claude: false, gemini: false });
    const [activeLLMs, setActiveLLMs] = useState({ gpt: true, claude: true, gemini: true });
    const [deletedPages, setDeletedPages] = useState({});
    const [allClearedPages, setAllClearedPages] = useState(null);
    const [clearRestoreCountdown, setClearRestoreCountdown] = useState(0);
    const [selectedModels, setSelectedModels] = useState({
        gpt: 'gpt-3.5-turbo',
        claude: 'claude-3-opus-20240229',
        gemini: 'gemini-pro'
    });
    const [hoveredGroupId, setHoveredGroupId] = useState(null);
    const [restoreCountdowns, setRestoreCountdowns] = useState({});

    // 현재 페이지의 메시지들을 가져오는 함수
    const currentMessages = useMemo(() => {
        const currentPageData = pages.find(p => p.id === currentPage);
        return currentPageData?.messages || [];
    }, [pages, currentPage]);

    // 메시지 업데이트 함수
    const updatePageMessages = useCallback((newMessage) => {
        setPages(prevPages => 
            prevPages.map(page => 
                page.id === currentPage
                    ? {
                        ...page,
                        messages: [...page.messages, {
                            ...newMessage,
                            timestamp: Date.now(),
                            pageId: currentPage
                        }]
                    }
                    : page
            )
        );
    }, [currentPage]);

    // 대화 맥락을 포맷팅하는 함수 (토큰 제한 적용)
    const formatConversationContext = useCallback((messages, model, llm) => {
        const tokenLimit = TOKEN_LIMITS[llm]?.[model] || 4096; // 기본값 설정
        const maxContextTokens = Math.floor(tokenLimit * 0.8); // 전체 토큰의 80%만 컨텍스트에 사용
        
        // 메시지 역순으로 정렬 (최신 메시지부터)
        const reversedMessages = [...messages].reverse();
        
        let contextMessages = [];
        let totalTokens = 0;
        
        // 토큰 제한을 고려하여 메시지 추가
        for (const msg of reversedMessages) {
            const messageTokens = estimateTokenCount(msg.content);
            if (totalTokens + messageTokens > maxContextTokens) {
                break;
            }
            contextMessages.unshift(msg); // 원래 순서로 다시 추가
            totalTokens += messageTokens;
        }
        
        // 대화 내용을 깔끔하게 포맷팅
        const formattedContext = contextMessages.map(msg => {
            const role = msg.role === 'user' ? 'Human' : 'Assistant';
            return `${role}: ${msg.content}`;
        }).join('\n\n');

        return `Previous conversation context (within ${tokenLimit} token limit):
${formattedContext}

Current conversation:
Human: `;
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const groupId = Date.now();

        // 사용자 메시지 추가
        const userMessage = {
            role: 'user',
            content: input.trim(),
            groupId,
            timestamp: Date.now(),
            pageId: currentPage
        };
        
        // 즉시 사용자 메시지 추가
        updatePageMessages(userMessage);
        setInput('');

        // GPT 응답 처리
        if (activeLLMs.gpt) {
            setIsLoading(prev => ({ ...prev, gpt: true }));
            try {
                const conversationContext = formatConversationContext(
                    currentMessages,
                    selectedModels.gpt,
                    'gpt'
                );
                const fullPrompt = `${conversationContext}${input}`;
                const response = await handleGPTResponse(fullPrompt, groupId);
                
                // AI 응답 추가
                updatePageMessages({
                    role: 'assistant',
                    content: response.content,
                    model: 'gpt',
                    groupId,
                    pageId: currentPage
                });
            } catch (error) {
                console.error('GPT Error:', error);
                updatePageMessages({
                    role: 'assistant',
                    content: 'Error: Failed to get response from GPT',
                    model: 'gpt',
                    groupId,
                    pageId: currentPage
                });
            } finally {
                setIsLoading(prev => ({ ...prev, gpt: false }));
            }
        }

        // Claude 응답 처리
        if (activeLLMs.claude) {
            setIsLoading(prev => ({ ...prev, claude: true }));
            try {
                const conversationContext = formatConversationContext(
                    currentMessages,
                    selectedModels.claude,
                    'claude'
                );
                const fullPrompt = `${conversationContext}${input}`;
                const response = await handleClaudeResponse(fullPrompt, groupId);
                
                updatePageMessages({
                    role: 'assistant',
                    content: response.content,
                    model: 'claude',
                    groupId,
                    pageId: currentPage
                });
            } catch (error) {
                console.error('Claude Error:', error);
                updatePageMessages({
                    role: 'assistant',
                    content: 'Error: Failed to get response from Claude',
                    model: 'claude',
                    groupId,
                    pageId: currentPage
                });
            } finally {
                setIsLoading(prev => ({ ...prev, claude: false }));
            }
        }

        // Gemini 응답 처리
        if (activeLLMs.gemini) {
            setIsLoading(prev => ({ ...prev, gemini: true }));
            try {
                const conversationContext = formatConversationContext(
                    currentMessages,
                    selectedModels.gemini,
                    'gemini'
                );
                const fullPrompt = `${conversationContext}${input}`;
                const response = await handleGeminiResponse(fullPrompt, groupId);
                
                updatePageMessages({
                    role: 'assistant',
                    content: response.content,
                    model: 'gemini',
                    groupId,
                    pageId: currentPage
                });
            } catch (error) {
                console.error('Gemini Error:', error);
                updatePageMessages({
                    role: 'assistant',
                    content: 'Error: Failed to get response from Gemini',
                    model: 'gemini',
                    groupId,
                    pageId: currentPage
                });
            } finally {
                setIsLoading(prev => ({ ...prev, gemini: false }));
            }
        }
    }, [
        input,
        currentPage,
        activeLLMs,
        selectedModels,
        currentMessages,
        updatePageMessages,
        formatConversationContext
    ]);

    const addNewPage = useCallback(() => {
        const newPage = {
            id: Date.now(),
            name: `Chat ${pages.length + 1}`,
            messages: []
        };
        setPages(prev => [...prev, newPage]);
        setCurrentPage(newPage.id);
    }, [pages.length]);

    const changePage = useCallback((pageId) => {
        setCurrentPage(pageId);
    }, []);

    const deletePage = useCallback((pageId) => {
        const pageToDelete = pages.find(p => p.id === pageId);
        if (pageToDelete) {
            setDeletedPages(prev => ({
                ...prev,
                [pageId]: pageToDelete
            }));
            setRestoreCountdowns(prev => ({
                ...prev,
                [pageId]: 15  // 15초 카운트다운 시작
            }));
            setPages(prev => prev.filter(p => p.id !== pageId));
            
            // 삭제된 페이지가 현재 페이지였다면 다른 페이지로 이동
            if (currentPage === pageId) {
                const remainingPages = pages.filter(p => p.id !== pageId);
                if (remainingPages.length > 0) {
                    setCurrentPage(remainingPages[0].id);
                }
            }
        }
    }, [pages, currentPage]);

    const restorePage = useCallback((pageId) => {
        const pageToRestore = deletedPages[pageId];
        if (pageToRestore) {
            setPages(prev => [...prev, pageToRestore]);
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
        }
    }, [deletedPages]);

    const clearAllChats = useCallback(() => {
        setAllClearedPages(pages);
        setPages([{ id: Date.now(), name: 'Chat 1', messages: [] }]);
        setCurrentPage(null);
        setClearRestoreCountdown(10);
    }, [pages]);

    const restoreAllChats = useCallback(() => {
        if (allClearedPages) {
            setPages(allClearedPages);
            setAllClearedPages(null);
            setClearRestoreCountdown(0);
        }
    }, [allClearedPages]);

    const handleModelChange = useCallback((llm, modelId) => {
        setSelectedModels(prev => ({
            ...prev,
            [llm]: modelId
        }));
    }, []);

    const renamePage = useCallback((pageId, newName) => {
        setPages(prev => prev.map(page => 
            page.id === pageId
                ? { ...page, name: newName }
                : page
        ));
    }, []);

    useEffect(() => {
        saveToStorage('chatPages', pages);
    }, [pages]);

    useEffect(() => {
        const timer = setInterval(() => {
            setRestoreCountdowns(prev => {
                const newCountdowns = { ...prev };
                Object.keys(newCountdowns).forEach(pageId => {
                    if (newCountdowns[pageId] > 0) {
                        newCountdowns[pageId]--;
                        if (newCountdowns[pageId] === 0) {
                            // 카운트다운이 끝나면 삭제된 페이지 정보도 제거
                            setDeletedPages(prev => {
                                const newDeletedPages = { ...prev };
                                delete newDeletedPages[pageId];
                                return newDeletedPages;
                            });
                        }
                    }
                });
                return newCountdowns;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return {
        pages,
        currentPage,
        messages: currentMessages,
        input,
        setInput,
        isLoading,
        activeLLMs,
        setActiveLLMs,
        handleSubmit,
        addNewPage,
        changePage,
        deletePage,
        restorePage,
        clearAllChats,
        restoreAllChats,
        deletedPages,
        allClearedPages,
        clearRestoreCountdown,
        selectedModels,
        handleModelChange,
        hoveredGroupId,
        setHoveredGroupId,
        restoreCountdowns,
        renamePage
    };
}; 