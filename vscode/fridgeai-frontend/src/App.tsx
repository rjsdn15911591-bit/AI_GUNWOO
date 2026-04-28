import { lazy, Suspense, useState, useEffect } from 'react'
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


const BG_IMAGES = ['/bg-market.jpg', '/bg-seafood.jpg']
const BG_INTERVAL = 6000 // 6초마다 전환

function BackgroundSlideshow() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % BG_IMAGES.length)
    }, BG_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {BG_IMAGES.map((src, i) => (
        <div key={src} style={{
          position: 'fixed', inset: 0,
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover', backgroundPosition: 'center 40%',
          filter: 'blur(8px)', transform: 'scale(1.1)',
          opacity: i === current ? 0.45 : 0,
          transition: 'opacity 3.75s ease-in-out',
          zIndex: 0,
        }} />
      ))}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(237,233,225,0.65)', zIndex: 0 }} />
    </>
  )
}

function PageLoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'transparent', gap: 16, position: 'relative', zIndex: 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
          <rect x="6" y="4" width="24" height="28" rx="4" stroke="#1D9E75" strokeWidth="2"/>
          <line x1="6" y1="13" x2="30" y2="13" stroke="#1D9E75" strokeWidth="2"/>
          <circle cx="24" cy="20" r="2" fill="#1D9E75"/>
        </svg>
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
          <span style={{ color: '#1A1A1A' }}>Pri</span>
          <span style={{ color: '#1D9E75' }}>gio</span>
          <span style={{ color: '#1D9E75' }}>.</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: '#1D9E75',
            animation: 'prigiopulse 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
            display: 'inline-block',
          }} />
        ))}
      </div>
      <style>{`@keyframes prigiopulse{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore()

  if (!initialized) return (
    <>
      <BackgroundSlideshow />
      <PageLoadingScreen />
    </>
  )

  if (!user) return <Navigate to="/" replace />

  return (
    <>
      <BackgroundSlideshow />
      <Suspense fallback={<PageLoadingScreen />}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </Suspense>
    </>
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
