# Week 4: Neural Network으로 물리 데이터 학습하기

**AI와 머신러닝 수업 - Week 4 과제**

TensorFlow/Keras 신경망을 활용하여 물리 현상을 학습하고 예측하는 PySide6 GUI 통합 애플리케이션입니다.

---

## Superpowers 활용 워크플로우

이 앱은 **Claude Code Superpowers** 스킬을 활용해 설계 → 계획 → 구현 순서로 개발됐습니다.

| 단계 | 사용 스킬 | 결과물 |
|------|----------|--------|
| 1. 설계 | `superpowers:brainstorming` | `docs/01_design-spec.md` |
| 2. 계획 | `superpowers:writing-plans` | `docs/02_implementation-plan.md` |
| 3. 구현 | `superpowers:executing-plans` | `main_app.py`, `lab*_widget.py` |
| 4. 검증 | `superpowers:code-reviewer` | `../1-1. output/*.png` |

---

## 실행 환경

- Python 3.12
- TensorFlow / Keras
- PySide6
- Matplotlib
- NumPy

### 패키지 설치

```bash
pip install PySide6 tensorflow numpy matplotlib
```

### 실행

```bash
python main_app.py
```

---

## 프로젝트 구조

```
2. superpowers + PySide6 앱/
├── main_app.py              # 메인 PySide6 GUI (Lab 1~8 탭)
├── lab1_widget.py           # Lab 1: 1D 함수 근사 (7가지 함수 선택)
├── lab2_widget.py           # Lab 2: 포물선 운동 회귀 + 공기저항 옵션
├── lab3_widget.py           # Lab 3: 과적합/과소적합 비교 + L1/L2 정규화
├── lab4_widget.py           # Lab 4: 진자 주기 예측 + RK4 + 감쇠 옵션
├── lab5_widget.py           # Lab 5: 스프링-질량 고유 진동수 예측
├── lab6_widget.py           # Lab 6: 2D Ising Model 상전이 예측
├── lab7_widget.py           # Lab 7: 양자 조화 진동자 에너지 준위 예측
├── lab8_widget.py           # Lab 8: Kepler 궤도 예측
├── docs/
│   ├── 01_design-spec.md    # 설계 스펙 (brainstorming 결과)
│   └── 02_implementation-plan.md  # 구현 계획 (writing-plans 결과)
├── outputs/                 # 그래프 PNG 자동 저장 폴더
└── MANUAL_Week4.md          # 이 파일
```

---

## Lab 구성

### [기본 과제] Lab 1 - 1D 함수 근사

다양한 수학 함수를 신경망으로 근사합니다.

- **선택 가능 함수 (7가지)**: sin(x), cos(x)+0.5sin(2x), x·sin(x), 극한 복잡도, tanh(x), x³, x²sin(x)
- **네트워크 크기 비교**: Small [32] / Medium [64,64] / Large [128,128] / Very Large [128,128,64]
- **활성화 함수**: tanh
- **출력**: 함수 근사 그래프 + 학습 곡선 (MSE)

### [기본 과제] Lab 2 - 포물선 운동 회귀

초기 속도(v₀), 발사각(θ), 시간(t)을 입력받아 (x, y) 위치를 예측합니다.

- **입력**: v₀ (10~50 m/s), θ (10°~80°), t
- **출력**: 수평 거리 x, 수직 높이 y
- **모델**: Dense [128→64→32→2] + Dropout
- **테스트 조건**: v₀=20/30/40 m/s, θ=30°/45°/60°
- **[심화] 공기저항**: 체크박스로 RK4 drag 시뮬레이션 활성화 (k: 0.01~0.5)

### [기본 과제] Lab 3 - 과적합/과소적합 비교

동일 데이터에 대해 3가지 모델을 동시에 학습하여 과적합/과소적합 현상을 시각화합니다.

| 모델 | 구성 | 특징 |
|------|------|------|
| Underfit | [4] | 표현력 부족 |
| Good Fit | [32, 16] + Dropout(0.2) | 일반화 성능 우수 |
| Overfit | [256, 128, 64, 32] | 훈련 데이터 암기 |

- **[심화] 정규화 선택**: 없음 / L1 / L2 / L1+L2, λ (0.0001~0.1) — Good Fit 모델에 적용

### [기본 과제] Lab 4 - 진자 주기 예측 + RK4 시뮬레이션

진자 길이(L)와 초기 각도(θ₀)를 입력받아 주기 T를 예측하며, RK4 수치적분으로 실제 운동을 시뮬레이션합니다.

- **물리 공식**: T = 2π√(L/g) + 큰 각도 타원적분 보정
- **RK4 시뮬레이션**: dt=0.001s, 위상 공간 시각화
- **테스트 조건**: L = 0.5m, 1.0m, 2.0m / 각도 5°~80°
- **[심화] 감쇠 진자**: γ 파라미터 (0.0~2.0), `dω/dt = -(g/L)sinθ - γω`

---

### [프로젝트 과제] Lab 5 - 스프링-질량 고유 진동수 예측

- **물리 공식**: f = (1/2π)√(k/m)
- **입력**: k (1~100 N/m), m (0.1~10 kg)
- **출력**: 고유 진동수 f (Hz)
- **네트워크**: Dense [64→32→16→1] ReLU
- **RK4 시뮬레이션**: k=10, m=1 조건의 실제 진동 변위 확인
- **결과**: 4-panel 그래프 (scatter, 학습 곡선, f vs k 곡선, RK4 시뮬레이션)

### [프로젝트 과제] Lab 6 - 2D Ising Model 상전이 예측

- **물리 모델**: H = -J Σ sᵢsⱼ, Metropolis 알고리즘
- **입력**: 온도 T (0.5~5.0)
- **출력**: 자화율 |M|
- **임계 온도**: Tc ≈ 2.269 (J=1, k_B=1)
- **네트워크**: Dense [32→16→1] tanh
- **결과**: 상전이 곡선 + 격자 스냅샷 (저온/임계/고온 3단계)

### [프로젝트 과제] Lab 7 - 양자 조화 진동자 에너지 준위 예측

- **물리 공식**: E_n = ℏω(n + 1/2) (ℏ=1 단위)
- **입력**: ω (0.5~5.0), n (0~9 정수)
- **출력**: 에너지 E_n
- **네트워크**: Dense [32→16→1] ReLU
- **파동함수**: Hermite 다항식으로 ψ_n(x) 계산 (n=0~4)
- **결과**: 에너지 준위 다이어그램 + 파동함수 시각화 + 예측 scatter + 학습 곡선

### [프로젝트 과제] Lab 8 - Kepler 궤도 예측

- **물리 공식**: r = a(1-e²)/(1+e·cosθ), x = r·cosθ, y = r·sinθ
- **입력**: a (1~5 AU), e (0~0.9), θ (0~2π)
- **출력**: 직교좌표 x, y (AU)
- **네트워크**: Dense [128→64→32→2] ReLU
- **테스트 조건**: a=2 AU, e=0.0(원형) / 0.5(타원) / 0.85(긴 타원)
- **결과**: 실제 vs 예측 궤도 비교 + 학습 곡선

---

## GUI 기능

- **탭 전환**: Lab 1~8을 탭으로 독립적으로 실행
- **QThread 백그라운드 학습**: UI 블로킹 없이 학습 진행
- **실시간 진행바 & 로그**: Epoch별 손실 실시간 표시
- **파라미터 조정**: 각 Lab별 샘플 수, Epochs, 물리 파라미터 GUI에서 직접 수정 가능
- **Matplotlib FigureCanvas**: 결과 그래프 인터랙티브 표시
- **PNG 자동 저장**: `outputs/` 폴더에 고해상도(150 DPI) 저장
- **한글 폰트**: Malgun Gothic (Windows), AppleGothic (macOS), NanumGothic (Linux)
- **마이너스 기호 정상 출력**: 모든 widget에 `axes.unicode_minus=False` 적용

---

## 출력 파일

학습 완료 후 "그래프 PNG 저장" 버튼 클릭 시 `outputs/` 폴더에 저장됩니다.

| 파일 | 내용 |
|------|------|
| `perfect_1d_approximation.png` | Lab 1 함수 근사 결과 |
| `02_projectile_trajectories.png` | Lab 2 포물선 궤적 비교 |
| `03_overfitting_comparison.png` | Lab 3 과적합/과소적합 비교 |
| `04_pendulum_prediction.png` | Lab 4 진자 주기 예측 및 시뮬레이션 |
| `05_spring_mass_frequency.png` | Lab 5 스프링-질량 고유 진동수 예측 |
| `06_ising_phase_transition.png` | Lab 6 Ising Model 상전이 예측 |
| `07_quantum_oscillator_energy.png` | Lab 7 양자 조화 진동자 에너지 준위 |
| `08_kepler_orbit.png` | Lab 8 Kepler 궤도 예측 |

---

## 문서

- **PRD_Week4.docx**: 제품 요구사항 문서 (목적, 사용자, 기능 요구사항)
- **TRD_Week4.docx**: 기술 요구사항 문서 (아키텍처, 모델 구성, 기술 스택)
- **docs/01_design-spec.md**: Superpowers brainstorming 결과 설계 스펙
- **docs/02_implementation-plan.md**: Superpowers writing-plans 결과 구현 계획
