import re
import sys

def check_braces(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    open_b = 0
    close_b = 0
    lines = content.split('\n')
    for i, line in enumerate(lines):
        line = line.split('//')[0]
        open_b += line.count('{')
        close_b += line.count('}')
        if close_b > open_b:
            print(f"Extra closing brace at {filename} line {i+1}: {line}")
            return False
            
    if open_b != close_b:
        print(f"Unmatched braces in {filename}: {open_b} open, {close_b} closed")
        return False
    return True

for arg in sys.argv[1:]:
    if not check_braces(arg):
        sys.exit(1)
    print(f"{arg} braces appear balanced.")
