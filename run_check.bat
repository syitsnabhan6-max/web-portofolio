@echo off
cd /d "c:\Users\syits\OneDrive\Documents\web porto personal"
python check_content.py > output.txt 2>&1
type output.txt
