# add_crops.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agroconnect.settings')
django.setup()

from marketplace.models import Crop

crops = [
    ('Maize', 'Grains'),
    ('Rice', 'Grains'),
    ('Cassava', 'Tubers'),
    ('Yam', 'Tubers'),
    ('Tomatoes', 'Vegetables'),
    ('Peppers', 'Vegetables'),
    ('Onions', 'Vegetables'),
    ('Cocoa', 'Cash Crops'),
    ('Palm Oil', 'Cash Crops'),
    ('Mango', 'Fruits'),
    ('Orange', 'Fruits'),
    ('Plantain', 'Fruits'),
    ('Groundnut', 'Legumes'),
    ('Soybeans', 'Legumes'),
]

for name, category in crops:
    crop, created = Crop.objects.get_or_create(name=name, category=category)
    if created:
        print(f"✅ Added: {name}")
    else:
        print(f"⏭️ Already exists: {name}")

print(f"\n✅ Total crops: {Crop.objects.count()}")