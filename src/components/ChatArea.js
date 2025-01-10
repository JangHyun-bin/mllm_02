import { ResponseMessage, UserMessage, LoadingIndicator, ModelSelector } from './MessageComponents';
import { models } from '../services/aiService';

export const ChatArea = ({
    messages,
    isLoading,
    hoveredGroupId,
    setHoveredGroupId,
    activeLLMs,
    selectedModels,
    handleModelChange,
    input,
    setInput,
    handleSubmit
}) => {
    return (
        <div className="flex-1 flex flex-col bg-[#0a0a0a]">
            {/* 모델 선택기 헤더 */}
            <div className="sticky top-0 bg-[#1a1a1a] z-10 p-4 border-b border-gray-800">
                <div className="text-lg font-bold flex justify-between items-center text-gray-300">
                    <div className="grid grid-cols-3 w-full gap-4">
                        {activeLLMs.gpt && (
                            <div className="text-center">
                                <ModelSelector
                                    llm="gpt"
                                    models={models.gpt}
                                    selected={selectedModels.gpt}
                                    onChange={handleModelChange}
                                />
                            </div>
                        )}
                        {activeLLMs.claude && (
                            <div className="text-center">
                                <ModelSelector
                                    llm="claude"
                                    models={models.claude}
                                    selected={selectedModels.claude}
                                    onChange={handleModelChange}
                                />
                            </div>
                        )}
                        {activeLLMs.gemini && (
                            <div className="text-center">
                                <ModelSelector
                                    llm="gemini"
                                    models={models.gemini}
                                    selected={selectedModels.gemini}
                                    onChange={handleModelChange}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 메시지 영역 - 패딩 및 스크롤바 스타일 수정 */}
            <div className="flex-1 flex">
                {/* GPT 영역 */}
                <div className="flex-1 border-r border-gray-800 overflow-hidden">
                    <div className="h-full px-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                        <div className="space-y-4 py-4">
                            {messages.map((message, index) => (
                                message.model === 'gpt' && (
                                    <div key={`gpt-${index}`}>
                                        {message.role === 'user' ? (
                                            <UserMessage
                                                message={message}
                                                hoveredGroupId={hoveredGroupId}
                                                setHoveredGroupId={setHoveredGroupId}
                                            />
                                        ) : (
                                            <ResponseMessage
                                                message={message}
                                                hoveredGroupId={hoveredGroupId}
                                                setHoveredGroupId={setHoveredGroupId}
                                            />
                                        )}
                                    </div>
                                )
                            ))}
                            {isLoading.gpt && <LoadingIndicator />}
                        </div>
                    </div>
                </div>

                {/* Claude 영역 */}
                <div className="flex-1 border-r border-gray-800 overflow-hidden">
                    <div className="h-full px-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                        <div className="space-y-4 py-4">
                            {messages.map((message, index) => (
                                message.model === 'claude' && (
                                    <div key={`claude-${index}`}>
                                        {message.role === 'user' ? (
                                            <UserMessage
                                                message={message}
                                                hoveredGroupId={hoveredGroupId}
                                                setHoveredGroupId={setHoveredGroupId}
                                            />
                                        ) : (
                                            <ResponseMessage
                                                message={message}
                                                hoveredGroupId={hoveredGroupId}
                                                setHoveredGroupId={setHoveredGroupId}
                                            />
                                        )}
                                    </div>
                                )
                            ))}
                            {isLoading.claude && <LoadingIndicator />}
                        </div>
                    </div>
                </div>

                {/* Gemini 영역 */}
                <div className="flex-1 overflow-hidden">
                    <div className="h-full px-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                        <div className="space-y-4 py-4">
                            {messages.map((message, index) => (
                                message.model === 'gemini' && (
                                    <div key={`gemini-${index}`}>
                                        {message.role === 'user' ? (
                                            <UserMessage
                                                message={message}
                                                hoveredGroupId={hoveredGroupId}
                                                setHoveredGroupId={setHoveredGroupId}
                                            />
                                        ) : (
                                            <ResponseMessage
                                                message={message}
                                                hoveredGroupId={hoveredGroupId}
                                                setHoveredGroupId={setHoveredGroupId}
                                            />
                                        )}
                                    </div>
                                )
                            ))}
                            {isLoading.gemini && <LoadingIndicator />}
                        </div>
                    </div>
                </div>
            </div>

            {/* 입력 폼 */}
            <div className="border-t border-gray-800 p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 p-2 border rounded-lg bg-[#1a1a1a] text-gray-300 border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700"
                        placeholder="메시지를 입력하세요..."
                    />
                    <button
                        type="submit"
                        className="bg-[#2a2a2a] text-gray-300 px-4 py-2 rounded-lg hover:bg-[#3a3a3a]"
                    >
                        전송
                    </button>
                </form>
            </div>
        </div>
    );
}; 