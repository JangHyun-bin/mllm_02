export const RestorePageButton = ({ pageName, countdown, onRestore }) => {
    const percentage = (countdown / 15) * 100;  // 15초를 100%로 계산

    return (
        <div className="relative p-3 mb-2 bg-[#2a1a1a] rounded-lg">
            <div className="flex items-center justify-between">
                {/* 복원 버튼 */}
                <button
                    onClick={onRestore}
                    className="text-gray-400 hover:text-gray-200"
                >
                    Restore page '{pageName}'
                </button>
                
                {/* 카운트다운 표시 */}
                <div className="flex items-center gap-2">
                    <div className="w-12 h-1 bg-gray-700 rounded overflow-hidden">
                        <div 
                            className="h-full bg-gray-400 transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <span className="text-xs text-gray-400">{countdown}s</span>
                </div>
            </div>
        </div>
    );
}; 