import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { useAuth } from './hooks/useAuth'
import Landing from './pages/Landing'
import AdminPanel from './components/AdminPanel'

const Dashboard    = lazy(() => import('./pages/Dashboard'))
const Fridge       = lazy(() => import('./pages/Fridge'))
const Analyze      = lazy(() => import('./pages/Analyze'))
const Recipes      = lazy(() => import('./pages/Recipes'))
const RecipeDetail = lazy(() => import('./pages/RecipeDetail'))
const Subscription = lazy(() => import('./pages/Subscription'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

function LoadingScreen() {
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

const BG_IMAGE = (
  <>
    <div style={{
      position: 'fixed', inset: 0,
      backgroundImage: 'url(/bg-market.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center 40%',
      filter: 'blur(8px)',
      transform: 'scale(1.1)',
      opacity: 0.45,
      zIndex: 0,
    }} />
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(237,233,225,0.65)', zIndex: 0 }} />
  </>
)

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore()
  if (!initialized) return <LoadingScreen />
  if (!user) return <Navigate to="/" replace />
  return (
    <Suspense fallback={<LoadingScreen />}>
      {BG_IMAGE}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </Suspense>
  )
}

function AuthInitializer() {
  useAuth()
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  )
}
