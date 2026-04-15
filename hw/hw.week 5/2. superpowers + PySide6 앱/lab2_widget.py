import os
import numpy as np
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QPushButton,
                                QLabel, QProgressBar)
from PySide6.QtCore import QThread, Signal
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas


class TrainThread(QThread):
    finished = Signal(dict, dict)
    progress = Signal(int)

    def run(self):
        import tensorflow as tf
        from tensorflow.keras import layers, models

        np.random.seed(42)
        X_train = np.linspace(-3, 3, 20)
        y_train = np.sin(X_train) + np.random.normal(0, 0.1, 20)
        X_test  = np.linspace(-3, 3, 100)
        y_test  = np.sin(X_test)  + np.random.normal(0, 0.1, 100)

        def make_model(kind):
            m = models.Sequential()
            if kind == 'underfit':
                m.add(layers.Dense(1, input_shape=(1,)))
            elif kind == 'overfit':
                m.add(layers.Dense(128, activation='relu', input_shape=(1,)))
                m.add(layers.Dense(128, activation='relu'))
                m.add(layers.Dense(128, activation='relu'))
                m.add(layers.Dense(1))
            else:
                m.add(layers.Dense(16, activation='relu', input_shape=(1,)))
                m.add(layers.Dense(16, activation='relu'))
                m.add(layers.Dense(1))
            m.compile(optimizer='adam', loss='mse')
            return m

        models_dict = {}
        histories  = {}
        kinds = ['underfit', 'balanced', 'overfit']
        for i, kind in enumerate(kinds):
            m = make_model(kind)
            h = m.fit(X_train, y_train, epochs=200, verbose=0,
                      validation_data=(X_test, y_test))
            models_dict[kind] = m
            histories[kind]   = h.history
            self.progress.emit(int((i + 1) / 3 * 100))

        self.finished.emit(models_dict, histories)


class Lab2Widget(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.addWidget(QLabel("<b>Lab 2: Overfitting vs Underfitting</b>"))

        self.run_btn = QPushButton("학습 시작")
        self.run_btn.clicked.connect(self.run)
        layout.addWidget(self.run_btn)

        self.progress = QProgressBar()
        layout.addWidget(self.progress)

        self.figure, self.axes = plt.subplots(1, 2, figsize=(10, 4))
        self.canvas = FigureCanvas(self.figure)
        layout.addWidget(self.canvas)

    def run(self):
        self.run_btn.setEnabled(False)
        self.progress.setValue(0)
        self.thread = TrainThread()
        self.thread.progress.connect(self.progress.setValue)
        self.thread.finished.connect(self.on_finished)
        self.thread.start()

    def on_finished(self, models_dict, histories):
        ax1, ax2 = self.axes
        ax1.clear(); ax2.clear()

        X_train = np.linspace(-3, 3, 20)
        y_train = np.sin(X_train) + np.random.normal(0, 0.1, 20)
        X_plot  = np.linspace(-3, 3, 100).reshape(-1, 1)

        ax1.scatter(X_train, y_train, color='red', label='Train Data', zorder=5)
        for kind, m in models_dict.items():
            ax1.plot(X_plot, m.predict(X_plot, verbose=0), label=f'{kind}')
        ax1.set_title("Model Predictions")
        ax1.legend()

        for kind, h in histories.items():
            ax2.plot(h['val_loss'], label=f'{kind} Val Loss')
        ax2.set_title("Validation Loss")
        ax2.set_xlabel("Epochs")
        ax2.set_ylabel("MSE")
        ax2.set_ylim(0, 0.5)
        ax2.legend()

        self.figure.tight_layout()
        self.canvas.draw()

        path = os.path.join("outputs", "02_overfitting_underfitting.png")
        self.figure.savefig(path, dpi=100, bbox_inches='tight')

        self.run_btn.setEnabled(True)
        self.progress.setValue(100)
