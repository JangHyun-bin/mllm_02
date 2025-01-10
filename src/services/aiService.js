import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// API 클라이언트 초기화
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

// 사용 가능한 모델 목록
export const models = {
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
        { id: 'gemini-pro', name: 'Gemini Pro' }
    ]
};

// GPT API 호출
export const handleGPTResponse = async (input, groupId) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: input }]
        });
        
        return {
            role: 'assistant',
            content: completion.choices[0].message.content,
            groupId
        };
    } catch (error) {
        console.error('GPT API Error:', error);
        throw error;
    }
};

// Claude API 호출
export const handleClaudeResponse = async (input, groupId) => {
    try {
        const message = await anthropic.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: 1000,
            messages: [{ role: "user", content: input }]
        });
        
        return {
            role: 'assistant',
            content: message.content[0].text,
            groupId
        };
    } catch (error) {
        console.error('Claude API Error:', error);
        throw error;
    }
};

// Gemini API 호출
export const handleGeminiResponse = async (input, groupId) => {
    try {
        const result = await geminiModel.generateContent(input);
        const response = await result.response;
        
        return {
            role: 'assistant',
            content: response.text(),
            groupId
        };
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw error;
    }
}; 