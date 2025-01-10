import { styles } from '../styles/animations';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { useChat } from '../hooks/useChat';

export const Layout = () => {
    const chat = useChat();

    return (
        <>
            <style>{styles}</style>
            <div className="h-screen flex bg-[#0a0a0a]">
                <Sidebar {...chat} />
                <ChatArea 
                    messages={chat.messages}
                    isLoading={chat.isLoading}
                    hoveredGroupId={chat.hoveredGroupId}
                    setHoveredGroupId={chat.setHoveredGroupId}
                    activeLLMs={chat.activeLLMs}
                    selectedModels={chat.selectedModels}
                    handleModelChange={chat.handleModelChange}
                    input={chat.input}
                    setInput={chat.setInput}
                    handleSubmit={chat.handleSubmit}
                />
            </div>
        </>
    );
}; 