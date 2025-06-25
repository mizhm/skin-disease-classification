import os
import glob
import numpy as np
import tensorflow as tf
import json
from flask import Flask, request, render_template, redirect, url_for
from tensorflow.keras.preprocessing.image import load_img, img_to_array # type: ignore
from tensorflow.keras.applications.resnet_v2 import preprocess_input # Import the specific preprocessing function

app = Flask(__name__)

MODEL_PATH = 'skin_disease_resnet.keras'

try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print(f"Mô hình đã được tải thành công từ {MODEL_PATH}")
except Exception as e:
    print(f"Lỗi khi tải mô hình từ {MODEL_PATH}: {e}")
    print("Vui lòng đảm bảo file mô hình tồn tại và đúng định dạng Keras.")
    model = None

class_names = [
    'Actinic Keratoses and Intraepithelial Carcinoma (Bowen\'s Disease)',  # akiec
    'Basal Cell Carcinoma',  # bcc
    'Benign Keratosis-like Lesions',  # bkl
    'Dermatofibroma',  # df
    'Melanoma',  # mel
    'Melanocytic Nevi',  # nv
    'Vascular Lesions'  # vasc
]

try:
    with open('disease_details.json', 'r', encoding='utf-8') as file:
        disease_details = json.load(file)
    print("Thông tin chi tiết về bệnh đã được tải thành công.")
except FileNotFoundError:
    print("Lỗi: File 'disease_details.json' không tìm thấy. Tạo file rỗng.")
    disease_details = {}
except json.JSONDecodeError:
    print("Lỗi: Không thể giải mã 'disease_details.json'. Đảm bảo định dạng JSON hợp lệ.")
    disease_details = {}


def delete_all_image_files_in_static():
    folder = 'static'
    if not os.path.exists(folder):
        os.makedirs(folder)

    image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.gif']

    for ext in image_extensions:
        files = glob.glob(os.path.join(folder, ext))
        for f in files:
            try:
                os.remove(f)
                print(f"Đã xóa: {f}")
            except Exception as e:
                print(f"Lỗi khi xóa file {f}: {e}")

def model_predict(img_path, model, class_names, confidence_threshold=0.8):
    if model is None:
        return "Lỗi: Mô hình không được tải", 0.0

    img = load_img(img_path, target_size=(224, 224))
    img_array = img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)

    img_array = preprocess_input(img_array)

    preds = model.predict(img_array)
    predicted_class_index = np.argmax(preds[0])
    predicted_class_confidence = preds[0][predicted_class_index]

    if predicted_class_confidence < confidence_threshold:
        return "Unknown", predicted_class_confidence
    else:
        predicted_class = class_names[predicted_class_index]
        return predicted_class, predicted_class_confidence


@app.route('/', methods=['GET'])
def index():
    delete_all_image_files_in_static()
    return render_template('index.html', prediction=None, img_path=None, details=None, accuracy=None)

@app.route('/predict', methods=['POST'])
def upload():
    delete_all_image_files_in_static()

    if 'file' not in request.files:
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        return redirect(request.url)
    if file:
        file_path = os.path.join('static', file.filename)
        file.save(file_path)

        predicted_class, accurate = model_predict(file_path, model, class_names)

        details = disease_details.get(predicted_class, None)
        print(f"Đã nhận file: {file.filename}, Dự đoán: {predicted_class}, Độ chính xác: {accurate:.2f}")

        # Trả về kết quả cho template
        return render_template('index.html',
                               prediction=predicted_class,
                               img_path=file.filename, # Truyền tên file ảnh để hiển thị
                               details=details,
                               accuracy=round(accurate*100, 2))
    return None


if __name__ == '__main__':
    app.run(debug=True)

