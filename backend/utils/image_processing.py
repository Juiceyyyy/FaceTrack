# -------------------------------
# IMAGE PROCESSING UTILITIES
# -------------------------------
# Features:
# 1. Image validation
# 2. Face detection helpers
# 3. Image conversion utilities
# -------------------------------

import cv2
import numpy as np
from typing import Tuple, List

def validate_image(image: np.ndarray) -> np.ndarray:
    """Ensure image is in correct format for processing"""
    if image is None:
        raise ValueError("Invalid image input")
    
    # Convert grayscale to RGB
    if len(image.shape) == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
    
    # Remove alpha channel if present
    if image.shape[2] == 4:
        image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
        
    return image

def extract_face_region(image: np.ndarray, bbox: List[int]) -> np.ndarray:
    """Extract face region from image using bounding box"""
    x1, y1, x2, y2 = map(int, bbox)
    face = image[y1:y2, x1:x2]
    
    if face.size == 0:
        raise ValueError("Empty face region detected")
        
    return face

def resize_image(image: np.ndarray, target_size: Tuple[int, int] = (640, 640)) -> np.ndarray:
    """Resize image while maintaining aspect ratio"""
    h, w = image.shape[:2]
    scale = min(target_size[0]/w, target_size[1]/h)
    
    return cv2.resize(image, (int(w*scale), int(h*scale)), 
                     interpolation=cv2.INTER_AREA)

def encode_image(image: np.ndarray, format: str = "jpg") -> bytes:
    """Encode image to bytes"""
    success, buffer = cv2.imencode(f".{format}", image)
    if not success:
        raise ValueError(f"Failed to encode image as {format}")
    return buffer.tobytes()