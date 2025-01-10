export const ToggleSwitch = ({ llm, isActive, onToggle }) => (
    <div className="flex items-center gap-2">
        <button
            onClick={() => onToggle(llm)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300
                ${isActive ? 'bg-[#2a2a2a]' : 'bg-[#1a1a1a]'}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-gray-300 transition-transform duration-300
                    ${isActive ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
        <span className="text-sm font-medium text-gray-300">{llm.toUpperCase()}</span>
    </div>
); 