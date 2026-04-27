import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { useAuth } from './hooks/useAuth'
import { useServerReady } from './hooks/useServerReady'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Fridge from './pages/Fridge'
import Analyze from './pages/Analyze'
import Recipes from './pages/Recipes'
import RecipeDetail from './pages/RecipeDetail'
import Subscription from './pages/Subscription'
import AdminPanel from './components/AdminPanel'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore()
  if (!initialized) return null
  return user ? <>{children}</> : <Navigate to="/" replace />
}

function AuthInitializer() {
  useAuth()
  return null
}

function ServerWakeup({ children }: { children: React.ReactNode }) {
  const { ready, timedOut } = useServerReady()

  if (timedOut) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0D1F1A', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 8 }}>
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <rect x="6" y="4" width="24" height="28" rx="4" stroke="#5DCAA5" strokeWidth="2"/>
            <line x1="6" y1="13" x2="30" y2="13" stroke="#5DCAA5" strokeWidth="2"/>
            <circle cx="24" cy="20" r="2" fill="#5DCAA5"/>
          </svg>
          <span style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            <span style={{ color: '#F1EFE8' }}>Pri</span>
            <span style={{ color: '#5DCAA5' }}>gio</span>
            <span style={{ color: '#5DCAA5' }}>.</span>
          </span>
        </div>
        <p style={{ color: '#FAC775', fontSize: 15, fontWeight: 600, margin: 0, fontFamily: "'Pretendard', sans-serif" }}>
          서버 연결에 실패했습니다
        </p>
        <p style={{ color: '#9FE1CB', fontSize: 13, margin: 0, fontFamily: "'Pretendard', sans-serif" }}>
          잠시 후 새로고침 해주세요
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8, padding: '10px 24px', borderRadius: 10,
            background: '#1D9E75', color: '#fff', border: 'none',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            fontFamily: "'Pretendard', sans-serif",
          }}
        >
          새로고침
        </button>
      </div>
    )
  }

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0D1F1A', gap: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
            <rect x="6" y="4" width="24" height="28" rx="4" stroke="#5DCAA5" strokeWidth="2"/>
            <line x1="6" y1="13" x2="30" y2="13" stroke="#5DCAA5" strokeWidth="2"/>
            <circle cx="24" cy="20" r="2" fill="#5DCAA5"/>
          </svg>
          <span style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            <span style={{ color: '#F1EFE8' }}>Pri</span>
            <span style={{ color: '#5DCAA5' }}>gio</span>
            <span style={{ color: '#5DCAA5' }}>.</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{
              width: 8, height: 8, borderRadius: '50%', background: '#5DCAA5',
              animation: 'prigiopulse 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
              display: 'inline-block',
            }} />
          ))}
        </div>
        <p style={{ color: '#9FE1CB', fontSize: 13, margin: 0, fontFamily: "'Pretendard', sans-serif" }}>
          서버를 준비하고 있어요 (최초 접속 시 최대 30초 소요)
        </p>
        <style>{`
          @keyframes prigiopulse {
            0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    )
  }

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ServerWakeup>
      <BrowserRouter>
        <AuthInitializer />
        <AdminPanel />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fridge"
            element={
              <ProtectedRoute>
                <Fridge />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analyze"
            element={
              <ProtectedRoute>
                <Analyze />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes"
            element={
              <ProtectedRoute>
                <Recipes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes/:id"
            element={
              <ProtectedRoute>
                <RecipeDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <Subscription />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </ServerWakeup>
    </QueryClientProvider>
  )
}
