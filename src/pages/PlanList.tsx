// src/pages/PlanList.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiClient } from '../api/axiosInstance';

interface Plan {
    id: number;
    title: string;
    planDate: string;
    isCompleted: boolean;
    version: number; // 서버에서 마지막으로 받은 값. 토글할 때 함께 보낸다.
}

export default function PlanList() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [error, setError] = useState('');
    // 단일 목록 접기/펴기 상태 (기본값: true/펼침)
    const [isListExpanded, setIsListExpanded] = useState(true);

    const fetchPlans = async () => {
        try {
            const response = await apiClient.get('/api/v1/plans');
            setPlans(response.data);
        } catch (err) {
            setError('계획 목록을 불러오는데 실패했습니다.');
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        const today = new Date().toISOString().split('T')[0];

        try {
            await apiClient.post('/api/v1/plans', {
                title: newTitle,
                planDate: today
            });
            setNewTitle('');
            fetchPlans();
            setIsListExpanded(true); // 항목 추가 시 자동으로 목록 펴기
        } catch (err) {
            setError('계획 생성에 실패했습니다.');
        }
    };

    const handleTogglePlan = async (plan: Plan) => {
        try {
            await apiClient.patch(`/api/v1/plans/${plan.id}/toggle`, { version: plan.version });
            fetchPlans();
        } catch (err) {
            const status = axios.isAxiosError(err) ? err.response?.status : undefined;
            if (status === 409 || status === 404) {
                // 다른 곳에서 먼저 바뀌었거나 지워졌다. 최신 목록을 다시 받은 뒤 안내한다.
                await fetchPlans();
                setError(status === 409
                    ? '이미 바뀐 계획이라 최신 상태로 다시 불러왔어요.'
                    : '이미 삭제된 계획이라 목록을 다시 불러왔어요.');
            } else {
                setError('상태 변경에 실패했습니다.');
            }
        }
    };

    const handleDeletePlan = async (id: number) => {
        if (!window.confirm('이 계획을 삭제하시겠습니까?')) return;
        try {
            await apiClient.delete(`/api/v1/plans/${id}`);
            fetchPlans();
        } catch (err) {
            setError('계획 삭제에 실패했습니다.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto w-full">
            <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800">나의 계획 관리</h2>
                    {/* 토글 버튼 추가 */}
                    <button 
                        onClick={() => setIsListExpanded(!isListExpanded)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-md transition-colors"
                    >
                        {isListExpanded ? '목록 접기 ▲' : '목록 펴기 ▼'}
                    </button>
                </div>

                {error && (
                    <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded mb-4">
                        {error}
                    </p>
                )}

                <form onSubmit={handleCreatePlan} className="flex gap-3 mb-8">
                    <input
                        type="text"
                        placeholder="새로운 계획을 입력하세요..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button 
                        type="submit" 
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm whitespace-nowrap"
                    >
                        추가
                    </button>
                </form>

                {/* isListExpanded가 true일 때만 목록 렌더링 */}
                {isListExpanded && (
                    <ul className="space-y-3">
                        {plans.length === 0 ? (
                            <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                등록된 계획이 없습니다.
                            </p>
                        ) : (
                            plans.map((plan) => (
                                <li 
                                    key={plan.id} 
                                    className={`flex justify-between items-center p-4 rounded-lg border transition-all duration-200 ${
                                        plan.isCompleted ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 shadow-sm hover:shadow-md'
                                    }`}
                                >
                                    <span className={`text-lg flex-1 mr-4 break-all ${
                                        plan.isCompleted ? 'text-gray-400 line-through decoration-2' : 'text-gray-800 font-medium'
                                    }`}>
                                        {plan.title}
                                    </span>
                                    
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleTogglePlan(plan)}
                                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${
                                                plan.isCompleted 
                                                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' 
                                                    : 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                                            }`}
                                        >
                                            {plan.isCompleted ? '취소' : '완료'}
                                        </button>
                                        
                                        <button 
                                            onClick={() => handleDeletePlan(plan.id)}
                                            className="px-4 py-2 rounded-lg font-bold text-sm text-red-500 bg-white border border-red-200 hover:bg-red-50 transition-colors whitespace-nowrap"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
}