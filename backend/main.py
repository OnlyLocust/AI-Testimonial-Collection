from fastapi import FastAPI
from routes import qa
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.include_router(qa.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Backend running 🚀"}