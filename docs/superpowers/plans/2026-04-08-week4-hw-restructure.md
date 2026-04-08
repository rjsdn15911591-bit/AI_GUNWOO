# Week 4 HW Superpowers Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** hw.week 4 제출물을 Superpowers 워크플로우(설계→계획→구현)가 명확히 드러나도록 재구성한다.

**Architecture:** 기존 코드는 그대로 유지하고, `2. PySide6 GUI/` 폴더를 `2. superpowers + PySide6 앱/`으로 이름을 변경한다. 폴더 내부에 `docs/` 서브폴더를 추가해 설계 스펙과 구현 계획 문서를 포함시킨다. MANUAL_Week4.md에 Superpowers 활용 과정을 명시한다.

**Tech Stack:** PySide6, TensorFlow/Keras, Matplotlib, NumPy, Python 3.12, Git

---

## File Map

| 작업 | 경로 |
|------|------|
| Rename | `hw/hw.week 4/2. PySide6 GUI/` → `hw/hw.week 4/2. superpowers + PySide6 앱/` |
| Create | `hw/hw.week 4/2. superpowers + PySide6 앱/docs/01_design-spec.md` |
| Create | `hw/hw.week 4/2. superpowers + PySide6 앱/docs/02_implementation-plan.md` |
| Modify | `hw/hw.week 4/2. superpowers + PySide6 앱/MANUAL_Week4.md` |

---

## Task 1: 폴더명 변경 (git mv)

**Files:**
- Rename: `hw/hw.week 4/2. PySide6 GUI/` → `hw/hw.week 4/2. superpowers + PySide6 앱/`

- [ ] **Step 1: git mv로 폴더 내 파일 이동**

```bash
cd "C:/Desktop/문서/AI_GUNWOO"
git mv "hw/hw.week 4/2. PySide6 GUI/main_app.py" "hw/hw.week 4/2. superpowers + PySide6 앱/main_app.py"
git mv "hw/hw.week 4/2. PySide6 GUI/lab1_widget.py" "hw/hw.week 4/2. superpowers + PySide6 앱/lab1_widget.py"
git mv "hw/hw.week 4/2. PySide6 GUI/lab2_widget.py" "hw/hw.week 4/2. superpowers + PySide6 앱/lab2_widget.py"
git mv "hw/hw.week 4/2. PySide6 GUI/lab3_widget.py" "hw/hw.week 4/2. superpowers + PySide6 앱/lab3_widget.py"
git mv "hw/hw.week 4/2. PySide6 GUI/lab4_widget.py" "hw/hw.week 4/2. superpowers + PySide6 앱/lab4_widget.py"
git mv "hw/hw.week 4/2. PySide6 GUI/MANUAL_Week4.md" "hw/hw.week 4/2. superpowers + PySide6 앱/MANUAL_Week4.md"
```

- [ ] **Step 2: 이동 확인**

```bash
ls "C:/Desktop/문서/AI_GUNWOO/hw/hw.week 4/2. superpowers + PySide6 앱/"
```

Expected: `main_app.py lab1_widget.py lab2_widget.py lab3_widget.py lab4_widget.py MANUAL_Week4.md`

- [ ] **Step 3: Commit**

```bash
git commit -m "rename: 2. PySide6 GUI -> 2. superpowers + PySide6 앱"
```

---

## Task 2: docs/ 서브폴더 및 설계 스펙 추가

**Files:**
- Create: `hw/hw.week 4/2. superpowers + PySide6 앱/docs/01_design-spec.md`

- [ ] **Step 1: docs 폴더 생성 및 설계 스펙 작성**

`docs/01_design-spec.md` 내용:

```markdown
# 설계 스펙 (Superpowers brainstorming 스킬 결과)

> 이 문서는 Superpowers `brainstorming` 스킬을 통해 도출된 설계입니다.
> 전체 스펙: `docs/superpowers/specs/2026-04-08-week4-hw-design.md`

## 문제 정의
TensorFlow/Keras로 물리 현상을 학습하는 PySide6 GUI 앱 제작
과제 요건: PRD + TRD + Superpowers 활용 + PySide6

## 아키텍처 결정
- QTabWidget으로 Lab 1~4 독립 탭 구성
- 각 Lab마다 QThread로 학습 → UI 블로킹 없음
- FigureCanvasQTAgg로 Matplotlib 그래프 임베드
- outputs/ 폴더에 PNG 자동 저장

## Lab별 설계 선택
| Lab | 핵심 설계 결정 |
|-----|--------------|
| Lab 1 | tanh 활성화 — sin/cos 근사에 relu보다 적합 |
| Lab 2 | 정규화 필수 — v₀/θ/t 스케일 차이 큼 |
| Lab 3 | 동일 조건 3모델 동시 비교 — 공정한 대조 실험 |
| Lab 4 | 타원적분 보정 추가 — 큰 각도(>30°)에서 오차 감소 |
```

- [ ] **Step 2: Commit**

```bash
git add "hw/hw.week 4/2. superpowers + PySide6 앱/docs/"
git commit -m "docs: add design spec inside superpowers app folder"
```

---

## Task 3: 구현 계획 문서 추가

**Files:**
- Create: `hw/hw.week 4/2. superpowers + PySide6 앱/docs/02_implementation-plan.md`

- [ ] **Step 1: 구현 계획 작성**

`docs/02_implementation-plan.md` 내용:

```markdown
# 구현 계획 (Superpowers writing-plans 스킬 결과)

> 이 문서는 Superpowers `writing-plans` 스킬을 통해 작성된 구현 계획입니다.
> 전체 계획: `docs/superpowers/plans/2026-04-08-week4-hw-restructure.md`

## 구현 순서

1. **main_app.py** — QMainWindow, QTabWidget, 스타일시트, 한글 폰트
2. **lab1_widget.py** — 1D 함수 근사 UI + TrainThread (tanh 네트워크)
3. **lab2_widget.py** — 포물선 운동 UI + TrainThread (정규화 + relu)
4. **lab3_widget.py** — 과적합 비교 UI + TrainThread (3모델 순차 학습)
5. **lab4_widget.py** — 진자 주기 UI + TrainThread + rk4_pendulum()

## 기술 스택
- Python 3.12, TensorFlow/Keras, PySide6, Matplotlib, NumPy

## 실행 방법
```bash
pip install PySide6 tensorflow numpy matplotlib
python main_app.py
```

## 검증 방법
- 각 Lab 탭에서 "학습 시작" 클릭 → 진행바 동작 확인
- 학습 완료 후 그래프 표시 확인
- "그래프 PNG 저장" 클릭 → outputs/ 폴더에 파일 생성 확인
```

- [ ] **Step 2: Commit**

```bash
git add "hw/hw.week 4/2. superpowers + PySide6 앱/docs/"
git commit -m "docs: add implementation plan inside superpowers app folder"
```

---

## Task 4: MANUAL_Week4.md에 Superpowers 활용 내역 추가

**Files:**
- Modify: `hw/hw.week 4/2. superpowers + PySide6 앱/MANUAL_Week4.md`

- [ ] **Step 1: Superpowers 워크플로우 섹션 추가**

MANUAL_Week4.md 최상단에 다음 섹션 추가:

```markdown
## Superpowers 활용 워크플로우

이 앱은 Claude Code Superpowers 스킬을 활용해 설계 → 계획 → 구현 순서로 개발됐습니다.

| 단계 | 사용 스킬 | 결과물 |
|------|----------|--------|
| 1. 설계 | `superpowers:brainstorming` | `docs/01_design-spec.md` |
| 2. 계획 | `superpowers:writing-plans` | `docs/02_implementation-plan.md` |
| 3. 구현 | `superpowers:executing-plans` | `main_app.py`, `lab*_widget.py` |
| 4. 검증 | `superpowers:verification-before-completion` | `1-1. output/*.png` |
```

- [ ] **Step 2: Commit**

```bash
git add "hw/hw.week 4/2. superpowers + PySide6 앱/MANUAL_Week4.md"
git commit -m "docs: add superpowers workflow section to MANUAL"
```

---

## Task 5: GitHub Push

- [ ] **Step 1: 전체 push**

```bash
cd "C:/Desktop/문서/AI_GUNWOO"
git push origin main
```

Expected:
```
To https://github.com/rjsdn15911591-bit/AI_GUNWOO.git
   xxxxxxx..xxxxxxx  main -> main
```

- [ ] **Step 2: GitHub에서 최종 구조 확인**

`hw/hw.week 4/` 폴더가 다음과 같이 보여야 함:
```
hw.week 4/
├── 1-1. output/
├── 1-2. report.md
├── 2. superpowers + PySide6 앱/
│   ├── docs/
│   │   ├── 01_design-spec.md
│   │   └── 02_implementation-plan.md
│   ├── main_app.py
│   ├── lab1~4_widget.py
│   └── MANUAL_Week4.md
├── 3. PRD,TRD/
└── 4. mit/
```
