from PIL import Image
import os

SRC_DIR = 'e2e/composed/final'
TARGETS = {
    'asc-6.5-new': (1284, 2778),    # iPhone 14/15 Pro Max
    'asc-6.5-legacy': (1242, 2688),  # iPhone 11 Pro Max / XS Max
}

for label, size in TARGETS.items():
    dst = f'e2e/composed/{label}'
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(SRC_DIR)):
        if not f.endswith('.png'):
            continue
        im = Image.open(os.path.join(SRC_DIR, f))
        if im.mode == 'RGBA':
            im = im.convert('RGB')
        im_resized = im.resize(size, Image.LANCZOS)
        out = os.path.join(dst, f)
        im_resized.save(out, 'PNG', optimize=False)
        print(f'[{label}] {f}: {im_resized.size[0]}x{im_resized.size[1]}')

print('\nDone.')
