from fastapi import APIRouter, HTTPException # type: ignore
from fastapi.responses import StreamingResponse # type: ignore
import cv2
import asyncio
import os, time, uuid
import numpy as np
from utils.face_analysis import face_analyzer, cosine_similarity
from utils.supabase import (
    load_known_faces_from_supabase,
    store_unknown_face_in_supabase,
    update_unknown_face_in_supabase,
    upload_image,
    supabase
)

router = APIRouter()

# Load known faces (averaged embeddings) from Supabase.
known_faces = load_known_faces_from_supabase()
known_face_confidence = {} 
unknown_faces_dict = {}     

# Delta threshold for updating (e.g., update only if new confidence is at least DELTA higher)
DELTA = 0.01

# Process detection every N frames to reduce CPU load.
DETECTION_INTERVAL = 3

def find_known_match(embedding, known_faces, threshold=0.6):
    """
    Compare embedding with known faces.
    Return (best_face, best_sim) if best_sim > threshold else (None, best_sim).
    """
    best_face = None
    best_sim = 0.0
    for face in known_faces:
        sim = cosine_similarity(embedding, face["embedding"])
        if sim > best_sim:
            best_sim = sim
            best_face = face
    return (best_face, best_sim) if best_sim > threshold else (None, best_sim)

def find_unknown_cluster(embedding, threshold=0.7):
    """
    Check if this embedding matches an existing unknown face cluster using a similarity threshold.
    Returns (cluster_id, similarity) or (None, 0.0).
    """
    best_cluster = None
    best_sim = 0.0
    for cid, data in unknown_faces_dict.items():
        sim = cosine_similarity(embedding, data["embedding"])
        if sim > best_sim and sim > threshold:
            best_sim = sim
            best_cluster = cid
    return (best_cluster, best_sim) if best_cluster else (None, 0.0)

async def upload_cropped_face(frame, bbox):
    """
    Crop the face region from the frame and upload it.
    Returns the public URL of the cropped image.
    """
    x1, y1, x2, y2 = bbox
    face_crop = frame[y1:y2, x1:x2]
    ret, crop_buffer = cv2.imencode(".jpg", face_crop)
    if not ret:
        raise Exception("Failed to encode cropped face as JPEG")
    crop_bytes = crop_buffer.tobytes()
    file_name = f"det_log_{int(time.time())}_{uuid.uuid4().hex}.jpg"
    image_url = await upload_image(crop_bytes, file_name, folder="detection_logs")
    return image_url

async def log_detection(known_face_id, unknown_face_id, confidence, image_url):
    """
    Insert a detection log record into the detection_logs table.
    Only one of known_face_id or unknown_face_id should be set.
    """
    record = {
        "known_face_id": known_face_id,
        "unknown_face_id": unknown_face_id,
        "confidence": confidence,
        "image_url": image_url
        # timestamp is set automatically by the database.
    }
    response = supabase.table("detection_logs").insert(record).execute()
    return response

class CameraManager:
    def __init__(self):
        self.capture = None
        self.active = False
        self.frame_count = 0
        self.last_detections = []  # List of dicts: { "bbox": (x1,y1,x2,y2), "label": str, "color": (B,G,R) }

    async def generate_frames(self):
        global known_faces, unknown_faces_dict, known_face_confidence

        while self.active:
            ret, frame = self.capture.read()
            if not ret:
                break

            self.frame_count += 1

            # Run detection every DETECTION_INTERVAL frames.
            if self.frame_count % DETECTION_INTERVAL == 0:
                faces = face_analyzer.detect_faces(frame)
                self.last_detections = []  # Clear previous detections.
                for face in faces:
                    x1, y1, x2, y2 = face["bbox"]
                    embedding = face["embedding"]
                    confidence = face["confidence"]

                    # Crop and upload the face image for logging (and storage for unknown faces)
                    cropped_image_url = await upload_cropped_face(frame, (x1, y1, x2, y2))

                    # 1) Known face detection.
                    match, sim = find_known_match(embedding, known_faces, threshold=0.55)
                    if match:
                        k_id = match["id"]
                        if k_id in known_face_confidence:
                            if confidence >= known_face_confidence[k_id] + DELTA:
                                known_face_confidence[k_id] = confidence
                            # Using the same label regardless of update
                            label = f"{match['name']} (sim={sim:.2f})"
                        else:
                            known_face_confidence[k_id] = confidence
                            label = f"{match['name']} (sim={sim:.2f})"
                        color = (0, 255, 0)
                        await log_detection(known_face_id=k_id, unknown_face_id=None, confidence=confidence, image_url=cropped_image_url)
                    else:
                        # 2) Unknown face.
                        cluster_id, unk_sim = find_unknown_cluster(embedding, threshold=0.75)
                        if cluster_id:
                            old_conf = unknown_faces_dict[cluster_id]["confidence"]
                            if confidence >= old_conf + DELTA:
                                supabase_id = unknown_faces_dict[cluster_id]["supabase_id"]
                                # Pass cropped image URL instead of the full frame
                                await update_unknown_face_in_supabase(supabase_id, cropped_image_url, embedding, confidence)
                                unknown_faces_dict[cluster_id]["confidence"] = confidence
                                unknown_faces_dict[cluster_id]["embedding"] = embedding
                            label = f"Unknown (conf={confidence:.2f})"
                            color = (0, 0, 255)
                            await log_detection(known_face_id=None, unknown_face_id=unknown_faces_dict[cluster_id]["supabase_id"], confidence=confidence, image_url=cropped_image_url)
                        else:
                            # For a new unknown face, store using the cropped image URL
                            supabase_id = await store_unknown_face_in_supabase(cropped_image_url, embedding, confidence)
                            cid = str(uuid.uuid4())
                            unknown_faces_dict[cid] = {
                                "embedding": embedding,
                                "confidence": confidence,
                                "supabase_id": supabase_id
                            }
                            label = f"Unknown (conf={confidence:.2f})"
                            color = (0, 0, 255)
                            await log_detection(known_face_id=None, unknown_face_id=supabase_id, confidence=confidence, image_url=cropped_image_url)

                    # Save detection result for drawing.
                    self.last_detections.append({
                        "bbox": (x1, y1, x2, y2),
                        "label": label,
                        "color": color
                    })

            # Draw the last detections on the frame.
            for det in self.last_detections:
                bx1, by1, bx2, by2 = det["bbox"]
                cv2.rectangle(frame, (bx1, by1), (bx2, by2), det["color"], 2)
                cv2.putText(frame, det["label"], (bx1, by1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, det["color"], 2)

            _, buffer = cv2.imencode(".jpg", frame)
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" +
                   buffer.tobytes() + b"\r\n")
            await asyncio.sleep(0.01)

camera_manager = CameraManager()

def get_available_cameras():
    """Return a list of available camera indices."""
    available_cameras = []
    for index in range(3):
        cap = cv2.VideoCapture(index)
        if cap is not None and cap.isOpened():
            available_cameras.append(index)
            cap.release()
    return available_cameras

@router.get("/cameras")
async def list_cameras():
    """List available cameras."""
    cameras = get_available_cameras()
    return {"available_cameras": cameras}

@router.post("/select_camera/{selected_camera}")
async def select_camera(selected_camera: int):
    """Select a camera by index."""
    if camera_manager.active:
        camera_manager.active = False
        if camera_manager.capture is not None:
            camera_manager.capture.release()
    camera_manager.capture = cv2.VideoCapture(selected_camera)
    camera_manager.capture.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    camera_manager.capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    if not camera_manager.capture.isOpened():
        raise HTTPException(
            status_code=400,
            detail=f"Camera {selected_camera} could not be opened."
        )
    camera_manager.active = True
    camera_manager.frame_count = 0
    unknown_faces_dict.clear()
    known_face_confidence.clear()
    return {"message": f"Camera {selected_camera} selected"}

@router.get("/stream")
async def video_stream():
    """Stream from the selected camera."""
    if not camera_manager.active or camera_manager.capture is None:
        raise HTTPException(
            status_code=400,
            detail="No camera selected or active. Please select a camera first."
        )
    return StreamingResponse(
        camera_manager.generate_frames(),
        media_type="multipart/x-mixed-replace;boundary=frame"
    )

@router.post("/stop")
async def stop_camera():
    """Stop the active camera."""
    if camera_manager.active:
        camera_manager.active = False
        if camera_manager.capture is not None:
            camera_manager.capture.release()
    return {"message": "Camera stopped"}
