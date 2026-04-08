# 구현 계획 (Superpowers writing-plans 스킬 결과)

> 이 문서는 Superpowers `writing-plans` 스킬을 통해 작성된 구현 계획입니다.
> 전체 계획 원본: `docs/superpowers/plans/2026-04-08-week4-hw-restructure.md`

---

## 구현 순서

| 순서 | 파일 | 내용 |
|------|------|------|
| 1 | `main_app.py` | QMainWindow, QTabWidget, 스타일시트, 한글 폰트 설정 |
| 2 | `lab1_widget.py` | 1D 함수 근사 UI + TrainThread (tanh 네트워크, 크기 비교) |
| 3 | `lab2_widget.py` | 포물선 운동 UI + TrainThread (정규화 + relu, 2D 출력) |
| 4 | `lab3_widget.py` | 과적합 비교 UI + TrainThread (3모델 순차 학습) |
| 5 | `lab4_widget.py` | 진자 주기 UI + TrainThread + rk4_pendulum() |

---

## 기술 스택

- **언어**: Python 3.12
- **딥러닝**: TensorFlow / Keras
- **GUI**: PySide6 (QThread, Signal/Slot, FigureCanvasQTAgg)
- **시각화**: Matplotlib
- **수치 계산**: NumPy

---

## 실행 방법

```bash
pip install PySide6 tensorflow numpy matplotlib
cd "2. superpowers + PySide6 앱"
python main_app.py
```

---

## 검증 체크리스트

- [ ] 앱 실행 시 4개 탭 정상 표시
- [ ] 각 Lab "학습 시작" 클릭 → 진행바 동작 (UI 블로킹 없음)
- [ ] 학습 완료 후 Matplotlib 그래프 표시
- [ ] "그래프 PNG 저장" → `outputs/` 폴더에 파일 생성
- [ ] 한글 폰트 깨짐 없음 (Malgun Gothic)
- [ ] TensorFlow 미설치 시 오류 메시지 표시 (앱 크래시 없음)
