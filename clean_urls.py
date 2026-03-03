import os
import re

# Directory containing the website
root_dir = r"c:\Users\rakes\Desktop\easy-application"

# Patterns to replace
replacements = [
    (r'href="([^"]*)/index\.html"', r'href="\1/"'),  # folder/index.html -> folder/
    (r'href="index\.html"', r'href="/"'),  # index.html -> /
    (r'href="\./"', r'href="/"'),  # ./ -> /
]

# Find all HTML files
html_files = []
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.html'):
            html_files.append(os.path.join(root, file))

print(f"Found {len(html_files)} HTML files to process\n")

# Process each file
files_modified = 0
total_replacements = 0

for filepath in html_files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        file_replacements = 0
        
        # Apply all replacement patterns
        for pattern, replacement in replacements:
            matches = len(re.findall(pattern, content))
            if matches > 0:
                content = re.sub(pattern, replacement, content)
                file_replacements += matches
        
        # Write back if changes were made
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            files_modified += 1
            total_replacements += file_replacements
            print(f"✓ Updated: {os.path.relpath(filepath, root_dir)} ({file_replacements} replacements)")
        else:
            print(f"  Skipped: {os.path.relpath(filepath, root_dir)} (no changes needed)")
    
    except Exception as e:
        print(f"✗ Error processing {filepath}: {e}")

print(f"\n{'='*60}")
print(f"Summary:")
print(f"  Files modified: {files_modified}/{len(html_files)}")
print(f"  Total replacements: {total_replacements}")
print(f"{'='*60}")
