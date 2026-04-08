"""Lab 3: 과적합 vs 과소적합 데모"""

import numpy as np
import os
import matplotlib
matplotlib.rcParams["axes.unicode_minus"] = False

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QProgressBar, QGroupBox, QSpinBox, QTextEdit,
    QComboBox, QDoubleSpinBox
)
from PySide6.QtCore import QThread, Signal

from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure


class TrainThread(QThread):
    progress = Signal(int)
    log_message = Signal(str)
    finished_result = Signal(dict)
    error_occurred = Signal(str)

    def __init__(self, epochs, n_samples, reg_type='없음', reg_lambda=0.001):
        super().__init__()
        self.epochs = epochs
        self.n_samples = n_samples
        self.reg_type = reg_type
        self.reg_lambda = reg_lambda

    def run(self):
        try:
            import tensorflow as tf
            from tensorflow import keras
            tf.get_logger().setLevel('ERROR')

            self.log_message.emit("테스트 데이터 생성 중...")

            # 데이터 생성: y = sin(2x) + 0.5x + noise
            np.random.seed(42)
            x = np.linspace(-3, 3, self.n_samples).reshape(-1, 1)
            y_clean = np.sin(2 * x) + 0.5 * x
            noise = np.random.normal(0, 0.3, x.shape)
            y = y_clean + noise

            perm = np.random.permutation(len(x))
            x_s, y_s = x[perm], y[perm]

            x_test = np.linspace(-3, 3, 300).reshape(-1, 1)
            y_test_clean = np.sin(2 * x_test) + 0.5 * x_test

            # 3가지 모델
            configs = [
                ("Underfit [4]", [4], 0, '#e74c3c'),
                ("Good Fit [32,16]+Dropout", [32, 16], 0.2, '#2ecc71'),
                ("Overfit [256,128,64,32]", [256, 128, 64, 32], 0, '#3498db'),
            ]

            results = []
            total_steps = len(configs) * self.epochs
            step = 0

            for name, layers, dropout, color in configs:
                self.log_message.emit(f"\n{name} 모델 학습 중...")

                if "Good Fit" in name and self.reg_type != '없음':
                    lam = self.reg_lambda
                    reg_map = {
                        'L1': keras.regularizers.l1(lam),
                        'L2': keras.regularizers.l2(lam),
                        'L1+L2': keras.regularizers.l1_l2(l1=lam, l2=lam),
                    }
                    regularizer = reg_map[self.reg_type]
                else:
                    regularizer = None

                model = keras.Sequential()
                for units in layers:
                    model.add(keras.layers.Dense(units, activation='relu',
                                                 kernel_regularizer=regularizer))
                    if dropout > 0:
                        model.add(keras.layers.Dropout(dropout))
                model.add(keras.layers.Dense(1, activation='linear'))
                model.compile(optimizer=keras.optimizers.Adam(0.001), loss='mse')

                class CB(keras.callbacks.Callback):
                    def __init__(self, thread, offset, total):
                        super().__init__()
                        self.thread = thread
                        self.offset = offset
                        self.total = total
                    def on_epoch_end(self, epoch, logs=None):
                        pct = int((self.offset + epoch + 1) / self.total * 100)
                        self.thread.progress.emit(pct)

                history = model.fit(x_s, y_s, epochs=self.epochs, batch_size=16,
                                    validation_split=0.2, verbose=0,
                                    callbacks=[CB(self, step, total_steps)])
                step += self.epochs

                y_pred = model.predict(x_test, verbose=0)

                train_loss = history.history['loss'][-1]
                val_loss = history.history['val_loss'][-1]
                self.log_message.emit(f"  Train Loss: {train_loss:.6f} | Val Loss: {val_loss:.6f}")

                results.append({
                    'name': name, 'color': color,
                    'y_pred': y_pred.flatten(),
                    'history': history.history,
                    'train_loss': train_loss,
                    'val_loss': val_loss,
                })

            self.log_message.emit("\n모든 모델 학습 완료!")
            self.finished_result.emit({
                'results': results,
                'x_test': x_test.flatten(),
                'y_test_clean': y_test_clean.flatten(),
                'x_train': x.flatten(),
                'y_train': y.flatten(),
                'reg_type': self.reg_type,
                'reg_lambda': self.reg_lambda,
            })

        except ImportError:
            self.error_occurred.emit("TensorFlow가 설치되지 않았습니다.")
        except Exception as e:
            self.error_occurred.emit(f"학습 오류: {str(e)}")


class Lab3Widget(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        layout = QHBoxLayout(self)

        left = QVBoxLayout()
        settings = QGroupBox("실험 설정")
        s = QVBoxLayout(settings)

        s.addWidget(QLabel("학습 데이터 수:"))
        self.sample_spin = QSpinBox()
        self.sample_spin.setRange(50, 500)
        self.sample_spin.setValue(100)
        s.addWidget(self.sample_spin)

        s.addWidget(QLabel("Epochs:"))
        self.epoch_spin = QSpinBox()
        self.epoch_spin.setRange(50, 1000)
        self.epoch_spin.setValue(200)
        self.epoch_spin.setSingleStep(50)
        s.addWidget(self.epoch_spin)

        info = QLabel("비교 모델:\n• Underfit: [4]\n• Good Fit: [32,16]+Dropout\n• Overfit: [256,128,64,32]")
        info.setStyleSheet("color: #555; padding: 8px; background: #f0f0f0; border-radius: 4px;")
        s.addWidget(info)

        s.addWidget(QLabel("Regularization (Good Fit):"))
        self.reg_combo = QComboBox()
        self.reg_combo.addItems(['없음', 'L1', 'L2', 'L1+L2'])
        s.addWidget(self.reg_combo)

        reg_row = QHBoxLayout()
        reg_row.addWidget(QLabel("λ:"))
        self.reg_spin = QDoubleSpinBox()
        self.reg_spin.setRange(0.0001, 0.1)
        self.reg_spin.setValue(0.001)
        self.reg_spin.setSingleStep(0.001)
        self.reg_spin.setDecimals(4)
        reg_row.addWidget(self.reg_spin)
        s.addLayout(reg_row)

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

        self.thread = TrainThread(
            self.epoch_spin.value(),
            self.sample_spin.value(),
            reg_type=self.reg_combo.currentText(),
            reg_lambda=self.reg_spin.value()
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

        # 상단: 3개 모델 예측 비교
        for i, res in enumerate(r['results']):
            ax = self.figure.add_subplot(2, 3, i + 1)
            ax.scatter(r['x_train'], r['y_train'], s=10, alpha=0.3, c='gray', label='데이터')
            ax.plot(r['x_test'], r['y_test_clean'], 'k-', linewidth=1.5, label='실제 함수')
            ax.plot(r['x_test'], res['y_pred'], '--', color=res['color'], linewidth=2, label='NN 예측')
            title = res['name']
            if 'Good Fit' in res['name'] and r.get('reg_type', '없음') != '없음':
                title += f"\n({r['reg_type']} λ={r.get('reg_lambda', '')})"
            ax.set_title(title, fontsize=11, color=res['color'])
            ax.legend(fontsize=7)
            ax.grid(True, alpha=0.3)

        # 하단: 학습 곡선
        for i, res in enumerate(r['results']):
            ax = self.figure.add_subplot(2, 3, i + 4)
            ax.plot(res['history']['loss'], label='Train', color=res['color'])
            ax.plot(res['history']['val_loss'], '--', label='Val', color=res['color'], alpha=0.7)
            ax.set_title(f"Train: {res['train_loss']:.4f} | Val: {res['val_loss']:.4f}", fontsize=9)
            ax.set_xlabel("Epoch")
            ax.set_ylabel("Loss")
            ax.legend(fontsize=8)
            ax.grid(True, alpha=0.3)

        self.figure.suptitle("과적합 vs 과소적합 비교", fontsize=14, fontweight='bold')
        self.figure.tight_layout()
        self.canvas.draw()

    def save_graph(self):
        if hasattr(self, 'last_result'):
            path = os.path.join("outputs", "03_overfitting_comparison.png")
            self.figure.savefig(path, dpi=150, bbox_inches='tight')
            self.log_text.append(f"저장 완료: {path}")
