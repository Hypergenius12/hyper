import http.server
import socketserver
import os
import sys

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

if __name__ == "__main__":
    PORT = 8000
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    socketserver.TCPServer.allow_reuse_address = True
    print(f"Starting server on port {PORT}...", flush=True)
    with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
        print(f"Server successfully running at http://localhost:{PORT}/", flush=True)
        httpd.serve_forever()
