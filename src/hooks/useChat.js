import { useState, useEffect, useRef, useCallback } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { handleGPTResponse, handleClaudeResponse, handleGeminiResponse } from '../services/aiService';

export const useChat = () => {
    const [messages, setMessages] = useState(() => loadFromStorage('chatMessages', []));
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState({
        gpt: false,
        claude: false,
        gemini: false
    });
    const [pages, setPages] = useState(() => loadFromStorage('chatPages', [{ id: 1, name: 'Chat 1', messages: [] }]));
    const [currentPage, setCurrentPage] = useState(() => loadFromStorage('currentPage', 1));
    const [activeLLMs, setActiveLLMs] = useState({
        gpt: true,
        claude: true,
        gemini: true
    });
    const [selectedModels, setSelectedModels] = useState({
        gpt: 'gpt-3.5-turbo',
        claude: 'claude-3-opus-20240229',
        gemini: 'gemini-pro'
    });
    const [hoveredGroupId, setHoveredGroupId] = useState(null);
    const [deletedPages, setDeletedPages] = useState({});
    const [restoreCountdowns, setRestoreCountdowns] = useState({});
    const [allClearedPages, setAllClearedPages] = useState(null);
    const [clearRestoreCountdown, setClearRestoreCountdown] = useState(0);

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
                model // 모델 정보 추가
            }));

        // 모든 사용자 메시지 추가
        setMessages(prev => [...prev, ...userMessages]);
        setInput('');

        // GPT 응답 처리
        if (activeLLMs.gpt) {
            setIsLoading(prev => ({ ...prev, gpt: true }));
            try {
                const gptResponse = await handleGPTResponse(input, groupId);
                if (gptResponse) {  // 응답 확인
                    setMessages(prev => [...prev, {
                        ...gptResponse,
                        model: 'gpt'
                    }]);
                }
            } catch (error) {
                console.error('GPT Error:', error);
                // 에러 처리 추가
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'Error: Failed to get response from GPT',
                    groupId,
                    model: 'gpt'
                }]);
            } finally {
                setIsLoading(prev => ({ ...prev, gpt: false }));
            }
        }

        // Claude 응답 처리
        if (activeLLMs.claude) {
            setIsLoading(prev => ({ ...prev, claude: true }));
            try {
                const claudeResponse = await handleClaudeResponse(input, groupId);
                if (claudeResponse) {  // 응답 확인
                    setMessages(prev => [...prev, {
                        ...claudeResponse,
                        model: 'claude'
                    }]);
                }
            } catch (error) {
                console.error('Claude Error:', error);
                // 에러 처리 추가
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'Error: Failed to get response from Claude',
                    groupId,
                    model: 'claude'
                }]);
            } finally {
                setIsLoading(prev => ({ ...prev, claude: false }));
            }
        }

        // Gemini 응답 처리
        if (activeLLMs.gemini) {
            setIsLoading(prev => ({ ...prev, gemini: true }));
            try {
                const geminiResponse = await handleGeminiResponse(input, groupId);
                if (geminiResponse) {  // 응답 확인
                    setMessages(prev => [...prev, {
                        ...geminiResponse,
                        model: 'gemini'
                    }]);
                }
            } catch (error) {
                console.error('Gemini Error:', error);
                // 에러 처리 추가
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'Error: Failed to get response from Gemini',
                    groupId,
                    model: 'gemini'
                }]);
            } finally {
                setIsLoading(prev => ({ ...prev, gemini: false }));
            }
        }
    }, [input, activeLLMs]);

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
        setDeletedPages(prev => ({
            ...prev,
            [pageId]: pages.find(p => p.id === pageId)
        }));
        setPages(prev => prev.filter(p => p.id !== pageId));
    }, [pages]);

    const restorePage = useCallback((pageId) => {
        const pageToRestore = deletedPages[pageId];
        if (pageToRestore) {
            setPages(prev => [...prev, pageToRestore]);
            setDeletedPages(prev => {
                const newDeletedPages = { ...prev };
                delete newDeletedPages[pageId];
                return newDeletedPages;
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

    return {
        messages,
        input,
        isLoading,
        pages,
        currentPage,
        activeLLMs,
        selectedModels,
        hoveredGroupId,
        deletedPages,
        restoreCountdowns,
        allClearedPages,
        clearRestoreCountdown,
        setMessages,
        setInput,
        setIsLoading,
        setPages,
        setCurrentPage,
        setActiveLLMs,
        setSelectedModels,
        setHoveredGroupId,
        setDeletedPages,
        setRestoreCountdowns,
        setAllClearedPages,
        setClearRestoreCountdown,
        handleSubmit,
        addNewPage,
        changePage,
        deletePage,
        restorePage,
        clearAllChats,
        restoreAllChats
    };
}; 