import os
import numpy as np
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
                                QLabel, QProgressBar, QSpinBox, QGroupBox)
from PySide6.QtCore import QThread, Signal
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas


class TrainThread(QThread):
    finished = Signal(dict, object, object, object)
    progress = Signal(int)

    def __init__(self, epochs):
        super().__init__()
        self.epochs = epochs

    def run(self):
        import tensorflow as tf
        from tensorflow.keras import layers, models

        (train_images, train_labels), (test_images, test_labels) = \
            tf.keras.datasets.mnist.load_data()

        train_images = train_images.reshape(-1, 28, 28, 1).astype('float32') / 255.0
        test_images  = test_images.reshape(-1, 28, 28, 1).astype('float32') / 255.0

        model = models.Sequential([
            layers.Conv2D(32, (3, 3), activation='relu', input_shape=(28, 28, 1)),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(64, (3, 3), activation='relu'),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(64, (3, 3), activation='relu'),
            layers.Flatten(),
            layers.Dense(64, activation='relu'),
            layers.Dense(10, activation='softmax'),
        ])
        model.compile(optimizer='adam',
                      loss='sparse_categorical_crossentropy',
                      metrics=['accuracy'])

        class ProgressCB(tf.keras.callbacks.Callback):
            def __init__(self, total, signal):
                super().__init__()
                self.total = total
                self.signal = signal

            def on_epoch_end(self, epoch, logs=None):
                self.signal.emit(int((epoch + 1) / self.total * 100))

        history = model.fit(
            train_images, train_labels,
            epochs=self.epochs, batch_size=64,
            validation_data=(test_images, test_labels),
            verbose=0,
            callbacks=[ProgressCB(self.epochs, self.progress)]
        )

        preds = model.predict(test_images[:9], verbose=0)
        pred_labels = np.argmax(preds, axis=1)

        self.finished.emit(history.history, test_images[:9],
                           test_labels[:9], pred_labels)


class Lab5Widget(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.addWidget(QLabel("<b>Lab 5: CNN — MNIST 분류</b>"))

        epoch_row = QHBoxLayout()
        epoch_row.addWidget(QLabel("에포크 수:"))
        self.epoch_spin = QSpinBox()
        self.epoch_spin.setRange(1, 10)
        self.epoch_spin.setValue(3)
        epoch_row.addWidget(self.epoch_spin)
        epoch_row.addStretch()
        layout.addLayout(epoch_row)

        self.run_btn = QPushButton("학습 시작")
        self.run_btn.clicked.connect(self.run)
        layout.addWidget(self.run_btn)

        self.progress = QProgressBar()
        layout.addWidget(self.progress)

        self.status = QLabel("")
        layout.addWidget(self.status)

        self.figure = plt.figure(figsize=(12, 4))
        self.canvas = FigureCanvas(self.figure)
        layout.addWidget(self.canvas)

    def run(self):
        self.run_btn.setEnabled(False)
        self.progress.setValue(0)
        self.status.setText("학습 중...")
        self.thread = TrainThread(self.epoch_spin.value())
        self.thread.progress.connect(self.progress.setValue)
        self.thread.finished.connect(self.on_finished)
        self.thread.start()

    def on_finished(self, history, sample_imgs, true_labels, pred_labels):
        self.figure.clear()

        # 왼쪽: 정확도 곡선
        ax1 = self.figure.add_subplot(1, 2, 1)
        ax1.plot(history['accuracy'], label='Train Acc')
        ax1.plot(history['val_accuracy'], label='Val Acc')
        ax1.set_title("MNIST CNN Training Accuracy")
        ax1.set_xlabel("Epoch")
        ax1.set_ylabel("Accuracy")
        ax1.set_ylim(0.8, 1.0)
        ax1.legend()
        ax1.grid(True)

        final_acc = history['val_accuracy'][-1]
        self.status.setText(f"테스트 정확도: {final_acc:.4f}")

        # 오른쪽: 3×3 예측 그리드
        for i in range(9):
            ax = self.figure.add_subplot(3, 6, i + 10)  # 오른쪽 절반 (열 4-6)
            ax.imshow(sample_imgs[i].reshape(28, 28), cmap='gray')
            color = 'green' if pred_labels[i] == true_labels[i] else 'red'
            ax.set_title(f"P:{pred_labels[i]} T:{true_labels[i]}",
                         color=color, fontsize=8)
            ax.axis('off')

        self.figure.suptitle("CNN Predictions (Green=정답, Red=오답)", fontsize=10)
        self.figure.tight_layout()
        self.canvas.draw()

        path = os.path.join("outputs", "05_mnist_cnn_result.png")
        self.figure.savefig(path, dpi=100, bbox_inches='tight')

        self.run_btn.setEnabled(True)
        self.progress.setValue(100)
