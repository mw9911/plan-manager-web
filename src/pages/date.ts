// src/utils/date.ts

/**
 * Date를 사용자의 로컬 시간대 기준 'YYYY-MM-DD' 문자열로 변환한다.
 * toISOString()은 UTC 기준이라 한국 시간 0~9시에는 전날 날짜가 나오므로 쓰지 않는다.
 */
export const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
