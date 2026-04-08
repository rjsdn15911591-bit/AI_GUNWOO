# Design Spec: Week 4 HW — Neural Network으로 물리 데이터 학습하기

**Date:** 2026-04-08
**Skill used:** superpowers:brainstorming
**Status:** Approved

---

## 1. 목적

TensorFlow/Keras 신경망을 활용해 물리 현상(함수 근사, 포물선 운동, 과적합, 진자 운동)을 학습하고 예측하는 PySide6 GUI 애플리케이션을 만든다. PRD/TRD 문서와 함께 Superpowers 워크플로우(설계 → 계획 → 구현)를 명확히 보여주는 것이 핵심이다.

---

## 2. 사용자 및 맥락

- **사용자**: AI와 머신러닝 수업 수강생
- **맥락**: Week 4 과제 — Superpowers + PySide6 + PRD/TRD를 활용해 물리 데이터 학습 앱 제출

---

## 3. 아키텍처

```
main_app.py
├── QTabWidget (Lab 1~4 탭 전환)
├── Lab1Widget  ─ TrainThread (QThread) ─ TensorFlow 학습
├── Lab2Widget  ─ TrainThread (QThread) ─ TensorFlow 학습
├── Lab3Widget  ─ TrainThread (QThread) ─ TensorFlow 학습
└── Lab4Widget  ─ TrainThread (QThread) ─ TensorFlow 학습 + RK4
```

- **UI**: PySide6 QMainWindow, QTabWidget, Fusion 스타일
- **학습**: 각 Lab마다 독립적인 QThread — UI 블로킹 없음
- **시각화**: Matplotlib FigureCanvasQTAgg — 결과 인터랙티브 표시
- **저장**: outputs/ 폴더에 PNG 자동 저장 (150 DPI)
- **폰트**: Malgun Gothic (Windows 한글 지원)

---

## 4. 각 Lab 설계 결정

### Lab 1 — 1D 함수 근사
- **입력**: x ∈ [-2π, 2π], 500개 샘플
- **모델**: Dense [N] + tanh 활성화, 출력 linear
- **목적**: 네트워크 크기(Small/Medium/Large/Very Large)에 따른 근사 성능 비교
- **결정**: tanh 선택 이유 — sin/cos 계열 함수 근사에 tanh가 relu보다 적합

### Lab 2 — 포물선 운동 회귀
- **입력**: v₀, θ, t (3차원)
- **출력**: x, y (2차원)
- **모델**: Dense [128→64→32→2] + Dropout(0.1)
- **결정**: 데이터 정규화 필수 — v₀(10~50), θ(라디안), t(0~수초) 스케일 차이가 큼

### Lab 3 — 과적합/과소적합 비교
- **3가지 모델 동시 학습**: Underfit [4] / Good Fit [32,16]+Dropout / Overfit [256,128,64,32]
- **결정**: 같은 데이터, 같은 Epochs로 비교해야 공정한 대조 실험이 됨
- **시각화**: 상단 예측 비교 + 하단 학습 곡선을 2×3 그리드로 배치

### Lab 4 — 진자 주기 + RK4
- **물리 공식**: T = 2π√(L/g) + 타원적분 보정 (큰 각도 보정 포함)
- **RK4**: dt=0.001s, 4주기 시뮬레이션
- **결정**: 작은 각도 근사(T=2π√(L/g))만 쓰면 80° 근처에서 오차가 커 타원적분 보정 추가

---

## 5. 컴포넌트 경계

| 컴포넌트 | 역할 | 의존성 |
|---------|------|--------|
| `main_app.py` | 앱 진입점, 탭 조합, 스타일 | PySide6, lab*_widget |
| `lab*_widget.py` | UI + TrainThread 연결 | PySide6, Matplotlib |
| `TrainThread` | TF 학습 로직 (QThread) | TensorFlow, NumPy |
| `rk4_pendulum()` | RK4 수치 적분 (Lab 4) | NumPy |

각 Lab 위젯은 독립적으로 동작하며 서로 상태를 공유하지 않는다.

---

## 6. 오류 처리

- TensorFlow 미설치 시 `ImportError` 캐치 → 사용자에게 메시지 표시
- 학습 중 예외 발생 시 `error_occurred` Signal → UI 로그에 출력
- 학습 완료 전 저장 버튼 비활성화 (`setEnabled(False)`)

---

## 7. 설계 승인

> 이 설계는 Superpowers `brainstorming` 스킬을 통해 도출되었으며,
> 사용자 승인 후 `writing-plans` 스킬로 구현 계획을 작성했다.
