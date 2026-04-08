# 설계 스펙 (Superpowers brainstorming 스킬 결과)

> 이 문서는 Superpowers `brainstorming` 스킬을 통해 도출된 설계입니다.
> 전체 스펙 원본: `docs/superpowers/specs/`

---

## 문제 정의

TensorFlow/Keras 신경망으로 물리 현상을 학습하고 예측하는 PySide6 GUI 애플리케이션 제작.

**과제 요건**: PRD + TRD + Superpowers 활용 + PySide6

**구현 범위**:
- **기본 과제**: Lab 1~4 (함수 근사, 포물선 운동, 과적합 비교, 진자 주기)
- **심화 과제**: 각 Lab에 고급 물리 기능 추가
- **프로젝트 과제**: Lab 5~8 (스프링-질량, Ising 모델, 양자 진동자, Kepler 궤도)

---

## 아키텍처

```
main_app.py
├── QTabWidget (Lab 1~8 탭 전환)
├── Lab1Widget  ─ TrainThread (QThread) ─ TensorFlow 학습 (tanh, 다중 함수 선택)
├── Lab2Widget  ─ TrainThread (QThread) ─ TensorFlow 학습 + RK4 공기저항 옵션
├── Lab3Widget  ─ TrainThread (QThread) ─ 3모델 비교 + L1/L2 정규화 선택
├── Lab4Widget  ─ TrainThread (QThread) ─ TensorFlow 학습 + RK4 (감쇠 옵션)
├── Lab5Widget  ─ TrainThread (QThread) ─ 스프링-질량 고유 진동수 + RK4 시뮬레이션
├── Lab6Widget  ─ TrainThread (QThread) ─ Metropolis Ising 데이터 생성 + NN 학습
├── Lab7Widget  ─ TrainThread (QThread) ─ 양자 에너지 준위 + Hermite 파동함수
└── Lab8Widget  ─ TrainThread (QThread) ─ 케플러 궤도 좌표 예측 (2D 출력)
```

- **UI**: PySide6 QMainWindow + QTabWidget, Fusion 스타일
- **학습**: QThread로 백그라운드 실행 → UI 블로킹 없음
- **시각화**: Matplotlib FigureCanvasQTAgg 임베드
- **저장**: outputs/ 폴더에 PNG 자동 저장 (150 DPI)
- **폰트**: Malgun Gothic (Windows 한글 지원), axes.unicode_minus=False

---

## Lab별 설계 결정

### 기본 과제 (Lab 1~4)

| Lab | 핵심 설계 결정 | 근거 |
|-----|--------------|------|
| Lab 1 | 활성화 함수: tanh, 7가지 함수 선택 가능 | sin/cos 계열 근사에 relu보다 적합, 다양성 확보 |
| Lab 2 | 입력 정규화 필수 + 공기저항 RK4 옵션 | 스케일 차이 보정, 심화: drag force = -k·v |
| Lab 3 | 3모델 동일 조건 비교 + L1/L2 정규화 선택 | 공정한 대조 실험, 심화: 정규화 효과 관찰 |
| Lab 4 | 타원적분 보정 + 감쇠 진자 옵션(gamma) | 대각도 정확도, 심화: -(g/L)sinθ - γω |

### 심화 기능 상세

| Lab | 추가 기능 | 파라미터 |
|-----|---------|---------|
| Lab 1 | 함수 추가: tanh(x), x³, x²sin(x) | 콤보박스 선택 |
| Lab 2 | 공기저항 RK4 시뮬레이션 | 체크박스 + k (0.01~0.5) |
| Lab 3 | 정규화: 없음 / L1 / L2 / L1+L2 | 콤보박스 + λ (0.0001~0.1) |
| Lab 4 | 감쇠 계수 γ: 0이면 이상 진자, >0이면 감쇠 진자 | QDoubleSpinBox (0.0~2.0) |

### 프로젝트 과제 (Lab 5~8)

| Lab | 물리 모델 | 네트워크 구성 |
|-----|---------|-------------|
| Lab 5 | f = (1/2π)√(k/m), RK4 진동 시뮬레이션 | [64, 32, 16, 1] ReLU |
| Lab 6 | 2D Ising Metropolis, T → \|M\| 상전이 | [32, 16, 1] tanh |
| Lab 7 | E_n = ω(n+0.5), Hermite 파동함수 | [32, 16, 1] ReLU |
| Lab 8 | r = a(1-e²)/(1+e·cosθ) → (x,y) | [128, 64, 32, 2] ReLU |

---

## 컴포넌트 경계

| 파일 | 역할 | 의존성 |
|------|------|--------|
| `main_app.py` | 앱 진입점, 탭 조합, 전역 스타일, 한글 폰트 | PySide6, lab*_widget |
| `lab1_widget.py` | 1D 함수 근사 UI + TrainThread | PySide6, Matplotlib, TF |
| `lab2_widget.py` | 포물선 운동 UI + TrainThread + RK4 drag | PySide6, Matplotlib, TF |
| `lab3_widget.py` | 과적합 비교 UI + TrainThread + 정규화 | PySide6, Matplotlib, TF |
| `lab4_widget.py` | 진자 주기 UI + TrainThread + RK4 감쇠 | PySide6, Matplotlib, TF |
| `lab5_widget.py` | 스프링-질량 UI + TrainThread + `rk4_spring()` | PySide6, Matplotlib, TF |
| `lab6_widget.py` | Ising UI + TrainThread + `metropolis_ising()` | PySide6, Matplotlib, TF |
| `lab7_widget.py` | 양자 진동자 UI + TrainThread + `psi_n()`, `hermite()` | PySide6, Matplotlib, TF |
| `lab8_widget.py` | Kepler UI + TrainThread + `kepler_orbit()` | PySide6, Matplotlib, TF |

각 Lab 위젯은 독립적으로 동작하며 서로 상태를 공유하지 않는다.

---

## 오류 처리 전략

- TensorFlow 미설치 → `ImportError` 캐치 후 UI 메시지 표시
- 학습 중 예외 → `error_occurred` Signal → 로그 출력
- 학습 완료 전 저장 버튼 비활성화
- matplotlib 마이너스 기호 경고 → 모든 widget에 `axes.unicode_minus = False` 적용
