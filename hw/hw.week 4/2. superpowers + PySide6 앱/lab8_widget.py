"""Lab 8: Kepler 문제의 궤도 예측"""

import numpy as np
import os
import matplotlib
matplotlib.rcParams['axes.unicode_minus'] = False

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QProgressBar, QGroupBox, QSpinBox, QTextEdit
)
from PySide6.QtCore import QThread, Signal

from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure


def kepler_orbit(a, e, theta):
    """케플러 궤도 직교좌표 계산"""
    r = a * (1 - e**2) / (1 + e * np.cos(theta))
    x = r * np.cos(theta)
    y = r * np.sin(theta)
    return x, y


class TrainThread(QThread):
    progress = Signal(int)
    log_message = Signal(str)
    finished_result = Signal(dict)
    error_occurred = Signal(str)

    def __init__(self, epochs, n_samples):
        super().__init__()
        self.epochs = epochs
        self.n_samples = n_samples

    def run(self):
        try:
            import tensorflow as tf
            from tensorflow import keras
            tf.get_logger().setLevel('ERROR')

            self.log_message.emit("케플러 궤도 데이터 생성 중...")
            a_arr = np.random.uniform(1.0, 5.0, self.n_samples)
            e_arr = np.random.uniform(0.0, 0.9, self.n_samples)
            theta_arr = np.random.uniform(0, 2 * np.pi, self.n_samples)

            x_arr, y_arr = kepler_orbit(a_arr, e_arr, theta_arr)

            X = np.column_stack([a_arr, e_arr, theta_arr])
            Y = np.column_stack([x_arr, y_arr])

            X_mean, X_std = X.mean(axis=0), X.std(axis=0)
            Y_mean, Y_std = Y.mean(axis=0), Y.std(axis=0)
            X_norm = (X - X_mean) / X_std
            Y_norm = (Y - Y_mean) / Y_std

            perm = np.random.permutation(self.n_samples)
            X_norm, Y_norm = X_norm[perm], Y_norm[perm]

            model = keras.Sequential([
                keras.layers.Dense(128, activation='relu'),
                keras.layers.Dense(64, activation='relu'),
                keras.layers.Dense(32, activation='relu'),
                keras.layers.Dense(2, activation='linear')
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

            # 테스트: a=2, 3가지 이심률
            test_configs = [
                (2.0, 0.0, "원형 e=0.0"),
                (2.0, 0.5, "타원 e=0.5"),
                (2.0, 0.85, "긴 타원 e=0.85"),
            ]
            orbits = []
            theta_full = np.linspace(0, 2 * np.pi, 200)

            for a_t, e_t, label in test_configs:
                x_true, y_true = kepler_orbit(a_t, e_t, theta_full)
                X_test = np.column_stack([
                    np.full_like(theta_full, a_t),
                    np.full_like(theta_full, e_t),
                    theta_full
                ])
                X_test_norm = (X_test - X_mean) / X_std
                Y_pred_norm = model.predict(X_test_norm, verbose=0)
                Y_pred = Y_pred_norm * Y_std + Y_mean
                orbits.append({
                    'label': label, 'e': e_t,
                    'x_true': x_true, 'y_true': y_true,
                    'x_pred': Y_pred[:, 0], 'y_pred': Y_pred[:, 1],
                })

            self.log_message.emit("학습 완료!")
            self.finished_result.emit({
                'orbits': orbits,
                'history': history.history,
            })
        except ImportError:
            self.error_occurred.emit("TensorFlow가 설치되지 않았습니다.")
        except Exception as e:
            self.error_occurred.emit(f"학습 오류: {str(e)}")


class Lab8Widget(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        layout = QHBoxLayout(self)

        left = QVBoxLayout()
        settings = QGroupBox("실험 설정")
        s = QVBoxLayout(settings)

        s.addWidget(QLabel("학습 샘플 수:"))
        self.sample_spin = QSpinBox()
        self.sample_spin.setRange(500, 5000)
        self.sample_spin.setValue(3000)
        self.sample_spin.setSingleStep(500)
        s.addWidget(self.sample_spin)

        s.addWidget(QLabel("Epochs:"))
        self.epoch_spin = QSpinBox()
        self.epoch_spin.setRange(200, 5000)
        self.epoch_spin.setValue(1000)
        self.epoch_spin.setSingleStep(200)
        s.addWidget(self.epoch_spin)

        info = QLabel("물리:\n• r = a(1-e²)/(1+e·cosθ)\n• a: 1~5 AU\n• e: 0~0.9\n\n테스트:\n• a=2, e=0/0.5/0.85")
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
        self.thread = TrainThread(self.epoch_spin.value(), self.sample_spin.value())
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
        colors = ['#3498db', '#e74c3c', '#2ecc71']

        ax1 = self.figure.add_subplot(121)
        for i, orb in enumerate(r['orbits']):
            ax1.plot(orb['x_true'], orb['y_true'], '-', color=colors[i],
                     linewidth=2, label=f"{orb['label']} (실제)")
            ax1.plot(orb['x_pred'], orb['y_pred'], '--', color=colors[i],
                     linewidth=1.5, alpha=0.7, label=f"{orb['label']} (예측)")
        ax1.plot(0, 0, 'yo', markersize=10, label='태양', zorder=5)
        ax1.set_title("케플러 궤도 예측 (a=2 AU)", fontsize=12)
        ax1.set_xlabel("x (AU)")
        ax1.set_ylabel("y (AU)")
        ax1.legend(fontsize=7)
        ax1.set_aspect('equal')
        ax1.grid(True, alpha=0.3)

        ax2 = self.figure.add_subplot(122)
        ax2.plot(r['history']['loss'], label='Train Loss')
        if 'val_loss' in r['history']:
            ax2.plot(r['history']['val_loss'], label='Val Loss')
        ax2.set_title("학습 곡선", fontsize=12)
        ax2.set_xlabel("Epoch")
        ax2.set_ylabel("MSE Loss")
        ax2.set_yscale('log')
        ax2.legend()
        ax2.grid(True, alpha=0.3)

        self.figure.suptitle("Lab 8: Kepler 궤도 예측", fontsize=13, fontweight='bold')
        self.figure.tight_layout()
        self.canvas.draw()

    def save_graph(self):
        if hasattr(self, 'last_result'):
            path = os.path.join("outputs", "08_kepler_orbit.png")
            self.figure.savefig(path, dpi=150, bbox_inches='tight')
            self.log_text.append(f"저장 완료: {path}")
