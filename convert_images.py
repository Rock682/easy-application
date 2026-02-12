from PIL import Image
import os
import glob

# Convert hero images to WebP
target_dir = r"c:\Users\rakes\Desktop\easy-application"
images = glob.glob(os.path.join(target_dir, "*-hero.png"))

print(f"Found {len(images)} images to convert.")

for image_path in images:
    try:
        img = Image.open(image_path)
        webp_path = image_path.replace(".png", ".webp")
        img.save(webp_path, "WEBP", quality=80)
        print(f"Converted: {os.path.basename(image_path)} -> {os.path.basename(webp_path)}")
    except Exception as e:
        print(f"Failed to convert {image_path}: {e}")
