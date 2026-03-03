import os
import re

# Directory containing the website
root_dir = r"c:\Users\rakes\Desktop\easy-application"

# Files to process (all HTML files)
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
        
        # Replace patterns
        # Pattern 1: href="../folder/index.html" -> href="../folder/"
        pattern1 = r'href="(\.\./[^"]+)/index\.html"'
        matches1 = len(re.findall(pattern1, content))
        if matches1 > 0:
            content = re.sub(pattern1, r'href="\1/"', content)
            file_replacements += matches1
        
        # Pattern 2: href="folder/index.html" -> href="folder/"
        pattern2 = r'href="([a-z0-9\-]+)/index\.html"'
        matches2 = len(re.findall(pattern2, content))
        if matches2 > 0:
            content = re.sub(pattern2, r'href="\1/"', content)
            file_replacements += matches2
        
        # Pattern 3: href="index.html" -> href="/"
        pattern3 = r'href="index\.html"'
        matches3 = len(re.findall(pattern3, content))
        if matches3 > 0:
            content = re.sub(pattern3, r'href="/"', content)
            file_replacements += matches3
        
        # Write back if changes were made
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            files_modified += 1
            total_replacements += file_replacements
            rel_path = os.path.relpath(filepath, root_dir)
            print(f"✓ Updated: {rel_path} ({file_replacements} replacements)")
    
    except Exception as e:
        print(f"✗ Error processing {filepath}: {e}")

print(f"\n{'='*60}")
print(f"Summary:")
print(f"  Files modified: {files_modified}/{len(html_files)}")
print(f"  Total replacements: {total_replacements}")
print(f"{'='*60}")
print("\n✅ All URLs have been updated to clean format!")
