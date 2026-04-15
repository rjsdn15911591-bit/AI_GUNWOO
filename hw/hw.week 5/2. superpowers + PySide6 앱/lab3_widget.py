import numpy as np
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
                                QLabel, QSlider, QGroupBox)
from PySide6.QtCore import Qt
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
import os


class Lab3Widget(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.addWidget(QLabel("<b>Lab 3: 데이터 증강 (Data Augmentation)</b>"))

        # 슬라이더 그룹
        ctrl = QGroupBox("증강 파라미터")
        ctrl_layout = QVBoxLayout(ctrl)

        # Rotation
        rot_row = QHBoxLayout()
        rot_row.addWidget(QLabel("Rotation:"))
        self.rot_slider = QSlider(Qt.Horizontal)
        self.rot_slider.setRange(0, 50)   # 0.00 ~ 0.50 (×0.01)
        self.rot_slider.setValue(20)
        self.rot_label = QLabel("0.20")
        self.rot_slider.valueChanged.connect(
            lambda v: self.rot_label.setText(f"{v/100:.2f}"))
        rot_row.addWidget(self.rot_slider)
        rot_row.addWidget(self.rot_label)
        ctrl_layout.addLayout(rot_row)

        # Zoom
        zoom_row = QHBoxLayout()
        zoom_row.addWidget(QLabel("Zoom:    "))
        self.zoom_slider = QSlider(Qt.Horizontal)
        self.zoom_slider.setRange(0, 50)
        self.zoom_slider.setValue(20)
        self.zoom_label = QLabel("0.20")
        self.zoom_slider.valueChanged.connect(
            lambda v: self.zoom_label.setText(f"{v/100:.2f}"))
        zoom_row.addWidget(self.zoom_slider)
        zoom_row.addWidget(self.zoom_label)
        ctrl_layout.addLayout(zoom_row)

        layout.addWidget(ctrl)

        self.run_btn = QPushButton("증강 이미지 생성")
        self.run_btn.clicked.connect(self.run)
        layout.addWidget(self.run_btn)

        self.figure, self.axes = plt.subplots(3, 3, figsize=(7, 7))
        self.canvas = FigureCanvas(self.figure)
        layout.addWidget(self.canvas)

    def run(self):
        import tensorflow as tf
        from tensorflow.keras import layers

        rotation = self.rot_slider.value() / 100.0
        zoom = self.zoom_slider.value() / 100.0

        # 원본 이미지 준비 (MNIST[0])
        (x_train, _), _ = tf.keras.datasets.mnist.load_data()
        image = x_train[0]
        image = np.expand_dims(image, axis=-1)
        image = tf.image.grayscale_to_rgb(tf.convert_to_tensor(image))
        image = tf.image.resize(image, [100, 100])
        image = tf.expand_dims(image, 0) / 255.0  # (1, 100, 100, 3)

        augmenter = tf.keras.Sequential([
            layers.RandomFlip("horizontal_and_vertical"),
            layers.RandomRotation(rotation),
            layers.RandomZoom(zoom),
        ])

        for ax in self.axes.flatten():
            ax.clear()

        for i, ax in enumerate(self.axes.flatten()):
            aug_img = augmenter(image)
            ax.imshow(aug_img[0].numpy())
            ax.axis("off")
            ax.set_title(f"#{i+1}", fontsize=8)

        self.figure.suptitle(
            f"Data Augmentation (rot={rotation:.2f}, zoom={zoom:.2f})",
            fontsize=10)
        self.figure.tight_layout()
        self.canvas.draw()

        path = os.path.join("outputs", "03_augmentation_examples.png")
        self.figure.savefig(path, dpi=100, bbox_inches='tight')
