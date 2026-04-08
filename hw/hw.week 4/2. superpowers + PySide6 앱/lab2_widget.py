"""Lab 2: 포물선 운동 회귀"""

import numpy as np
import os
import matplotlib
matplotlib.rcParams["axes.unicode_minus"] = False

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QProgressBar, QGroupBox, QSpinBox, QTextEdit,
    QCheckBox, QDoubleSpinBox
)
from PySide6.QtCore import QThread, Signal

from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure


class TrainThread(QThread):
    progress = Signal(int)
    log_message = Signal(str)
    finished_result = Signal(dict)
    error_occurred = Signal(str)

    def __init__(self, epochs, n_samples, use_drag=False, drag_k=0.1):
        super().__init__()
        self.epochs = epochs
        self.n_samples = n_samples
        self.use_drag = use_drag
        self.drag_k = drag_k

    def run(self):
        try:
            import tensorflow as tf
            from tensorflow import keras
            tf.get_logger().setLevel('ERROR')

            g = 9.8
            self.log_message.emit("포물선 운동 데이터 생성 중...")

            # 데이터 생성
            v0 = np.random.uniform(10, 50, self.n_samples)
            theta = np.random.uniform(np.radians(10), np.radians(80), self.n_samples)
            t_flight = 2 * v0 * np.sin(theta) / g
            t = np.random.uniform(0, 1, self.n_samples) * t_flight

            if self.use_drag:
                self.log_message.emit(f"공기 저항 RK4 계산 중 (k={self.drag_k})...")
                def rk4_drag(v0_, th_, t_end, k, dt=0.01):
                    state = np.array([0.0, 0.0, v0_*np.cos(th_), v0_*np.sin(th_)])
                    t_cur = 0.0
                    while t_cur < t_end:
                        def deriv(s):
                            return np.array([s[2], s[3], -k*s[2], -g - k*s[3]])
                        k1 = deriv(state)
                        k2 = deriv(state + 0.5*dt*k1)
                        k3 = deriv(state + 0.5*dt*k2)
                        k4 = deriv(state + dt*k3)
                        state = state + (dt/6)*(k1 + 2*k2 + 2*k3 + k4)
                        t_cur += dt
                    return state[0], max(state[1], 0)
                xy = np.array([rk4_drag(v0[i], theta[i], t[i], self.drag_k) for i in range(self.n_samples)])
                x_data = xy[:, 0] + np.random.normal(0, 0.5, self.n_samples)
                y_data = np.maximum(xy[:, 1] + np.random.normal(0, 0.5, self.n_samples), 0)
            else:
                x_data = v0 * np.cos(theta) * t + np.random.normal(0, 0.5, self.n_samples)
                y_data = v0 * np.sin(theta) * t - 0.5 * g * t**2 + np.random.normal(0, 0.5, self.n_samples)
                y_data = np.maximum(y_data, 0)

            # 입력/출력
            X = np.column_stack([v0, theta, t])
            Y = np.column_stack([x_data, y_data])

            # 정규화
            X_mean, X_std = X.mean(axis=0), X.std(axis=0)
            Y_mean, Y_std = Y.mean(axis=0), Y.std(axis=0)
            X_norm = (X - X_mean) / X_std
            Y_norm = (Y - Y_mean) / Y_std

            # 셔플
            perm = np.random.permutation(len(X_norm))
            X_norm = X_norm[perm]
            Y_norm = Y_norm[perm]

            # 모델
            model = keras.Sequential([
                keras.layers.Dense(128, activation='relu'),
                keras.layers.Dropout(0.1),
                keras.layers.Dense(64, activation='relu'),
                keras.layers.Dropout(0.1),
                keras.layers.Dense(32, activation='relu'),
                keras.layers.Dropout(0.1),
                keras.layers.Dense(2, activation='linear')
            ])
            model.compile(optimizer=keras.optimizers.Adam(0.001), loss='mse')

            class CB(keras.callbacks.Callback):
                def __init__(self, thread):
                    super().__init__()
                    self.thread = thread
                def on_epoch_end(self, epoch, logs=None):
                    self.thread.progress.emit(int((epoch + 1) / self.thread.epochs * 100))
                    if (epoch + 1) % 200 == 0:
                        self.thread.log_message.emit(f"  Epoch {epoch+1} - loss: {logs['loss']:.6f}")

            self.log_message.emit(f"학습 시작 ({self.epochs} epochs)...")
            history = model.fit(X_norm, Y_norm, epochs=self.epochs, batch_size=32,
                                validation_split=0.2, verbose=0, callbacks=[CB(self)])

            # 테스트 조건별 예측
            test_configs = [
                (20, 30, "v0=20m/s, θ=30°"),
                (30, 45, "v0=30m/s, θ=45°"),
                (40, 60, "v0=40m/s, θ=60°"),
            ]

            trajectories = []
            for v, ang, label in test_configs:
                th = np.radians(ang)
                tf_val = 2 * v * np.sin(th) / g
                t_arr = np.linspace(0, tf_val, 100)
                x_true = v * np.cos(th) * t_arr
                y_true = v * np.sin(th) * t_arr - 0.5 * g * t_arr ** 2

                X_test = np.column_stack([
                    np.full_like(t_arr, v),
                    np.full_like(t_arr, th),
                    t_arr
                ])
                X_test_norm = (X_test - X_mean) / X_std
                Y_pred_norm = model.predict(X_test_norm, verbose=0)
                Y_pred = Y_pred_norm * Y_std + Y_mean

                trajectories.append({
                    'label': label,
                    'x_true': x_true, 'y_true': y_true,
                    'x_pred': Y_pred[:, 0], 'y_pred': np.maximum(Y_pred[:, 1], 0)
                })

            self.log_message.emit("학습 완료!")
            self.finished_result.emit({
                'trajectories': trajectories,
                'history': history.history,
                'use_drag': self.use_drag,
                'drag_k': self.drag_k,
            })

        except ImportError:
            self.error_occurred.emit("TensorFlow가 설치되지 않았습니다.")
        except Exception as e:
            self.error_occurred.emit(f"학습 오류: {str(e)}")


class Lab2Widget(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        layout = QHBoxLayout(self)

        # 왼쪽 패널
        left = QVBoxLayout()
        settings = QGroupBox("실험 설정")
        s = QVBoxLayout(settings)

        s.addWidget(QLabel("학습 샘플 수:"))
        self.sample_spin = QSpinBox()
        self.sample_spin.setRange(500, 5000)
        self.sample_spin.setValue(2000)
        self.sample_spin.setSingleStep(500)
        s.addWidget(self.sample_spin)

        s.addWidget(QLabel("Epochs:"))
        self.epoch_spin = QSpinBox()
        self.epoch_spin.setRange(100, 5000)
        self.epoch_spin.setValue(1000)
        self.epoch_spin.setSingleStep(200)
        s.addWidget(self.epoch_spin)

        info = QLabel("테스트 조건:\n• v0=20m/s, θ=30°\n• v0=30m/s, θ=45°\n• v0=40m/s, θ=60°")
        info.setStyleSheet("color: #555; padding: 8px; background: #f0f0f0; border-radius: 4px;")
        s.addWidget(info)

        self.drag_check = QCheckBox("공기 저항 포함")
        s.addWidget(self.drag_check)

        drag_row = QHBoxLayout()
        drag_row.addWidget(QLabel("항력 계수 k:"))
        self.drag_spin = QDoubleSpinBox()
        self.drag_spin.setRange(0.01, 1.0)
        self.drag_spin.setValue(0.1)
        self.drag_spin.setSingleStep(0.05)
        self.drag_spin.setEnabled(False)
        drag_row.addWidget(self.drag_spin)
        s.addLayout(drag_row)
        self.drag_check.toggled.connect(self.drag_spin.setEnabled)

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

        # 오른쪽 그래프
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

        self.thread = TrainThread(
            self.epoch_spin.value(),
            self.sample_spin.value(),
            use_drag=self.drag_check.isChecked(),
            drag_k=self.drag_spin.value()
        )
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
        colors = ['#e74c3c', '#2ecc71', '#3498db']

        # 궤적
        ax1 = self.figure.add_subplot(121)
        for i, traj in enumerate(r['trajectories']):
            ax1.plot(traj['x_true'], traj['y_true'], '-', color=colors[i], linewidth=2, label=f"{traj['label']} (실제)")
            ax1.plot(traj['x_pred'], traj['y_pred'], '--', color=colors[i], linewidth=2, alpha=0.7, label=f"{traj['label']} (예측)")
        drag_label = f" (공기저항 k={r['drag_k']})" if r.get('use_drag') else ""
        ax1.set_title(f"포물선 운동 궤적{drag_label}", fontsize=13)
        ax1.set_xlabel("수평 거리 (m)")
        ax1.set_ylabel("수직 높이 (m)")
        ax1.legend(fontsize=8)
        ax1.grid(True, alpha=0.3)

        # 학습 곡선
        ax2 = self.figure.add_subplot(122)
        ax2.plot(r['history']['loss'], label='Train Loss')
        if 'val_loss' in r['history']:
            ax2.plot(r['history']['val_loss'], label='Val Loss')
        ax2.set_title("학습 곡선", fontsize=13)
        ax2.set_xlabel("Epoch")
        ax2.set_ylabel("MSE Loss")
        ax2.set_yscale('log')
        ax2.legend()
        ax2.grid(True, alpha=0.3)

        self.figure.tight_layout()
        self.canvas.draw()

    def save_graph(self):
        if hasattr(self, 'last_result'):
            path = os.path.join("outputs", "02_projectile_trajectories.png")
            self.figure.savefig(path, dpi=150, bbox_inches='tight')
            self.log_text.append(f"저장 완료: {path}")
