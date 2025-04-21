
#!/usr/bin/env python3
import sys
import json
import feedparser
import hashlib
import re
import random
import ssl
import html
from urllib.parse import quote

# Import transformers library for summarization
# This requires installation: pip install transformers torch
try:
    from transformers import pipeline
    SUMMARIZER_AVAILABLE = True
except ImportError:
    SUMMARIZER_AVAILABLE = False
    print("Transformers library not available. Install with: pip install transformers torch", file=sys.stderr)

# Disable SSL verification if needed
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except:
    pass

# Initialize summarizer
summarizer = None
if SUMMARIZER_AVAILABLE:
    try:
        # Use a small, efficient model for summarization
        summarizer = pipeline("summarization", model="facebook/bart-large-cnn", max_length=60)
        print("AI summarizer initialized successfully", file=sys.stderr)
    except Exception as e:
        print(f"Error initializing summarizer: {str(e)}", file=sys.stderr)

# Define several user agents to rotate
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
]

# Map of our categories to Google News categories
CATEGORY_MAP = {
    'world': 'WORLD',
    'business': 'BUSINESS',
    'technology': 'TECHNOLOGY',
    'entertainment': 'ENTERTAINMENT',
    'sports': 'SPORTS',
    'science': 'SCIENCE',
    'health': 'HEALTH',
    'politics': 'NATION'  # Google News uses NATION for politics
}

def get_first_headline(text):
    """Extract just the first headline from concatenated headlines"""
    if not text:
        return ""
    
    # Replace HTML entities and normalize spaces
    text = html.unescape(text)
    text = text.replace('\xa0', ' ')
    text = re.sub(r'\s+', ' ', text)
    
    # Patterns for identifying headline boundaries
    patterns = [
        r'^(.*?)(?:\s+[A-Z][A-Za-z0-9 ]+\s*$)',  # Headline followed by source at end
        r'^(.*?)(?:\s+[A-Z][A-Za-z0-9 ]+\s+[A-Z])',  # Headline followed by source then new headline
        r'^(.*?)(?:\.\s+[A-Z][A-Za-z0-9 ]+)',  # Headline ending with period, then source
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
    
    # If we can't extract with patterns, take the first sentence
    sentences = re.split(r'(?<=[.!?])\s+', text)
    if sentences:
        return sentences[0].strip()
    
    return text.strip()

def extract_headlines_from_summary(summary):
    """Extract all separate headlines from a summary field to use for better summarization"""
    if not summary:
        return []
    
    # Decode HTML entities and clean spacing
    text = html.unescape(summary)
    text = text.replace('\xa0', ' ')
    text = re.sub(r'\s+', ' ', text)
    
    # Look for source patterns like "Text Source" or "Text. Source"
    headlines = []
    
    # Split by source attribution patterns
    parts = re.split(r'(?:\.\s+|\s+)([A-Z][A-Za-z0-9 ]+(?:\s+|\.\s+|$))', text)
    
    current_headline = ""
    for i, part in enumerate(parts):
        if i % 2 == 0:  # Even indices are headline parts
            current_headline += part
        else:  # Odd indices are potential sources
            if current_headline:
                headlines.append(current_headline.strip())
                current_headline = ""
    
    # Add the last headline if there's content
    if current_headline:
        headlines.append(current_headline.strip())
    
    # If splitting didn't work, try sentence-based approach
    if not headlines:
        headlines = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
    
    return headlines

def ai_summarize(text, max_length=60):
    """Generate an AI summary of the content"""
    if not summarizer or not text:
        return ""
    
    # Extract all possible headlines to get more context
    headlines = extract_headlines_from_summary(text)
    
    # Combine headlines to provide more context for summarization
    if headlines:
        input_text = " ".join(headlines)
    else:
        input_text = text
    
    # Ensure the text is long enough for summarization (most models require minimum length)
    if len(input_text.split()) < 10:
        return input_text
    
    try:
        # Generate summary
        result = summarizer(input_text, max_length=max_length, min_length=10, do_sample=False)
        if result and len(result) > 0:
            return result[0]['summary_text'].strip()
    except Exception as e:
        print(f"Summarization error: {str(e)}", file=sys.stderr)
    
    # Fallback to first headline if AI summarization fails
    return get_first_headline(text)

def fetch_google_news(category, count=10):
    """Fetch news from Google News RSS feed"""
    # Pick a random user agent
    user_agent = random.choice(USER_AGENTS)
    
    # Convert category to Google News format
    cat_key = category.lower()
    gcat = CATEGORY_MAP.get(cat_key, cat_key)
    
    # Build URL based on category
    if cat_key in CATEGORY_MAP:
        url = f"https://news.google.com/rss/headlines/section/topic/{gcat.upper()}?hl=en&gl=US&ceid=US:en"
    else:
        url = f"https://news.google.com/rss/search?q={quote(category)}&hl=en&gl=US&ceid=US:en"
    
    # Print debugging to stderr
    print(f"Fetching from URL: {url}", file=sys.stderr)
    
    # Set up request headers
    request_headers = {
        'User-Agent': user_agent,
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive'
    }
    
    # Parse the feed
    feed = feedparser.parse(
        url,
        agent=user_agent,
        request_headers=request_headers
    )
    
    # Check if we got entries
    if not feed.entries:
        print(f"No entries found for {category} (Status: {feed.get('status', 'unknown')})", file=sys.stderr)
        print(f"Feed debug info: {feed.get('debug_message', '')}", file=sys.stderr)
        return []
    
    print(f"Found {len(feed.entries)} entries", file=sys.stderr)
    return feed.entries[:count]

def extract_source(title):
    """Extract source from title if present"""
    # Pattern: "Title - Source"
    match = re.search(r'(.+)\s+-\s+([^-]+)$', title)
    if match:
        return match.group(2).strip()
    return "Google News"

def process_entries(entries, category):
    """Process the entries into our format with better cleaning and summarization"""
    results = []
    
    for entry in entries:
        # Get the raw title and clean it
        raw_title = entry.get('title', 'Untitled')
        
        # Extract source if present in title
        source = extract_source(raw_title)
        
        # Get the clean title (first headline only)
        title = get_first_headline(raw_title)
        
        # Get link
        link = entry.get('link', '')
        
        # Skip if no title or link
        if not title or not link:
            continue
        
        # Create ID
        hashed = hashlib.md5(f"{category}:{link}:{title}".encode()).hexdigest()[:8]
        entry_id = f"{category.lower()}-gnews-{hashed}"
        
        # Get summary/description
        summary = entry.get('summary', '')
        if not summary and hasattr(entry, 'description'):
            summary = entry.description
        
        # Clean HTML from summary
        summary = re.sub(r'<.*?>', '', summary).strip()
        
        # Generate AI summary if possible
        ai_summary = ai_summarize(summary or raw_title)
        
        # Fallback to first headline if AI summarization fails
        if not ai_summary:
            ai_summary = get_first_headline(summary or raw_title)
        
        # Get source from entry if available
        if hasattr(entry, 'source') and hasattr(entry.source, 'title'):
            source = entry.source.title
        
        # Add to results
        results.append({
            "id": entry_id,
            "title": title,
            "link": link,
            "published": entry.get('published', ''),
            "summary": ai_summary,  # Use AI-generated summary
            "originalSummary": summary,  # Keep original for reference
            "source": source,
            "fromGoogleNews": True,
            "extracted": False
        })
    
    return results

if __name__ == "__main__":
    try:
        # Get arguments
        category = sys.argv[1] if len(sys.argv) > 1 else "World"
        count = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        
        # Fetch and process
        entries = fetch_google_news(category, count)
        results = process_entries(entries, category)
        
        # Return JSON
        output = {
            "success": len(results) > 0,
            "category": category,
            "entries": results,
            "stats": {
                "total": len(results), 
                "extracted": 0, 
                "summarized": bool(summarizer),
                "source": "Google News RSS"
            }
        }
        
        sys.stdout.write(json.dumps(output))
        
    except Exception as e:
        # Handle any errors
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.stdout.write(json.dumps({
            "success": False,
            "error": str(e),
            "category": sys.argv[1] if len(sys.argv) > 1 else "unknown",
            "entries": []
        }))
