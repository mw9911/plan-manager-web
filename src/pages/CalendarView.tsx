// src/pages/CalendarView.tsx
import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // 달력 기본 스타일
import { apiClient } from '../api/axiosInstance';
import { toLocalDateString } from '../utils/date';

// 캘린더 조회 API(/api/v1/calendar) 응답 형식
interface CalendarItem {
    id: number;
    type: 'PLAN' | 'ROUTINE';
    title: string;
    targetDate: string;
    isCompleted: boolean;
}

export default function CalendarView() {
    const [date, setDate] = useState<Date>(new Date());
    const [items, setItems] = useState<CalendarItem[]>([]);
    const [error, setError] = useState('');

    // 특정 월의 시작일과 종료일 계산 및 데이터 패칭
    const fetchCalendarData = async (targetDate: Date) => {
        try {
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();

            // 해당 월의 1일과 말일을 로컬 날짜 기준으로 계산
            const startDate = toLocalDateString(new Date(year, month, 1));
            const endDate = toLocalDateString(new Date(year, month + 1, 0));

            const response = await apiClient.get('/api/v1/calendar', {
                params: { startDate, endDate }
            });
            setItems(response.data);
            setError('');
        } catch (err) {
            setError('캘린더 데이터를 불러오는데 실패했습니다.');
        }
    };

    // 처음 렌더링되거나 월이 변경될 때 데이터 다시 불러오기
    useEffect(() => {
        fetchCalendarData(date);
    }, [date]);

    // 달력의 월(Month) 이동 화살표 클릭 시 실행되는 핸들러
    const handleActiveStartDateChange = ({ activeStartDate }: { activeStartDate: Date | null }) => {
        if (activeStartDate) {
            setDate(activeStartDate);
        }
    };

    // 달력의 각 날짜 타일(Tile) 안에 렌더링될 커스텀 콘텐츠 지정
    const renderTileContent = ({ date, view }: { date: Date, view: string }) => {
        if (view !== 'month') return null; // 월간 뷰에서만 렌더링

        // 타일 날짜를 YYYY-MM-DD로 변환해 일정 날짜와 비교
        const dateString = toLocalDateString(date);
        const dayItems = items.filter(item => item.targetDate === dateString);

        if (dayItems.length === 0) return null;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', fontSize: '10px' }}>
                {dayItems.map(item => (
                    <div
                        key={`${item.type}-${item.id}`}
                        style={{
                            padding: '2px 4px',
                            borderRadius: '4px',
                            color: 'white',
                            textAlign: 'left',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            // PLAN은 파란색, ROUTINE은 보라색 계열 (완료하면 옅은 색)
                            backgroundColor: item.type === 'PLAN' ? (item.isCompleted ? '#a0c4ff' : '#007bff') : (item.isCompleted ? '#dcb6ff' : '#6f42c1'),
                            textDecoration: item.isCompleted ? 'line-through' : 'none'
                        }}
                    >
                        {item.type === 'PLAN' ? '📋' : '🔄'} {item.title}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px', fontFamily: 'sans-serif' }}>
            <h2>나의 캘린더</h2>
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                <Calendar
                    onChange={(newDate) => setDate(newDate as Date)}
                    value={date}
                    onActiveStartDateChange={handleActiveStartDateChange}
                    tileContent={renderTileContent}
                    className="custom-calendar" // 별도 CSS 커스텀을 위한 클래스
                />
            </div>

            {/* 범례(Legend) 표시 */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'center', fontSize: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#007bff', borderRadius: '2px' }}></div> 일반 계획 (Plan)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#6f42c1', borderRadius: '2px' }}></div> 반복 루틴 (Routine)
                </span>
            </div>
        </div>
    );
}
