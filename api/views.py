# api/views.py
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore[import]
from .models import User as CustomUser
from .serializers import UserSerializer
import re

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        phone = request.data.get('phone')
        password = request.data.get('password')
        full_name = request.data.get('full_name')
        role = request.data.get('role', 'buyer')
        location_state = request.data.get('location_state', '')
        
        # Validate phone
        if not phone:
            return Response({'error': 'Phone number is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user exists
        if CustomUser.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        if CustomUser.objects.filter(phone=phone).exists():
            return Response({'error': 'Phone number already registered'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user = CustomUser.objects.create_user(
            username=username,
            password=password,
            first_name=full_name.split()[0] if full_name else '',
            last_name=' '.join(full_name.split()[1:]) if full_name else '',
            phone=phone,
            role=role,
            location_state=location_state
        )
        
        # Generate token
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'data': {
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'full_name': f"{user.first_name} {user.last_name}".strip(),
                    'phone': user.phone,
                    'role': user.role,
                    'location_state': user.location_state
                },
                'token': str(refresh.access_token),
                'refresh_token': str(refresh)
            }
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        phone = request.data.get('phone')
        password = request.data.get('password')
        
        # Try to find user by username or phone
        user = None
        if username:
            try:
                user = CustomUser.objects.get(username=username)
            except CustomUser.DoesNotExist:
                pass
        
        if not user and phone:
            try:
                user = CustomUser.objects.get(phone=phone)
            except CustomUser.DoesNotExist:
                pass
        
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check password
        if not user.check_password(password):
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate token
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'data': {
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'full_name': f"{user.first_name} {user.last_name}".strip(),
                    'phone': user.phone,
                    'role': user.role,
                    'location_state': user.location_state,
                    'rating': str(user.rating)
                },
                'token': str(refresh.access_token),
                'refresh_token': str(refresh)
            }
        })

class ProfileView(APIView):
    def get(self, request):
        user = request.user
        return Response({
            'success': True,
            'data': {
                'id': user.id,
                'username': user.username,
                'full_name': f"{user.first_name} {user.last_name}".strip(),
                'phone': user.phone,
                'role': user.role,
                'location_state': user.location_state,
                'rating': str(user.rating),
                'total_transactions': user.total_transactions,
                'is_verified': user.is_verified,
                'bio': user.bio
            }
        })