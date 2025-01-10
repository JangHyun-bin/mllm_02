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
    // 활성화된 모델 수 계산
    const activeModelCount = Object.values(activeLLMs).filter(Boolean).length;
    
    // 각 모델 영역의 너비 계산 (flex 기반)
    const getColumnClass = () => {
        switch(activeModelCount) {
            case 1: return 'flex-1';
            case 2: return 'flex-[0.5]';
            case 3: return 'flex-[0.33]';
            default: return 'flex-1';
        }
    };

    // 사용자 메시지와 AI 응답을 함께 표시하는 메시지 렌더링 함수
    const renderMessages = (modelType) => {
        return messages.map((message, index) => {
            // 사용자 메시지는 모든 활성화된 모델 칸에 표시
            const shouldShowMessage = message.role === 'user' || message.model === modelType;
            
            if (shouldShowMessage) {
                return (
                    <div key={`${modelType}-${message.timestamp || index}`}>
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
                );
            }
            return null;
        });
    };

    return (
        <div className="flex-1 flex flex-col bg-[#0a0a0a]">
            {/* 모델 선택기 헤더 - flex 레이아웃으로 변경 */}
            <div className="sticky top-0 bg-[#1a1a1a] z-10 border-b border-gray-800">
                <div className="flex">
                    {activeLLMs.gpt && (
                        <div className={`${getColumnClass()} border-r border-gray-800 p-4`}>
                            <div className="text-center">
                                <ModelSelector
                                    llm="gpt"
                                    models={models.gpt}
                                    selected={selectedModels.gpt}
                                    onChange={handleModelChange}
                                />
                            </div>
                        </div>
                    )}
                    {activeLLMs.claude && (
                        <div className={`${getColumnClass()} border-r border-gray-800 p-4`}>
                            <div className="text-center">
                                <ModelSelector
                                    llm="claude"
                                    models={models.claude}
                                    selected={selectedModels.claude}
                                    onChange={handleModelChange}
                                />
                            </div>
                        </div>
                    )}
                    {activeLLMs.gemini && (
                        <div className={`${getColumnClass()} p-4`}>
                            <div className="text-center">
                                <ModelSelector
                                    llm="gemini"
                                    models={models.gemini}
                                    selected={selectedModels.gemini}
                                    onChange={handleModelChange}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 메시지 영역 */}
            <div className="flex-1 flex">
                {/* GPT 영역 */}
                {activeLLMs.gpt && (
                    <div className={`${getColumnClass()} border-r border-gray-800 overflow-hidden`}>
                        <div className="h-full px-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                            <div className="space-y-4 py-4">
                                {renderMessages('gpt')}
                                {isLoading.gpt && <LoadingIndicator />}
                            </div>
                        </div>
                    </div>
                )}

                {/* Claude 영역 */}
                {activeLLMs.claude && (
                    <div className={`${getColumnClass()} border-r border-gray-800 overflow-hidden`}>
                        <div className="h-full px-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                            <div className="space-y-4 py-4">
                                {renderMessages('claude')}
                                {isLoading.claude && <LoadingIndicator />}
                            </div>
                        </div>
                    </div>
                )}

                {/* Gemini 영역 */}
                {activeLLMs.gemini && (
                    <div className={`${getColumnClass()} overflow-hidden`}>
                        <div className="h-full px-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                            <div className="space-y-4 py-4">
                                {renderMessages('gemini')}
                                {isLoading.gemini && <LoadingIndicator />}
                            </div>
                        </div>
                    </div>
                )}
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