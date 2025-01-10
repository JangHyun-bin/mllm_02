import { styles } from '../styles/animations';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { useChat } from '../hooks/useChat';

export const Layout = () => {
    const chatState = useChat();

    return (
        <>
            <style>{styles}</style>
            <div className="h-screen flex bg-[#0a0a0a]">
                <Sidebar {...chatState} />
                <ChatArea {...chatState} />
            </div>
        </>
    );
}; 