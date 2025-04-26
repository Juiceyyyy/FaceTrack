import base64
import os
import time
import uuid
import io
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request # type: ignore
import cv2
import numpy as np
from utils.face_analysis import face_analyzer
from utils.supabase import get_supabase, upload_image

router = APIRouter()
supabase = get_supabase()
logger = logging.getLogger("uvicorn")

@router.post("/add-face")
async def add_face(
    files: list[UploadFile] = File(...),
    name: str = Form(...),
    user_id: str = Form(...)
):
    """Add new face with multiple angles"""
    logger.info("Received add-face request")
    logger.info(f"Name: {name}, User ID: {user_id}")
    logger.info(f"Received {len(files)} files")

    if len(files) != 5:
        logger.error("Invalid number of files received")
        raise HTTPException(400, "Exactly 5 images required")

    face_id = str(uuid.uuid4())
    embeddings = []
    image_urls = []

    try:
        for idx, file in enumerate(files):
            logger.info(f"Processing file {idx+1}/5")
            
            # Read and verify image
            contents = await file.read()
            logger.info(f"File {idx+1} size: {len(contents)} bytes")
            
            # Convert to numpy array
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                logger.error(f"Failed to decode image {idx+1}")
                raise HTTPException(400, f"Invalid image format in image {idx+1}")

            # Detect faces
            logger.info(f"Detecting faces in image {idx+1}")
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            faces = face_analyzer.app.get(img_rgb)
            
            if not faces:
                logger.error(f"No face detected in image {idx+1}")
                raise HTTPException(400, f"No face detected in image {idx+1}")
                
            logger.info(f"Face detected in image {idx+1}")
            embeddings.append(faces[0].normed_embedding.tolist())

            # Upload to storage under folder "known_faces"
            logger.info(f"Uploading image {idx+1} to Supabase in known_faces folder")
            file_bytes = io.BytesIO(contents)
            url = await upload_image(file_bytes, f"{face_id}/angle_{idx}.jpg", folder="known_faces")
            image_urls.append(url)
            logger.info(f"Image {idx+1} uploaded to {url}")

        # Database insertion with matching column names:
        logger.info("Storing metadata in database")
        logger.debug(f"Embeddings length: {len(embeddings)}")
        logger.debug(f"Image URLs: {image_urls}")
        
        db_response = supabase.table("known_faces").insert({
            "face_id": face_id,
            "name": name,
            "userId": user_id,         # DB expects numeric but can be converted later if needed
            "image_url": image_urls,    # JSON array of URLs
            "embedding": embeddings     # JSON array of embeddings
        }).execute()
        
        logger.info("Database insertion completed")
        return {"status": "success", "face_id": face_id}

    except HTTPException as he:
        logger.error(f"HTTP Error: {he.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(500, f"Internal server error: {str(e)}")

@router.post("/recognize")
async def recognize_face(file: UploadFile = File(...)):
    """Recognize face from image"""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Get query embedding
        query_embeddings = face_analyzer.get_embeddings(img)
        if not query_embeddings:
            raise HTTPException(400, "No face detected")
        query_embedding = np.array(query_embeddings[0])
        
        # Get known faces
        try:
            known_faces = supabase.table("known_faces").select("name, embedding").execute().data
        except Exception as e:
            raise HTTPException(500, f"Database error: {str(e)}")
        
        # Find best match
        best_match = "Unknown"
        min_distance = float('inf')
        for face in known_faces:
            for emb in face["embedding"]:
                distance = np.linalg.norm(np.array(emb) - query_embedding)
                if distance < min_distance:
                    min_distance = distance
                    best_match = face["name"]
        
        confidence = 1 - min(min_distance, 1.0)
        return {
            "match": best_match,
            "confidence": round(confidence, 2),
            "threshold": 0.75
        }
    
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(500, f"Processing error: {str(e)}")

@router.post("/detect")
async def detect_face(request: Request):
    try:
        data = await request.json()
        image_data = data.get("image")
        
        if not image_data:
            raise HTTPException(400, "No image data provided")

        # Debug: Save received image (optional)
        debug_dir = "debug_images"
        os.makedirs(debug_dir, exist_ok=True)
        debug_path = os.path.join(debug_dir, f"debug_{int(time.time())}.jpg")
        
        try:
            # Handle base64 with/without prefix
            if "base64," in image_data:
                header, image_data = image_data.split(",", 1)
            
            # Decode and save
            decoded = base64.b64decode(image_data)
            with open(debug_path, "wb") as f:
                f.write(decoded)
                
            # Read and convert
            nparr = np.frombuffer(decoded, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
        except Exception as e:
            logger.error(f"Image processing failed: {str(e)}")
            return {"face_detected": False, "error": "Invalid image data"}

        # Detect faces with timing
        start = time.time()
        faces = face_analyzer.app.get(img_rgb)
        detection_time = time.time() - start
        
        logger.info(f"Detection completed in {detection_time:.2f}s")
        logger.info(f"Detected {len(faces)} faces")
        
        # If a face is detected, extract the bounding box of the first face
        bbox = None
        if faces:
            bbox = faces[0].bbox.astype(int).tolist()  # [x1, y1, x2, y2]
        
        return {
            "face_detected": len(faces) > 0,
            "face_count": len(faces),
            "detection_time": detection_time,
            "bbox": bbox
        }
    
    except Exception as e:
        logger.error(f"Detection error: {str(e)}", exc_info=True)
        return {"face_detected": False, "error": str(e)}
