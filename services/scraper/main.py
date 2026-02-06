from fastapi import FastAPI, HTTPException, Response
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
def scrape_recipe(url: str, response: Response):
    try:
        # Green Code: Cache Control
        # Cache this result for 24 hours (86400 seconds) at the Edge.
        # This prevents re-scraping the same URL if multiple users request it.
        response.headers["Cache-Control"] = "public, max-age=86400, s-maxage=86400"
        
        # Use recipe-scrapers library (Polyglot power!)
        # This library internally uses BeautifulSoup4 with efficient selectors
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