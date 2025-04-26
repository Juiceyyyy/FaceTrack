import os
import glob
import cv2
import numpy as np
from insightface.app import FaceAnalysis  # type: ignore
from typing import List, Dict

CURRENT_DIR = os.path.dirname(__file__)
DOWNLOAD_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
MODELS_DIR = os.path.join(DOWNLOAD_DIR, "models")
MODEL_DIR = os.path.join(MODELS_DIR, "buffalo_l")

REQUIRED_FILES = [
    "1k3d68.onnx",
    "2d106det.onnx",
    "det_10g.onnx",
    "genderage.onnx",
    "w600k_r50.onnx"
]

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    v1 = np.array(vec1)
    v2 = np.array(vec2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(v1, v2) / (norm1 * norm2))

class FaceAnalyzer:
    def __init__(self):
        self._verify_and_download()
        self._delete_zip_files()
        self._init_model()

    def _verify_and_download(self):
        """
        If the buffalo_l folder or required files are missing in <DOWNLOAD_DIR>/models/buffalo_l,
        call FaceAnalysis(..., download=True) so that the library automatically
        creates the 'models/buffalo_l' structure.
        """
        
        missing = []
        if not os.path.exists(MODEL_DIR):
            print(f"🚨 {MODEL_DIR} not found. Downloading models now...")
            FaceAnalysis(name="buffalo_l", root=DOWNLOAD_DIR, download=True)
        else:
            # Check for missing required files in MODEL_DIR
            for fname in REQUIRED_FILES:
                if not os.path.exists(os.path.join(MODEL_DIR, fname)):
                    missing.append(fname)
            if missing:
                print(f"🚨 Missing model files: {missing}. Downloading models now...")
                FaceAnalysis(name="buffalo_l", root=DOWNLOAD_DIR, download=True)

        # Final verification
        still_missing = [f for f in REQUIRED_FILES if not os.path.exists(os.path.join(MODEL_DIR, f))]
        if still_missing:
            raise FileNotFoundError(
                f"❌ Could not download the following model files: {still_missing}. "
                f"Please place them manually in {MODEL_DIR}."
            )
        else:
            print("✅ All buffalo_l model files are present.")

    def _delete_zip_files(self):
        """
        Delete any .zip files found in MODELS_DIR and MODEL_DIR.
        This ensures that any leftover ZIP files (e.g. buffalo_l.zip in the parent folder) are removed.
        """
        # Delete zip files in MODELS_DIR (the parent folder)
        parent_zip_files = glob.glob(os.path.join(MODELS_DIR, "*.zip"))
        for zip_file in parent_zip_files:
            try:
                os.remove(zip_file)
                print(f"🗑️ Deleted zip file from MODELS_DIR: {os.path.basename(zip_file)}")
            except Exception as e:
                print(f"⚠️ Could not delete zip file {os.path.basename(zip_file)} in MODELS_DIR: {e}")

        # Delete zip files in MODEL_DIR
        model_zip_files = glob.glob(os.path.join(MODEL_DIR, "*.zip"))
        for zip_file in model_zip_files:
            try:
                os.remove(zip_file)
                print(f"🗑️ Deleted zip file from MODEL_DIR: {os.path.basename(zip_file)}")
            except Exception as e:
                print(f"⚠️ Could not delete zip file {os.path.basename(zip_file)} in MODEL_DIR: {e}")

    def _init_model(self):
        """Initialize face analysis model with GPU fallback."""
        try:
            self.app = FaceAnalysis(name="buffalo_l", root=DOWNLOAD_DIR)
            self.app.prepare(ctx_id=0, det_size=(640, 640))
            print("✅ Face detector initialized with GPU acceleration.")
        except Exception as e:
            print(f"⚠️ GPU initialization failed: {e}, falling back to CPU.")
            self.app = FaceAnalysis(name="buffalo_l", root=DOWNLOAD_DIR)
            self.app.prepare(ctx_id=-1, det_size=(640, 640))
            print("✅ Face detector initialized with CPU.")

    def detect_faces(self, image: np.ndarray) -> List[Dict]:
        if not isinstance(image, np.ndarray):
            raise ValueError("Input must be a numpy array")
        if image.ndim == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        elif image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
        faces = self.app.get(image)
        return [{
            "bbox": face.bbox.astype(int).tolist(),
            "embedding": face.normed_embedding.tolist(),
            "landmarks": face.landmark_2d_106.tolist(),
            "confidence": float(face.det_score),
        } for face in faces]

# -------------------------------
# MODULE INITIALIZATION
# -------------------------------
try:
    face_analyzer = FaceAnalyzer()
except Exception as ex:
    print(f"❌ Error initializing FaceAnalyzer: {ex}")
    raise
