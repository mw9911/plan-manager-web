// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import PlanList from './pages/PlanList';
import RoutineList from './pages/RoutineList';
import CalendarView from './pages/CalendarView';
import { useAuthStore } from './store/useAuthStore';

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const logout = useAuthStore(state => state.logout);

    if (!isAuthenticated) return <Navigate to="/login" />;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="px-6 py-4 bg-gray-800 flex items-center gap-6 shadow-md">
                <Link to="/" className="text-white font-bold hover:text-gray-300 transition-colors">
                    📋 계획
                </Link>
                <Link to="/routines" className="text-white font-bold hover:text-gray-300 transition-colors">
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
                {children}
            </main>
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedLayout><PlanList /></ProtectedLayout>} />
                <Route path="/routines" element={<ProtectedLayout><RoutineList /></ProtectedLayout>} />
                <Route path="/calendar" element={<ProtectedLayout><CalendarView /></ProtectedLayout>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;