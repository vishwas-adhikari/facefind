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

        # 2. convert to PIL image then numpy array (what DeepFace expects)
        image = Image.open(io.BytesIO(response.content)).convert("RGB")
        image_array = np.array(image)

        # 3. run DeepFace — detect all faces, generate ArcFace embeddings
        results = DeepFace.represent(
            img_path=image_array,
            model_name="ArcFace",
            detector_backend="retinaface",  # best for group photos
            enforce_detection=False,        # don't crash if no face found
            align=True                      # align face before embedding
        )

        # 4. format results
        faces = []
        for r in results:
            facial_area = r.get("facial_area", {})
            faces.append(FaceResult(
                embedding=r["embedding"],   # 512-dim vector
                bbox=BoundingBox(
                    x=facial_area.get("x", 0),
                    y=facial_area.get("y", 0),
                    w=facial_area.get("w", 0),
                    h=facial_area.get("h", 0)
                ),
                confidence=r.get("face_confidence", 0.0)
            ))

        return EmbedResponse(faces=faces, total_faces=len(faces))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))