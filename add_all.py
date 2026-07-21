# add_all.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agroconnect.settings')
django.setup()

print("=" * 60)
print("🌾 AGRO CONNECT - BULK DATA LOADER")
print("=" * 60)

# Import and run user script
print("\n1️⃣ ADDING USERS...")
exec(open('add_users.py').read())

# Import and run ads script
print("\n2️⃣ ADDING ADS...")
exec(open('add_ads.py').read())

print("\n" + "=" * 60)
print("✅ ALL DATA LOADED SUCCESSFULLY!")
print("=" * 60)