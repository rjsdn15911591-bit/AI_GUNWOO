"""
Week 4: Neural Network으로 물리 데이터 학습하기
PySide6 통합 GUI 애플리케이션

실행 방법:
    pip install PySide6 tensorflow numpy matplotlib
    python main_app.py
"""

import sys
import os
import platform

# outputs 디렉토리 자동 생성
os.makedirs("outputs", exist_ok=True)

# 한글 폰트 설정
import matplotlib
import matplotlib.pyplot as plt

if platform.system() == 'Windows':
    matplotlib.rc('font', family='Malgun Gothic')
elif platform.system() == 'Darwin':  # macOS
    matplotlib.rc('font', family='AppleGothic')
else:  # Linux
    matplotlib.rc('font', family='NanumGothic')
matplotlib.rcParams['axes.unicode_minus'] = False  # 마이너스 기호 깨짐 방지

from PySide6.QtWidgets import (
    QApplication, QMainWindow, QTabWidget, QWidget, QVBoxLayout,
    QHBoxLayout, QPushButton, QLabel, QProgressBar, QStatusBar,
    QComboBox, QSpinBox, QDoubleSpinBox, QGroupBox, QMessageBox,
    QScrollArea, QSplitter, QTextEdit
)
from PySide6.QtCore import Qt, QThread, Signal
from PySide6.QtGui import QFont

from lab1_widget import Lab1Widget
from lab2_widget import Lab2Widget
from lab3_widget import Lab3Widget
from lab4_widget import Lab4Widget
from lab5_widget import Lab5Widget
from lab6_widget import Lab6Widget
from lab7_widget import Lab7Widget
from lab8_widget import Lab8Widget


class MainWindow(QMainWindow):
    """메인 윈도우 - 탭으로 Lab 1~4 전환"""

    def __init__(self):
        super().__init__()
        self.setWindowTitle("Week 4: Neural Network으로 물리 데이터 학습하기")
        self.setMinimumSize(1200, 800)

        # 중앙 위젯
        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)

        # 상단 타이틀
        title = QLabel("Week 4: 물리 데이터로 학습하기")
        title.setFont(QFont("Arial", 18, QFont.Bold))
        title.setAlignment(Qt.AlignCenter)
        title.setStyleSheet("color: #2B579A; padding: 10px;")
        layout.addWidget(title)

        subtitle = QLabel("TensorFlow/Keras Neural Network을 사용한 물리 데이터 학습 및 예측")
        subtitle.setAlignment(Qt.AlignCenter)
        subtitle.setStyleSheet("color: #666; padding-bottom: 10px;")
        layout.addWidget(subtitle)

        # 탭 위젯
        self.tabs = QTabWidget()
        self.tabs.setFont(QFont("Arial", 11))

        self.lab1 = Lab1Widget()
        self.lab2 = Lab2Widget()
        self.lab3 = Lab3Widget()
        self.lab4 = Lab4Widget()
        self.lab5 = Lab5Widget()
        self.lab6 = Lab6Widget()
        self.lab7 = Lab7Widget()
        self.lab8 = Lab8Widget()

        self.tabs.addTab(self.lab1, "Lab 1: 1D 함수 근사")
        self.tabs.addTab(self.lab2, "Lab 2: 포물선 운동")
        self.tabs.addTab(self.lab3, "Lab 3: 과적합/과소적합")
        self.tabs.addTab(self.lab4, "Lab 4: 진자 주기")
        self.tabs.addTab(self.lab5, "Lab 5: 스프링-질량")
        self.tabs.addTab(self.lab6, "Lab 6: Ising Model")
        self.tabs.addTab(self.lab7, "Lab 7: 양자 진동자")
        self.tabs.addTab(self.lab8, "Lab 8: Kepler 궤도")

        layout.addWidget(self.tabs)

        # 상태바
        self.statusBar().showMessage("준비 완료. 탭을 선택하고 '학습 시작' 버튼을 클릭하세요.")


def main():
    app = QApplication(sys.argv)
    app.setStyle("Fusion")

    # 전체 스타일시트
    app.setStyleSheet("""
        QMainWindow { background-color: #f5f5f5; }
        QTabWidget::pane { border: 1px solid #ccc; background: white; }
        QTabBar::tab {
            padding: 8px 20px;
            margin-right: 2px;
            background: #e0e0e0;
            border: 1px solid #ccc;
            border-bottom: none;
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
        }
        QTabBar::tab:selected {
            background: white;
            font-weight: bold;
            color: #2B579A;
        }
        QPushButton {
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 13px;
        }
        QPushButton#runBtn {
            background-color: #2B579A;
            color: white;
            font-weight: bold;
            font-size: 14px;
            padding: 10px 24px;
        }
        QPushButton#runBtn:hover { background-color: #1e3f6f; }
        QPushButton#runBtn:disabled { background-color: #aaa; }
        QPushButton#saveBtn {
            background-color: #4CAF50;
            color: white;
        }
        QPushButton#saveBtn:hover { background-color: #388E3C; }
        QGroupBox {
            font-weight: bold;
            border: 1px solid #ddd;
            border-radius: 6px;
            margin-top: 10px;
            padding-top: 15px;
        }
        QGroupBox::title {
            subcontrol-origin: margin;
            left: 10px;
            padding: 0 5px;
        }
        QProgressBar {
            border: 1px solid #ccc;
            border-radius: 4px;
            text-align: center;
            height: 22px;
        }
        QProgressBar::chunk {
            background-color: #2B579A;
            border-radius: 3px;
        }
    """)

    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
