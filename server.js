#!/usr/bin/env node
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
// Use native fetch in Node.js 18+ or install node-fetch
const fetch = (...args) => 
  import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const port = process.env.PORT || 3001;

// Configuration
const CONFIG = {
  cacheEnabled: true,
  cacheTTL: 30 * 60 * 1000, // 30 minutes
  scriptTimeout: 30000, // 30 seconds for script execution
  maxRetries: 2,
  pythonPath: process.env.PYTHON_PATH || 'python3'
};

// Simple in‑memory cache
const cache = {
  data: {},
  ttl: CONFIG.cacheTTL,
  get(k) {
    const e = this.data[k];
    if (e && Date.now() - e.ts < this.ttl) {
      console.log(`🔄 Using cached data for: ${k}`);
      return e.payload;
    }
    return null;
  },
  set(k, v) {
    console.log(`💾 Caching data for: ${k}`);
    this.data[k] = { ts: Date.now(), payload: v };
  },
  clear() { 
    this.data = {}; 
    console.log('🧹 Cache cleared');
  }
};

// Execute Python script with proper timeout
function executePythonWithTimeout(scriptPath, args = [], timeoutMs = CONFIG.scriptTimeout) {
  return new Promise((resolve, reject) => {
    console.log(`🐍 Executing: ${CONFIG.pythonPath} ${scriptPath} ${args.join(' ')}`);
    
    const process = spawn(CONFIG.pythonPath, [scriptPath, ...args]);
    let stdout = '';
    let stderr = '';
    let killed = false;
    
    // Set timeout
    const timeout = setTimeout(() => {
      console.error(`⏱️ Script execution timed out after ${timeoutMs}ms`);
      process.kill();
      killed = true;
      reject(new Error(`Script execution timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    
    // Collect stdout
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    // Collect stderr
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Handle process completion
    process.on('close', (code) => {
      clearTimeout(timeout);
      
      if (killed) return; // Already handled by timeout
      
      if (code === 0) {
        try {
          // Try to parse JSON output
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          console.error('❌ Failed to parse script output as JSON:', e);
          reject(new Error(`Script output is not valid JSON: ${e.message}`));
        }
      } else {
        console.error(`❌ Script exited with code ${code}`);
        console.error(`Error output: ${stderr}`);
        reject(new Error(`Script exited with code ${code}: ${stderr}`));
      }
    });
    
    // Handle process errors
    process.on('error', (err) => {
      clearTimeout(timeout);
      console.error(`❌ Failed to start script: ${err.message}`);
      reject(new Error(`Failed to start script: ${err.message}`));
    });
  });
}

// Set up Express middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/news/:category
app.get('/api/news/:category', async (req, res) => {
  const category = req.params.category;
  const maxItems = Math.min(parseInt(req.query.max) || 10, 20); // Cap at 20
  const page = parseInt(req.query.page) || 1;
  const bypassCache = req.query.nocache === 'true';
  
  // Generate cache key
  const cacheKey = `${category}_p${page}_m${maxItems}`;
  
  // Check cache first
  if (CONFIG.cacheEnabled && !bypassCache) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
  }
  
  try {
    // Try Google News RSS first
    console.log(`🔍 Fetching RSS for ${category} (${CONFIG.maxRetries} retries left)`);
    
    // Execute the Python script to fetch RSS
    const rssResult = await executePythonWithTimeout(
      './fetch_google_news.py',
      [category, String(maxItems), String(page)]
    );
    
    // Check if we got valid results
    if (rssResult.success && rssResult.entries && rssResult.entries.length > 0) {
      // Cache the successful result
      if (CONFIG.cacheEnabled) {
        cache.set(cacheKey, rssResult);
      }
      return res.json(rssResult);
    }
    
    // If RSS failed, try NewsAPI
    console.log(`⚠️ RSS failed for ${category}, falling back to NewsAPI`);
    const newsApiResult = await fetchFromNewsApi(category, maxItems, page);
    
    // Cache the NewsAPI result
    if (CONFIG.cacheEnabled) {
      cache.set(cacheKey, newsApiResult);
    }
    
    return res.json(newsApiResult);
    
  } catch (error) {
    console.error(`❌ Error fetching news for ${category}:`, error.message);
    
    try {
      // If primary fetch fails, try NewsAPI as fallback
      console.log(`⚠️ RSS failed for ${category}, falling back to NewsAPI`);
      const newsApiResult = await fetchFromNewsApi(category, maxItems, page);
      
      if (newsApiResult.success) {
        if (CONFIG.cacheEnabled) {
          cache.set(cacheKey, newsApiResult);
        }
        return res.json(newsApiResult);
      }
    } catch (newsApiError) {
      console.error(`❌ NewsAPI fallback failed:`, newsApiError.message);
    }
    
    // Both sources failed
    return res.status(502).json({
      success: false,
      error: `Failed to fetch news from all sources: ${error.message}`,
      category,
      entries: []
    });
  }
});

// GET /api/extract?url=...
app.get('/api/extract', async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL parameter is required'
    });
  }
  
  // Generate cache key for extraction
  const cacheKey = `extract_${url.substring(0, 100)}`;
  
  // Check cache
  if (CONFIG.cacheEnabled) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
  }
  
  try {
    // Execute article extractor script
    const extractionResult = await executePythonWithTimeout(
      './article_extractor.py',
      [url],
      60000 // 60 seconds timeout for extraction
    );
    
    // Cache successful extractions
    if (extractionResult.success && CONFIG.cacheEnabled) {
      cache.set(cacheKey, extractionResult);
    }
    
    return res.json(extractionResult);
    
  } catch (error) {
    console.error(`❌ Article extraction failed for ${url}:`, error.message);
    
    return res.status(500).json({
      success: false,
      error: `Article extraction failed: ${error.message}`,
      url
    });
  }
});

// POST /api/clear-cache
app.post('/api/clear-cache', (req, res) => {
  cache.clear();
  res.json({ success: true, message: 'Cache cleared successfully' });
});

// Fallback to NewsAPI
async function fetchFromNewsApi(category, pageSize = 10, page = 1) {
  const apiKey = process.env.NEWSAPI_KEY;
  
  if (!apiKey) {
    throw new Error('NEWSAPI_KEY environment variable is not set');
  }
  
  // Map our categories to NewsAPI categories
  const categoryMap = {
    'World': 'general',
    'Business': 'business', 
    'Technology': 'technology',
    'Entertainment': 'entertainment',
    'Sports': 'sports',
    'Science': 'science',
    'Health': 'health',
    'Politics': 'general' // Use query instead for politics
  };
  
  // Determine parameters
  let params;
  if (category.toLowerCase() === 'politics') {
    params = `q=politics`;
  } else {
    const newsApiCategory = categoryMap[category] || 'general';
    params = `category=${newsApiCategory}`;
  }
  
  // Build URL
  const url = `https://newsapi.org/v2/top-headlines?${params}&pageSize=${pageSize}&page=${page}&language=en&apiKey=${apiKey}`;
  console.log(`➡️ NewsAPI: ${url.replace(apiKey, '***')}`);
  
  try {
    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`NewsAPI ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Format the response to match our expected structure
    return {
      success: true,
      category,
      entries: (data.articles || []).map((article, index) => {
        // Clean title (remove source name at the end)
        const title = article.title ? article.title.replace(/ - [^-]+$/, '').trim() : 'Untitled';
        
        // Create a stable ID
        const id = `${category.toLowerCase()}-newsapi-${index}-${hashString(article.url || title)}`;
        
        return {
          id,
          title,
          link: article.url || '',
          published: article.publishedAt || '',
          summary: article.description || '',
          source: article.source?.name || 'NewsAPI',
          imageUrl: article.urlToImage || '',
          fromNewsAPI: true,
          extracted: false
        };
      }),
      stats: {
        total: data.articles?.length || 0,
        extracted: 0,
        source: 'NewsAPI'
      }
    };
    
  } catch (error) {
    console.error(`❌ NewsAPI error:`, error.message);
    throw error;
  }
}

// Simple hash function for IDs
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// Start the server
app.listen(port, () => {
  console.log(`🚀 News API server running at http://localhost:${port}`);
  
  // Check if Python is available
  const pythonCheck = spawn(CONFIG.pythonPath, ['--version']);
  
  pythonCheck.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Python is available');
    } else {
      console.error('❌ Python check failed - make sure Python 3 is installed');
    }
  });
  
  pythonCheck.on('error', () => {
    console.error(`❌ Python not found at path: ${CONFIG.pythonPath}`);
    console.error('Please install Python 3 or set the PYTHON_PATH environment variable');
  });
  
  // Check if required modules are installed
  const moduleCheck = spawn(CONFIG.pythonPath, ['-c', 'import feedparser, newspaper']);
  
  moduleCheck.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Required Python modules are installed');
    } else {
      console.error('❌ Missing required Python modules');
      console.error('Please install them with: pip install feedparser newspaper3k');
    }
  });
});