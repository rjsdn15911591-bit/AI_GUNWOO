import sys
import os
from PySide6.QtWidgets import QApplication, QMainWindow, QTabWidget
from PySide6.QtCore import Qt
from PySide6.QtGui import QFont

from lab1_widget import Lab1Widget
from lab2_widget import Lab2Widget
from lab3_widget import Lab3Widget
from lab4_widget import Lab4Widget
from lab5_widget import Lab5Widget

os.makedirs("outputs", exist_ok=True)

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Week 5 — 딥러닝 핵심 개념 실습")
        self.setMinimumSize(900, 700)

        # 초록 테마
        self.setStyleSheet("""
            QMainWindow { background-color: #f0f7f0; }
            QTabWidget::pane { border: 1px solid #4caf50; }
            QTabBar::tab {
                background: #c8e6c9; color: #1a6b3a;
                padding: 8px 16px; font-weight: bold;
            }
            QTabBar::tab:selected { background: #1a6b3a; color: white; }
            QPushButton {
                background-color: #1a6b3a; color: white;
                border-radius: 4px; padding: 6px 14px; font-weight: bold;
            }
            QPushButton:hover { background-color: #2e7d32; }
            QPushButton:disabled { background-color: #a5d6a7; }
            QLabel { color: #1a6b3a; }
        """)

        tabs = QTabWidget()
        tabs.addTab(Lab1Widget(), "Lab 1: Regularization")
        tabs.addTab(Lab2Widget(), "Lab 2: Overfitting")
        tabs.addTab(Lab3Widget(), "Lab 3: Augmentation")
        tabs.addTab(Lab4Widget(), "Lab 4: Transfer Learning")
        tabs.addTab(Lab5Widget(), "Lab 5: CNN")
        self.setCentralWidget(tabs)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    font = QFont("Malgun Gothic", 10)
    app.setFont(font)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
