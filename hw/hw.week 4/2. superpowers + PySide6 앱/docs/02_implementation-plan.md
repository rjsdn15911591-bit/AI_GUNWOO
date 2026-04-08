# 구현 계획 (Superpowers writing-plans 스킬 결과)

> 이 문서는 Superpowers `writing-plans` 스킬을 통해 작성된 구현 계획입니다.
> 전체 계획 원본: `docs/superpowers/plans/`

---

## 구현 순서

### Phase 1 - 기본 과제 (Lab 1~4)

| 순서 | 파일 | 내용 |
|------|------|------|
| 1 | `main_app.py` | QMainWindow, QTabWidget, 스타일시트, 한글 폰트 설정 |
| 2 | `lab1_widget.py` | 1D 함수 근사 UI + TrainThread (tanh, 네트워크 크기 비교) |
| 3 | `lab2_widget.py` | 포물선 운동 UI + TrainThread (정규화, relu, 2D 출력) |
| 4 | `lab3_widget.py` | 과적합 비교 UI + TrainThread (3모델 순차 학습) |
| 5 | `lab4_widget.py` | 진자 주기 UI + TrainThread + `rk4_pendulum()` |

### Phase 2 - 심화 과제

| 순서 | 파일 | 추가 내용 |
|------|------|---------|
| 6 | `lab1_widget.py` | 함수 선택 확장: tanh(x), x³, x²sin(x) 추가 |
| 7 | `lab2_widget.py` | 공기저항 RK4 옵션: 체크박스 + drag coefficient k |
| 8 | `lab3_widget.py` | L1/L2 정규화 선택: ComboBox + λ QDoubleSpinBox |
| 9 | `lab4_widget.py` | 감쇠 진자: γ 파라미터 추가, `-(g/L)sinθ - γω` |

### Phase 3 - 프로젝트 과제 (Lab 5~8)

| 순서 | 파일 | 내용 |
|------|------|------|
| 10 | `lab5_widget.py` | 스프링-질량 고유 진동수 + `rk4_spring()` |
| 11 | `lab6_widget.py` | 2D Ising 상전이 + `metropolis_ising()` |
| 12 | `lab7_widget.py` | 양자 에너지 준위 + `hermite()`, `psi_n()` |
| 13 | `lab8_widget.py` | Kepler 궤도 + `kepler_orbit()` |
| 14 | `main_app.py` | Lab 5~8 탭 추가 |

---

## 기술 스택

- **언어**: Python 3.12
- **딥러닝**: TensorFlow / Keras (Sequential, Dense, Adam, Callbacks)
- **GUI**: PySide6 (QMainWindow, QTabWidget, QThread, Signal/Slot, FigureCanvasQTAgg)
- **시각화**: Matplotlib (FigureCanvasQTAgg, Figure)
- **수치 계산**: NumPy
- **수치 적분**: RK4 (직접 구현, lab2/4/5)
- **통계 역학**: Metropolis 알고리즘 (직접 구현, lab6)
- **양자역학**: Hermite 다항식 (재귀 구현, lab7)

---

## 실행 방법

```bash
pip install PySide6 tensorflow numpy matplotlib
cd "2. superpowers + PySide6 앱"
python main_app.py
```

---

## 검증 체크리스트

### 기본 동작
- [x] 앱 실행 시 8개 탭 정상 표시 (Lab 1~8)
- [x] 각 Lab "학습 시작" 클릭 → 진행바 동작 (UI 블로킹 없음)
- [x] 학습 완료 후 Matplotlib 그래프 표시
- [x] "그래프 PNG 저장" → `outputs/` 폴더에 파일 생성
- [x] 한글 폰트 깨짐 없음 (Malgun Gothic)
- [x] 마이너스 기호 경고 없음 (axes.unicode_minus=False)
- [x] TensorFlow 미설치 시 오류 메시지 표시 (앱 크래시 없음)

### 심화 기능
- [x] Lab 1: 7가지 함수 선택 후 학습 정상 동작
- [x] Lab 2: 공기저항 체크박스 on/off 시 RK4 궤적 차이 확인
- [x] Lab 3: L1/L2/L1+L2 정규화 선택 시 Good Fit 모델에 적용
- [x] Lab 4: γ > 0 시 감쇠 진자 시뮬레이션, γ = 0 시 이상 진자

### 프로젝트 과제
- [x] Lab 5: f vs k 곡선, RK4 진동 그래프 표시
- [x] Lab 6: 온도-자화율 곡선 + 격자 스냅샷 3개 표시
- [x] Lab 7: 에너지 준위 다이어그램 + 파동함수 n=0~4 표시
- [x] Lab 8: 원형/타원/긴타원 궤도 실제 vs 예측 비교 표시
