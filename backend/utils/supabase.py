# -------------------------------
# SUPABASE CLIENT MANAGEMENT
# -------------------------------
# Features:
# 1. Database connection handling
# 2. File storage operations
# 3. Face data management
# -------------------------------

from supabase import create_client
import os
from typing import Union
from dotenv import load_dotenv  # type: ignore
import time
import uuid
import io
import numpy as np
import cv2
from datetime import datetime

load_dotenv()

def get_supabase():
    """Initialize Supabase client"""
    return create_client(
        os.getenv("VITE_SUPABASE_URL"),
        os.getenv("VITE_SUPABASE_KEY")
    )

supabase = get_supabase()

async def upload_image(
    file_content: Union[bytes, "io.BytesIO"],
    file_path: str,
    folder: str = ""
) -> str:
    """Upload image to Supabase Storage under a specific folder in the 'static' bucket."""
    if hasattr(file_content, "read"):
        file_content = file_content.read()
    full_path = f"{folder}/{file_path}" if folder else file_path
    response = supabase.storage.from_("static").upload(
        full_path,
        file_content,
        {"content-type": "image/jpeg"}
    )
    if hasattr(response, "error") and response.error:
        raise ValueError(f"Supabase upload error: {response.error}")
    return supabase.storage.from_("static").get_public_url(full_path)

def load_known_faces_from_supabase():
    """
    Fetch known faces from the 'known_faces' table in Supabase.
    Each row must have:
      - 'face_id' (UUID primary key)
      - 'name'
      - 'embedding': a list of 5 embeddings (each a list of 512 floats)
    Averages the embeddings and returns a list of dicts.
    """
    response = supabase.table("known_faces").select("*").execute()
    rows = response.data
    if not rows:
        print("No known faces found in Supabase.")
        return []
    known_faces = []
    for row in rows:
        stored_embedding = row["embedding"]
        emb_array = np.array(stored_embedding)
        if emb_array.ndim == 2 and emb_array.shape[0] == 5:
            averaged_embedding = emb_array.mean(axis=0)
        elif emb_array.ndim == 2 and emb_array.shape[0] == 1:
            averaged_embedding = emb_array[0]
        else:
            averaged_embedding = emb_array
        known_faces.append({
            "id": row["face_id"],   # Must be a valid UUID from your DB.
            "name": row["name"],
            "embedding": averaged_embedding.tolist(),
        })
    print("Loaded known faces:", known_faces)
    return known_faces

async def store_unknown_face_in_supabase(cropped_image_url: str, embedding, confidence) -> str:
    """
    Store a new unknown face in Supabase using the cropped image URL.
    Returns the newly created record's face_id.
    """
    record = {
        "image_url": [cropped_image_url],
        "embedding": [embedding],
        "confidence": confidence,
    }
    response = supabase.table("unknown_faces").insert(record).execute()
    if response.data:
        return response.data[0]["face_id"]
    else:
        raise Exception("Failed to store unknown face in Supabase")

async def update_unknown_face_in_supabase(supabase_id: str, cropped_image_url: str, embedding, confidence) -> str:
    """
    Update an existing unknown face record in Supabase using the cropped image URL.
    Returns the updated record's face_id.
    """
    record = {
        "image_url": [cropped_image_url],
        "embedding": [embedding],
        "confidence": confidence,
    }
    response = supabase.table("unknown_faces").update(record).eq("face_id", supabase_id).execute()
    if response.data:
        return response.data[0]["face_id"]
    else:
        raise Exception("Failed to update unknown face in Supabase")
