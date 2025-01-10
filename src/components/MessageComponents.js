export const LoadingIndicator = () => (
    <div className="flex space-x-1 items-center h-6">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
);

export const ResponseMessage = ({ message, hoveredGroupId, setHoveredGroupId }) => (
    <div
        onMouseEnter={() => setHoveredGroupId(message.groupId)}
        onMouseLeave={() => setHoveredGroupId(null)}
        className={`rounded-lg p-3 transition-transform duration-1500 ease-in-out transform
            ${message.model === 'gpt'
                ? 'bg-[#1a1a1a] text-gray-300'
                : message.model === 'claude'
                    ? 'bg-[#2a1a2a] text-gray-300'
                    : 'bg-[#1a2a1a] text-gray-300'
            }
            ${hoveredGroupId === message.groupId ? 'scale-105' : 'scale-100'}
        `}
    >
        {message.content}
    </div>
);

export const UserMessage = ({ message, hoveredGroupId, setHoveredGroupId }) => (
    <div
        onMouseEnter={() => setHoveredGroupId(message.groupId)}
        onMouseLeave={() => setHoveredGroupId(null)}
        className={`bg-[#2a2a2a] text-gray-300 rounded-lg p-3 transition-transform duration-1500 ease-in-out transform
            ${hoveredGroupId === message.groupId ? 'scale-105' : 'scale-100'}
        `}
    >
        {message.content}
    </div>
);

export const ModelSelector = ({ llm, models, selected, onChange }) => (
    <select
        value={selected}
        onChange={(e) => onChange(llm, e.target.value)}
        className="text-sm border rounded-md px-2 py-1 bg-[#1a1a1a] text-gray-300 border-gray-800"
    >
        {models.map(model => (
            <option key={model.id} value={model.id}>
                {model.name}
            </option>
        ))}
    </select>
); 