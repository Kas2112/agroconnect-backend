# api/serializers.py
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'phone', 'role', 'location_state', 'rating']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()