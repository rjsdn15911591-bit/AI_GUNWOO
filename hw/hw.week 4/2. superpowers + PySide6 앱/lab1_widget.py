"""Lab 1: 완벽한 1D 함수 근사"""

import numpy as np
import os

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QProgressBar, QGroupBox, QComboBox, QSpinBox, QTextEdit, QSplitter
)
from PySide6.QtCore import Qt, QThread, Signal

from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure


class TrainThread(QThread):
    """백그라운드 학습 스레드"""
    progress = Signal(int)
    log_message = Signal(str)
    finished_result = Signal(dict)
    error_occurred = Signal(str)

    def __init__(self, func_name, epochs, network_size):
        super().__init__()
        self.func_name = func_name
        self.epochs = epochs
        self.network_size = network_size

    def run(self):
        try:
            import tensorflow as tf
            from tensorflow import keras

            tf.get_logger().setLevel('ERROR')
            self.log_message.emit("데이터 생성 중...")

            # 데이터 생성
            x = np.linspace(-2 * np.pi, 2 * np.pi, 500).reshape(-1, 1)

            funcs = {
                "sin(x)": lambda x: np.sin(x),
                "cos(x) + 0.5sin(2x)": lambda x: np.cos(x) + 0.5 * np.sin(2 * x),
                "x·sin(x)": lambda x: x * np.sin(x),
                "극한 복잡도": lambda x: (np.sin(x) + 0.5 * np.sin(2 * x) +
                    0.3 * np.cos(3 * x) + 0.2 * np.sin(5 * x) + 0.1 * x * np.cos(x)),
                "tanh(x)": lambda x: np.tanh(x),
                "x³": lambda x: x**3 / 20,
                "x²·sin(x)": lambda x: x**2 * np.sin(x) / 10,
            }
            y = funcs[self.func_name](x)

            # 데이터 셔플링 (validation_split 문제 방지)
            perm = np.random.permutation(len(x))
            x_shuffled = x[perm]
            y_shuffled = y[perm]

            # 네트워크 크기 설정
            sizes = {
                "Small [32]": [32],
                "Medium [64, 64]": [64, 64],
                "Large [128, 128]": [128, 128],
                "Very Large [128, 128, 64]": [128, 128, 64],
            }
            layers = sizes[self.network_size]

            self.log_message.emit(f"모델 구성: {layers}")
            self.log_message.emit(f"함수: {self.func_name}")

            # 모델 구성
            model = keras.Sequential()
            for units in layers:
                model.add(keras.layers.Dense(units, activation='tanh'))
            model.add(keras.layers.Dense(1, activation='linear'))

            model.compile(optimizer=keras.optimizers.Adam(learning_rate=0.001),
                          loss='mse')

            # Epoch 콜백
            class ProgressCallback(keras.callbacks.Callback):
                def __init__(self, thread):
                    super().__init__()
                    self.thread = thread

                def on_epoch_end(self, epoch, logs=None):
                    pct = int((epoch + 1) / self.thread.epochs * 100)
                    self.thread.progress.emit(pct)
                    if (epoch + 1) % 500 == 0:
                        self.thread.log_message.emit(
                            f"  Epoch {epoch+1}/{self.thread.epochs} - loss: {logs['loss']:.6f}"
                        )

            self.log_message.emit(f"학습 시작 ({self.epochs} epochs)...")

            history = model.fit(
                x_shuffled, y_shuffled,
                epochs=self.epochs,
                batch_size=32,
                validation_split=0.2,
                verbose=0,
                callbacks=[ProgressCallback(self)]
            )

            # 예측
            x_test = np.linspace(-2 * np.pi, 2 * np.pi, 1000).reshape(-1, 1)
            y_true = funcs[self.func_name](x_test)
            y_pred = model.predict(x_test, verbose=0)

            final_loss = history.history['loss'][-1]
            self.log_message.emit(f"학습 완료! 최종 MSE: {final_loss:.6f}")

            self.finished_result.emit({
                'x_test': x_test.flatten(),
                'y_true': y_true.flatten(),
                'y_pred': y_pred.flatten(),
                'history': history.history,
                'func_name': self.func_name,
                'network': self.network_size,
                'final_mse': final_loss
            })

        except ImportError:
            self.error_occurred.emit("TensorFlow가 설치되지 않았습니다.\npip install tensorflow 실행 후 다시 시도하세요.")
        except Exception as e:
            self.error_occurred.emit(f"학습 오류: {str(e)}")


class Lab1Widget(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        layout = QHBoxLayout(self)

        # 왼쪽: 컨트롤 패널
        left = QVBoxLayout()

        # 설정 그룹
        settings = QGroupBox("실험 설정")
        s_layout = QVBoxLayout(settings)

        s_layout.addWidget(QLabel("함수 선택:"))
        self.func_combo = QComboBox()
        self.func_combo.addItems([
            "sin(x)", "cos(x) + 0.5sin(2x)", "x·sin(x)", "극한 복잡도",
            "tanh(x)", "x³", "x²·sin(x)"
        ])
        s_layout.addWidget(self.func_combo)

        s_layout.addWidget(QLabel("네트워크 크기:"))
        self.net_combo = QComboBox()
        self.net_combo.addItems(["Small [32]", "Medium [64, 64]", "Large [128, 128]", "Very Large [128, 128, 64]"])
        self.net_combo.setCurrentIndex(2)
        s_layout.addWidget(self.net_combo)

        s_layout.addWidget(QLabel("Epochs:"))
        self.epoch_spin = QSpinBox()
        self.epoch_spin.setRange(100, 10000)
        self.epoch_spin.setValue(3000)
        self.epoch_spin.setSingleStep(500)
        s_layout.addWidget(self.epoch_spin)

        left.addWidget(settings)

        # 실행 버튼
        self.run_btn = QPushButton("학습 시작")
        self.run_btn.setObjectName("runBtn")
        self.run_btn.clicked.connect(self.start_training)
        left.addWidget(self.run_btn)

        # 프로그레스바
        self.progress = QProgressBar()
        self.progress.setValue(0)
        left.addWidget(self.progress)

        # 저장 버튼
        self.save_btn = QPushButton("그래프 PNG 저장")
        self.save_btn.setObjectName("saveBtn")
        self.save_btn.clicked.connect(self.save_graph)
        self.save_btn.setEnabled(False)
        left.addWidget(self.save_btn)

        # 로그
        log_group = QGroupBox("학습 로그")
        log_layout = QVBoxLayout(log_group)
        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        self.log_text.setMaximumHeight(200)
        log_layout.addWidget(self.log_text)
        left.addWidget(log_group)

        left.addStretch()

        left_widget = QWidget()
        left_widget.setLayout(left)
        left_widget.setMaximumWidth(320)

        # 오른쪽: 그래프
        right = QVBoxLayout()
        self.figure = Figure(figsize=(10, 8))
        self.canvas = FigureCanvas(self.figure)
        right.addWidget(self.canvas)

        right_widget = QWidget()
        right_widget.setLayout(right)

        layout.addWidget(left_widget)
        layout.addWidget(right_widget, 1)

    def start_training(self):
        self.run_btn.setEnabled(False)
        self.save_btn.setEnabled(False)
        self.progress.setValue(0)
        self.log_text.clear()

        self.thread = TrainThread(
            self.func_combo.currentText(),
            self.epoch_spin.value(),
            self.net_combo.currentText()
        )
        self.thread.progress.connect(self.progress.setValue)
        self.thread.log_message.connect(lambda msg: self.log_text.append(msg))
        self.thread.finished_result.connect(self.on_training_done)
        self.thread.error_occurred.connect(self.on_error)
        self.thread.start()

    def on_training_done(self, result):
        self.run_btn.setEnabled(True)
        self.save_btn.setEnabled(True)
        self.last_result = result
        self.plot_result(result)

    def on_error(self, msg):
        self.run_btn.setEnabled(True)
        self.log_text.append(f"[오류] {msg}")

    def plot_result(self, r):
        self.figure.clear()

        ax1 = self.figure.add_subplot(121)
        ax1.plot(r['x_test'], r['y_true'], 'b-', label='실제 함수', linewidth=2)
        ax1.plot(r['x_test'], r['y_pred'], 'r--', label='NN 예측', linewidth=2)
        ax1.set_title(f"함수 근사: {r['func_name']}", fontsize=13)
        ax1.set_xlabel("x")
        ax1.set_ylabel("y")
        ax1.legend()
        ax1.grid(True, alpha=0.3)

        ax2 = self.figure.add_subplot(122)
        ax2.plot(r['history']['loss'], label='Train Loss', color='blue')
        if 'val_loss' in r['history']:
            ax2.plot(r['history']['val_loss'], label='Val Loss', color='orange')
        ax2.set_title("학습 곡선", fontsize=13)
        ax2.set_xlabel("Epoch")
        ax2.set_ylabel("MSE Loss")
        ax2.set_yscale('log')
        ax2.legend()
        ax2.grid(True, alpha=0.3)

        self.figure.suptitle(
            f"네트워크: {r['network']} | 최종 MSE: {r['final_mse']:.6f}",
            fontsize=11, color='#666'
        )
        self.figure.tight_layout()
        self.canvas.draw()

    def save_graph(self):
        if hasattr(self, 'last_result'):
            path = os.path.join("outputs", "perfect_1d_approximation.png")
            self.figure.savefig(path, dpi=150, bbox_inches='tight')
            self.log_text.append(f"저장 완료: {path}")
