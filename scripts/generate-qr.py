"""Generate branded QR code for print."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

import qrcode
from qrcode.constants import ERROR_CORRECT_H

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://app.auroraforwomen.com'
NAVY = '#0c134f'
OUT = ROOT / 'app-qr-branded.png'

# --- QR core ---
qr = qrcode.QRCode(version=None, error_correction=ERROR_CORRECT_H, box_size=14, border=2)
qr.add_data(URL)
qr.make(fit=True)
qr_img = qr.make_image(fill_color=NAVY, back_color='white').convert('RGBA')
qr_size = qr_img.size[0]

# --- Logo in center ---
emblem = Image.open(ROOT / 'aurora-emblem.png').convert('RGBA')
logo_size = qr_size // 4
emblem = emblem.resize((logo_size, logo_size), Image.Resampling.LANCZOS)

pad = logo_size // 8
badge = Image.new('RGBA', (logo_size + pad * 2, logo_size + pad * 2), (255, 255, 255, 255))
badge.paste(emblem, (pad, pad), emblem)

x = (qr_size - badge.size[0]) // 2
y = (qr_size - badge.size[1]) // 2
qr_img.paste(badge, (x, y), badge)

# --- Canvas with text ---
url_label = 'app.auroraforwomen.com'

margin_x = 48
top_pad = 32
gap = 20
bottom_pad = 40

try:
    font_url = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 24)
except OSError:
    font_url = ImageFont.load_default()

canvas_w = qr_size + margin_x * 2
canvas_h = top_pad + qr_size + gap + bottom_pad + 20

canvas = Image.new('RGBA', (canvas_w, canvas_h), (255, 250, 246, 255))
draw = ImageDraw.Draw(canvas)

def text_w(font, text):
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0]

def draw_centered(text, y, font, fill):
    w = text_w(font, text)
    draw.text(((canvas_w - w) // 2, y), text, font=font, fill=fill)

qr_x = margin_x
qr_y = top_pad
canvas.paste(qr_img, (qr_x, qr_y), qr_img)

url_y = qr_y + qr_size + gap
draw_centered(url_label, url_y, font_url, NAVY)

canvas.convert('RGB').save(OUT, 'PNG', optimize=True)
print(f'Saved {OUT} ({canvas.size[0]}x{canvas.size[1]})')
