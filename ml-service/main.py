from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from deepface import DeepFace
import requests
import numpy as np
from PIL import Image
import io

app = FastAPI()

# ─── Request / Response models ────────────────────────────────────────────────

class EmbedRequest(BaseModel):
    image_url: str

class BoundingBox(BaseModel):
    x: int
    y: int
    w: int
    h: int

class FaceResult(BaseModel):
    embedding: list[float]
    bbox: BoundingBox
    confidence: float

class EmbedResponse(BaseModel):
    faces: list[FaceResult]
    total_faces: int

# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "ok", "model": "ArcFace", "detector": "retinaface"}

# ─── Main embed endpoint ──────────────────────────────────────────────────────

@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    try:
        # 1. download image from Drive URL into memory
        response = requests.get(req.image_url, timeout=30)
        if response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail=f"Could not fetch image from URL: {req.image_url}"
            )

        # 2. convert to PIL image
        image = Image.open(io.BytesIO(response.content)).convert("RGB")

        # 3. upscale small images — RetinaFace detects better on larger images
        w, h = image.size
        min_dim = min(w, h)
        if min_dim < 800:
            scale = 800 / min_dim
            new_w = int(w * scale)
            new_h = int(h * scale)
            image = image.resize((new_w, new_h), Image.LANCZOS)

        image_array = np.array(image)

        # 4. run DeepFace — detect all faces, generate ArcFace embeddings
        results = DeepFace.represent(
            img_path=image_array,
            model_name="ArcFace",
            detector_backend="retinaface",
            enforce_detection=False,
            align=True
        )

        # 5. filter out very low confidence detections
        faces = []
        for r in results:
            confidence = r.get("face_confidence", 0.0)
            if confidence < 0.7:   # skip blurry / partial faces
                continue

            facial_area = r.get("facial_area", {})
            faces.append(FaceResult(
                embedding=r["embedding"],
                bbox=BoundingBox(
                    x=facial_area.get("x", 0),
                    y=facial_area.get("y", 0),
                    w=facial_area.get("w", 0),
                    h=facial_area.get("h", 0)
                ),
                confidence=confidence
            ))

        return EmbedResponse(faces=faces, total_faces=len(faces))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))