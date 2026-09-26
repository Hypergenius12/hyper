import http.server, urllib.parse, sys, json
class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        content_len = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_len).decode('utf-8')
        print(f"BROWSER LOG: {post_body}", flush=True)
        self.send_response(200)
        self.end_headers()
http.server.HTTPServer(('', 8011), Handler).serve_forever()
