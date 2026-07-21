# add_users.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agroconnect.settings')
django.setup()

from api.models import User
from marketplace.models import Crop

def add_users():
    """Add multiple users at once"""
    
    users = [
        {
            'username': 'farmer_ade',
            'password': 'password123',
            'phone': '08011111111',
            'role': 'farmer',
            'location_state': 'Oyo',
            'full_name': 'Ade Farmer'
        },
        {
            'username': 'farmer_bisi',
            'password': 'password123',
            'phone': '08022222222',
            'role': 'farmer',
            'location_state': 'Lagos',
            'full_name': 'Bisi Farmer'
        },
        {
            'username': 'farmer_chi',
            'password': 'password123',
            'phone': '08033333333',
            'role': 'farmer',
            'location_state': 'Abuja',
            'full_name': 'Chi Farmer'
        },
        {
            'username': 'buyer_david',
            'password': 'password123',
            'phone': '08044444444',
            'role': 'buyer',
            'location_state': 'Kano',
            'full_name': 'David Buyer'
        },
        {
            'username': 'buyer_emeka',
            'password': 'password123',
            'phone': '08055555555',
            'role': 'buyer',
            'location_state': 'Enugu',
            'full_name': 'Emeka Buyer'
        },
        {
            'username': 'buyer_fatima',
            'password': 'password123',
            'phone': '08066666666',
            'role': 'buyer',
            'location_state': 'Kaduna',
            'full_name': 'Fatima Buyer'
        },
        {
            'username': 'labourer_geo',
            'password': 'password123',
            'phone': '08077777777',
            'role': 'labourer',
            'location_state': 'Ogun',
            'full_name': 'Geo Labourer'
        },
        {
            'username': 'labourer_halima',
            'password': 'password123',
            'phone': '08088888888',
            'role': 'labourer',
            'location_state': 'Plateau',
            'full_name': 'Halima Labourer'
        },
    ]

    print("=" * 50)
    print("📝 ADDING USERS")
    print("=" * 50)

    created_count = 0
    skipped_count = 0

    for user_data in users:
        username = user_data['username']
        full_name = user_data.pop('full_name', username)
        
        # Check if user exists
        if User.objects.filter(username=username).exists():
            print(f"⏭️ User '{username}' already exists - skipping")
            skipped_count += 1
            continue
        
        # Create user
        try:
            user = User.objects.create_user(**user_data)
            # Add full name
            user.first_name = full_name.split()[0]
            user.last_name = ' '.join(full_name.split()[1:]) if len(full_name.split()) > 1 else ''
            user.save()
            print(f"✅ Created: {username} ({full_name}) - Role: {user_data['role']}")
            created_count += 1
        except Exception as e:
            print(f"❌ Failed to create {username}: {str(e)}")

    print("\n" + "=" * 50)
    print(f"📊 SUMMARY:")
    print(f"   ✅ Created: {created_count} users")
    print(f"   ⏭️ Skipped: {skipped_count} users")
    print(f"   📋 Total users now: {User.objects.count()}")
    print("=" * 50)

if __name__ == '__main__':
    add_users()