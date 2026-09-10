require 'webrick'

server = WEBrick::HTTPServer.new(
  Port: 8080,
  DocumentRoot: '.',
  DirectoryIndex: ['index.html'],
  RequestCallback: proc do |req, res|
    res['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    res['Pragma'] = 'no-cache'
    res['Expires'] = '0'
  end
)

trap('INT') { server.shutdown }

puts "Starting Ruby server with caching enabled on port 8080..."
server.start
