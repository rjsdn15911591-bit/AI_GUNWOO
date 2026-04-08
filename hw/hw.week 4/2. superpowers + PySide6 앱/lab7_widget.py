"""Lab 7: 단순 조화 진동자의 에너지 준위 예측"""

import numpy as np
import os
from math import factorial

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QProgressBar, QGroupBox, QSpinBox, QTextEdit
)
from PySide6.QtCore import QThread, Signal

from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure


def hermite(n, x):
    """n차 Hermite 다항식 H_n(x) 재귀 계산"""
    if n == 0:
        return np.ones_like(x)
    elif n == 1:
        return 2 * x
    else:
        return 2 * x * hermite(n-1, x) - 2 * (n-1) * hermite(n-2, x)


def psi_n(n, x):
    """양자 조화 진동자 파동함수 (ℏ=m=ω=1 단위)"""
    norm = 1.0 / np.sqrt(2**n * factorial(n) * np.sqrt(np.pi))
    return norm * hermite(n, x) * np.exp(-x**2 / 2)


class TrainThread(QThread):
    progress = Signal(int)
    log_message = Signal(str)
    finished_result = Signal(dict)
    error_occurred = Signal(str)

    def __init__(self, epochs):
        super().__init__()
        self.epochs = epochs

    def run(self):
        try:
            import tensorflow as tf
            from tensorflow import keras
            tf.get_logger().setLevel('ERROR')

            self.log_message.emit("양자 진동자 데이터 생성 중...")
            n_samples = 3000
            omega_arr = np.random.uniform(0.5, 5.0, n_samples)
            n_arr = np.random.randint(0, 10, n_samples).astype(float)
            E_arr = omega_arr * (n_arr + 0.5)  # ℏ=1 단위

            X = np.column_stack([omega_arr, n_arr])
            Y = E_arr.reshape(-1, 1)

            X_mean, X_std = X.mean(axis=0), X.std(axis=0)
            Y_mean, Y_std = float(Y.mean()), float(Y.std())
            X_norm = (X - X_mean) / X_std
            Y_norm = (Y - Y_mean) / Y_std

            perm = np.random.permutation(n_samples)
            X_norm, Y_norm = X_norm[perm], Y_norm[perm]

            model = keras.Sequential([
                keras.layers.Dense(32, activation='relu'),
                keras.layers.Dense(16, activation='relu'),
                keras.layers.Dense(1, activation='linear')
            ])
            model.compile(optimizer=keras.optimizers.Adam(0.001), loss='mse')

            class CB(keras.callbacks.Callback):
                def __init__(self, thread):
                    super().__init__()
                    self.thread = thread
                def on_epoch_end(self, epoch, logs=None):
                    self.thread.progress.emit(int((epoch+1)/self.thread.epochs*100))
                    if (epoch+1) % 200 == 0:
                        self.thread.log_message.emit(f"  Epoch {epoch+1} - loss: {logs['loss']:.6f}")

            self.log_message.emit(f"학습 시작 ({self.epochs} epochs)...")
            history = model.fit(X_norm, Y_norm, epochs=self.epochs, batch_size=64,
                                validation_split=0.2, verbose=0, callbacks=[CB(self)])

            # 테스트: ω=1, n=0~9
            omega_test = 1.0
            n_levels = np.arange(0, 10)
            X_test = np.column_stack([np.full(10, omega_test), n_levels.astype(float)])
            X_test_norm = (X_test - X_mean) / X_std
            E_pred_norm = model.predict(X_test_norm, verbose=0)
            E_pred = E_pred_norm * Y_std + Y_mean
            E_true = omega_test * (n_levels + 0.5)

            # scatter
            X_sc = np.column_stack([omega_arr[:300], n_arr[:300]])
            X_sc_norm = (X_sc - X_mean) / X_std
            E_sc_pred_norm = model.predict(X_sc_norm, verbose=0)
            E_sc_pred = E_sc_pred_norm * Y_std + Y_mean
            E_sc_true = E_arr[:300]

            # 파동함수
            x_psi = np.linspace(-5, 5, 300)
            psi_list = [psi_n(n, x_psi) for n in range(5)]

            mape = float(np.mean(np.abs((E_true - E_pred.flatten()) / E_true)) * 100)
            self.log_message.emit(f"학습 완료! MAPE: {mape:.2f}%")

            self.finished_result.emit({
                'n_levels': n_levels, 'E_true': E_true, 'E_pred': E_pred.flatten(),
                'E_sc_true': E_sc_true, 'E_sc_pred': E_sc_pred.flatten(),
                'x_psi': x_psi, 'psi_list': psi_list,
                'history': history.history,
            })
        except ImportError:
            self.error_occurred.emit("TensorFlow가 설치되지 않았습니다.")
        except Exception as e:
            self.error_occurred.emit(f"학습 오류: {str(e)}")


class Lab7Widget(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        layout = QHBoxLayout(self)

        left = QVBoxLayout()
        settings = QGroupBox("실험 설정")
        s = QVBoxLayout(settings)

        s.addWidget(QLabel("Epochs:"))
        self.epoch_spin = QSpinBox()
        self.epoch_spin.setRange(200, 5000)
        self.epoch_spin.setValue(1000)
        self.epoch_spin.setSingleStep(200)
        s.addWidget(self.epoch_spin)

        info = QLabel("물리 (ℏ=1 단위):\n• E_n = ω(n + 1/2)\n• ω: 0.5~5.0\n• n: 0~9\n\n파동함수: n=0~4\n(Hermite 다항식)")
        info.setStyleSheet("color: #555; padding: 8px; background: #f0f0f0; border-radius: 4px;")
        s.addWidget(info)
        left.addWidget(settings)

        self.run_btn = QPushButton("학습 시작")
        self.run_btn.setObjectName("runBtn")
        self.run_btn.clicked.connect(self.start_training)
        left.addWidget(self.run_btn)

        self.progress = QProgressBar()
        left.addWidget(self.progress)

        self.save_btn = QPushButton("그래프 PNG 저장")
        self.save_btn.setObjectName("saveBtn")
        self.save_btn.clicked.connect(self.save_graph)
        self.save_btn.setEnabled(False)
        left.addWidget(self.save_btn)

        log_group = QGroupBox("학습 로그")
        ll = QVBoxLayout(log_group)
        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        self.log_text.setMaximumHeight(200)
        ll.addWidget(self.log_text)
        left.addWidget(log_group)
        left.addStretch()

        lw = QWidget()
        lw.setLayout(left)
        lw.setMaximumWidth(320)

        right = QVBoxLayout()
        self.figure = Figure(figsize=(10, 8))
        self.canvas = FigureCanvas(self.figure)
        right.addWidget(self.canvas)
        rw = QWidget()
        rw.setLayout(right)

        layout.addWidget(lw)
        layout.addWidget(rw, 1)

    def start_training(self):
        self.run_btn.setEnabled(False)
        self.save_btn.setEnabled(False)
        self.progress.setValue(0)
        self.log_text.clear()
        self.thread = TrainThread(self.epoch_spin.value())
        self.thread.progress.connect(self.progress.setValue)
        self.thread.log_message.connect(lambda m: self.log_text.append(m))
        self.thread.finished_result.connect(self.on_done)
        self.thread.error_occurred.connect(self.on_error)
        self.thread.start()

    def on_done(self, result):
        self.run_btn.setEnabled(True)
        self.save_btn.setEnabled(True)
        self.last_result = result
        self.plot(result)

    def on_error(self, msg):
        self.run_btn.setEnabled(True)
        self.log_text.append(f"[오류] {msg}")

    def plot(self, r):
        self.figure.clear()
        colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6']

        ax1 = self.figure.add_subplot(221)
        for n in r['n_levels']:
            E = r['E_true'][n]
            ax1.axhline(y=E, color=colors[n % 5], linewidth=2, alpha=0.8)
            ax1.text(0.55, E + 0.05, f"n={n}, E={E:.2f}", fontsize=7, color=colors[n % 5])
        ax1.set_title("에너지 준위 다이어그램 (ω=1)", fontsize=11)
        ax1.set_ylabel("에너지 E (ℏ 단위)")
        ax1.set_xlim(0, 1)
        ax1.set_xticks([])
        ax1.grid(True, alpha=0.2)

        ax2 = self.figure.add_subplot(222)
        for n in range(5):
            offset = r['E_true'][n]
            ax2.plot(r['x_psi'], r['psi_list'][n] * 0.8 + offset,
                     color=colors[n], linewidth=1.5, label=f"n={n}")
            ax2.axhline(y=offset, color=colors[n], linewidth=0.5, linestyle='--', alpha=0.4)
        ax2.set_title("파동함수 ψ_n(x)", fontsize=11)
        ax2.set_xlabel("x")
        ax2.set_ylabel("ψ_n(x) + E_n")
        ax2.legend(fontsize=7, loc='upper right')
        ax2.grid(True, alpha=0.3)

        ax3 = self.figure.add_subplot(223)
        ax3.scatter(r['E_sc_true'], r['E_sc_pred'], s=8, alpha=0.4, color='#3498db')
        lim = [r['E_sc_true'].min(), r['E_sc_true'].max()]
        ax3.plot(lim, lim, 'r--', linewidth=1.5, label='이상적 예측')
        ax3.set_title("NN 예측 vs 실제 E_n", fontsize=11)
        ax3.set_xlabel("실제 E_n")
        ax3.set_ylabel("예측 E_n")
        ax3.legend(fontsize=8)
        ax3.grid(True, alpha=0.3)

        ax4 = self.figure.add_subplot(224)
        ax4.plot(r['history']['loss'], label='Train Loss')
        if 'val_loss' in r['history']:
            ax4.plot(r['history']['val_loss'], label='Val Loss')
        ax4.set_title("학습 곡선", fontsize=11)
        ax4.set_xlabel("Epoch")
        ax4.set_ylabel("MSE Loss")
        ax4.set_yscale('log')
        ax4.legend()
        ax4.grid(True, alpha=0.3)

        self.figure.suptitle("Lab 7: 양자 조화 진동자 에너지 준위 예측", fontsize=13, fontweight='bold')
        self.figure.tight_layout()
        self.canvas.draw()

    def save_graph(self):
        if hasattr(self, 'last_result'):
            path = os.path.join("outputs", "07_quantum_oscillator_energy.png")
            self.figure.savefig(path, dpi=150, bbox_inches='tight')
            self.log_text.append(f"저장 완료: {path}")
