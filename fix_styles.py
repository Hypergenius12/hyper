import re

biomes_code = open("excavator/js/biomes.js").read()

def replace_style(match):
    name = match.group(1).lower()
    style = "solid"
    
    if "landing page" in name: style = "rounded"
    elif "saas" in name: style = "inset-2"
    elif "social feed" in name: style = "circle"
    elif "ad network" in name: style = "x-mark"
    elif "cloud" in name: style = "hollow"
    elif "framework" in name: style = "checkerboard"
    elif "stack overflow" in name: style = "triangle"
    elif "crypto" in name: style = "diamond"
    elif "web 2.0" in name: style = "rounded"
    elif "flash" in name: style = "wireframe"
    elif "forum" in name: style = "hlines-2"
    elif "myspace" in name: style = "stripes"
    elif "piracy" in name: style = "crosshair"
    elif "geocities" in name: style = "glitch"
    elif "irc" in name: style = "hlines-3"
    elif "y2k" in name: style = "glitch"
    elif "napster" in name: style = "waves" # if waves doesn't exist, use dots
    elif "java applet" in name: style = "grid-2"
    elif "dial-up" in name: style = "dots"
    elif "usenet" in name: style = "vlines-4"
    elif "bbs" in name: style = "checkerboard"
    elif "arpanet" in name: style = "wireframe"
    elif "mainframe" in name: style = "grid-5"
    elif "source code" in name: style = "brackets"
    elif "kernel" in name: style = "solid"
    elif "singularity" in name: style = "circle"
    else:
        # Fallbacks based on depth index or just hash
        h = sum(ord(c) for c in name)
        styles = ['solid', 'wireframe', 'dots', 'stripes', 'hollow', 'checkerboard', 'diamond', 'triangle', 'inset-1', 'grid-3', 'hlines-4']
        style = styles[h % len(styles)]
        
    # fallback if 'waves' isn't implemented (it isn't)
    if style == 'waves': style = 'stripes'
    
    # We replace the blockStyle: "..." with blockStyle: "new_style"
    body = match.group(2)
    new_body = re.sub(r'blockStyle:\s*"[^"]+"', f'blockStyle: "{style}"', body)
    
    return f'name: "{match.group(1)}",{new_body}'

new_code = re.sub(r'name:\s*"([^"]+)",(.*?)(?=\n\s*(?:name:|};|\];))', replace_style, biomes_code, flags=re.DOTALL)

open("excavator/js/biomes.js", "w").write(new_code)
print("Updated styles.")
