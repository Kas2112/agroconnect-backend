# marketplace/admin.py
from django.contrib import admin
from .models import Crop, Advertisement, Application

@admin.register(Crop)
class CropAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'category')
    ordering = ('name',)

@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'seller', 'crop', 'quantity', 'price_per_unit', 'status', 'created_at')
    list_filter = ('status', 'crop', 'created_at')
    search_fields = ('title', 'seller__username', 'location_text')
    readonly_fields = ('views_count', 'applications_count', 'created_at', 'updated_at')
    ordering = ('-created_at',)

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('id', 'ad', 'buyer', 'requested_quantity', 'offered_price', 'status', 'created_at')
    list_filter = ('status', 'delivery_method', 'created_at')
    search_fields = ('ad__title', 'buyer__username', 'message')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)