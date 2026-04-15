import os
import numpy as np
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
                                QLabel, QCheckBox, QSpinBox, QProgressBar, QGroupBox)
from PySide6.QtCore import QThread, Signal
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas

class TrainThread(QThread):
    finished = Signal(dict)
    progress = Signal(int)

    def __init__(self, selected, epochs):
        super().__init__()
        self.selected = selected
        self.epochs = epochs

    def run(self):
        import tensorflow as tf
        from tensorflow.keras import layers, models, regularizers

        (x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()
        x_train = x_train.reshape(-1, 784).astype('float32') / 255.0
        x_test  = x_test.reshape(-1, 784).astype('float32') / 255.0
        x_train, y_train = x_train[:1000], y_train[:1000]
        x_test,  y_test  = x_test[:200],  y_test[:200]

        history_dict = {}
        configs = [c for c in ['none', 'l2', 'dropout', 'batch_norm'] if c in self.selected]

        for i, cfg in enumerate(configs):
            model = models.Sequential()
            model.add(layers.Dense(128, activation='relu', input_shape=(784,)))
            if cfg == 'l2':
                model.add(layers.Dense(128, activation='relu',
                                       kernel_regularizer=regularizers.l2(0.01)))
            elif cfg == 'dropout':
                model.add(layers.Dropout(0.5))
                model.add(layers.Dense(128, activation='relu'))
            elif cfg == 'batch_norm':
                model.add(layers.BatchNormalization())
                model.add(layers.Dense(128, activation='relu'))
            else:
                model.add(layers.Dense(128, activation='relu'))
            model.add(layers.Dense(10, activation='softmax'))

            model.compile(optimizer='adam',
                          loss='sparse_categorical_crossentropy',
                          metrics=['accuracy'])
            history = model.fit(x_train, y_train, epochs=self.epochs,
                                batch_size=32,
                                validation_data=(x_test, y_test), verbose=0)
            history_dict[cfg] = history.history['val_loss']
            self.progress.emit(int((i + 1) / len(configs) * 100))

        self.finished.emit(history_dict)


class Lab1Widget(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)

        layout.addWidget(QLabel("<b>Lab 1: 정규화 기법 비교 (Regularization)</b>"))

        # 기법 선택
        box = QGroupBox("적용할 정규화 기법")
        box_layout = QHBoxLayout(box)
        self.checks = {}
        for key, label in [('none','None'), ('l2','L2'), ('dropout','Dropout'), ('batch_norm','BatchNorm')]:
            cb = QCheckBox(label)
            cb.setChecked(True)
            self.checks[key] = cb
            box_layout.addWidget(cb)
        layout.addWidget(box)

        # 에포크 수
        epoch_layout = QHBoxLayout()
        epoch_layout.addWidget(QLabel("에포크 수:"))
        self.epoch_spin = QSpinBox()
        self.epoch_spin.setRange(1, 50)
        self.epoch_spin.setValue(10)
        epoch_layout.addWidget(self.epoch_spin)
        epoch_layout.addStretch()
        layout.addLayout(epoch_layout)

        self.run_btn = QPushButton("학습 시작")
        self.run_btn.clicked.connect(self.run)
        layout.addWidget(self.run_btn)

        self.progress = QProgressBar()
        layout.addWidget(self.progress)

        self.figure, self.ax = plt.subplots(figsize=(8, 4))
        self.canvas = FigureCanvas(self.figure)
        layout.addWidget(self.canvas)

    def run(self):
        selected = [k for k, cb in self.checks.items() if cb.isChecked()]
        if not selected:
            return
        self.run_btn.setEnabled(False)
        self.progress.setValue(0)
        self.thread = TrainThread(selected, self.epoch_spin.value())
        self.thread.progress.connect(self.progress.setValue)
        self.thread.finished.connect(self.on_finished)
        self.thread.start()

    def on_finished(self, history_dict):
        self.ax.clear()
        for cfg, val_loss in history_dict.items():
            self.ax.plot(val_loss, label=cfg)
        self.ax.set_title("Validation Loss — Regularization 비교")
        self.ax.set_xlabel("Epochs")
        self.ax.set_ylabel("Val Loss")
        self.ax.legend()
        self.ax.grid(True)
        self.canvas.draw()

        path = os.path.join("outputs", "01_regularization_plot.png")
        self.figure.savefig(path, dpi=100, bbox_inches='tight')

        self.run_btn.setEnabled(True)
        self.progress.setValue(100)
