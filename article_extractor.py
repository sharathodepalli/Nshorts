#!/usr/bin/env python3
import sys
import json
import newspaper
import ssl
import re
import traceback
import time
import logging
from urllib.parse import urlparse
from datetime import datetime
from newspaper.article import ArticleException, ArticleDownloadState

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('article_extractor')

# Allow unverified HTTPS (use with caution)
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except:
    logger.warning("Could not configure SSL context - HTTPS verification will be required")

# User agents rotation to avoid blocking
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
]

# Text cleaning functions
def clean_text(text):
    """Clean extracted text by removing excess whitespace"""
    if not text:
        return ""
    
    # Replace multiple newlines with a single one
    text = re.sub(r'\n+', '\n', text)
    
    # Replace multiple spaces with a single one
    text = re.sub(r'\s+', ' ', text)
    
    # Fix common encoding issues
    text = text.replace('â€™', "'")
    text = text.replace('â€œ', '"')
    text = text.replace('â€', '"')
    text = text.replace('&amp;', '&')
    
    return text.strip()

def summarize_text(text, max_length=250):
    """Create a short summary of the article text"""
    if not text:
        return ""
    
    # Simple summarization: take first paragraph that's reasonably long
    paragraphs = text.split('\n')
    for p in paragraphs:
        p = p.strip()
        if len(p) > 50:  # Only consider paragraphs with some substance
            if len(p) <= max_length:
                return p
            else:
                # Try to cut at sentence boundary
                sentences = p.split('. ')
                summary = sentences[0]
                i = 1
                while i < len(sentences) and len(summary) + len(sentences[i]) + 2 <= max_length:
                    summary += '. ' + sentences[i]
                    i += 1
                return summary + ('...' if i < len(sentences) else '.')
    
    # Fallback: just take the first max_length characters
    return text[:max_length] + '...' if len(text) > max_length else text

def extract_article(url, max_retries=2, timeout=30):
    """Extract article content with retry logic"""
    logger.info(f"Extracting article from: {url}")
    
    # Validate URL
    try:
        parsed = urlparse(url)
        if not all([parsed.scheme, parsed.netloc]):
            return {"success": False, "error": "Invalid URL format", "extracted": False}
    except Exception as e:
        return {"success": False, "error": f"URL parsing error: {str(e)}", "extracted": False}
    
    # Try extraction with retries
    for attempt in range(max_retries + 1):
        try:
            # Use a different user agent for each retry
            user_agent = USER_AGENTS[attempt % len(USER_AGENTS)]
            
            # Configure newspaper
            config = newspaper.Config()
            config.browser_user_agent = user_agent
            config.request_timeout = timeout
            config.fetch_images = True
            config.memoize_articles = False  # Disable caching for fresh content
            
            # Create and download article
            article = newspaper.Article(url, config=config)
            logger.info(f"Downloading article (attempt {attempt+1}/{max_retries+1})...")
            article.download()
            
            # Check download state
            if article.download_state == ArticleDownloadState.SUCCESS:
                logger.info("Article downloaded successfully, parsing...")
                article.parse()
                
                # Extract the text content
                text = clean_text(article.text)
                
                # Check if we have enough content
                if len(text.split()) < 20:
                    raise ArticleException("Extracted text is too short (less than 20 words)")
                
                # Extract main image if available
                top_image = article.top_image or None
                
                # Create summary
                summary = summarize_text(text)
                
                # Get publish date
                publish_date = None
                if article.publish_date:
                    try:
                        publish_date = article.publish_date.isoformat()
                    except:
                        # Fallback if date parsing fails
                        publish_date = str(article.publish_date)
                
                return {
                    "success": True,
                    "title": clean_text(article.title),
                    "text": text,
                    "summary": summary,
                    "top_image": top_image,
                    "authors": article.authors or [],
                    "publish_date": publish_date,
                    "extracted": True,
                    "meta": {
                        "keywords": article.meta_keywords or [],
                        "description": article.meta_description or "",
                        "language": article.meta_lang or ""
                    }
                }
            else:
                raise ArticleException(f"Download failed with state: {article.download_state}")
                
        except Exception as e:
            logger.warning(f"Extraction attempt {attempt+1} failed: {str(e)}")
            traceback.print_exc(file=sys.stderr)
            
            if attempt < max_retries:
                # Wait before retry with increasing backoff
                wait_time = (attempt + 1) * 2
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                # All retries failed
                return {
                    "success": False, 
                    "error": str(e), 
                    "extracted": False,
                    "url": url
                }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        logger.error("No URL provided")
        print(json.dumps({"success": False, "error": "no URL provided"}))
        sys.exit(1)
    
    url = sys.argv[1]
    result = extract_article(url)
    
    # Output as JSON
    sys.stdout.write(json.dumps(result))