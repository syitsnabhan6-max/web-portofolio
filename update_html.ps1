$filePath = 'c:\Users\syits\OneDrive\Documents\web porto personal\index.html'
$content = [System.IO.File]::ReadAllText($filePath)

# Update About Me - first paragraph
$old1 = "I'm a Graphic Designer involved in videography, photography, and simple web development.`nI enjoy transforming complex ideas into visuals that are clean, engaging, and easy to understand."
$new1 = "I am a digital designer and system-oriented builder who focuses on creating clean, structured, and functional digital experiences. I don't just design visuals — I build with clarity and purpose."

$content = $content.Replace($old1, $new1)

# Update About Me - second and third paragraphs
$old2 = "My work focuses on creating designs that are not only visually appealing but also functional and aligned with each brand's purpose.`nI always add a personal touch to make every project feel alive and distinctive.`nMy goal is simple — to communicate messages and identities in a creative, strong, and memorable way."
$new2 = "I approach every project with structure first, aesthetics second. For me, design is not only about how it looks, but how it works. I enjoy improving systems, refining layouts, and making digital experiences more efficient and intentional.`n`n          <p>`n            Currently, I am expanding from visual design into web structuring and database integration. Alongside my creative work, I am continuing my education through a homeschooling program while gaining professional experience in an export-import company. My goal is to combine creativity with logic — building digital work that is visually strong, technically organized, and scalable."

$content = $content.Replace($old2, $new2)

[System.IO.File]::WriteAllText($filePath, $content)
Write-Host "Content updated successfully!"
