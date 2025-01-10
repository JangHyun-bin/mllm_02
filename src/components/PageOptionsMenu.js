import { useState, useRef, useEffect } from 'react';

export const PageOptionsMenu = ({ page, onDelete, onRename }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(page.name);
    const menuRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
                setIsRenaming(false);
                setNewName(page.name);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [page.name]);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isRenaming]);

    const handleRename = (e) => {
        e.preventDefault();
        if (newName.trim() && newName !== page.name) {
            onRename(page.id, newName.trim());
        }
        setIsRenaming(false);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="ml-2 px-2 py-1 text-gray-400 hover:text-gray-200 hover:bg-[#3a3a3a] rounded transition-colors"
            >
                •••
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[#2a2a2a] ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                        {isRenaming ? (
                            <form onSubmit={handleRename} className="px-4 py-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-2 py-1 bg-[#1a1a1a] text-gray-300 rounded border border-gray-700 focus:outline-none focus:border-gray-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setIsRenaming(false);
                                            setIsOpen(false);
                                            setNewName(page.name);
                                        }
                                    }}
                                />
                            </form>
                        ) : (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsRenaming(true);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#3a3a3a]"
                                >
                                    Rename
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(page.id);
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#3a3a3a]"
                                >
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}; 