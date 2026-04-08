"""Lab 6: 2D Ising Model 상전이 예측"""

import numpy as np
import os

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QProgressBar, QGroupBox, QSpinBox, QTextEdit
)
from PySide6.QtCore import QThread, Signal

from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure


def metropolis_ising(N, T, n_steps=2000, J=1.0):
    """Metropolis 알고리즘으로 2D Ising 모델 시뮬레이션"""
    spin = np.random.choice([-1, 1], size=(N, N))
    beta = 1.0 / T if T > 0 else 1e10

    for _ in range(n_steps):
        i, j = np.random.randint(0, N, size=2)
        neighbors = (spin[(i+1) % N, j] + spin[(i-1) % N, j] +
                     spin[i, (j+1) % N] + spin[i, (j-1) % N])
        dE = 2 * J * spin[i, j] * neighbors
        if dE < 0 or np.random.rand() < np.exp(-beta * dE):
            spin[i, j] *= -1

    return spin, abs(spin.mean())


class TrainThread(QThread):
    progress = Signal(int)
    log_message = Signal(str)
    finished_result = Signal(dict)
    error_occurred = Signal(str)

    def __init__(self, epochs, grid_size):
        super().__init__()
        self.epochs = epochs
        self.grid_size = grid_size

    def run(self):
        try:
            import tensorflow as tf
            from tensorflow import keras
            tf.get_logger().setLevel('ERROR')

            N = self.grid_size
            T_arr = np.linspace(0.5, 5.0, 80)
            self.log_message.emit(f"Ising 데이터 생성 중 (격자 {N}×{N})...")

            M_arr = []
            for idx, T in enumerate(T_arr):
                _, M = metropolis_ising(N, T, n_steps=3000)
                M_arr.append(M)
                if (idx + 1) % 20 == 0:
                    self.log_message.emit(f"  T={T:.2f} → |M|={M:.3f}")
            M_arr = np.array(M_arr)

            X = T_arr.reshape(-1, 1)
            Y = M_arr.reshape(-1, 1)
            X_mean, X_std = float(X.mean()), float(X.std())
            Y_mean, Y_std = float(Y.mean()), max(float(Y.std()), 1e-8)
            X_norm = (X - X_mean) / X_std
            Y_norm = (Y - Y_mean) / Y_std

            model = keras.Sequential([
                keras.layers.Dense(32, activation='tanh'),
                keras.layers.Dense(16, activation='tanh'),
                keras.layers.Dense(1, activation='linear')
            ])
            model.compile(optimizer=keras.optimizers.Adam(0.001), loss='mse')

            class CB(keras.callbacks.Callback):
                def __init__(self, thread):
                    super().__init__()
                    self.thread = thread
                def on_epoch_end(self, epoch, logs=None):
                    self.thread.progress.emit(int((epoch+1)/self.thread.epochs*100))

            self.log_message.emit(f"학습 시작 ({self.epochs} epochs)...")
            history = model.fit(X_norm, Y_norm, epochs=self.epochs, batch_size=16,
                                verbose=0, callbacks=[CB(self)])

            T_test = np.linspace(0.5, 5.0, 200).reshape(-1, 1)
            T_test_norm = (T_test - X_mean) / X_std
            M_pred_norm = model.predict(T_test_norm, verbose=0)
            M_pred = np.clip(M_pred_norm * Y_std + Y_mean, 0, 1)

            # 격자 스냅샷
            snapshots = {}
            for T_snap in [1.0, 2.27, 4.0]:
                grid, _ = metropolis_ising(N, T_snap, n_steps=5000)
                snapshots[T_snap] = grid

            self.log_message.emit("학습 완료!")
            self.finished_result.emit({
                'T_data': T_arr, 'M_data': M_arr,
                'T_test': T_test.flatten(), 'M_pred': M_pred.flatten(),
                'history': history.history,
                'snapshots': snapshots,
            })
        except ImportError:
            self.error_occurred.emit("TensorFlow가 설치되지 않았습니다.")
        except Exception as e:
            self.error_occurred.emit(f"학습 오류: {str(e)}")


class Lab6Widget(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        layout = QHBoxLayout(self)

        left = QVBoxLayout()
        settings = QGroupBox("실험 설정")
        s = QVBoxLayout(settings)

        s.addWidget(QLabel("격자 크기 N (N×N):"))
        self.grid_spin = QSpinBox()
        self.grid_spin.setRange(5, 20)
        self.grid_spin.setValue(10)
        s.addWidget(self.grid_spin)

        s.addWidget(QLabel("Epochs:"))
        self.epoch_spin = QSpinBox()
        self.epoch_spin.setRange(100, 3000)
        self.epoch_spin.setValue(500)
        self.epoch_spin.setSingleStep(100)
        s.addWidget(self.epoch_spin)

        info = QLabel("물리:\n• H = -J Σ sᵢsⱼ\n• Tc ≈ 2.269 (J=1)\n• Metropolis 알고리즘")
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
        self.thread = TrainThread(self.epoch_spin.value(), self.grid_spin.value())
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

        ax1 = self.figure.add_subplot(221)
        ax1.scatter(r['T_data'], r['M_data'], s=20, color='#3498db', label='Monte Carlo', zorder=3)
        ax1.plot(r['T_test'], r['M_pred'], 'r-', linewidth=2, label='NN 예측')
        ax1.axvline(x=2.269, color='gray', linestyle='--', linewidth=1, label='Tc≈2.27')
        ax1.set_title("|M| vs 온도 T", fontsize=12)
        ax1.set_xlabel("온도 T (J/k_B 단위)")
        ax1.set_ylabel("|자화율 M|")
        ax1.legend(fontsize=8)
        ax1.grid(True, alpha=0.3)

        ax2 = self.figure.add_subplot(222)
        ax2.plot(r['history']['loss'], label='Train Loss', color='#e74c3c')
        ax2.set_title("학습 곡선", fontsize=12)
        ax2.set_xlabel("Epoch")
        ax2.set_ylabel("MSE Loss")
        ax2.set_yscale('log')
        ax2.legend()
        ax2.grid(True, alpha=0.3)

        titles = {1.0: "저온 T=1.0\n(강자성)", 2.27: "임계 T=2.27\n(상전이)", 4.0: "고온 T=4.0\n(상자성)"}
        for idx, (T_snap, grid) in enumerate(r['snapshots'].items()):
            ax = self.figure.add_subplot(2, 3, idx + 4)
            ax.imshow(grid, cmap='RdBu', vmin=-1, vmax=1, interpolation='nearest')
            ax.set_title(titles[T_snap], fontsize=9)
            ax.axis('off')

        self.figure.suptitle("Lab 6: 2D Ising Model 상전이 예측", fontsize=13, fontweight='bold')
        self.figure.tight_layout()
        self.canvas.draw()

    def save_graph(self):
        if hasattr(self, 'last_result'):
            path = os.path.join("outputs", "06_ising_phase_transition.png")
            self.figure.savefig(path, dpi=150, bbox_inches='tight')
            self.log_text.append(f"저장 완료: {path}")
