// 각 모델별 토큰 제한 설정
export const TOKEN_LIMITS = {
    gpt: {
        'gpt-3.5-turbo': 4096,
        'gpt-4': 8192,
        'gpt-4-turbo-preview': 128000
    },
    claude: {
        'claude-3-opus-20240229': 200000,
        'claude-3-sonnet-20240229': 200000,
        'claude-2.1': 100000
    },
    gemini: {
        'gemini-pro': 32768
    }
};

// 대략적인 토큰 수 계산 (영어 기준 1토큰 ≈ 4자)
export const estimateTokenCount = (text) => {
    return Math.ceil(text.length / 4);
}; 