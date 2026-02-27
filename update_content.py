#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Read the file
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Update About Me section - first paragraph
old_about = """I'm a Graphic Designer involved in videography, photography, and simple web development.
I enjoy transforming complex ideas into visuals that are clean, engaging, and easy to understand."""

new_about = """I am a digital designer and system-oriented builder who focuses on creating clean, structured, and functional digital experiences. I don't just design visuals — I build with clarity and purpose."""

content = content.replace(old_about, new_about)

# Update About Me section - second paragraph
old_para2 = """My work focuses on creating designs that are not only visually appealing but also functional and aligned with each brand's purpose.
I always add a personal touch to make every project feel alive and distinctive.
My goal is simple — to communicate messages and identities in a creative, strong, and memorable way."""

new_para2 = """I approach every project with structure first, aesthetics second. For me, design is not only about how it looks, but how it works. I enjoy improving systems, refining layouts, and making digital experiences more efficient and intentional.

          <p>
            Currently, I am expanding from visual design into web structuring and database integration. Alongside my creative work, I am continuing my education through a homeschooling program while gaining professional experience in an export-import company. My goal is to combine creativity with logic — building digital work that is visually strong, technically organized, and scalable."""

content = content.replace(old_para2, new_para2)

# Write back
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Content updated successfully!")
