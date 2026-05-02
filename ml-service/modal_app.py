import modal

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install([
        "libgl1",           # ← fixes libGL.so.1 error
        "libglib2.0-0",     # ← opencv also needs this
    ])
    .pip_install([
        "fastapi",
        "uvicorn",
        "deepface",
        "tf-keras",
        "opencv-python-headless",
        "numpy",
        "pillow",
        "requests",
        "python-multipart"
    ])
    .add_local_file("main.py", "/root/main.py")
)

app = modal.App("facefind-ml", image=image)

@app.function(
    timeout=120,
    scaledown_window=60,
)
@modal.asgi_app()
def fastapi_app():
    from main import app as fastapi_app
    return fastapi_app