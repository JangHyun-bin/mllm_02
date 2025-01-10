import { useState, useEffect, useRef, useCallback } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { handleGPTResponse, handleClaudeResponse, handleGeminiResponse } from '../services/aiService';

export const useChat = () => {
    const [pages, setPages] = useState(() => loadFromStorage('chatPages', [
        { id: Date.now(), name: 'Chat 1', messages: [] }
    ]));
    const [currentPage, setCurrentPage] = useState(() => pages[0]?.id);
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

    // 현재 페이지의 메시지만 반환
    const messages = pages.find(p => p.id === currentPage)?.messages || [];

    // 메시지 업데이트 함수
    const updatePageMessages = useCallback((newMessage) => {
        setPages(prevPages => prevPages.map(page => 
            page.id === currentPage
                ? { ...page, messages: [...page.messages, newMessage] }
                : page
        ));
    }, [currentPage]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const groupId = Date.now();
        
        // 사용자 메시지를 각 활성화된 모델에 대해 복제
        const userMessages = Object.entries(activeLLMs)
            .filter(([_, isActive]) => isActive)
            .map(([model]) => ({
                role: 'user',
                content: input,
                groupId,
                model
            }));

        // 모든 사용자 메시지 추가
        userMessages.forEach(msg => updatePageMessages(msg));
        setInput('');

        // GPT 응답 처리
        if (activeLLMs.gpt) {
            setIsLoading(prev => ({ ...prev, gpt: true }));
            try {
                const gptResponse = await handleGPTResponse(input, groupId);
                updatePageMessages({
                    ...gptResponse,
                    model: 'gpt'
                });
            } catch (error) {
                console.error('GPT Error:', error);
                updatePageMessages({
                    role: 'assistant',
                    content: 'Error: Failed to get response from GPT',
                    groupId,
                    model: 'gpt'
                });
            } finally {
                setIsLoading(prev => ({ ...prev, gpt: false }));
            }
        }

        // Claude 응답 처리
        if (activeLLMs.claude) {
            setIsLoading(prev => ({ ...prev, claude: true }));
            try {
                const claudeResponse = await handleClaudeResponse(input, groupId);
                updatePageMessages({
                    ...claudeResponse,
                    model: 'claude'
                });
            } catch (error) {
                console.error('Claude Error:', error);
                updatePageMessages({
                    role: 'assistant',
                    content: 'Error: Failed to get response from Claude',
                    groupId,
                    model: 'claude'
                });
            } finally {
                setIsLoading(prev => ({ ...prev, claude: false }));
            }
        }

        // Gemini 응답 처리
        if (activeLLMs.gemini) {
            setIsLoading(prev => ({ ...prev, gemini: true }));
            try {
                const geminiResponse = await handleGeminiResponse(input, groupId);
                updatePageMessages({
                    ...geminiResponse,
                    model: 'gemini'
                });
            } catch (error) {
                console.error('Gemini Error:', error);
                updatePageMessages({
                    role: 'assistant',
                    content: 'Error: Failed to get response from Gemini',
                    groupId,
                    model: 'gemini'
                });
            } finally {
                setIsLoading(prev => ({ ...prev, gemini: false }));
            }
        }
    }, [input, activeLLMs, updatePageMessages]);

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
        messages,
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