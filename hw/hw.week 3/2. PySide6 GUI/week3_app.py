"""
Week 3: 신경망 기초 (Neural Networks Fundamentals) - PySide6 GUI
=================================================================
5개 Lab을 탭 형태로 구성한 인터랙티브 학습 애플리케이션
- Lab 1: Perceptron (AND/OR/XOR 게이트)
- Lab 2: Activation Functions (Sigmoid, Tanh, ReLU, Leaky ReLU)
- Lab 3: Forward Propagation 시각화
- Lab 4: MLP로 XOR 문제 해결
- Lab 5: Universal Approximation Theorem 시연

Author: 이건우 (202512131)
Course: AI와 머신러닝 2-1학기
"""

import sys
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure

from PySide6.QtWidgets import (
    QApplication, QMainWindow, QTabWidget, QWidget, QVBoxLayout,
    QHBoxLayout, QLabel, QPushButton, QSpinBox, QDoubleSpinBox,
    QComboBox, QTextEdit, QGroupBox, QGridLayout, QSplitter,
    QSlider, QCheckBox, QFrame, QSizePolicy
)
from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QFont, QColor

# ──────────────────────────────────────────────
# 공통 유틸리티
# ──────────────────────────────────────────────
def make_canvas(fig):
    """matplotlib Figure를 PySide6 위젯으로 변환"""
    canvas = FigureCanvas(fig)
    canvas.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
    return canvas


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Lab 1: Perceptron
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class Perceptron:
    """단일 퍼셉트론 모델"""
    def __init__(self, input_size, learning_rate=0.1):
        self.weights = np.random.randn(input_size)
        self.bias = np.random.randn()
        self.lr = learning_rate

    def activation(self, x):
        return 1 if x >= 0 else 0

    def predict(self, inputs):
        return self.activation(np.dot(inputs, self.weights) + self.bias)

    def train(self, X, y, epochs):
        for _ in range(epochs):
            for inputs, label in zip(X, y):
                error = label - self.predict(inputs)
                self.weights += self.lr * error * inputs
                self.bias += self.lr * error


class Lab1Tab(QWidget):
    """Lab 1: Perceptron - AND/OR/XOR 게이트"""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)

        # 상단 설명
        desc = QLabel(
            "Lab 1: Perceptron\n"
            "단일 퍼셉트론으로 논리 게이트(AND, OR, XOR)를 학습합니다.\n"
            "XOR은 단일 퍼셉트론으로 해결 불가능 → Multi-Layer 필요!"
        )
        desc.setFont(QFont("Arial", 11))
        desc.setWordWrap(True)
        layout.addWidget(desc)

        # 컨트롤
        ctrl = QHBoxLayout()
        ctrl.addWidget(QLabel("학습률:"))
        self.lr_spin = QDoubleSpinBox()
        self.lr_spin.setRange(0.01, 1.0)
        self.lr_spin.setValue(0.1)
        self.lr_spin.setSingleStep(0.05)
        ctrl.addWidget(self.lr_spin)

        ctrl.addWidget(QLabel("Epochs:"))
        self.epoch_spin = QSpinBox()
        self.epoch_spin.setRange(10, 5000)
        self.epoch_spin.setValue(100)
        self.epoch_spin.setSingleStep(50)
        ctrl.addWidget(self.epoch_spin)

        self.run_btn = QPushButton("학습 실행")
        self.run_btn.clicked.connect(self.run_training)
        self.run_btn.setStyleSheet("QPushButton { background-color: #4CAF50; color: white; padding: 6px 16px; font-weight: bold; }")
        ctrl.addWidget(self.run_btn)
        ctrl.addStretch()
        layout.addLayout(ctrl)

        # 결과 영역
        splitter = QSplitter(Qt.Horizontal)

        # 그래프
        self.fig = Figure(figsize=(12, 4))
        self.canvas = make_canvas(self.fig)
        splitter.addWidget(self.canvas)

        # 로그
        self.log = QTextEdit()
        self.log.setReadOnly(True)
        self.log.setMaximumWidth(320)
        self.log.setFont(QFont("Consolas", 10))
        splitter.addWidget(self.log)

        layout.addWidget(splitter)
        self.run_training()

    def run_training(self):
        lr = self.lr_spin.value()
        epochs = self.epoch_spin.value()
        X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
        gates = {
            "AND": np.array([0, 0, 0, 1]),
            "OR":  np.array([0, 1, 1, 1]),
            "XOR": np.array([0, 1, 1, 0]),
        }

        self.fig.clear()
        self.log.clear()
        self.log.append(f"=== Perceptron 학습 (lr={lr}, epochs={epochs}) ===\n")

        for idx, (name, y) in enumerate(gates.items()):
            ax = self.fig.add_subplot(1, 3, idx + 1)
            p = Perceptron(2, lr)
            p.train(X, y, epochs)

            # 결정 경계 시각화
            xx, yy = np.meshgrid(np.linspace(-0.5, 1.5, 100), np.linspace(-0.5, 1.5, 100))
            Z = np.array([p.predict(np.array([xi, yi])) for xi, yi in zip(xx.ravel(), yy.ravel())])
            Z = Z.reshape(xx.shape)
            ax.contourf(xx, yy, Z, alpha=0.3, levels=[-0.5, 0.5, 1.5], colors=["#4A90D9", "#E74C3C"])

            for point, label in zip(X, y):
                color = "#E74C3C" if label == 1 else "#4A90D9"
                marker = "o" if label == 1 else "x"
                ax.scatter(point[0], point[1], c=color, marker=marker, s=200, edgecolors="black", linewidth=2, zorder=5)

            ax.set_title(f"{name} Gate", fontsize=13, fontweight="bold")
            ax.set_xlabel("x1")
            ax.set_ylabel("x2")
            ax.set_xlim(-0.5, 1.5)
            ax.set_ylim(-0.5, 1.5)
            ax.grid(True, alpha=0.3)

            # 로그
            self.log.append(f"[{name} Gate]")
            errors = 0
            for inp, lbl in zip(X, y):
                pred = p.predict(inp)
                if pred != lbl:
                    errors += 1
                self.log.append(f"  {inp} → 예측: {pred}, 정답: {lbl}")
            self.log.append(f"  오류: {errors}/4\n")

        self.fig.tight_layout()
        self.canvas.draw()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Lab 2: Activation Functions
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class Lab2Tab(QWidget):
    """Lab 2: 활성화 함수 비교"""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)

        desc = QLabel(
            "Lab 2: Activation Functions\n"
            "Sigmoid, Tanh, ReLU, Leaky ReLU의 함수 모양과 미분(Gradient)을 비교합니다.\n"
            "활성화 함수가 없으면 여러 층을 쌓아도 선형 → 비선형 문제 해결 불가!"
        )
        desc.setFont(QFont("Arial", 11))
        desc.setWordWrap(True)
        layout.addWidget(desc)

        # 컨트롤
        ctrl = QHBoxLayout()
        ctrl.addWidget(QLabel("표시할 함수:"))
        self.cb_sigmoid = QCheckBox("Sigmoid")
        self.cb_sigmoid.setChecked(True)
        self.cb_sigmoid.stateChanged.connect(self.update_plot)
        ctrl.addWidget(self.cb_sigmoid)

        self.cb_tanh = QCheckBox("Tanh")
        self.cb_tanh.setChecked(True)
        self.cb_tanh.stateChanged.connect(self.update_plot)
        ctrl.addWidget(self.cb_tanh)

        self.cb_relu = QCheckBox("ReLU")
        self.cb_relu.setChecked(True)
        self.cb_relu.stateChanged.connect(self.update_plot)
        ctrl.addWidget(self.cb_relu)

        self.cb_leaky = QCheckBox("Leaky ReLU")
        self.cb_leaky.setChecked(True)
        self.cb_leaky.stateChanged.connect(self.update_plot)
        ctrl.addWidget(self.cb_leaky)

        ctrl.addWidget(QLabel("Leaky α:"))
        self.alpha_spin = QDoubleSpinBox()
        self.alpha_spin.setRange(0.001, 0.5)
        self.alpha_spin.setValue(0.01)
        self.alpha_spin.setSingleStep(0.01)
        self.alpha_spin.valueChanged.connect(self.update_plot)
        ctrl.addWidget(self.alpha_spin)
        ctrl.addStretch()
        layout.addLayout(ctrl)

        # 그래프
        self.fig = Figure(figsize=(14, 8))
        self.canvas = make_canvas(self.fig)
        layout.addWidget(self.canvas)
        self.update_plot()

    def update_plot(self):
        x = np.linspace(-5, 5, 300)
        alpha = self.alpha_spin.value()

        sigmoid = lambda t: 1 / (1 + np.exp(-t))
        sigmoid_d = lambda t: sigmoid(t) * (1 - sigmoid(t))
        tanh_f = np.tanh
        tanh_d = lambda t: 1 - np.tanh(t) ** 2
        relu_f = lambda t: np.maximum(0, t)
        relu_d = lambda t: np.where(t > 0, 1.0, 0.0)
        leaky_f = lambda t: np.where(t > 0, t, alpha * t)
        leaky_d = lambda t: np.where(t > 0, 1.0, alpha)

        funcs = []
        if self.cb_sigmoid.isChecked():
            funcs.append(("Sigmoid", sigmoid, sigmoid_d, "#2196F3"))
        if self.cb_tanh.isChecked():
            funcs.append(("Tanh", tanh_f, tanh_d, "#FF9800"))
        if self.cb_relu.isChecked():
            funcs.append(("ReLU", relu_f, relu_d, "#4CAF50"))
        if self.cb_leaky.isChecked():
            funcs.append((f"Leaky ReLU (α={alpha})", leaky_f, leaky_d, "#E91E63"))

        self.fig.clear()

        # 함수 그래프
        ax1 = self.fig.add_subplot(1, 2, 1)
        for name, f, _, color in funcs:
            ax1.plot(x, f(x), label=name, linewidth=2.5, color=color)
        ax1.axhline(0, color="k", alpha=0.3)
        ax1.axvline(0, color="k", alpha=0.3)
        ax1.set_title("Activation Functions", fontsize=14, fontweight="bold")
        ax1.set_xlabel("Input (x)")
        ax1.set_ylabel("Output f(x)")
        ax1.legend(fontsize=10)
        ax1.grid(True, alpha=0.3)

        # 미분 그래프
        ax2 = self.fig.add_subplot(1, 2, 2)
        for name, _, d, color in funcs:
            ax2.plot(x, d(x), label=f"{name}'", linewidth=2.5, color=color)
        ax2.axhline(0, color="k", alpha=0.3)
        ax2.axvline(0, color="k", alpha=0.3)
        ax2.set_title("Derivatives (Gradients)", fontsize=14, fontweight="bold")
        ax2.set_xlabel("Input (x)")
        ax2.set_ylabel("f'(x)")
        ax2.legend(fontsize=10)
        ax2.grid(True, alpha=0.3)

        self.fig.tight_layout()
        self.canvas.draw()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Lab 3: Forward Propagation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class Lab3Tab(QWidget):
    """Lab 3: Forward Propagation 시각화"""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)

        desc = QLabel(
            "Lab 3: Forward Propagation\n"
            "입력에서 출력까지 데이터가 앞으로(forward) 흐르는 과정을 시각화합니다.\n"
            "2-3-1 네트워크: 입력 2개 → 은닉층 3개(ReLU) → 출력 1개(Sigmoid)"
        )
        desc.setFont(QFont("Arial", 11))
        desc.setWordWrap(True)
        layout.addWidget(desc)

        # 입력 컨트롤
        ctrl = QHBoxLayout()
        ctrl.addWidget(QLabel("x1:"))
        self.x1_spin = QDoubleSpinBox()
        self.x1_spin.setRange(-2.0, 2.0)
        self.x1_spin.setValue(0.5)
        self.x1_spin.setSingleStep(0.1)
        ctrl.addWidget(self.x1_spin)

        ctrl.addWidget(QLabel("x2:"))
        self.x2_spin = QDoubleSpinBox()
        self.x2_spin.setRange(-2.0, 2.0)
        self.x2_spin.setValue(0.8)
        self.x2_spin.setSingleStep(0.1)
        ctrl.addWidget(self.x2_spin)

        self.run_btn = QPushButton("Forward Pass 실행")
        self.run_btn.clicked.connect(self.run_forward)
        self.run_btn.setStyleSheet("QPushButton { background-color: #2196F3; color: white; padding: 6px 16px; font-weight: bold; }")
        ctrl.addWidget(self.run_btn)
        ctrl.addStretch()
        layout.addLayout(ctrl)

        # 결과 영역
        splitter = QSplitter(Qt.Horizontal)

        self.fig = Figure(figsize=(10, 6))
        self.canvas = make_canvas(self.fig)
        splitter.addWidget(self.canvas)

        self.log = QTextEdit()
        self.log.setReadOnly(True)
        self.log.setMaximumWidth(380)
        self.log.setFont(QFont("Consolas", 10))
        splitter.addWidget(self.log)

        layout.addWidget(splitter)

        # 네트워크 초기화 (고정 시드)
        np.random.seed(42)
        self.W1 = np.random.randn(2, 3) * 0.5
        self.b1 = np.random.randn(3) * 0.1
        self.W2 = np.random.randn(3, 1) * 0.5
        self.b2 = np.random.randn(1) * 0.1

        self.run_forward()

    def run_forward(self):
        X = np.array([self.x1_spin.value(), self.x2_spin.value()])

        # Layer 1
        z1 = np.dot(X, self.W1) + self.b1
        a1 = np.maximum(0, z1)  # ReLU

        # Layer 2
        z2 = np.dot(a1, self.W2) + self.b2
        a2 = 1 / (1 + np.exp(-z2))  # Sigmoid

        # 로그
        self.log.clear()
        self.log.append("=== Forward Propagation ===\n")
        self.log.append(f"[입력] X = [{X[0]:.2f}, {X[1]:.2f}]\n")
        self.log.append("[Step 1] 입력층 → 은닉층")
        self.log.append(f"  z1 = X @ W1 + b1")
        self.log.append(f"     = [{z1[0]:.4f}, {z1[1]:.4f}, {z1[2]:.4f}]")
        self.log.append(f"  a1 = ReLU(z1)")
        self.log.append(f"     = [{a1[0]:.4f}, {a1[1]:.4f}, {a1[2]:.4f}]\n")
        self.log.append("[Step 2] 은닉층 → 출력층")
        self.log.append(f"  z2 = a1 @ W2 + b2 = {z2[0]:.4f}")
        self.log.append(f"  a2 = Sigmoid(z2)  = {a2[0]:.4f}\n")
        self.log.append(f"최종 출력: {a2[0]:.4f}")

        # 시각화
        self.fig.clear()

        # 네트워크 다이어그램
        ax = self.fig.add_subplot(1, 2, 1)
        ax.set_xlim(-0.5, 4.5)
        ax.set_ylim(-0.5, 4.5)
        ax.axis("off")
        ax.set_title("Network Diagram", fontsize=13, fontweight="bold")

        input_pos = [(0.5, 1.5), (0.5, 3.0)]
        hidden_pos = [(2.0, 0.5), (2.0, 2.0), (2.0, 3.5)]
        output_pos = [(3.5, 2.0)]

        # 연결선 (가중치 크기로 두께 조절)
        for i, ip in enumerate(input_pos):
            for j, hp in enumerate(hidden_pos):
                w = abs(self.W1[i, j])
                ax.plot([ip[0], hp[0]], [ip[1], hp[1]], "gray", alpha=0.3 + 0.5 * min(w, 1), linewidth=1 + 2 * min(w, 1))

        for j, hp in enumerate(hidden_pos):
            w = abs(self.W2[j, 0])
            ax.plot([hp[0], output_pos[0][0]], [hp[1], output_pos[0][1]], "gray", alpha=0.3 + 0.5 * min(w, 1), linewidth=1 + 2 * min(w, 1))

        # 뉴런
        for i, (px, py) in enumerate(input_pos):
            c = plt.Circle((px, py), 0.25, color="#AED6F1", ec="black", lw=2, zorder=10)
            ax.add_patch(c)
            ax.text(px, py, f"x{i+1}\n{X[i]:.2f}", ha="center", va="center", fontsize=8, fontweight="bold", zorder=11)

        for j, (px, py) in enumerate(hidden_pos):
            val = a1[j]
            color = "#A9DFBF" if val > 0 else "#FADBD8"
            c = plt.Circle((px, py), 0.25, color=color, ec="black", lw=2, zorder=10)
            ax.add_patch(c)
            ax.text(px, py, f"h{j+1}\n{val:.3f}", ha="center", va="center", fontsize=8, fontweight="bold", zorder=11)

        px, py = output_pos[0]
        c = plt.Circle((px, py), 0.25, color="#F9E79F", ec="black", lw=2, zorder=10)
        ax.add_patch(c)
        ax.text(px, py, f"y\n{a2[0]:.3f}", ha="center", va="center", fontsize=8, fontweight="bold", zorder=11)

        ax.text(0.5, -0.3, "Input", ha="center", fontsize=10, fontweight="bold")
        ax.text(2.0, -0.3, "Hidden\n(ReLU)", ha="center", fontsize=10, fontweight="bold")
        ax.text(3.5, -0.3, "Output\n(Sigmoid)", ha="center", fontsize=10, fontweight="bold")

        # 값 막대 그래프
        ax2 = self.fig.add_subplot(1, 2, 2)
        labels = ["z1[0]", "z1[1]", "z1[2]", "a1[0]", "a1[1]", "a1[2]", "z2", "a2"]
        vals = [z1[0], z1[1], z1[2], a1[0], a1[1], a1[2], z2[0], a2[0]]
        colors = ["#F39C12"] * 3 + ["#27AE60"] * 3 + ["#F39C12", "#E74C3C"]
        ax2.barh(labels, vals, color=colors, edgecolor="black", linewidth=0.5)
        ax2.set_title("Layer Values", fontsize=13, fontweight="bold")
        ax2.set_xlabel("Value")
        ax2.grid(True, alpha=0.3, axis="x")
        for i, v in enumerate(vals):
            ax2.text(v + 0.02, i, f"{v:.3f}", va="center", fontsize=9)

        self.fig.tight_layout()
        self.canvas.draw()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Lab 4: MLP (XOR 문제 해결)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class MLP:
    """Numpy MLP - XOR 문제 해결용"""
    def __init__(self, input_size, hidden_size, output_size, lr=0.5):
        self.W1 = np.random.randn(input_size, hidden_size) * np.sqrt(2.0 / input_size)
        self.b1 = np.zeros((1, hidden_size))
        self.W2 = np.random.randn(hidden_size, output_size) * np.sqrt(2.0 / hidden_size)
        self.b2 = np.zeros((1, output_size))
        self.lr = lr
        self.loss_history = []

    @staticmethod
    def sigmoid(x):
        return 1 / (1 + np.exp(-np.clip(x, -500, 500)))

    @staticmethod
    def sigmoid_derivative(x):
        s = MLP.sigmoid(x)
        return s * (1 - s)

    def forward(self, X):
        self.z1 = np.dot(X, self.W1) + self.b1
        self.a1 = MLP.sigmoid(self.z1)
        self.z2 = np.dot(self.a1, self.W2) + self.b2
        self.a2 = MLP.sigmoid(self.z2)
        return self.a2

    def backward(self, X, y, output):
        m = X.shape[0]
        dz2 = output - y
        dW2 = (1 / m) * np.dot(self.a1.T, dz2)
        db2 = (1 / m) * np.sum(dz2, axis=0, keepdims=True)
        da1 = np.dot(dz2, self.W2.T)
        dz1 = da1 * MLP.sigmoid_derivative(self.z1)
        dW1 = (1 / m) * np.dot(X.T, dz1)
        db1 = (1 / m) * np.sum(dz1, axis=0, keepdims=True)
        self.W2 -= self.lr * dW2
        self.b2 -= self.lr * db2
        self.W1 -= self.lr * dW1
        self.b1 -= self.lr * db1

    def train_step(self, X, y):
        output = self.forward(X)
        loss = np.mean((output - y) ** 2)
        self.loss_history.append(loss)
        self.backward(X, y, output)
        return loss


class Lab4Tab(QWidget):
    """Lab 4: MLP로 XOR 문제 해결"""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)

        desc = QLabel(
            "Lab 4: Multi-Layer Perceptron (MLP)\n"
            "Numpy로 MLP를 구현하여 XOR 문제를 해결합니다.\n"
            "Backpropagation으로 가중치를 자동 업데이트!"
        )
        desc.setFont(QFont("Arial", 11))
        desc.setWordWrap(True)
        layout.addWidget(desc)

        # 컨트롤
        ctrl = QHBoxLayout()
        ctrl.addWidget(QLabel("은닉 뉴런:"))
        self.hidden_spin = QSpinBox()
        self.hidden_spin.setRange(2, 32)
        self.hidden_spin.setValue(4)
        ctrl.addWidget(self.hidden_spin)

        ctrl.addWidget(QLabel("학습률:"))
        self.lr_spin = QDoubleSpinBox()
        self.lr_spin.setRange(0.01, 5.0)
        self.lr_spin.setValue(0.5)
        self.lr_spin.setSingleStep(0.1)
        ctrl.addWidget(self.lr_spin)

        ctrl.addWidget(QLabel("Epochs:"))
        self.epoch_spin = QSpinBox()
        self.epoch_spin.setRange(100, 50000)
        self.epoch_spin.setValue(10000)
        self.epoch_spin.setSingleStep(1000)
        ctrl.addWidget(self.epoch_spin)

        self.run_btn = QPushButton("학습 시작")
        self.run_btn.clicked.connect(self.run_training)
        self.run_btn.setStyleSheet("QPushButton { background-color: #9C27B0; color: white; padding: 6px 16px; font-weight: bold; }")
        ctrl.addWidget(self.run_btn)
        ctrl.addStretch()
        layout.addLayout(ctrl)

        # 결과 영역
        splitter = QSplitter(Qt.Horizontal)

        self.fig = Figure(figsize=(14, 4))
        self.canvas = make_canvas(self.fig)
        splitter.addWidget(self.canvas)

        self.log = QTextEdit()
        self.log.setReadOnly(True)
        self.log.setMaximumWidth(300)
        self.log.setFont(QFont("Consolas", 10))
        splitter.addWidget(self.log)

        layout.addWidget(splitter)
        self.run_training()

    def run_training(self):
        hidden = self.hidden_spin.value()
        lr = self.lr_spin.value()
        epochs = self.epoch_spin.value()

        X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=float)
        y = np.array([[0], [1], [1], [0]], dtype=float)

        mlp = MLP(2, hidden, 1, lr)

        self.log.clear()
        self.log.append(f"=== MLP 학습 (hidden={hidden}, lr={lr}) ===\n")

        for epoch in range(epochs):
            loss = mlp.train_step(X, y)
            if (epoch + 1) % (epochs // 5) == 0:
                self.log.append(f"Epoch {epoch+1}: Loss = {loss:.6f}")

        # 결과
        preds = mlp.forward(X)
        self.log.append(f"\n[학습 결과]")
        for inp, pred, lbl in zip(X, preds, y):
            self.log.append(f"  ({int(inp[0])},{int(inp[1])}) → {pred[0]:.4f} (정답: {int(lbl[0])})")

        accuracy = np.mean((preds > 0.5).astype(int) == y.astype(int)) * 100
        self.log.append(f"\n정확도: {accuracy:.1f}%")

        # 시각화
        self.fig.clear()

        # Loss
        ax1 = self.fig.add_subplot(1, 3, 1)
        ax1.plot(mlp.loss_history, linewidth=2, color="#E74C3C")
        ax1.set_title("Training Loss (MSE)", fontsize=12, fontweight="bold")
        ax1.set_xlabel("Epoch")
        ax1.set_ylabel("Loss")
        ax1.set_yscale("log")
        ax1.grid(True, alpha=0.3)

        # 결정 경계
        ax2 = self.fig.add_subplot(1, 3, 2)
        xx, yy = np.meshgrid(np.linspace(-0.5, 1.5, 200), np.linspace(-0.5, 1.5, 200))
        Z = mlp.forward(np.c_[xx.ravel(), yy.ravel()])
        Z = Z.reshape(xx.shape)
        contour = ax2.contourf(xx, yy, Z, levels=20, cmap="RdYlBu", alpha=0.8)
        self.fig.colorbar(contour, ax=ax2, label="Output")

        for point, label in zip(X, y):
            color = "#E74C3C" if label[0] == 1 else "#2980B9"
            marker = "o" if label[0] == 1 else "x"
            ax2.scatter(point[0], point[1], c=color, marker=marker, s=250, edgecolors="black", linewidth=2, zorder=5)

        ax2.set_title("XOR Decision Boundary", fontsize=12, fontweight="bold")
        ax2.set_xlim(-0.5, 1.5)
        ax2.set_ylim(-0.5, 1.5)
        ax2.grid(True, alpha=0.3)

        # 은닉층 활성화
        ax3 = self.fig.add_subplot(1, 3, 3)
        hidden_act = mlp.a1
        im = ax3.imshow(hidden_act.T, cmap="viridis", aspect="auto")
        ax3.set_yticks(range(hidden))
        ax3.set_yticklabels([f"H{i+1}" for i in range(hidden)])
        ax3.set_xticks(range(4))
        ax3.set_xticklabels(["0,0", "0,1", "1,0", "1,1"], fontsize=9)
        ax3.set_title("Hidden Activations", fontsize=12, fontweight="bold")
        self.fig.colorbar(im, ax=ax3)

        self.fig.tight_layout()
        self.canvas.draw()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Lab 5: Universal Approximation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class UniversalApproximator:
    """단일 은닉층 신경망 - 함수 근사용"""
    def __init__(self, n_hidden):
        limit = np.sqrt(6 / (1 + n_hidden))
        self.W1 = np.random.uniform(-limit, limit, (1, n_hidden))
        self.b1 = np.zeros(n_hidden)
        limit2 = np.sqrt(6 / (n_hidden + 1))
        self.W2 = np.random.uniform(-limit2, limit2, (n_hidden, 1))
        self.b2 = np.zeros(1)

    def forward(self, x):
        z1 = x @ self.W1 + self.b1
        a1 = np.tanh(z1)
        return a1 @ self.W2 + self.b2

    def train(self, X, y, epochs=5000, lr=0.05):
        for _ in range(epochs):
            z1 = X @ self.W1 + self.b1
            a1 = np.tanh(z1)
            output = a1 @ self.W2 + self.b2

            dL = 2 * (output - y) / len(X)
            dW2 = a1.T @ dL
            db2 = np.sum(dL, axis=0)
            da1 = dL @ self.W2.T
            dz1 = da1 * (1 - a1 ** 2)
            dW1 = X.T @ dz1
            db1 = np.sum(dz1, axis=0)

            self.W2 -= lr * dW2
            self.b2 -= lr * db2
            self.W1 -= lr * dW1
            self.b1 -= lr * db1


class Lab5Tab(QWidget):
    """Lab 5: Universal Approximation Theorem"""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)

        desc = QLabel(
            "Lab 5: Universal Approximation Theorem\n"
            "하나의 은닉층 + 충분한 뉴런 → 어떤 연속 함수도 근사 가능!\n"
            "뉴런 수를 바꿔가며 근사 정확도 변화를 관찰하세요."
        )
        desc.setFont(QFont("Arial", 11))
        desc.setWordWrap(True)
        layout.addWidget(desc)

        # 컨트롤
        ctrl = QHBoxLayout()
        ctrl.addWidget(QLabel("목표 함수:"))
        self.func_combo = QComboBox()
        self.func_combo.addItems(["sin(2πx)", "Step Function", "Complex (다중 주파수)"])
        ctrl.addWidget(self.func_combo)

        ctrl.addWidget(QLabel("뉴런 수:"))
        self.neuron_spin = QSpinBox()
        self.neuron_spin.setRange(1, 100)
        self.neuron_spin.setValue(10)
        ctrl.addWidget(self.neuron_spin)

        ctrl.addWidget(QLabel("Epochs:"))
        self.epoch_spin = QSpinBox()
        self.epoch_spin.setRange(500, 20000)
        self.epoch_spin.setValue(5000)
        self.epoch_spin.setSingleStep(500)
        ctrl.addWidget(self.epoch_spin)

        self.run_btn = QPushButton("근사 실행")
        self.run_btn.clicked.connect(self.run_approx)
        self.run_btn.setStyleSheet("QPushButton { background-color: #FF5722; color: white; padding: 6px 16px; font-weight: bold; }")
        ctrl.addWidget(self.run_btn)

        self.compare_btn = QPushButton("3 vs 10 vs 50 비교")
        self.compare_btn.clicked.connect(self.run_compare)
        self.compare_btn.setStyleSheet("QPushButton { background-color: #607D8B; color: white; padding: 6px 16px; font-weight: bold; }")
        ctrl.addWidget(self.compare_btn)
        ctrl.addStretch()
        layout.addLayout(ctrl)

        self.fig = Figure(figsize=(14, 5))
        self.canvas = make_canvas(self.fig)
        layout.addWidget(self.canvas)

        self.run_approx()

    def _get_target(self):
        idx = self.func_combo.currentIndex()
        if idx == 0:
            return "sin(2πx)", lambda x: np.sin(2 * np.pi * x)
        elif idx == 1:
            return "Step Function", lambda x: np.where(x < 0.5, 0.0, 1.0)
        else:
            return "Complex", lambda x: np.sin(2 * np.pi * x) + 0.5 * np.sin(4 * np.pi * x) + 0.3 * np.cos(6 * np.pi * x)

    def run_approx(self):
        name, func = self._get_target()
        n = self.neuron_spin.value()
        epochs = self.epoch_spin.value()

        x_train = np.linspace(0, 1, 100).reshape(-1, 1)
        y_train = func(x_train)
        x_test = np.linspace(0, 1, 200).reshape(-1, 1)
        y_test = func(x_test)

        model = UniversalApproximator(n)
        lr = 0.05 if n < 20 else 0.01
        model.train(x_train, y_train, epochs, lr)
        y_pred = model.forward(x_test)
        mse = np.mean((y_pred - y_test) ** 2)

        self.fig.clear()
        ax = self.fig.add_subplot(1, 1, 1)
        ax.plot(x_test, y_test, "b-", linewidth=2.5, label="True Function", alpha=0.8)
        ax.plot(x_test, y_pred, "r--", linewidth=2.5, label=f"NN ({n} neurons)")
        ax.scatter(x_train[::10], y_train[::10], c="green", s=30, alpha=0.6, label="Training Data")
        ax.set_title(f"{name} — {n} Neurons (MSE: {mse:.4f})", fontsize=14, fontweight="bold")
        ax.legend(fontsize=11)
        ax.grid(True, alpha=0.3)
        ax.set_xlabel("x")
        ax.set_ylabel("y")

        self.fig.tight_layout()
        self.canvas.draw()

    def run_compare(self):
        name, func = self._get_target()
        x_train = np.linspace(0, 1, 100).reshape(-1, 1)
        y_train = func(x_train)
        x_test = np.linspace(0, 1, 200).reshape(-1, 1)
        y_test = func(x_test)

        self.fig.clear()
        for idx, n in enumerate([3, 10, 50]):
            model = UniversalApproximator(n)
            lr = 0.05 if n < 20 else 0.01
            model.train(x_train, y_train, 5000, lr)
            y_pred = model.forward(x_test)
            mse = np.mean((y_pred - y_test) ** 2)

            ax = self.fig.add_subplot(1, 3, idx + 1)
            ax.plot(x_test, y_test, "b-", linewidth=2.5, label="True", alpha=0.8)
            ax.plot(x_test, y_pred, "r--", linewidth=2.5, label=f"NN ({n})")
            ax.scatter(x_train[::10], y_train[::10], c="green", s=20, alpha=0.5)
            ax.set_title(f"{n} Neurons\nMSE: {mse:.4f}", fontsize=12, fontweight="bold")
            ax.legend(fontsize=9)
            ax.grid(True, alpha=0.3)
            ax.set_xlabel("x")
            ax.set_ylabel("y")

        self.fig.tight_layout()
        self.canvas.draw()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 메인 윈도우
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Week 3: 신경망 기초 - Neural Networks Fundamentals")
        self.setMinimumSize(1100, 700)

        # 중앙 위젯
        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QVBoxLayout(central)

        # 제목
        title = QLabel("Week 3: 신경망 기초 (Neural Networks Fundamentals)")
        title.setFont(QFont("Arial", 16, QFont.Bold))
        title.setAlignment(Qt.AlignCenter)
        title.setStyleSheet("color: #1a237e; padding: 8px;")
        main_layout.addWidget(title)

        subtitle = QLabel("이건우 (202512131) | AI와 머신러닝 2-1학기")
        subtitle.setAlignment(Qt.AlignCenter)
        subtitle.setStyleSheet("color: #546E7A; padding: 2px 0 8px 0;")
        main_layout.addWidget(subtitle)

        # 탭
        tabs = QTabWidget()
        tabs.setStyleSheet("""
            QTabWidget::pane { border: 1px solid #ccc; }
            QTabBar::tab { padding: 8px 18px; font-size: 12px; font-weight: bold; }
            QTabBar::tab:selected { background: #e3f2fd; border-bottom: 2px solid #1976D2; }
        """)
        tabs.addTab(Lab1Tab(), "Lab 1: Perceptron")
        tabs.addTab(Lab2Tab(), "Lab 2: Activation Functions")
        tabs.addTab(Lab3Tab(), "Lab 3: Forward Propagation")
        tabs.addTab(Lab4Tab(), "Lab 4: MLP (XOR)")
        tabs.addTab(Lab5Tab(), "Lab 5: Universal Approximation")
        main_layout.addWidget(tabs)


def main():
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
