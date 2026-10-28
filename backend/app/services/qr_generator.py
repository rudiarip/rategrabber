import io
import zipfile
import csv
from typing import List
import segno
from backend.app.core.config import settings

def generate_qr_bytes(url: str, format: str = "png", scale: int = 10) -> bytes:
    """Generates QR code bytes for a given URL using segno.
    Supported formats: 'png', 'svg'.
    """
    qr = segno.make(url, error='h')  # High error correction allows logo embedding if desired
    buffer = io.BytesIO()
    if format.lower() == "svg":
        qr.save(buffer, kind='svg', scale=scale, dark='#0F172A', light='#FFFFFF')
    else:
        # PNG format
        qr.save(buffer, kind='png', scale=scale, dark='#0F172A', light='#FFFFFF', border=2)
    buffer.seek(0)
    return buffer.getvalue()

def generate_batch_zip(cards: List[dict]) -> bytes:
    """Creates a downloadable ZIP file containing:
    1. High-resolution PNG QR code for each card
    2. SVG vector file for print shop / laser engraving
    3. 'nfc_encoding_urls.csv' containing full URLs for NFC tag encoders
    4. Printing instructions
    """
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, mode='w', compression=zipfile.ZIP_DEFLATED) as zf:
        # CSV data for NFC writer apps
        csv_buffer = io.StringIO()
        csv_writer = csv.writer(csv_buffer)
        csv_writer.writerow(["Card Code", "Direct Scan URL", "Batch ID", "Status"])
        
        for card in cards:
            code = card["code"]
            batch_id = card.get("batch_id", "default")
            card_url = f"{settings.BASE_URL}/c/{code}"
            
            # Write to CSV
            csv_writer.writerow([code, card_url, batch_id, "UNACTIVATED"])
            
            # Generate PNG (high resolution for 300 DPI card printing)
            png_bytes = generate_qr_bytes(card_url, format="png", scale=12)
            zf.writestr(f"qrcodes_png/{code}.png", png_bytes)
            
            # Generate SVG (vector for laser engraving / CorelDraw / Illustrator)
            svg_bytes = generate_qr_bytes(card_url, format="svg", scale=10)
            zf.writestr(f"qrcodes_svg/{code}.svg", svg_bytes)

        # Write CSV into ZIP
        zf.writestr("nfc_encoding_urls.csv", csv_buffer.getvalue())
        
        # Write README instructions for printing & NFC writing
        readme_text = (
            "⭐ TAPSTAR - PETUNJUK CETAK & ENCODING NFC ⭐\n"
            "====================================================\n\n"
            "1. FOLDER qrcodes_png/: File QR Code resolusi tinggi untuk cetak langsung ke kartu/standee akrilik.\n"
            "2. FOLDER qrcodes_svg/: File vector untuk CorelDraw, Adobe Illustrator, atau mesin Laser Engraving.\n"
            "3. FILE nfc_encoding_urls.csv: Berisi daftar URL unik untuk dimasukkan ke aplikasi NFC Writer (seperti NFC Tools Pro di Android/iOS atau desktop reader ACR122U).\n\n"
            f"Format URL: {settings.BASE_URL}/c/{{KODE}}\n"
        )
        zf.writestr("PETUNJUK_CETAK_TAPSTAR.txt", readme_text)

    zip_buffer.seek(0)
    return zip_buffer.getvalue()
