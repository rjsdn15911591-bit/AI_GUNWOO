# Design Spec: Week 4 프로젝트 — Lab 5~8 신규 구현

**Date:** 2026-04-08
**Skill used:** superpowers:brainstorming
**Status:** Approved

---

## 1. 목적

기존 Lab 1~4와 동일한 패턴으로 4개의 프로젝트 Lab을 추가한다.
각 Lab은 독립적인 widget 파일로 구현되고 main_app.py의 탭에 추가된다.

---

## 2. 변경 파일 목록

| 파일 | 내용 |
|------|------|
| `lab5_widget.py` | 신규: 스프링-질량 고유 진동수 예측 |
| `lab6_widget.py` | 신규: 2D Ising Model 상전이 예측 |
| `lab7_widget.py` | 신규: 양자 조화 진동자 에너지 준위 |
| `lab8_widget.py` | 신규: Kepler 궤도 예측 |
| `main_app.py` | 수정: Lab 5~8 탭 추가 |

---

## 3. 공통 구조 (기존 Lab 패턴 동일)

```
LabNWidget(QWidget)
├── init_ui()
│   ├── 왼쪽: 설정 GroupBox + 실행/저장 버튼 + 프로그레스바 + 로그
│   └── 오른쪽: FigureCanvas (Matplotlib)
├── start_training() → TrainThread 시작
├── on_done(result) → plot() 호출
├── on_error(msg)
├── plot(result)
└── save_graph() → outputs/ PNG 저장

TrainThread(QThread)
├── progress Signal(int)
├── log_message Signal(str)
├── finished_result Signal(dict)
└── error_occurred Signal(str)
```

---

## 4. Lab 5 — 스프링-질량 고유 진동수 예측

### 물리
- 고유 진동수: f = (1/2π)√(k/m)
- 운동 방정식: x'' = -(k/m)·x  →  RK4로 시뮬레이션

### 학습 데이터
- k: [1, 100] N/m, m: [0.1, 10] kg, 각 2000개 랜덤 샘플
- 입력: (k, m), 출력: f

### 모델
- Dense [64, 32, 16] + ReLU, 출력 linear

### 그래프 (2×2)
- 좌상: NN 예측 f vs 실제 f (scatter)
- 우상: 학습 곡선
- 좌하: k 고정, m 변화에 따른 f 예측 vs 실제
- 우하: RK4 진동 시뮬레이션 (선택한 k, m)

### PNG 저장
- `outputs/05_spring_mass_frequency.png`

---

## 5. Lab 6 — 2D Ising Model 상전이

### 물리
- 해밀토니안: H = -J Σ sᵢsⱼ
- 임계온도: Tc = 2J/ln(1+√2) ≈ 2.269 (J=1 단위)
- Monte Carlo (Metropolis 알고리즘)로 격자 10×10 시뮬레이션

### 학습 데이터
- T: [0.5, 5.0] 범위 200개 온도값
- 각 T에서 Metropolis 1000 스텝 → 평균 자화율 |M| 계산
- 입력: T, 출력: |M|

### 모델
- Dense [32, 16] + tanh

### 그래프 (1×2 + 격자 시각화)
- 좌: |M| vs T 곡선 (실제 + NN 예측, Tc 수직선 표시)
- 우상: 학습 곡선
- 우하: T=1.0(저온), T=2.27(임계), T=4.0(고온) 격자 스냅샷 3개

### PNG 저장
- `outputs/06_ising_phase_transition.png`

---

## 6. Lab 7 — 양자 조화 진동자 에너지 준위

### 물리
- 에너지: E_n = ℏω(n + 1/2),  ℏ=1 단위 사용
- 파동함수: ψ_n(x) ∝ H_n(x)·exp(-x²/2)  (Hermite 다항식)

### 학습 데이터
- ω: [0.5, 5.0], n: [0, 9] 정수, 각 2000개 샘플
- 입력: (ω, n), 출력: E_n = ω·(n + 0.5)

### 모델
- Dense [32, 16] + ReLU

### 그래프 (1×2 + 에너지 준위 다이어그램)
- 좌상: 에너지 준위 다이어그램 (n=0~4, ω=1)
- 좌하: ψ_n(x) 파동함수 n=0~4 오버레이
- 우상: NN 예측 vs 실제 E_n scatter
- 우하: 학습 곡선

### PNG 저장
- `outputs/07_quantum_oscillator_energy.png`

---

## 7. Lab 8 — Kepler 궤도 예측

### 물리
- 극좌표: r = a(1-e²)/(1 + e·cos θ)
- 직교좌표: x = r·cos θ, y = r·sin θ
- 이심률 e: 0(원) ~ 0.9(타원)

### 학습 데이터
- a: [1, 5] AU, e: [0, 0.9], θ: [0, 2π], 각 3000개 샘플
- 입력: (a, e, θ), 출력: (x, y)

### 모델
- Dense [128, 64, 32, 2] + ReLU, 출력 linear

### 그래프 (1×2)
- 좌: 3가지 이심률(e=0.0/0.5/0.9) 예측 궤도 vs 실제 궤도
- 우: 학습 곡선

### PNG 저장
- `outputs/08_kepler_orbit.png`

---

## 8. main_app.py 변경

```python
from lab5_widget import Lab5Widget
from lab6_widget import Lab6Widget
from lab7_widget import Lab7Widget
from lab8_widget import Lab8Widget

self.tabs.addTab(Lab5Widget(), "Lab 5: 스프링-질량")
self.tabs.addTab(Lab6Widget(), "Lab 6: Ising Model")
self.tabs.addTab(Lab7Widget(), "Lab 7: 양자 진동자")
self.tabs.addTab(Lab8Widget(), "Lab 8: Kepler 궤도")
```

---

## 9. 설계 승인

> 이 설계는 Superpowers `brainstorming` 스킬을 통해 도출되었으며,
> 사용자 승인 후 `writing-plans` 스킬로 구현 계획을 작성했다.
