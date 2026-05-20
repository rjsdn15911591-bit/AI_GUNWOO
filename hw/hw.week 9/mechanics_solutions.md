# Week 9: 고전 역학 시뮬레이션 — 과제 풀이 정리

> **과목**: AI와 머신러닝 | **주차**: Week 9 | **주제**: 고전 역학 수치 시뮬레이션  
> 각 Python 파일을 직접 실행한 결과를 바탕으로 작성된 풀이입니다.

---

## 목차

1. [Lab 1: 수치 적분 방법 비교 (Euler vs RK4)](#lab-1)
2. [Lab 2: 행성 운동과 케플러 법칙](#lab-2)
3. [Lab 3: 혼돈 시스템 — 이중 진자](#lab-3)
4. [Lab 4: 라그랑지안과 해밀토니안 역학](#lab-4)
5. [종합 결론](#결론)

---

## Lab 1: 수치 적분 방법 비교 (`01euler_rk4.py`) {#lab-1}

### 문제 설정

대부분의 물리 시스템은 해석적(analytic) 해가 존재하지 않습니다. 따라서 미분 방정식을 **수치적으로 근사**해야 합니다. 이 실습에서는 대표적인 두 방법인 **오일러 방법**과 **RK4 방법**을 비교합니다.

테스트 시스템:
- **단순 조화 진동자** (해석해가 존재 → 비교 기준으로 사용)
- **감쇠 진자** (해석해 없음 → 실제 적용 사례)

---

### 방법 1: 오일러 방법 (Euler Method)

**핵심 아이디어**: 미분의 정의를 직접 이용하여 한 단계씩 전진

$$\frac{dy}{dt} \approx \frac{y(t+\Delta t) - y(t)}{\Delta t} \quad \Rightarrow \quad y(t+\Delta t) = y(t) + \Delta t \cdot f(y,\, t)$$

**구현 코드:**
```python
def euler_step(f, y, t, dt):
    return y + dt * f(y, t)
```

- **정확도**: 1차 (오차 ∝ Δt)
- **계산 비용**: 함수 평가 1회/스텝
- **단점**: 오차 누적이 심하고 에너지가 보존되지 않음

---

### 방법 2: Runge-Kutta 4차 방법 (RK4)

**핵심 아이디어**: 한 스텝 내에서 4개의 기울기를 계산한 뒤 가중 평균을 사용

$$k_1 = f(y,\, t)$$
$$k_2 = f\!\left(y + \tfrac{1}{2}\Delta t\, k_1,\; t + \tfrac{1}{2}\Delta t\right)$$
$$k_3 = f\!\left(y + \tfrac{1}{2}\Delta t\, k_2,\; t + \tfrac{1}{2}\Delta t\right)$$
$$k_4 = f(y + \Delta t\, k_3,\; t + \Delta t)$$
$$y(t+\Delta t) = y(t) + \frac{\Delta t}{6}(k_1 + 2k_2 + 2k_3 + k_4)$$

**구현 코드:**
```python
def rk4_step(f, y, t, dt):
    k1 = f(y, t)
    k2 = f(y + 0.5*dt*k1, t + 0.5*dt)
    k3 = f(y + 0.5*dt*k2, t + 0.5*dt)
    k4 = f(y + dt*k3, t + dt)
    return y + (dt/6) * (k1 + 2*k2 + 2*k3 + k4)
```

- **정확도**: 4차 (오차 ∝ Δt⁴)
- **계산 비용**: 함수 평가 4회/스텝
- **장점**: 매우 안정적이고 에너지 보존 우수 → 산업 표준

---

### 테스트 시스템 설정

#### 단순 조화 진동자
$$\frac{d^2x}{dt^2} = -\omega^2 x, \quad \omega = 2\pi = 6.2832\;\text{rad/s},\quad T_\text{period} = 1.0\;\text{s}$$

2차 미분 방정식을 1차 시스템으로 변환 (표준 기법):
$$\mathbf{y} = \begin{bmatrix} x \\ v \end{bmatrix}, \quad \frac{d\mathbf{y}}{dt} = \begin{bmatrix} v \\ -\omega^2 x \end{bmatrix}$$

```python
def harmonic_oscillator(y, t):
    omega = 2 * np.pi   # 6.2832 rad/s
    x, v = y
    return np.array([v, -omega**2 * x])
```

해석해: $x(t) = \cos(\omega t)$ (초기 조건 $x_0=1,\; v_0=0$)  
에너지: $E = \frac{1}{2}(v^2 + \omega^2 x^2) = \text{일정}$

#### 감쇠 진자
$$\frac{d^2\theta}{dt^2} = -\omega_0^2 \sin\theta - \gamma\,\frac{d\theta}{dt}, \quad \omega_0 = 2\pi,\; \gamma = 0.1$$

```python
def damped_pendulum(y, t):
    omega0 = 2 * np.pi
    gamma = 0.1
    theta, omega = y
    return np.array([omega, -omega0**2 * np.sin(theta) - gamma * omega])
```

초기 조건: $\theta_0 = 60°,\; \omega_0 = 0$

---

### 실행 결과 (`dt = 0.1 s`)

#### 단순 조화 진동자 에너지 오차 (t = 10 s)

| 방법 | 최종 에너지 오차 |
|------|----------------|
| **Euler** | **39,373,876,402,244,184%** (완전 발산!) |
| **RK4** | **7.88%** |

> Euler 방법은 dt = 0.1 s 라는 비교적 큰 스텝에서 에너지가 기하급수적으로 증가하여 수치적으로 **폭발(blow-up)**합니다.

#### 감쇠 진자 최종 각도 (t = 20 s, dt = 0.05 s)

| 방법 | 최종 각도 |
|------|----------|
| **Euler** | **-17,588.69°** (발산, 물리적으로 불가능) |
| **RK4** | **-18.93°** (수렴, 물리적으로 타당) |

---

### 오차 수렴율 분석 (`t = 50 s`, `dt = 0.05 s`)

단순 조화 진동자를 기준으로 장시간 시뮬레이션:

- Euler 오차: 시간에 따라 **선형 증가**
- RK4 오차: 장시간 후에도 **극도로 작게 유지**
- 같은 dt에서 RK4가 Euler보다 수백조 배 이상 정확

---

### 핵심 결론

| 항목 | Euler | RK4 |
|------|-------|-----|
| 정확도 차수 | O(Δt) — 1차 | O(Δt⁴) — 4차 |
| 계산 비용 | 1× | 4× |
| 에너지 보존 | 불량 (발산) | 우수 |
| 감쇠 진자 최종각 | -17,588.69° (발산) | -18.93° (정상) |
| 권장 사용처 | 개념 학습 | 실제 시뮬레이션 |

**결론**: RK4는 4배 느리지만 오차는 수백 배 이상 작으며, 물리 시뮬레이션의 산업 표준입니다.

---

## Lab 2: 행성 운동과 케플러 법칙 (`02planetary.py`) {#lab-2}

### 문제 설정

뉴턴의 만유인력 법칙을 이용해 지구·화성·목성의 궤도를 수치 시뮬레이션하고, **케플러 3법칙**을 수치적으로 검증합니다.

단위계: AU(천문단위), year(년), 태양 질량  
$$G = 4\pi^2 \;\text{AU}^3/(\text{year}^2 \cdot M_\odot)$$

---

### 물리 배경 — 뉴턴의 만유인력

$$\mathbf{F} = -\frac{GM_\odot m}{r^2}\hat{r} \quad \Rightarrow \quad \frac{d^2\mathbf{r}}{dt^2} = -\frac{GM_\odot}{r^3}\mathbf{r}$$

상태 벡터 $\mathbf{y} = [x, y, v_x, v_y]$로 변환:

```python
def gravitational_field(y, t):
    x, y_pos, vx, vy = y
    r = np.sqrt(x**2 + y_pos**2)
    a = -G * M_sun / r**3
    return np.array([vx, vy, a * x, a * y_pos])
```

---

### 초기 조건 설정 (근일점 출발)

$$r_0 = a(1-e), \quad v_0 = \sqrt{\frac{GM_\odot(1+e)}{a(1-e)}}$$

```python
def simulate_planet(a, e, t_max, dt=0.001):
    r0 = a * (1 - e)
    v0 = np.sqrt(G * M_sun * (1 + e) / (a * (1 - e)))
    y0 = np.array([r0, 0.0, 0.0, v0])
    # RK4 적분 (dt = 0.001 year)
```

---

### 시뮬레이션 실행 결과

| 행성 | 장반경 $a$ (AU) | 이심률 $e$ | 시간 단계 수 | 에너지 보존 | 각운동량 보존 |
|------|----------------|-----------|------------|-----------|-------------|
| 지구 | 1.000 | 0.0167 | 2,000 | **0.0000%** | **0.0000%** |
| 화성 | 1.524 | 0.0934 | 3,762 | **0.0000%** | **0.0000%** |
| 목성 | 5.203 | 0.0489 | 23,720 | **0.0000%** | **0.0000%** |

RK4 적분의 높은 정확도로 보존 법칙이 수치 정밀도 수준에서 완벽하게 유지됩니다.

---

### 케플러 3법칙 수치 검증

#### 제1법칙: 타원 궤도
행성의 궤도는 타원이고, 태양은 한 초점에 위치합니다.
$$r = \frac{a(1-e^2)}{1 + e\cos\theta}$$

시뮬레이션 궤적과 이론 타원을 겹쳐 그려 완벽한 일치를 확인합니다.

#### 제2법칙: 면적 속도 일정 (각운동량 보존)
$$\frac{dA}{dt} = \frac{L}{2m} = \text{일정}$$

```python
area_velocity = earth_L / (2 * mass_earth)
# 시간에 따라 상수임을 확인
```

각운동량 변동: **0.0000%** → 케플러 제2법칙 완벽 성립

#### 제3법칙: 주기-거리 관계
$$T^2 \propto a^3 \quad \Leftrightarrow \quad \frac{T^2}{a^3} = \frac{4\pi^2}{GM_\odot} \approx 1$$

| 행성 | 장반경 $a$ (AU) | 주기 $T$ (year) | $T^2/a^3$ |
|------|----------------|----------------|-----------|
| 지구 | 1.000 | 1.000 | **1.000000** |
| 화성 | 1.524 | 1.881 | **0.999592** |
| 목성 | 5.203 | 11.860 | **0.998638** |
| **평균** | | | **0.999410 ± 0.00057** |

이론값 1.0에 대해 오차 < 0.06%로 케플러 제3법칙이 매우 잘 성립합니다.

---

## Lab 3: 혼돈 시스템 — 이중 진자 (`03chaotic_pendulum.py`) {#lab-3}

### 문제 설정

이중 진자는 방정식은 결정론적이지만 초기 조건에 극도로 민감한 **혼돈(chaos)** 시스템입니다. 두 진자의 초기 각도를 **0.001도**만 다르게 설정하고 궤적이 어떻게 발산하는지 관찰합니다.

---

### 시스템 파라미터

$$L_1 = L_2 = 1.0\;\text{m},\quad m_1 = m_2 = 1.0\;\text{kg},\quad g = 9.81\;\text{m/s}^2$$

---

### 이중 진자 운동 방정식 (라그랑지안 역학에서 유도)

$$\delta = \theta_2 - \theta_1$$

$$\dot{\omega}_1 = \frac{m_2 L_1 \omega_1^2 \sin\delta\cos\delta + m_2 g\sin\theta_2\cos\delta + m_2 L_2 \omega_2^2 \sin\delta - (m_1+m_2)g\sin\theta_1}{(m_1+m_2)L_1 - m_2 L_1\cos^2\!\delta}$$

```python
def double_pendulum_derivs(y, t):
    theta1, omega1, theta2, omega2 = y
    delta = theta2 - theta1
    den1 = (m1 + m2) * L1 - m2 * L1 * np.cos(delta)**2
    den2 = (L2 / L1) * den1

    domega1 = (m2*L1*omega1**2*np.sin(delta)*np.cos(delta) +
               m2*g*np.sin(theta2)*np.cos(delta) +
               m2*L2*omega2**2*np.sin(delta) -
               (m1+m2)*g*np.sin(theta1)) / den1
    # ... (domega2도 유사하게 구성)
    return np.array([omega1, domega1, omega2, domega2])
```

---

### 나비 효과 실험 설정

| | 진자 A | 진자 B |
|--|--------|--------|
| $\theta_1$ | 90.000° | 90.000° |
| $\theta_2$ | 90.000° | **90.001°** |
| 초기 차이 | — | $\varepsilon = 0.001° = 1.745 \times 10^{-5}\;\text{rad}$ |

시뮬레이션 조건: `t_max = 30 s`, `dt = 0.01 s`, 총 **3,000 스텝**

---

### 실행 결과

#### 리아푸노프 지수 추정

두 궤적의 위치 차이가 지수적으로 증가합니다:
$$\delta(t) = \delta_0 \cdot e^{\lambda t}$$

```python
# 위치 차이 delta_pos가 0.1 m를 초과하는 시점 검출
lyapunov_approx = np.log(delta_pos[idx] / epsilon) / t_diverge
```

| 지표 | 측정값 |
|------|--------|
| 리아푸노프 지수 $\lambda$ | **0.556 s⁻¹** |
| 발산 시점 | **t ≈ 15.59 s** |
| 예측 가능 시간 ($1/\lambda$) | **~1.80 s** |

#### 정성적 관찰

- **0 ~ 5 s**: 두 궤적이 거의 동일하게 움직임
- **~15.6 s**: 위치 차이가 0.1 m에 도달 (발산 시작)
- **30 s 이후**: 완전히 다른 궤적

초기 차이 0.001도 → 30초 후 완전히 다른 궤적. 이것이 **나비 효과**입니다.

---

### 포앵카레 단면 (Poincaré Section)

4차원 위상 공간 $(\theta_1, \omega_1, \theta_2, \omega_2)$을 2D로 시각화합니다.  
$\theta_1 = 0$을 통과할 때마다 $(\theta_2, \omega_2)$를 기록:

```python
idx_poincare = np.where(np.diff(np.sign(theta1)) != 0)[0]
# 혼돈적 구조: 점들이 프랙탈 패턴으로 흩어짐
```

---

### 혼돈의 핵심 특성 정리

| 특성 | 내용 |
|------|------|
| 결정론적 | 운동 방정식이 명확하게 존재 |
| 비예측적 | 초기 오차가 지수적($e^{\lambda t}$)으로 증폭 |
| 리아푸노프 지수 | **λ ≈ 0.556 s⁻¹ > 0** → 혼돈 판별 기준 |
| 예측 가능 시간 | **~1.80 s** |
| 위상 공간 | 프랙탈(Fractal) 구조 |

---

## Lab 4: 라그랑지안과 해밀토니안 역학 (`04lagrangian_hamiltonian.py`) {#lab-4}

### 문제 설정

단순 진자를 세 가지 역학 정식화로 각각 풀고, 세 방법이 동일한 결과를 산출함을 수치적으로 확인합니다.

**파라미터**: $m = 1\;\text{kg},\; L = 1\;\text{m},\; g = 9.81\;\text{m/s}^2$  
**초기 조건**: $\theta_0 = 60°,\; \omega_0 = 0$, 시뮬레이션 시간 10 s, `dt = 0.01 s`

---

### 방법 1: 뉴턴 역학 (F = ma)

토크-관성 모멘트 관계를 직접 적용:

$$\tau = I\alpha \quad \Rightarrow \quad -mgL\sin\theta = mL^2\ddot{\theta} \quad \Rightarrow \quad \ddot{\theta} = -\frac{g}{L}\sin\theta$$

```python
def newtonian_pendulum(y, t):
    theta, omega = y
    alpha = -(g / L) * np.sin(theta)   # -(9.81/1.0) * sin(θ)
    return np.array([omega, alpha])
```

---

### 방법 2: 라그랑지안 역학 (L = T − V)

**라그랑지안 구성:**

$$T = \frac{1}{2}mL^2\dot{\theta}^2 = \frac{1}{2}(1)(1)^2\dot{\theta}^2$$
$$V = -mgL\cos\theta = -(1)(9.81)(1)\cos\theta$$
$$\mathcal{L} = T - V = \frac{1}{2}\dot{\theta}^2 + 9.81\cos\theta$$

**오일러-라그랑주 방정식 적용:**

$$\frac{d}{dt}\!\left(\frac{\partial\mathcal{L}}{\partial\dot{\theta}}\right) - \frac{\partial\mathcal{L}}{\partial\theta} = 0$$
$$\ddot{\theta} + \frac{g}{L}\sin\theta = 0 \quad \Rightarrow \quad \ddot{\theta} = -\frac{g}{L}\sin\theta \quad \text{← 뉴턴과 동일!}$$

```python
def lagrangian_pendulum(y, t):
    theta, omega = y
    alpha = -(g / L) * np.sin(theta)  # 동일한 운동 방정식
    return np.array([omega, alpha])
```

---

### 방법 3: 해밀토니안 역학 (H = T + V)

**정준 운동량(canonical momentum):**
$$p = \frac{\partial\mathcal{L}}{\partial\dot{\theta}} = mL^2\dot{\theta} = (1)(1)^2\dot{\theta} = \dot{\theta}$$

**해밀토니안:**
$$H = \frac{p^2}{2mL^2} - mgL\cos\theta = \frac{p^2}{2} - 9.81\cos\theta \quad (= \text{총 에너지})$$

**해밀턴 방정식:**
$$\dot{\theta} = \frac{\partial H}{\partial p} = \frac{p}{mL^2} = p, \qquad \dot{p} = -\frac{\partial H}{\partial \theta} = -mgL\sin\theta = -9.81\sin\theta$$

```python
def hamiltonian_pendulum(y, t):
    theta, p = y
    omega = p / (m * L**2)          # p / 1.0 = p
    dp_dt = -m * g * L * np.sin(theta)  # -9.81 * sin(θ)
    return np.array([omega, dp_dt])
```

초기 정준 운동량: $p_0 = mL^2\omega_0 = (1)(1)^2(0) = 0$

---

### 세 방법 동등성 수치 검증 결과

```
방법 간 차이:
  |θ_Newton - θ_Lagrange| < 0.0000000000 rad
  |θ_Newton - θ_Hamilton| < 0.0000000000 rad
  → 세 방법이 동일한 결과!
```

| 방법 | 에너지 보존 오차 ($\Delta E / E_0$) |
|------|-----------------------------------|
| **뉴턴** | **0.000001%** |
| **라그랑지안** | **0.000001%** |
| **해밀토니안** | **0.000001%** |

세 방법 모두 에너지 보존 오차 **0.000001%** 수준으로 RK4 수치 정밀도 한계 안에서 완벽히 일치합니다.

---

### 각 방법의 비교

| 항목 | 뉴턴 | 라그랑지안 | 해밀토니안 |
|------|------|-----------|-----------|
| 기본 식 | $F = ma$ | $\mathcal{L} = T - V$ | $H = T + V$ |
| 좌표 | 카테시안 | 일반화 좌표 $q$ | 위상 공간 $(q, p)$ |
| 제약 처리 | 복잡 | 자동 | 자동 |
| 직관성 | 높음 | 중간 | 낮음 |
| 확장성 | 제한적 | 장론으로 확장 가능 | 양자역학으로 확장 |

---

### 작용 원리 (Principle of Least Action)

$$S = \int_0^T \mathcal{L}\,dt, \qquad \delta S = 0$$

자연은 작용(action) $S$를 최소화하는 경로를 선택합니다. 오일러-라그랑주 방정식은 이 변분 원리의 직접적인 결과입니다.

---

### 해밀토니안과 양자역학의 연결

해밀토니안 역학은 양자역학으로 직접 이어집니다:

| 고전 역학 | 양자 역학 |
|-----------|-----------|
| $\theta$ (위치) | $\hat{\theta}$ (위치 연산자) |
| $p$ (운동량) | $\hat{p} = -i\hbar\partial/\partial\theta$ |
| $H$ (에너지) | $\hat{H} \rightarrow i\hbar\partial\psi/\partial t = \hat{H}\psi$ |

---

## 종합 결론 {#결론}

### 실제 실행 결과 요약

| 실습 | 파일 | 핵심 수치 결과 |
|------|------|--------------|
| **Lab 1** | `01euler_rk4.py` | Euler 에너지 오차 3.9×10¹⁶%, RK4는 7.88% (dt=0.1) |
| **Lab 2** | `02planetary.py` | $T^2/a^3 = 0.9994 \pm 0.0006$, 보존법칙 오차 0.0000% |
| **Lab 3** | `03chaotic_pendulum.py` | 리아푸노프 $\lambda = 0.556\;\text{s}^{-1}$, 예측가능시간 1.80 s |
| **Lab 4** | `04lagrangian_hamiltonian.py` | 3 정식화 차이 < 10⁻¹⁰ rad, 에너지 오차 0.000001% |

---

### 수치 적분 구현 패턴 (공통)

**2차 ODE를 1차 시스템으로 변환:**

```python
# 원래: d²θ/dt² = f(θ, dθ/dt)
# → 상태 벡터 y = [θ, ω]
def system(y, t):
    theta, omega = y
    return np.array([omega, f(theta, omega)])
```

**시간 간격 선택 기준:**
$$\Delta t < \frac{T_\text{characteristic}}{100}$$

예: 단진자 주기 $T = 2\pi\sqrt{L/g} \approx 2.0\;\text{s}$ → `dt = 0.01 s`로 충분

**에너지 보존으로 신뢰성 확인:**
```python
E_error = (E.max() - E.min()) / abs(E[0])
# 0.01% 미만이면 시뮬레이션 신뢰 가능
```

---

### 언제 어떤 방법을 쓰는가?

| 상황 | 적합한 방법 |
|------|-------------|
| 간단한 직선 운동 | 뉴턴 |
| 제약 조건이 복잡한 시스템 (로봇 팔 등) | 라그랑지안 |
| 보존 법칙·대칭성 분석, 천체 역학 | 해밀토니안 |
| 양자역학으로의 확장 | 해밀토니안 |

> **핵심 메시지**: 뉴턴·라그랑지안·해밀토니안은 모두 **동일한 물리**를 서로 다른 언어로 표현한 것입니다. 문제의 성격에 맞는 정식화를 선택하면 계산이 크게 단순해집니다.

---

*생성 파일: `outputs/01_euler_vs_rk4.png`, `01_error_analysis.png`, `02_solar_system.png`, `02_orbital_parameters.png`, `02_kepler_laws.png`, `03_double_pendulum.png`, `03_chaos_analysis.png`, `03_phase_space.png`, `04_comparison.png`, `04_lagrangian.png`, `04_hamiltonian.png`, `04_phase_space.png`*
