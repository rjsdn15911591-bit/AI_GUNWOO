# Design Spec: Week 4 심화 과제 — Lab 1~4 기능 확장

**Date:** 2026-04-08
**Skill used:** superpowers:brainstorming
**Status:** Approved

---

## 1. 목적

기존 Lab 1~4에 심화 기능을 추가한다. 각 Lab은 독립적으로 수정되며 기존 동작을 깨지 않는다.

---

## 2. 변경 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `lab1_widget.py` | funcs 딕셔너리 + 콤보박스에 3개 함수 추가 |
| `lab2_widget.py` | 공기 저항 체크박스 + 데이터 생성 분기 + 비교 그래프 |
| `lab3_widget.py` | regularization 콤보박스 + Good Fit 모델에 적용 |
| `lab4_widget.py` | 감쇠 계수 스핀박스 + rk4_pendulum 감쇠 항 추가 + 비교 그래프 |

---

## 3. Lab 1 — 함수 추가

### 추가할 함수
| 이름 | 람다 |
|------|------|
| `tanh(x)` | `np.tanh(x)` |
| `x³` | `x**3 / 20` (스케일 조정) |
| `x²·sin(x)` | `x**2 * np.sin(x) / 10` |

- `funcs` 딕셔너리에 위 3개 추가
- `func_combo.addItems()`에 동일하게 추가
- 기존 4개 함수 동작 변경 없음

---

## 4. Lab 2 — 공기 저항 모델

### UI 변경
- `QCheckBox("공기 저항 포함")` 추가
- `QDoubleSpinBox` 항력 계수 k (기본값 0.1, 범위 0.01~1.0)
- 체크박스 상태에 따라 k 스핀박스 활성/비활성

### 물리 모델
```
공기 저항 없음 (기존):
  x(t) = v0·cos(θ)·t
  y(t) = v0·sin(θ)·t - 0.5·g·t²

공기 저항 있음 (RK4 수치 적분):
  dvx/dt = -k·vx
  dvy/dt = -g - k·vy
  dx/dt  = vx
  dy/dt  = vy
```

### 데이터 생성 분기
- `use_drag=True` 이면 RK4로 궤적 계산하여 학습 데이터 생성
- `use_drag=False` 이면 기존 해석 공식 사용

### 그래프
- 기존: 궤적 비교 + 학습 곡선 (2개)
- 변경: 실제 궤적 / NN 예측 / 공기저항 궤적 3가지 비교 (공기 저항 켤 때)

---

## 5. Lab 3 — L1/L2 Regularization

### UI 변경
- `QComboBox` regularization 종류 선택: `없음 / L1 / L2 / L1+L2`
- `QDoubleSpinBox` regularization 강도 λ (기본값 0.001, 범위 0.0001~0.1)

### 모델 변경
- Good Fit 모델의 Dense 레이어에 `kernel_regularizer` 적용
  - `없음`: regularizer 없음 (기존)
  - `L1`: `keras.regularizers.l1(λ)`
  - `L2`: `keras.regularizers.l2(λ)`
  - `L1+L2`: `keras.regularizers.l1_l2(l1=λ, l2=λ)`
- Underfit / Overfit 모델은 변경 없음 (대조군 유지)

### 그래프
- 기존 레이아웃 유지 (2×3 그리드)
- Good Fit 서브플롯 제목에 regularizer 종류 표시

---

## 6. Lab 4 — 감쇠 진자

### UI 변경
- `QDoubleSpinBox` 감쇠 계수 γ (기본값 0.0, 범위 0.0~2.0, step 0.1)
- γ=0 이면 기존 비감쇠 동작 유지

### 물리 모델 변경
```python
# 기존
def deriv(state):
    theta, omega = state
    return [omega, -(g/L)*sin(theta)]

# 변경 (감쇠 항 추가)
def deriv(state):
    theta, omega = state
    return [omega, -(g/L)*sin(theta) - gamma*omega]
```

### 그래프 변경
- 좌하단 시뮬레이션 그래프: γ=0 (비감쇠) vs 입력된 γ (감쇠) 두 곡선 동시 표시
- γ=0 이면 기존과 동일하게 단일 곡선만 표시

---

## 7. 설계 승인

> 이 설계는 Superpowers `brainstorming` 스킬을 통해 도출되었으며,
> 사용자 승인 후 `writing-plans` 스킬로 구현 계획을 작성했다.
