const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg'
};

function createStaticServer(rootDir, port) {
    const server = http.createServer((req, res) => {
        req.on('error', () => {});
        res.on('error', () => {});

        let reqPath = decodeURIComponent(req.url.split('?')[0]);
        if (reqPath === '/' || reqPath.endsWith('/')) {
            reqPath += 'index.html';
        }

        const filePath = path.normalize(path.join(rootDir, reqPath));

        if (!filePath.startsWith(rootDir)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found: ' + reqPath);
                return;
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            const totalSize = stats.size;

            // Support HTTP Range requests for smooth audio/video streaming
            const range = req.headers.range;
            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

                if (start >= totalSize || end >= totalSize || start > end) {
                    res.writeHead(416, { 'Content-Range': `bytes */${totalSize}` });
                    res.end();
                    return;
                }

                const chunksize = (end - start) + 1;
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': contentType,
                });

                const stream = fs.createReadStream(filePath, { start, end });
                stream.on('error', () => res.destroy());
                res.on('close', () => stream.destroy());
                stream.pipe(res);
            } else {
                res.writeHead(200, {
                    'Content-Length': totalSize,
                    'Content-Type': contentType,
                    'Accept-Ranges': 'bytes',
                    'Cache-Control': 'no-cache'
                });

                const stream = fs.createReadStream(filePath);
                stream.on('error', () => res.destroy());
                res.on('close', () => stream.destroy());
                stream.pipe(res);
            }
        });
    });

    server.on('error', (err) => {
        console.error(`[Server ${port}] Error:`, err.message);
    });

    server.listen(port, () => {
        console.log(`[Server] Serving ${rootDir} on http://localhost:${port}/`);
    });

    return server;
}

process.on('uncaughtException', (err) => {
    console.error('[Process UncaughtException]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Process UnhandledRejection]:', reason);
});

const hyperRoot = path.resolve(__dirname);
const slopcraftRoot = path.resolve(__dirname, 'slopcraft 3D');

createStaticServer(hyperRoot, 8000);
createStaticServer(slopcraftRoot, 8060);

// Keep-alive timer to prevent event loop starvation in background processes
setInterval(() => {}, 1000 * 60 * 60);

