# add_ads.py
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agroconnect.settings')
django.setup()

from api.models import User
from marketplace.models import Crop, Advertisement

def add_ads():
    """Add multiple ads at once"""
    
    # Get farmers
    farmers = User.objects.filter(role__in=['farmer', 'both'])[:5]
    
    if not farmers:
        print("❌ No farmers found! Please create farmers first.")
        print("   Run: python add_users.py")
        return
    
    # Get crops
    crops = Crop.objects.all()
    
    if not crops:
        print("❌ No crops found! Please add crops first.")
        return
    
    # Sample ads data
    ads_data = [
        {
            'title': 'Fresh Maize for Sale',
            'quantity': 100,
            'unit': 'bags',
            'price_per_unit': 25000,
            'location_text': 'Oyo, Nigeria',
            'description': 'High-quality fresh maize, harvested this season.'
        },
        {
            'title': 'Premium Rice Available',
            'quantity': 200,
            'unit': 'bags',
            'price_per_unit': 40000,
            'location_text': 'Lagos, Nigeria',
            'description': 'Premium quality rice, direct from farm.'
        },
        {
            'title': 'Organic Cassava',
            'quantity': 50,
            'unit': 'bags',
            'price_per_unit': 18000,
            'location_text': 'Abuja, Nigeria',
            'description': 'Organically grown cassava, perfect for processing.'
        },
        {
            'title': 'Fresh Yam Tubers',
            'quantity': 300,
            'unit': 'pieces',
            'price_per_unit': 2000,
            'location_text': 'Benue, Nigeria',
            'description': 'Fresh yam tubers, just harvested.'
        },
        {
            'title': 'Ripe Tomatoes',
            'quantity': 100,
            'unit': 'crates',
            'price_per_unit': 15000,
            'location_text': 'Kano, Nigeria',
            'description': 'Ripe tomatoes, perfect for market.'
        },
        {
            'title': 'Fresh Peppers',
            'quantity': 80,
            'unit': 'bags',
            'price_per_unit': 12000,
            'location_text': 'Oyo, Nigeria',
            'description': 'Fresh bell peppers, farm fresh.'
        },
        {
            'title': 'Quality Onions',
            'quantity': 150,
            'unit': 'bags',
            'price_per_unit': 20000,
            'location_text': 'Niger, Nigeria',
            'description': 'High-quality onions, ready for delivery.'
        },
        {
            'title': 'Premium Cocoa Beans',
            'quantity': 50,
            'unit': 'bags',
            'price_per_unit': 50000,
            'location_text': 'Ondo, Nigeria',
            'description': 'Grade A cocoa beans, premium quality.'
        },
        {
            'title': 'Fresh Palm Oil',
            'quantity': 100,
            'unit': 'litres',
            'price_per_unit': 3000,
            'location_text': 'Rivers, Nigeria',
            'description': 'Pure red palm oil, freshly extracted.'
        },
        {
            'title': 'Sweet Mangoes',
            'quantity': 200,
            'unit': 'pieces',
            'price_per_unit': 500,
            'location_text': 'Lagos, Nigeria',
            'description': 'Fresh sweet mangoes, in season.'
        },
    ]

    print("=" * 50)
    print("📝 ADDING ADS")
    print("=" * 50)

    created_count = 0
    skipped_count = 0

    for i, ad_data in enumerate(ads_data):
        # Select a farmer (cycle through available farmers)
        farmer = farmers[i % len(farmers)]
        
        # Select a crop (cycle through available crops)
        crop = crops[i % len(crops)]
        
        # Check if similar ad exists (optional - skip duplicates)
        if Advertisement.objects.filter(
            seller=farmer,
            title=ad_data['title'],
            status='active'
        ).exists():
            print(f"⏭️ Ad '{ad_data['title']}' already exists for {farmer.username} - skipping")
            skipped_count += 1
            continue
        
        # Create ad
        try:
            ad = Advertisement.objects.create(
                seller=farmer,
                crop=crop,
                title=ad_data['title'],
                quantity=ad_data['quantity'],
                unit=ad_data['unit'],
                price_per_unit=ad_data['price_per_unit'],
                location_text=ad_data['location_text'],
                description=ad_data['description'],
                is_negotiable=True,
                status='active'
            )
            print(f"✅ Created: {ad.title} - {farmer.username} - {crop.name}")
            created_count += 1
        except Exception as e:
            print(f"❌ Failed to create ad: {str(e)}")

    print("\n" + "=" * 50)
    print(f"📊 SUMMARY:")
    print(f"   ✅ Created: {created_count} ads")
    print(f"   ⏭️ Skipped: {skipped_count} ads")
    print(f"   📋 Total ads now: {Advertisement.objects.count()}")
    print("=" * 50)

if __name__ == '__main__':
    add_ads()