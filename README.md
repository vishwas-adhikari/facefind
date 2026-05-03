
# 📸 FaceFind

**Find yourself in any event photo instantly using AI.**

FaceFind is a full-stack, serverless web application designed to solve the tedious problem of manually scrolling through hundreds of event photos (weddings, fests, trips) shared via Google Drive. 

Paste a Google Drive folder link, and FaceFind will autonomously scan the photos, detect faces, and group them by identity using state-of-the-art Deep Learning models. Click your face, and instantly retrieve every photo you appear in.

![FaceFind Demo](https://via.placeholder.com/800x400?text=Add+a+Screenshot+of+your+App+Here)

## ✨ Features

- **Zero Image Storage (Privacy-First):** Images are never downloaded or stored on our servers. FaceFind operates entirely on metadata and numerical embeddings. The original files remain securely in Google Drive.
- **Unsupervised Identity Clustering:** Doesn't require prior facial enrollment, manual tagging, or knowing how many people are at the event.
- **High-Speed CDN Delivery:** Bypasses Google Drive rate-limits by proxying and requesting highly-optimized (`=s800`) images via Google's internal CDN.
- **Serverless ML Pipeline:** Heavy machine learning tasks scale to zero when idle and boot on-demand via GPU-accelerated serverless containers.

## 🏗️ System Architecture

FaceFind is built on a decoupled, three-tier architecture:

1. **Frontend / API Orchestrator (Next.js 15):** Handles the UI, authenticates with Google Drive, paginates image fetching, and orchestrates the batch-processing pipeline.
2. **Vector Database (Supabase + pgvector):** Stores metadata and 512-dimensional face embeddings. Structurally linked via `ON DELETE CASCADE` to prevent orphan data.
3. **ML Microservice (Python / FastAPI / Modal.com):** A stateless container that downloads an image into RAM, extracts faces, generates embeddings, and returns JSON.

### The Machine Learning Pipeline
- **Face Detection:** [RetinaFace](https://github.com/serengil/deepface) (ResNet-50 backbone) - robust against partial occlusions and varying scales in group photos.
- **Embedding / Recognition:** [ArcFace](https://github.com/serengil/deepface) - generates highly discriminative 512-dimensional L2-normalized feature vectors.
- **Clustering:** Custom **DBSCAN** implementation (TypeScript) using Cosine Distance. We use a strict $\epsilon = 0.25$ threshold to prevent cross-identity merging (e.g., grouping different people together).

## 💻 Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript, Tailwind CSS)
- **Database:** PostgreSQL (Supabase) + `pgvector` extension
- **ML Deployment:** Modal.com (Serverless Python)
- **ML Libraries:** DeepFace, OpenCV, TensorFlow/Keras
- **External APIs:** Google Drive API v3 (Service Account Auth)

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- A [Supabase](https://supabase.com/) project with `pgvector` enabled.
- A [Modal.com](https://modal.com/) account for deploying the ML worker.
- A Google Cloud Console project with the **Google Drive API** enabled and a Service Account key.

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/facefind.git
cd facefind
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Deploy the ML Microservice
Ensure you have the Modal CLI installed and authenticated (`pip install modal` and `modal setup`).
```bash
modal deploy ml-service/modal_app.py
```
*Note the URL that Modal outputs. You will need it for the environment variables.*

### 4. Environment Variables
Create a `.env.local` file in the root directory and add the following keys:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Drive Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
# Ensure \n characters are kept literal in the string
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# ML Microservice
ML_SERVICE_URL=your_modal_deployment_url

# Clustering Strategy ('own' runs the custom DBSCAN algorithm)
CLUSTERING_MODE=own
```

### 5. Initialize the Database
Run the provided SQL schema in your Supabase SQL Editor to create the `events`, `photos`, `faces`, and `clusters` tables. (Found in `supabase/schema.sql`).

### 6. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔮 Future Scope
- **Event Deduplication:** Hashing Drive folder IDs to bypass the ML pipeline if a folder has already been scanned.
- **Dynamic Face Cropping:** Base64 encoding the exact face crops within the Python microservice to use as representative thumbnails on the UI cluster cards.
- **Dynamic Epsilon Tuning:** Automatically adjusting the DBSCAN threshold based on the specific embedding distribution of an event.

## 📄 License
This project is licensed under the MIT License.
```

***

