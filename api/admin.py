# api/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DefaultUserAdmin
from .models import User

# Unregister Django's default User if registered
try:
    admin.site.unregister(User)
except:
    pass

@admin.register(User)
class UserAdmin(DefaultUserAdmin):
    list_display = ('id', 'username', 'phone', 'role', 'location_state', 'rating', 'is_verified')
    list_filter = ('role', 'is_verified', 'location_state')
    search_fields = ('username', 'phone', 'email', 'first_name', 'last_name')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    
    # Show username field
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'phone', 'bio')}),
        ('Location', {'fields': ('location_state', 'city', 'latitude', 'longitude')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Ratings', {'fields': ('rating', 'total_transactions', 'is_verified')}),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'phone', 'role'),
        }),
    )