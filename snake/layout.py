import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Rename Oracle to Genius
html = html.replace('Advanced Example: The "Oracle" Bot', 'Advanced Example: The "Genius" Bot')
html = html.replace('SNAKE DEV ORACLE BOT', 'SNAKE DEV GENIUS BOT')

# 2. Add layout container divs
# Change stats div
html = html.replace('<div>\n    Score: <b id="stat-score">', '<div id="stat-panel">\n    <span>Score: <b id="stat-score">')
html = html.replace('Status: <b id="stat-status">IDLE</b>\n  </div>', 'Status: <b id="stat-status">IDLE</b></span>\n  </div>')

# Change separators inside stat panel from | to </span><span>
html = html.replace('</b> |\n    Length:', '</b></span><span> | Length:')
html = html.replace('</b> |\n    Ticks:', '</b></span><span> | Ticks:')
html = html.replace('</b> |\n    Speed:', '</b></span><span> | Speed:')
html = html.replace('</b>ms |\n    Status:', '</b>ms</span><span> | Status:')

# Group into game-panel and settings-panel
html = html.replace('<div id="stat-panel">', '<div class="layout-container">\n  <div class="game-panel">\n    <div id="stat-panel">')
html = html.replace('<button id="btn-restart">Restart</button>\n  </div>', '<button id="btn-restart">Restart</button>\n  </div>\n  </div>\n  <div class="settings-panel">')
html = html.replace('<script type="module"', '  </div>\n</div>\n\n  <script type="module"')

# Bump version
html = re.sub(r'src="\./src/main\.js\?v=\d+"', 'src="./src/main.js?v=19"', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('HTML Layout Applied!')
