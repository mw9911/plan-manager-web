import { BrowserRouter, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import PlanList from './pages/PlanList';
import RoutineList from './pages/RoutineList';
import CalendarView from './pages/CalendarView';
import { useAuthStore } from './store/useAuthStore';

// 💡 수정점 1: props로 받던 children을 제거하고, 내부에서 <Outlet />을 사용하도록 변경
const ProtectedLayout = () => {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const logout = useAuthStore(state => state.logout);

    if (!isAuthenticated) return <Navigate to="/login" />;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="px-6 py-4 bg-gray-800 flex items-center gap-6 shadow-md">
                <Link to="/plan" className="text-white font-bold hover:text-gray-300 transition-colors">
                    📋 계획
                </Link>
                <Link to="/" className="text-white font-bold hover:text-gray-300 transition-colors">
                    🔄 루틴
                </Link>
                <Link to="/calendar" className="text-white font-bold hover:text-gray-300 transition-colors">
                    📅 캘린더
                </Link>
                
                <button 
                    onClick={logout} 
                    className="ml-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                >
                    로그아웃
                </button>
            </nav>
            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <Outlet /> {/* 💡 하위 라우트 컴포넌트들이 렌더링될 위치 */}
            </main>
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* 💡 인증이 필요 없는 로그인 페이지는 레이아웃 밖으로 분리 */}
                <Route path="/login" element={<Login />} />
                
                {/* 💡 ProtectedLayout을 부모 라우트로 설정하여 중첩 라우팅 구성 */}
                <Route element={<ProtectedLayout />}>
                    <Route path="/" element={<RoutineList />} />
                    <Route path="/plan" element={<PlanList />} />
                    <Route path="/calendar" element={<CalendarView />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;