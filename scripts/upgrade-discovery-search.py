from pathlib import Path

path = Path('worker/index.js')
text = path.read_text(encoding='utf-8')
old = """  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
"""
new = """  const latRaw = url.searchParams.get('lat');
  const lngRaw = url.searchParams.get('lng');
  const lat = latRaw === null ? Number.NaN : Number(latRaw);
  const lng = lngRaw === null ? Number.NaN : Number(lngRaw);
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
"""
if old in text:
    text = text.replace(old, new, 1)
elif 'const latRaw = url.searchParams.get' not in text:
    raise SystemExit('Location parsing block not found')
path.write_text(text, encoding='utf-8')
