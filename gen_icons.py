from PIL import Image, ImageDraw

def draw_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    u = size / 8
    r = int(size * 0.15)

    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=(15, 15, 35))

    def block(gx, gy, color):
        pad = int(u * 0.08)
        x1 = int(gx * u) + pad
        y1 = int(gy * u) + pad
        x2 = int((gx + 1) * u) - pad
        y2 = int((gy + 1) * u) - pad
        br = max(2, int(u * 0.1))
        draw.rounded_rectangle([x1, y1, x2, y2], radius=br, fill=color)
        hi = (*color[:3], 50)
        draw.rectangle([x1 + 2, y1 + 2, x2 - 2, y1 + int(u * 0.12)], fill=hi)

    purple = (180, 77, 255)
    cyan = (0, 212, 255)
    orange = (255, 140, 0)
    green = (0, 255, 136)

    # T piece
    for gx in [2, 3, 4]:
        block(gx, 1.2, purple)
    block(3, 2.2, purple)

    # I piece
    for gx in [1, 2, 3, 4]:
        block(gx, 3.2, cyan)

    # L piece
    block(2, 4.2, orange)
    block(2, 5.2, orange)
    block(3, 5.2, orange)

    # S piece
    block(4.5, 4.2, green)
    block(5.5, 4.2, green)
    block(5.5, 5.2, green)

    return img


for s in [192, 512]:
    icon = draw_icon(s)
    icon.save(f'icons/icon-{s}.png')
    print(f'Created icons/icon-{s}.png')
