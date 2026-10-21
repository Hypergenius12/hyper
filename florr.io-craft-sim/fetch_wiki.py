import urllib.request
from html.parser import HTMLParser

url = "https://florr.fandom.com/wiki/Electric_Web"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla'})
try:
    data = urllib.request.urlopen(req).read().decode('utf-8')
    # simple text extraction
    class MyHTMLParser(HTMLParser):
        def __init__(self):
            super().__init__()
            self.text = []
        def handle_data(self, data):
            if data.strip():
                self.text.append(data.strip())
    
    parser = MyHTMLParser()
    parser.feed(data)
    for i, t in enumerate(parser.text):
        if 'Electric Web' in t or 'Damage' in t or 'Health' in t:
            print(t)
except Exception as e:
    print(e)
