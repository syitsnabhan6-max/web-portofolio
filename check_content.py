#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os

filepath = r'c:\Users\syits\OneDrive\Documents\web porto personal\index.html'

# Read the file
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Print lines 215-225 (0-indexed, so 214-224)
print("Lines around About Me section:")
for i in range(214, 230):
    if i < len(lines):
        print(f"Line {i+1}: {repr(lines[i])}")

# Now try the replacement with exact line content
content = ''.join(lines)

# Try simpler replacements
searches = [
    "I'm a Graphic Designer",
    "Graphic Designer involved in videography",
]

for search in searches:
    if search in content:
        print(f"\n✓ Found: {search[:50]}")
    else:
        print(f"\n✗ Not found: {search[:50]}")
