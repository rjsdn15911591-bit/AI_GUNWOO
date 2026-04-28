import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getGoogleLoginUrl } from '../api/auth'

function PanelSlideshow({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % images.length), 6000)
    return () => clearInterval(t)
  }, [images.length])
  return (
    <>
      {images.map((src, i) => (
        <div key={src} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: i === current ? 1 : 0,
          transition: 'opacity 3.75s ease-in-out',
        }} />
      ))}
    </>
  )
}

const PHOTO_TOP = '/food-top.jpg'
const PHOTO_BTM =
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=85'

function CornerDecor({ color }: { color: string }) {
  const SZ = 18
  const base: React.CSSProperties = { position: 'absolute', width: SZ, height: SZ }
  return (
    <>
      <span style={{ ...base, top: 0, left: 0,  borderTop:    `1px solid ${color}`, borderLeft:   `1px solid ${color}` }} />
      <span style={{ ...base, top: 0, right: 0,  borderTop:    `1px solid ${color}`, borderRight:  `1px solid ${color}` }} />
      <span style={{ ...base, bottom: 0, left: 0, borderBottom: `1px solid ${color}`, borderLeft:   `1px solid ${color}` }} />
      <span style={{ ...base, bottom: 0, right: 0, borderBottom:`1px solid ${color}`, borderRight:  `1px solid ${color}` }} />
    </>
  )
}

function Badge({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return (
    <span style={{
      background: bg,
      color,
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.18em',
      fontFamily: "'Inter', sans-serif",
      padding: '5px 9px',
      borderRadius: 3,
      textTransform: 'uppercase' as const,
      display: 'inline-block',
    }}>
      {children}
    </span>
  )
}

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  const handleLogin = async () => {
    try {
      const url = await getGoogleLoginUrl()
      window.location.href = url
    } catch {
      alert('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#EDE9E1',
      padding: 14,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── 3분할 그리드 ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 10,
        flex: 1,
        minHeight: 'calc(100vh - 28px)',
      }}>

        {/* ════════════════════════════
            왼쪽 패널 — 전체 높이
        ════════════════════════════ */}
        <div style={{
          gridRow: '1 / 3',
          position: 'relative',
          background: '#0D1F1A',
          borderRadius: 14,
          padding: '44px 38px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <CornerDecor color="rgba(93,202,165,0.4)" />

          {/* 상단: 브랜드 */}
          <div>
            {/* 로고 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 28 }}>
              <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
                <rect x="6" y="4" width="24" height="28" rx="4" stroke="#5DCAA5" strokeWidth="2"/>
                <line x1="6" y1="13" x2="30" y2="13" stroke="#5DCAA5" strokeWidth="2"/>
                <circle cx="24" cy="20" r="2" fill="#5DCAA5"/>
              </svg>
              <span style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 44,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}>
                <span style={{ color: '#F1EFE8' }}>Pri</span>
                <span style={{ color: '#5DCAA5' }}>gio</span>
                <span style={{ color: '#5DCAA5' }}>.</span>
              </span>
            </div>

            {/* 서비스 태그 */}
            <p style={{
              fontFamily: "'Inter', sans-serif",
              color: 'rgba(93,202,165,0.6)',
              fontSize: 10,
              letterSpacing: '0.2em',
              fontWeight: 500,
              marginBottom: 16,
              textTransform: 'uppercase',
            }}>
              AI · Fridge · Recipe
            </p>

            {/* 메인 슬로건 */}
            <div style={{ marginBottom: 40 }}>
              <p style={{
                fontFamily: "'Pretendard', sans-serif",
                color: 'rgba(241,239,232,0.45)',
                fontSize: 30,
                fontWeight: 300,
                letterSpacing: '-0.01em',
                lineHeight: 1.25,
                margin: 0,
              }}>
                찍으면,
              </p>
              <p style={{
                fontFamily: "'Pretendard', sans-serif",
                color: '#F1EFE8',
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                margin: 0,
              }}>
                요리가 된다
              </p>
            </div>

            {/* 기능 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[
                { icon: '📸', text: '사진 한 장으로 식재료 자동 인식' },
                { icon: '🍽️', text: '보유 재료 기반 맞춤 레시피 추천' },
                { icon: '📅', text: '유통기한 관리로 식재료 낭비 절감' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'rgba(93,202,165,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, flexShrink: 0,
                  }}>{icon}</span>
                  <span style={{
                    fontFamily: "'Pretendard', sans-serif",
                    color: 'rgba(159,225,203,0.8)',
                    fontSize: 12.5,
                  }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 하단: 로그인 */}
          <div>
            {/* 구분선 */}
            <div style={{
              borderTop: '0.5px solid rgba(93,202,165,0.15)',
              marginBottom: 20,
            }} />

            <p style={{
              fontFamily: "'Inter', sans-serif",
              color: 'rgba(93,202,165,0.6)',
              fontSize: 10,
              letterSpacing: '0.15em',
              textAlign: 'center',
              marginBottom: 14,
              textTransform: 'uppercase',
            }}>
              Free Plan · 월 5회 AI 분석 무료
            </p>

            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(93,202,165,0.2)',
              borderRadius: 12,
              padding: '16px 18px',
            }}>
              <button
                onClick={handleLogin}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11,
                  background: '#fff',
                  border: 'none',
                  borderRadius: 9,
                  padding: '13px 18px',
                  fontFamily: "'Pretendard', sans-serif",
                  fontWeight: 600,
                  fontSize: 13.5,
                  color: '#1A1A1A',
                  cursor: 'pointer',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F1EFE8')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 시작하기
              </button>
            </div>

            <p style={{
              fontFamily: "'Inter', sans-serif",
              color: 'rgba(95,94,90,0.7)',
              fontSize: 10,
              letterSpacing: '0.08em',
              textAlign: 'center',
              marginTop: 13,
            }}>
              @prigio.app
            </p>
          </div>
        </div>

        {/* ════════════════════════════
            오른쪽 위 — AI 분석 (사진)
        ════════════════════════════ */}
        <div style={{
          position: 'relative',
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          <PanelSlideshow images={[PHOTO_TOP, '/bg-landing1.jpg']} />
          {/* 다크 그라디언트 오버레이 */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%)',
          }} />

          <CornerDecor color="rgba(255,255,255,0.35)" />

          {/* 배지 — 우상단 */}
          <div style={{ position: 'absolute', top: 22, right: 22 }}>
            <Badge bg="rgba(255,255,255,0.92)" color="#0D1F1A">New Feature</Badge>
          </div>

          {/* 텍스트 — 좌하단 */}
          <div style={{ position: 'absolute', bottom: 26, left: 28 }}>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              color: 'rgba(255,255,255,0.55)',
              fontSize: 9,
              letterSpacing: '0.22em',
              fontWeight: 500,
              marginBottom: 7,
              textTransform: 'uppercase',
            }}>
              AI 식재료 인식
            </p>
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: '#fff',
              fontSize: 22,
              fontWeight: 600,
              lineHeight: 1.3,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              냉장고 사진<br />한 장이면 충분
            </p>
          </div>
        </div>

        {/* ════════════════════════════
            오른쪽 아래 — 레시피 (사진)
        ════════════════════════════ */}
        <div style={{
          position: 'relative',
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          <PanelSlideshow images={[PHOTO_BTM, '/bg-landing2.jpg']} />
          {/* 다크 그라디언트 오버레이 */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.6) 100%)',
          }} />

          <CornerDecor color="rgba(255,255,255,0.35)" />

          {/* 배지 — 우상단 */}
          <div style={{ position: 'absolute', top: 22, right: 22 }}>
            <Badge bg="rgba(250,199,117,0.92)" color="#1A1A1A">Special Promo</Badge>
          </div>

          {/* 텍스트 — 좌하단 */}
          <div style={{ position: 'absolute', bottom: 26, left: 28 }}>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              color: 'rgba(255,255,255,0.55)',
              fontSize: 9,
              letterSpacing: '0.22em',
              fontWeight: 500,
              marginBottom: 7,
              textTransform: 'uppercase',
            }}>
              맞춤 레시피 추천
            </p>
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: '#fff',
              fontSize: 22,
              fontWeight: 600,
              lineHeight: 1.3,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              오늘 저녁은<br />뭘 먹을까?
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
