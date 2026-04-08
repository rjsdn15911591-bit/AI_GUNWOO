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
| 4. 검증 | `superpowers:verification-before-completion` | `../1-1. output/*.png` |

---

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
hw.week 4/
├── main_app.py          # 메인 PySide6 GUI 애플리케이션
├── lab1_widget.py       # Lab 1: 1D 함수 근사
├── lab2_widget.py       # Lab 2: 포물선 운동 회귀
├── lab3_widget.py       # Lab 3: 과적합/과소적합 비교
├── lab4_widget.py       # Lab 4: 진자 주기 예측 + RK4 시뮬레이션
├── outputs/             # 그래프 PNG 자동 저장 폴더
├── PRD_Week4.docx       # Product Requirements Document
├── TRD_Week4.docx       # Technical Requirements Document
└── README.md
```

---

## Lab 구성

### Lab 1 - 1D 함수 근사

다양한 수학 함수(sin, cos, 합성함수 등)를 신경망으로 근사합니다.

- **선택 가능 함수**: sin(x), cos(x)+0.5sin(2x), x·sin(x), 극한 복잡도
- **네트워크 크기 비교**: Small [32] / Medium [64,64] / Large [128,128] / Very Large [128,128,64]
- **활성화 함수**: tanh
- **출력**: 함수 근사 그래프 + 학습 곡선 (MSE)

### Lab 2 - 포물선 운동 회귀

초기 속도(v₀), 발사각(θ), 시간(t)을 입력받아 (x, y) 위치를 예측합니다.

- **입력**: v₀ (10~50 m/s), θ (10°~80°), t
- **출력**: 수평 거리 x, 수직 높이 y
- **모델**: Dense [128→64→32→2] + Dropout
- **테스트 조건**: v₀=20/30/40 m/s, θ=30°/45°/60°

### Lab 3 - 과적합/과소적합 비교

동일 데이터에 대해 3가지 모델을 동시에 학습하여 과적합/과소적합 현상을 시각화합니다.

| 모델 | 구성 | 특징 |
|------|------|------|
| Underfit | [4] | 표현력 부족 |
| Good Fit | [32, 16] + Dropout(0.2) | 일반화 성능 우수 |
| Overfit | [256, 128, 64, 32] | 훈련 데이터 암기 |

### Lab 4 - 진자 주기 예측 + RK4 시뮬레이션

진자 길이(L)와 초기 각도(θ₀)를 입력받아 주기 T를 예측하며, RK4 수치적분으로 실제 운동을 시뮬레이션합니다.

- **물리 공식**: T = 2π√(L/g) + 큰 각도 타원적분 보정
- **RK4 시뮬레이션**: dt=0.001s, 위상 공간 시각화
- **테스트 조건**: L = 0.5m, 1.0m, 2.0m / 각도 5°~80°

---

## GUI 기능

- **탭 전환**: Lab 1~4를 탭으로 독립적으로 실행
- **QThread 백그라운드 학습**: UI 블로킹 없이 학습 진행
- **실시간 진행바 & 로그**: Epoch별 손실 실시간 표시
- **Matplotlib FigureCanvas**: 결과 그래프 인터랙티브 표시
- **PNG 자동 저장**: `outputs/` 폴더에 고해상도(150 DPI) 저장
- **한글 폰트**: Malgun Gothic (Windows 기준)

---

## 출력 파일

학습 완료 후 "그래프 PNG 저장" 버튼 클릭 시 `outputs/` 폴더에 저장됩니다.

| 파일 | 내용 |
|------|------|
| `perfect_1d_approximation.png` | Lab 1 함수 근사 결과 |
| `02_projectile_trajectories.png` | Lab 2 포물선 궤적 비교 |
| `03_overfitting_comparison.png` | Lab 3 과적합/과소적합 비교 |
| `04_pendulum_prediction.png` | Lab 4 진자 주기 예측 및 시뮬레이션 |

---

## 문서

- **PRD_Week4.docx**: 제품 요구사항 문서 (목적, 사용자, 기능 요구사항)
- **TRD_Week4.docx**: 기술 요구사항 문서 (아키텍처, 모델 구성, 기술 스택)
