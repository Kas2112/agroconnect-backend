# api/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # Django already has username, email, password, first_name, last_name
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    role = models.CharField(
        max_length=20,
        choices=[
            ('farmer', 'Farmer'),
            ('buyer', 'Buyer'),
            ('both', 'Both'),
        ],
        default='buyer'
    )
    location_state = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_transactions = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    profile_image = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    fcm_token = models.CharField(max_length=255, blank=True, null=True)
    
    # ============ BANK FIELDS ============
    bank_code = models.CharField(max_length=10, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=20, blank=True, null=True)
    account_name = models.CharField(max_length=100, blank=True, null=True)
    paystack_recipient_code = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"
    
    class Meta:
        db_table = 'users'