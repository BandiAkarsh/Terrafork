from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from recipe_scrapers import scrape_me
import uvicorn

app = FastAPI()

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "service": "forkzero-scraper"}

@app.get("/scrape")
def scrape_recipe(url: str):
    try:
        # Use recipe-scrapers library (Polyglot power!)
        scraper = scrape_me(url)
        
        return {
            "title": scraper.title(),
            "total_time": scraper.total_time(),
            "yields": scraper.yields(),
            "ingredients": scraper.ingredients(),
            "instructions": scraper.instructions(),
            "image": scraper.image(),
            "host": scraper.host(),
            "nutrients": scraper.nutrients()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)