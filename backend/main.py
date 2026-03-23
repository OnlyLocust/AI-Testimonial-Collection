from fastapi import FastAPI
from routes import qa

app = FastAPI()

app.include_router(qa.router)

@app.get("/")
def root():
    return {"message": "Backend running 🚀"}