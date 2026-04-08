# 설계 스펙 (Superpowers brainstorming 스킬 결과)

> 이 문서는 Superpowers `brainstorming` 스킬을 통해 도출된 설계입니다.
> 전체 스펙 원본: `docs/superpowers/specs/2026-04-08-week4-hw-design.md`

---

## 문제 정의

TensorFlow/Keras 신경망으로 물리 현상을 학습하고 예측하는 PySide6 GUI 애플리케이션 제작.

**과제 요건**: PRD + TRD + Superpowers 활용 + PySide6

---

## 아키텍처 결정

```
main_app.py
├── QTabWidget (Lab 1~4 탭 전환)
├── Lab1Widget  ─ TrainThread (QThread) ─ TensorFlow 학습
├── Lab2Widget  ─ TrainThread (QThread) ─ TensorFlow 학습
├── Lab3Widget  ─ TrainThread (QThread) ─ TensorFlow 학습
└── Lab4Widget  ─ TrainThread (QThread) ─ TensorFlow 학습 + RK4
```

- **UI**: PySide6 QMainWindow + QTabWidget, Fusion 스타일
- **학습**: QThread로 백그라운드 실행 → UI 블로킹 없음
- **시각화**: Matplotlib FigureCanvasQTAgg 임베드
- **저장**: outputs/ 폴더에 PNG 자동 저장 (150 DPI)
- **폰트**: Malgun Gothic (Windows 한글 지원)

---

## Lab별 설계 선택

| Lab | 핵심 설계 결정 | 근거 |
|-----|--------------|------|
| Lab 1 | 활성화 함수: tanh | sin/cos 계열 근사에 relu보다 적합 |
| Lab 2 | 입력 정규화 필수 | v₀(10~50) / θ(라디안) / t(초) 스케일 차이 큼 |
| Lab 3 | 3모델 동일 조건 비교 | 공정한 대조 실험 (같은 데이터, 같은 Epochs) |
| Lab 4 | 타원적분 보정 추가 | 각도 >30°에서 단순 공식 오차 증가 |

---

## 컴포넌트 경계

| 파일 | 역할 | 의존성 |
|------|------|--------|
| `main_app.py` | 앱 진입점, 탭 조합, 전역 스타일 | PySide6, lab*_widget |
| `lab*_widget.py` | UI + TrainThread 연결 | PySide6, Matplotlib |
| `TrainThread` (각 widget 내) | TF 학습 로직 | TensorFlow, NumPy |
| `rk4_pendulum()` (lab4) | RK4 수치 적분 | NumPy |

각 Lab 위젯은 독립적으로 동작하며 서로 상태를 공유하지 않는다.

---

## 오류 처리 전략

- TensorFlow 미설치 → `ImportError` 캐치 후 UI 메시지 표시
- 학습 중 예외 → `error_occurred` Signal → 로그 출력
- 학습 완료 전 저장 버튼 비활성화
