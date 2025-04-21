#!/usr/bin/env python3
import sys, json, newspaper, ssl, re, traceback

# allow unverified HTTPS
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except:
    pass

def clean(t):
    if not t: return ""
    t = re.sub(r'\n+','\n',t)
    t = re.sub(r'\s+',' ',t)
    return t.strip()

def extract(url):
    try:
        art = newspaper.Article(url, fetch_images=True)
        art.download(); art.parse()
        text = clean(art.text)
        if len(text.split())<20:
            return {"success":False,"error":"too little text","extracted":False}
        return {
            "success":True,
            "title": clean(art.title),
            "fullText": text,
            "topImage": art.top_image,
            "authors": art.authors or [],
            "publishDate": art.publish_date.isoformat() if art.publish_date else None,
            "extracted":True
        }
    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        return {"success":False,"error":str(e),"extracted":False}

if __name__=="__main__":
    if len(sys.argv)<2:
        print(json.dumps({"success":False,"error":"no URL"})); sys.exit(1)
    res = extract(sys.argv[1])
    sys.stdout.write(json.dumps(res))
