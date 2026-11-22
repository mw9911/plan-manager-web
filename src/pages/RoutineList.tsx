// src/pages/RoutineList.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiClient } from '../api/axiosInstance';

interface RoutineItem {
    id: number;
    title: string;
    isCompleted: boolean;
    version: number; // 서버에서 마지막으로 받은 값. 토글할 때 함께 보낸다.
}

interface RoutineGroup {
    id: number;
    title: string;
    intervalDays: number;
    items: RoutineItem[];
}

export default function RoutineList() {
    const [groups, setGroups] = useState<RoutineGroup[]>([]);
    const [newGroupTitle, setNewGroupTitle] = useState('');
    const [newGroupInterval, setNewGroupInterval] = useState(1);
    const [newItemTitles, setNewItemTitles] = useState<{ [groupId: number]: string }>({});
    const [error, setError] = useState('');
    
    // 그룹별 접기/펴기 상태 관리 (groupId를 key로 가지는 객체)
    // 기본적으로 값이 없으면 '펼쳐짐(true)'으로 간주합니다.
    const [expandedGroups, setExpandedGroups] = useState<{ [groupId: number]: boolean }>({});

    const fetchRoutines = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await apiClient.get('/api/v1/routines', {
                params: { date: today }
            });
            setGroups(response.data);
            setError('');
        } catch (err) {
            setError('루틴 목록을 불러오는데 실패했습니다.');
        }
    };

    useEffect(() => {
        fetchRoutines();
    }, []);

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupTitle.trim()) return;

        try {
            await apiClient.post('/api/v1/routines/groups', {
                title: newGroupTitle,
                intervalDays: newGroupInterval
            });
            setNewGroupTitle('');
            setNewGroupInterval(1);
            fetchRoutines();
        } catch (err) {
            setError('루틴 그룹 생성에 실패했습니다.');
        }
    };

    const handleAddItem = async (groupId: number) => {
        const itemTitle = newItemTitles[groupId];
        if (!itemTitle || !itemTitle.trim()) return;

        try {
            await apiClient.post(`/api/v1/routines/groups/${groupId}/items`, {
                title: itemTitle
            });
            setNewItemTitles({ ...newItemTitles, [groupId]: '' });
            fetchRoutines();
            
            // 항목 추가 시 해당 그룹을 강제로 펼침
            setExpandedGroups(prev => ({ ...prev, [groupId]: true }));
        } catch (err) {
            setError('루틴 항목 생성에 실패했습니다.');
        }
    };

    const handleToggleItem = async (item: RoutineItem) => {
        try {
            await apiClient.patch(`/api/v1/routines/items/${item.id}/toggle`, { version: item.version });
            fetchRoutines();
        } catch (err) {
            const status = axios.isAxiosError(err) ? err.response?.status : undefined;
            if (status === 409 || status === 404) {
                // 다른 곳에서 먼저 바뀌었거나 지워졌다. 목록을 받으면 에러가 지워지므로, 다시 받은 뒤에 안내한다.
                await fetchRoutines();
                setError(status === 409
                    ? '이미 바뀐 항목이라 최신 상태로 다시 불러왔어요.'
                    : '이미 삭제된 항목이라 목록을 다시 불러왔어요.');
            } else {
                setError('항목 상태 변경에 실패했습니다.');
            }
        }
    };

    const handleDeleteGroup = async (groupId: number) => {
        if (!window.confirm('이 그룹과 하위 루틴을 모두 삭제하시겠습니까?')) return;
        try {
            await apiClient.delete(`/api/v1/routines/groups/${groupId}`);
            fetchRoutines();
        } catch (err) {
            setError('그룹 삭제에 실패했습니다.');
        }
    };

    const handleDeleteItem = async (itemId: number) => {
        if (!window.confirm('이 세부 루틴 항목을 삭제하시겠습니까?')) return;
        try {
            await apiClient.delete(`/api/v1/routines/items/${itemId}`);
            fetchRoutines();
        } catch (err) {
            setError('항목 삭제에 실패했습니다.');
        }
    };

    // 그룹 토글 핸들러
    const toggleGroupExpand = (groupId: number) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !(prev[groupId] ?? true) // 기본값이 true이므로 반전시킴
        }));
    };

    return (
        <div className="max-w-2xl mx-auto w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 px-2">반복 루틴(Routine) 관리</h2>
            
            {error && (
                <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg mb-4">
                    {error}
                </p>
            )}

            <form onSubmit={handleCreateGroup} className="bg-white p-5 rounded-xl shadow-md flex flex-col sm:flex-row gap-3 mb-8 border border-gray-100">
                <input
                    type="text"
                    placeholder="새 루틴 그룹 이름"
                    value={newGroupTitle}
                    onChange={(e) => setNewGroupTitle(e.target.value)}
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-3">
                    <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-3">
                        <span className="text-sm text-gray-500 mr-2 whitespace-nowrap">주기(일)</span>
                        <input
                            type="number"
                            min="1"
                            value={newGroupInterval}
                            onChange={(e) => setNewGroupInterval(Number(e.target.value))}
                            className="w-16 py-2 bg-transparent focus:outline-none text-center font-bold text-indigo-600"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors whitespace-nowrap shadow-sm"
                    >
                        그룹 추가
                    </button>
                </div>
            </form>

            <ul className="space-y-6">
                {groups.length === 0 ? (
                    <p className="text-gray-500 text-center py-10 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        등록된 루틴이 없습니다.
                    </p>
                ) : (
                    groups.map((group) => {
                        // 현재 그룹이 펼쳐져 있는지 확인 (기본값 true)
                        const isExpanded = expandedGroups[group.id] ?? true;

                        return (
                            <li key={group.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                                {/* 그룹 헤더 */}
                                <div className="bg-indigo-50 px-5 py-4 flex justify-between items-center border-b border-indigo-100">
                                    <div 
                                        className="flex items-center gap-2 cursor-pointer select-none"
                                        onClick={() => toggleGroupExpand(group.id)}
                                    >
                                        {/* 토글 아이콘 추가 및 클릭 영역 확장 */}
                                        <span className="text-indigo-600 font-bold w-5 text-center">
                                            {isExpanded ? '▼' : '▶'}
                                        </span>
                                        <h3 className="text-lg font-bold text-indigo-900">
                                            {group.title}
                                            <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full ml-2">
                                                {group.intervalDays}일마다
                                            </span>
                                        </h3>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteGroup(group.id)}
                                        className="px-3 py-1 bg-white hover:bg-red-50 text-red-500 hover:text-red-600 text-sm font-bold rounded-md border border-red-200 transition-colors"
                                    >
                                        삭제
                                    </button>
                                </div>
                                
                                {/* isExpanded가 true일 때만 하위 항목 렌더링 */}
                                {isExpanded && (
                                    <div className="p-5">
                                        <ul className="space-y-2 mb-4">
                                            {group.items && group.items.map(item => (
                                                <li key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <span className={`text-sm md:text-base flex-1 mr-3 ${
                                                        item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'
                                                    }`}>
                                                        • {item.title}
                                                    </span>
                                                    
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handleToggleItem(item)}
                                                            className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors whitespace-nowrap ${
                                                                item.isCompleted 
                                                                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' 
                                                                    : 'bg-teal-500 text-white hover:bg-teal-600 shadow-sm'
                                                            }`}
                                                        >
                                                            {item.isCompleted ? '취소' : '완료'}
                                                        </button>
                                                        
                                                        <button
                                                            onClick={() => handleDeleteItem(item.id)}
                                                            className="px-3 py-1.5 rounded-md text-sm font-bold text-red-500 bg-white border border-red-200 hover:bg-red-50 transition-colors whitespace-nowrap"
                                                        >
                                                            삭제
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="flex gap-2 mt-4 pt-4 border-t border-dashed border-gray-200">
                                            <input 
                                                type="text" 
                                                placeholder="이 그룹에 포함될 상세 루틴 추가..." 
                                                value={newItemTitles[group.id] || ''}
                                                onChange={(e) => setNewItemTitles({ ...newItemTitles, [group.id]: e.target.value })}
                                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
                                            />
                                            <button 
                                                onClick={() => handleAddItem(group.id)}
                                                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold rounded-md transition-colors whitespace-nowrap"
                                            >
                                                항목 등록
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    })
                )}
            </ul>
        </div>
    );
}