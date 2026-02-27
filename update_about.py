#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os

filepath = r'c:\Users\syits\OneDrive\Documents\web porto personal\index.html'

# Read the file with UTF-8 encoding
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# First replacement - first paragraph
old1 = "I'm a Graphic Designer involved in videography, photography, and simple web development.\nI enjoy transforming complex ideas into visuals that are clean, engaging, and easy to understand."
new1 = "I am a digital designer and system-oriented builder who focuses on creating clean, structured, and functional digital experiences. I don't just design visuals — I build with clarity and purpose."

if old1 in content:
    content = content.replace(old1, new1)
    print("✓ First paragraph updated")
else:
    print("✗ First paragraph not found")

# Second replacement - second and third paragraphs
old2 = "My work focuses on creating designs that are not only visually appealing but also functional and aligned with each brand's purpose.\nI always add a personal touch to make every project feel alive and distinctive.\nMy goal is simple — to communicate messages and identities in a creative, strong, and memorable way."
new2 = """I approach every project with structure first, aesthetics second. For me, design is not only about how it looks, but how it works. I enjoy improving systems, refining layouts, and making digital experiences more efficient and intentional.

          </p>

          <p>
            Currently, I am expanding from visual design into web structuring and database integration. Alongside my creative work, I am continuing my education through a homeschooling program while gaining professional experience in an export-import company. My goal is to combine creativity with logic — building digital work that is visually strong, technically organized, and scalable."""

if old2 in content:
    content = content.replace(old2, new2)
    print("✓ Second paragraph updated")
else:
    print("✗ Second paragraph not found")

# Write the file back
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ File updated successfully!")
