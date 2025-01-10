import { ToggleSwitch } from './ToggleSwitch';
import { exportMessages } from '../utils/storage';
import { RestorePageButton } from './RestorePageButton';

export const Sidebar = ({
    pages,
    currentPage,
    deletedPages,
    restoreCountdowns,
    addNewPage,
    changePage,
    deletePage,
    restorePage,
    clearAllChats,
    restoreAllChats,
    activeLLMs,
    setActiveLLMs,
    allClearedPages,
    clearRestoreCountdown,
    messages
}) => {
    return (
        <div className="w-64 bg-[#1a1a1a] border-r border-gray-800 p-4 flex flex-col">
            <div className="flex flex-col gap-4 mb-4">
                {/* LLM 토글 스위치들 */}
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

            {/* 채팅 페이지 목록 */}
            <div className="flex-1 overflow-y-auto">
                {pages.map(page => (
                    <div
                        key={page.id}
                        onClick={() => changePage(page.id)}
                        className={`flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer ${
                            currentPage === page.id ? 'bg-[#2a2a2a]' : 'hover:bg-[#1a1a1a]'
                        }`}
                    >
                        <span className="truncate">{page.name}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                deletePage(page.id);
                            }}
                            className="ml-2 px-2 py-1 text-gray-400 hover:text-gray-200 hover:bg-[#3a3a3a] rounded transition-colors"
                        >
                            ×
                        </button>
                    </div>
                ))}
                
                {/* 삭제된 페이지의 복원 UI */}
                {Object.entries(deletedPages).map(([pageId, page]) => (
                    restoreCountdowns[pageId] > 0 && (
                        <RestorePageButton
                            key={pageId}
                            pageName={page.name}
                            countdown={restoreCountdowns[pageId]}
                            onRestore={() => restorePage(parseInt(pageId))}
                        />
                    )
                ))}
            </div>

            {/* 하단 버튼들 */}
            <div className="mt-4 space-y-2">
                <button
                    onClick={addNewPage}
                    className="w-full bg-[#2a2a2a] text-gray-300 px-4 py-2 rounded-lg hover:bg-[#3a3a3a]"
                >
                    New Chat
                </button>
                <button
                    onClick={clearAllChats}
                    className="w-full bg-[#2a1a1a] text-gray-300 px-4 py-2 rounded-lg hover:bg-[#3a2a2a]"
                >
                    Clear All Chats
                </button>
                <button
                    onClick={() => exportMessages(messages, `Chat ${currentPage}`)}
                    className="w-full bg-[#1a2a1a] text-gray-300 px-4 py-2 rounded-lg hover:bg-[#2a3a2a]"
                >
                    Export Messages
                </button>
            </div>
        </div>
    );
}; 