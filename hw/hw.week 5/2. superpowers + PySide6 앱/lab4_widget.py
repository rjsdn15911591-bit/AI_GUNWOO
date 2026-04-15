import os
import numpy as np
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
                                QLabel, QComboBox, QTextEdit, QGroupBox, QSplitter)
from PySide6.QtCore import QThread, Signal, Qt
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas


class LoadThread(QThread):
    finished = Signal(dict)

    def __init__(self, num_classes, fine_tune_layers):
        super().__init__()
        self.num_classes = num_classes
        self.fine_tune_layers = fine_tune_layers

    def run(self):
        import tensorflow as tf
        from tensorflow.keras import layers, models

        base_model = tf.keras.applications.MobileNetV2(
            input_shape=(160, 160, 3),
            include_top=False,
            weights='imagenet'
        )
        base_model.trainable = False

        # 파인튜닝: 마지막 N개 레이어 해제
        if self.fine_tune_layers > 0:
            for layer in base_model.layers[-self.fine_tune_layers:]:
                layer.trainable = True

        # Dense 헤드
        act = 'sigmoid' if self.num_classes == 1 else 'softmax'
        model = models.Sequential([
            base_model,
            layers.GlobalAveragePooling2D(),
            layers.Dense(self.num_classes, activation=act)
        ])

        total_params = model.count_params()
        trainable_params = sum(
            tf.size(w).numpy() for w in model.trainable_weights
        )
        non_trainable_params = total_params - trainable_params

        summary_lines = []
        model.summary(print_fn=lambda x: summary_lines.append(x))

        self.finished.emit({
            'summary': '\n'.join(summary_lines),
            'total': total_params,
            'trainable': trainable_params,
            'non_trainable': non_trainable_params,
        })


class Lab4Widget(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.addWidget(QLabel("<b>Lab 4: 전이 학습 (Transfer Learning)</b>"))

        # 설정
        cfg = QGroupBox("모델 설정")
        cfg_layout = QHBoxLayout(cfg)

        cfg_layout.addWidget(QLabel("출력 클래스:"))
        self.class_combo = QComboBox()
        self.class_combo.addItems(["1 (Binary)", "10 (MNIST)", "100 (CIFAR-100)"])
        cfg_layout.addWidget(self.class_combo)

        cfg_layout.addWidget(QLabel("파인튜닝 레이어:"))
        self.ft_combo = QComboBox()
        self.ft_combo.addItems(["0 (전부 동결)", "10개 해제", "30개 해제"])
        cfg_layout.addWidget(self.ft_combo)

        layout.addWidget(cfg)

        self.run_btn = QPushButton("모델 로드")
        self.run_btn.clicked.connect(self.run)
        layout.addWidget(self.run_btn)

        # 요약 텍스트 + 차트 (좌우 분할)
        splitter = QSplitter(Qt.Horizontal)

        self.summary_text = QTextEdit()
        self.summary_text.setReadOnly(True)
        self.summary_text.setFont(self.summary_text.font())
        splitter.addWidget(self.summary_text)

        self.figure, self.axes = plt.subplots(1, 2, figsize=(6, 4))
        self.canvas = FigureCanvas(self.figure)
        splitter.addWidget(self.canvas)

        splitter.setSizes([350, 350])
        layout.addWidget(splitter)

    def run(self):
        self.run_btn.setEnabled(False)
        self.summary_text.setText("모델 로딩 중...")

        num_classes = [1, 10, 100][self.class_combo.currentIndex()]
        fine_tune = [0, 10, 30][self.ft_combo.currentIndex()]

        self.thread = LoadThread(num_classes, fine_tune)
        self.thread.finished.connect(self.on_finished)
        self.thread.start()

    def on_finished(self, info):
        self.summary_text.setText(info['summary'])

        ax1, ax2 = self.axes
        ax1.clear(); ax2.clear()

        trainable = info['trainable']
        non_trainable = info['non_trainable']

        # 막대 차트
        ax1.bar(['Trainable', 'Non-Trainable'],
                [trainable, non_trainable],
                color=['#1a6b3a', '#a5d6a7'])
        ax1.set_title("파라미터 수 비교")
        ax1.set_ylabel("파라미터 수")

        # 파이 차트
        ax2.pie([trainable, non_trainable],
                labels=[f"Trainable\n{trainable:,}", f"Frozen\n{non_trainable:,}"],
                colors=['#1a6b3a', '#a5d6a7'],
                autopct='%1.1f%%')
        ax2.set_title("학습 가능 비율")

        self.figure.tight_layout()
        self.canvas.draw()

        path = os.path.join("outputs", "04_transfer_learning_summary.txt")
        with open(path, 'w') as f:
            f.write(info['summary'])

        self.run_btn.setEnabled(True)
