# marketplace/views.py - COMPLETE UPDATED WITH FIXED TRANSACTIONS AND BANK DETAILS
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from datetime import datetime
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import uuid
import secrets
import requests
import json
from decimal import Decimal
from django.db import models as django_models
from django.conf import settings
from .models import Crop, Advertisement, Application, Conversation, Message, Gig, GigApplication, GigReview, Transaction
from .serializers import (
    CropSerializer, AdvertisementSerializer, ApplicationSerializer, 
    ConversationSerializer, MessageSerializer,
    GigSerializer, GigApplicationSerializer, GigReviewSerializer,
    TransactionSerializer
)
from api.models import User

# ============ CROP & ADVERTISEMENT VIEWS ============

# Get all crops
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_crops(request):
    crops = Crop.objects.filter(is_active=True)
    serializer = CropSerializer(crops, many=True)
    return Response({'success': True, 'data': serializer.data})

# Get all active ads
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ads(request):
    ads = Advertisement.objects.filter(status='active').select_related('seller', 'crop')
    
    # Filter by crop
    crop_id = request.query_params.get('crop_id')
    if crop_id:
        ads = ads.filter(crop_id=crop_id)
    
    # Filter by location
    location = request.query_params.get('location')
    if location:
        ads = ads.filter(location_text__icontains=location)
    
    ads = ads.order_by('-created_at')
    serializer = AdvertisementSerializer(ads, many=True)
    return Response({'success': True, 'data': serializer.data})

# Create an ad - DIRECT CREATION WITH IMAGES
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_ad(request):
    print("=" * 60)
    print("📝 CREATE AD - DIRECT CREATION")
    print(f"User: {request.user.id} - {request.user.username}")
    print(f"Request data: {request.data}")
    print("=" * 60)
    
    data = request.data
    
    # Check required fields
    required_fields = ['crop_id', 'title', 'quantity', 'price_per_unit', 'location_text']
    missing_fields = []
    for field in required_fields:
        if not data.get(field):
            missing_fields.append(field)
    
    if missing_fields:
        print(f"❌ Missing fields: {missing_fields}")
        return Response({
            'error': f'Missing required fields: {", ".join(missing_fields)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check crop exists
    try:
        crop = Crop.objects.get(id=data['crop_id'])
        print(f"✅ Crop found: {crop.name} (ID: {crop.id})")
    except Crop.DoesNotExist:
        print(f"❌ Crop with ID {data['crop_id']} not found!")
        return Response({
            'error': f'Crop with ID {data["crop_id"]} does not exist'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"❌ Error checking crop: {str(e)}")
        return Response({
            'error': f'Invalid crop_id: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create ad DIRECTLY
    try:
        ad = Advertisement.objects.create(
            seller=request.user,
            crop_id=data['crop_id'],
            title=data['title'],
            quantity=data['quantity'],
            unit=data.get('unit', 'kg'),
            price_per_unit=data['price_per_unit'],
            location_text=data['location_text'],
            description=data.get('description', ''),
            is_negotiable=data.get('is_negotiable', True),
            images=data.get('images', [])
        )
        
        print(f"✅ Ad created successfully! ID: {ad.id}")
        
        created_ad = Advertisement.objects.select_related('seller', 'crop').get(id=ad.id)
        serializer = AdvertisementSerializer(created_ad)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Ad created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"❌ Error creating ad: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# Get ad details
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ad_detail(request, id):
    ad = get_object_or_404(Advertisement, id=id)
    serializer = AdvertisementSerializer(ad)
    return Response({'success': True, 'data': serializer.data})

# Get user's own ads
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_ads(request):
    ads = Advertisement.objects.filter(seller=request.user).order_by('-created_at')
    serializer = AdvertisementSerializer(ads, many=True)
    return Response({'success': True, 'data': serializer.data})

# ============ APPLICATION VIEWS ============

# Apply to buy - FIXED DIRECT CREATION
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_to_buy(request):
    print("=" * 60)
    print("📝 APPLY TO BUY - DIRECT CREATION")
    print(f"User: {request.user.id} - {request.user.username}")
    print(f"Request data: {request.data}")
    print("=" * 60)
    
    data = request.data
    
    # Check required fields
    required_fields = ['ad_id', 'requested_quantity', 'offered_price']
    missing_fields = []
    for field in required_fields:
        if not data.get(field):
            missing_fields.append(field)
    
    if missing_fields:
        print(f"❌ Missing fields: {missing_fields}")
        return Response({
            'error': f'Missing required fields: {", ".join(missing_fields)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if ad exists and is active
    try:
        ad = Advertisement.objects.get(id=data['ad_id'])
        print(f"✅ Ad found: {ad.title} (ID: {ad.id}), Status: {ad.status}")
    except Advertisement.DoesNotExist:
        print(f"❌ Ad with ID {data['ad_id']} not found")
        return Response({
            'error': 'Ad not found'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if ad is active
    if ad.status != 'active':
        print(f"❌ Ad is not active (status: {ad.status})")
        return Response({
            'error': f'This ad is no longer available (Status: {ad.status})'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user is the seller (can't apply to own ad)
    if ad.seller.id == request.user.id:
        print(f"❌ User is the seller of this ad")
        return Response({
            'error': 'You cannot apply to your own ad'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user already applied
    existing = Application.objects.filter(ad_id=data['ad_id'], buyer=request.user, status='pending')
    if existing.exists():
        print(f"❌ User already has a pending application")
        return Response({
            'error': 'You already have a pending application for this ad'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check quantity
    if float(data['requested_quantity']) > float(ad.quantity):
        print(f"❌ Requested quantity exceeds available")
        return Response({
            'error': f'Requested quantity ({data["requested_quantity"]}) exceeds available ({ad.quantity})'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create application DIRECTLY
    try:
        application = Application.objects.create(
            ad=ad,
            buyer=request.user,
            requested_quantity=data['requested_quantity'],
            offered_price=data['offered_price'],
            message=data.get('message', ''),
            status='pending'
        )
        
        # Increment application count
        ad.applications_count += 1
        ad.save()
        
        print(f"✅ Application created successfully! ID: {application.id}")
        
        # Get created application with relationships
        created_app = Application.objects.select_related('ad', 'ad__seller', 'ad__crop', 'buyer').get(id=application.id)
        serializer = ApplicationSerializer(created_app)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Application submitted successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"❌ Error creating application: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# ============ UPDATED: Get buyer's applications WITH TRANSACTIONS (FIXED) ============
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_applications(request):
    apps = Application.objects.filter(buyer=request.user).select_related('ad', 'ad__seller', 'ad__crop').order_by('-created_at')
    
    # Get the data with serializer
    serializer = ApplicationSerializer(apps, many=True)
    data = serializer.data
    
    # Add transaction data to each application using manual dict (no circular reference)
    for app_data in data:
        try:
            transaction = Transaction.objects.get(application_id=app_data['id'])
            app_data['transaction'] = {
                'id': transaction.id,
                'reference': transaction.reference,
                'amount': str(transaction.amount),
                'platform_fee': str(transaction.platform_fee),
                'seller_amount': str(transaction.seller_amount),
                'status': transaction.status,
                'payment_method': transaction.payment_method,
                'paid_at': transaction.paid_at,
                'released_at': transaction.released_at,
                'created_at': transaction.created_at,
                'updated_at': transaction.updated_at
            }
            print(f"✅ Found transaction for app {app_data['id']}")
        except Transaction.DoesNotExist:
            app_data['transaction'] = None
            print(f"❌ No transaction for app {app_data['id']}")
    
    return Response({'success': True, 'data': data})

# ============ UPDATED: Get applications received (for farmers) WITH TRANSACTIONS (FIXED) ============
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def received_applications(request):
    apps = Application.objects.filter(ad__seller=request.user).select_related('ad', 'buyer', 'ad__crop').order_by('-created_at')
    
    # Get the data with serializer
    serializer = ApplicationSerializer(apps, many=True)
    data = serializer.data
    
    # Add transaction data to each application using manual dict (no circular reference)
    for app_data in data:
        try:
            transaction = Transaction.objects.get(application_id=app_data['id'])
            app_data['transaction'] = {
                'id': transaction.id,
                'reference': transaction.reference,
                'amount': str(transaction.amount),
                'platform_fee': str(transaction.platform_fee),
                'seller_amount': str(transaction.seller_amount),
                'status': transaction.status,
                'payment_method': transaction.payment_method,
                'paid_at': transaction.paid_at,
                'released_at': transaction.released_at,
                'created_at': transaction.created_at,
                'updated_at': transaction.updated_at
            }
            print(f"✅ Found transaction for app {app_data['id']}")
        except Transaction.DoesNotExist:
            app_data['transaction'] = None
            print(f"❌ No transaction for app {app_data['id']}")
    
    return Response({'success': True, 'data': data})

# Update application status (accept/decline)
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_application_status(request, id):
    app = get_object_or_404(Application, id=id)
    
    # Check if user is the seller
    if app.ad.seller.id != request.user.id:
        return Response({'error': 'You are not authorized'}, status=status.HTTP_403_FORBIDDEN)
    
    status_value = request.data.get('status')
    if status_value not in ['accepted', 'declined']:
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
    
    app.status = status_value
    app.save()
    
    # If accepted, mark ad as sold and decline other applications
    if status_value == 'accepted':
        ad = app.ad
        ad.status = 'sold'
        ad.save()
        
        # Decline other pending applications
        Application.objects.filter(ad=ad, status='pending').exclude(id=app.id).update(status='declined')
    
    serializer = ApplicationSerializer(app)
    return Response({
        'success': True,
        'data': serializer.data,
        'message': f'Application {status_value}'
    })

# ============ CHAT VIEWS ============

# Get or create a conversation
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_or_get_conversation(request):
    """Create a new conversation or get existing one"""
    user = request.user
    other_user_id = request.data.get('other_user_id')
    ad_id = request.data.get('ad_id')
    
    if not other_user_id:
        return Response({
            'error': 'other_user_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        other_user = User.objects.get(id=other_user_id)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if conversation already exists
    conversations = Conversation.objects.filter(participants=user)
    conversations = conversations.filter(participants=other_user)
    
    if ad_id:
        conversations = conversations.filter(ad_id=ad_id)
    
    if conversations.exists():
        conversation = conversations.first()
    else:
        # Create new conversation
        conversation = Conversation.objects.create()
        conversation.participants.add(user, other_user)
        if ad_id:
            try:
                ad = Advertisement.objects.get(id=ad_id)
                conversation.ad = ad
                conversation.save()
            except Advertisement.DoesNotExist:
                pass
    
    serializer = ConversationSerializer(conversation)
    return Response({
        'success': True,
        'data': serializer.data
    })

# Get user's conversations
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversations(request):
    """Get all conversations for the logged-in user"""
    conversations = Conversation.objects.filter(participants=request.user)
    serializer = ConversationSerializer(conversations, many=True)
    return Response({
        'success': True,
        'data': serializer.data
    })

# Get messages for a conversation
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, conversation_id):
    """Get all messages in a conversation"""
    try:
        conversation = Conversation.objects.get(id=conversation_id)
    except Conversation.DoesNotExist:
        return Response({
            'error': 'Conversation not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user is a participant
    if request.user not in conversation.participants.all():
        return Response({
            'error': 'You are not a participant in this conversation'
        }, status=status.HTTP_403_FORBIDDEN)
    
    messages = Message.objects.filter(conversation=conversation)
    serializer = MessageSerializer(messages, many=True)
    
    # Mark messages as read
    Message.objects.filter(
        conversation=conversation,
        receiver=request.user,
        is_read=False
    ).update(is_read=True, read_at=datetime.now())
    
    return Response({
        'success': True,
        'data': serializer.data
    })

# Send a message
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """Send a message in a conversation"""
    data = request.data.copy()
    
    conversation_id = data.get('conversation_id')
    receiver_id = data.get('receiver_id')
    content = data.get('content')
    
    if not content:
        return Response({
            'error': 'Message content is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get conversation
    try:
        conversation = Conversation.objects.get(id=conversation_id)
    except Conversation.DoesNotExist:
        return Response({
            'error': 'Conversation not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user is a participant
    if request.user not in conversation.participants.all():
        return Response({
            'error': 'You are not a participant in this conversation'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get receiver
    if not receiver_id:
        # Get the other participant
        other_participants = conversation.participants.exclude(id=request.user.id)
        if other_participants.exists():
            receiver_id = other_participants.first().id
        else:
            return Response({
                'error': 'No receiver found'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        receiver = User.objects.get(id=receiver_id)
    except User.DoesNotExist:
        return Response({
            'error': 'Receiver not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Create message
    message = Message.objects.create(
        conversation=conversation,
        sender=request.user,
        receiver=receiver,
        content=content
    )
    
    # Update conversation last message
    conversation.last_message = content
    conversation.last_message_time = message.created_at
    conversation.save()
    
    serializer = MessageSerializer(message)
    return Response({
        'success': True,
        'data': serializer.data,
        'message': 'Message sent successfully'
    }, status=status.HTTP_201_CREATED)

# Get unread message count
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_count(request):
    """Get count of unread messages for the user"""
    count = Message.objects.filter(
        receiver=request.user,
        is_read=False
    ).count()
    
    return Response({
        'success': True,
        'data': {'unread_count': count}
    })

# ============ GIG VIEWS ============

# Get all active gigs
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_gigs(request):
    gigs = Gig.objects.filter(status='active')
    
    # Filter by category
    category = request.query_params.get('category')
    if category:
        gigs = gigs.filter(category=category)
    
    # Filter by location
    location = request.query_params.get('location')
    if location:
        gigs = gigs.filter(location_text__icontains=location)
    
    gigs = gigs.order_by('-created_at')
    serializer = GigSerializer(gigs, many=True)
    return Response({'success': True, 'data': serializer.data})

# Get gig details
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_gig_detail(request, id):
    gig = get_object_or_404(Gig, id=id)
    serializer = GigSerializer(gig)
    return Response({'success': True, 'data': serializer.data})

# Create a gig (Farmer only)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_gig(request):
    print("=" * 60)
    print("📝 CREATE GIG")
    print(f"User: {request.user.id} - {request.user.username}")
    print(f"Request data: {request.data}")
    print("=" * 60)
    
    data = request.data
    
    # Check required fields
    required_fields = ['title', 'description', 'location_text', 'start_date', 'end_date', 'rate_per_day']
    missing_fields = []
    for field in required_fields:
        if not data.get(field):
            missing_fields.append(field)
    
    if missing_fields:
        return Response({
            'error': f'Missing required fields: {", ".join(missing_fields)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create gig
    try:
        gig = Gig.objects.create(
            farmer=request.user,
            title=data['title'],
            description=data['description'],
            category=data.get('category', 'other'),
            location_text=data['location_text'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            daily_hours=data.get('daily_hours', 8),
            rate_per_day=data['rate_per_day'],
            number_of_workers_needed=data.get('number_of_workers_needed', 1),
            skills_required=data.get('skills_required', [])
        )
        
        print(f"✅ Gig created successfully! ID: {gig.id}")
        serializer = GigSerializer(gig)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Gig posted successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"❌ Error creating gig: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# Get farmer's own gigs
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_gigs(request):
    gigs = Gig.objects.filter(farmer=request.user).order_by('-created_at')
    serializer = GigSerializer(gigs, many=True)
    return Response({'success': True, 'data': serializer.data})

# Apply to a gig (Labourer only)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_to_gig(request):
    print("=" * 60)
    print("📝 APPLY TO GIG")
    print(f"User: {request.user.id} - {request.user.username}")
    print(f"Request data: {request.data}")
    print("=" * 60)
    
    data = request.data
    gig_id = data.get('gig_id')
    
    if not gig_id:
        return Response({
            'error': 'gig_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if gig exists and is active
    try:
        gig = Gig.objects.get(id=gig_id, status='active')
        print(f"✅ Gig found: {gig.title} (ID: {gig.id})")
    except Gig.DoesNotExist:
        return Response({
            'error': 'Gig not found or not active'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user is the farmer (can't apply to own gig)
    if gig.farmer.id == request.user.id:
        return Response({
            'error': 'You cannot apply to your own gig'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if already applied
    existing = GigApplication.objects.filter(gig_id=gig_id, labourer=request.user, status='pending')
    if existing.exists():
        return Response({
            'error': 'You already have a pending application for this gig'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create application
    try:
        application = GigApplication.objects.create(
            gig=gig,
            labourer=request.user,
            message=data.get('message', ''),
            rate_offered=data.get('rate_offered'),
            status='pending'
        )
        
        print(f"✅ Gig application created! ID: {application.id}")
        serializer = GigApplicationSerializer(application)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Application submitted successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# Get labourer's gig applications
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_gig_applications(request):
    apps = GigApplication.objects.filter(labourer=request.user).select_related('gig', 'gig__farmer').order_by('-created_at')
    serializer = GigApplicationSerializer(apps, many=True)
    return Response({'success': True, 'data': serializer.data})

# Get applications received (for farmers)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def received_gig_applications(request):
    apps = GigApplication.objects.filter(gig__farmer=request.user).select_related('gig', 'labourer').order_by('-created_at')
    serializer = GigApplicationSerializer(apps, many=True)
    return Response({'success': True, 'data': serializer.data})

# Update gig application status (accept/reject)
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_gig_application_status(request, id):
    app = get_object_or_404(GigApplication, id=id)
    
    # Check if user is the farmer
    if app.gig.farmer.id != request.user.id:
        return Response({'error': 'You are not authorized'}, status=status.HTTP_403_FORBIDDEN)
    
    status_value = request.data.get('status')
    if status_value not in ['accepted', 'rejected']:
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
    
    app.status = status_value
    if status_value == 'accepted':
        app.accepted_at = datetime.now()
    app.save()
    
    # If accepted, mark gig as filled if enough workers
    if status_value == 'accepted':
        gig = app.gig
        accepted_count = GigApplication.objects.filter(gig=gig, status='accepted').count()
        if accepted_count >= gig.number_of_workers_needed:
            gig.status = 'filled'
            gig.save()
            # Reject other pending applications
            GigApplication.objects.filter(gig=gig, status='pending').update(status='rejected')
    
    serializer = GigApplicationSerializer(app)
    return Response({
        'success': True,
        'data': serializer.data,
        'message': f'Application {status_value}'
    })

# ============ IMAGE UPLOAD VIEWS ============

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_image(request):
    """Upload an image for an ad"""
    print("=" * 60)
    print("📸 IMAGE UPLOAD")
    print(f"User: {request.user.id} - {request.user.username}")
    print("=" * 60)
    
    # Check if image is in request
    if 'image' not in request.FILES:
        return Response({
            'error': 'No image provided'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    image = request.FILES['image']
    
    # Validate file size
    if image.size > 5 * 1024 * 1024:  # 5MB
        return Response({
            'error': 'Image size must be less than 5MB'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate file type
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    ext = os.path.splitext(image.name)[1].lower()
    if ext not in valid_extensions:
        return Response({
            'error': f'Invalid file type. Allowed: {", ".join(valid_extensions)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate unique filename
    filename = f"ads/{uuid.uuid4()}{ext}"
    
    # Save image
    try:
        path = default_storage.save(filename, ContentFile(image.read()))
        url = default_storage.url(path)
        
        print(f"✅ Image uploaded: {url}")
        
        return Response({
            'success': True,
            'data': {
                'url': url,
                'filename': filename
            },
            'message': 'Image uploaded successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"❌ Error uploading image: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_image(request):
    """Delete an image"""
    filename = request.data.get('filename')
    
    if not filename:
        return Response({
            'error': 'filename is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        default_storage.delete(filename)
        print(f"✅ Image deleted: {filename}")
        return Response({
            'success': True,
            'message': 'Image deleted successfully'
        })
    except Exception as e:
        print(f"❌ Error deleting image: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# ============ PAYMENT VIEWS - DIRECT API CALLS ============

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initialize_payment(request):
    """Initialize a payment for an accepted application"""
    print("=" * 60)
    print("💰 INITIALIZE PAYMENT")
    print(f"User: {request.user.id} - {request.user.username}")
    print(f"Request data: {request.data}")
    print("=" * 60)
    
    application_id = request.data.get('application_id')
    
    if not application_id:
        return Response({
            'error': 'application_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get the application
    try:
        application = Application.objects.get(id=application_id)
        print(f"✅ Application found: ID {application.id}, Status: {application.status}")
    except Application.DoesNotExist:
        print(f"❌ Application not found")
        return Response({
            'error': 'Application not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if application is accepted
    if application.status != 'accepted':
        print(f"❌ Application status is {application.status}, not 'accepted'")
        return Response({
            'error': f'Application must be accepted before payment. Current status: {application.status}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user is the buyer
    if application.buyer.id != request.user.id:
        print(f"❌ User is not the buyer")
        return Response({
            'error': 'You are not the buyer for this application'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Check if transaction already exists
    if Transaction.objects.filter(application=application).exists():
        print(f"❌ Transaction already exists")
        return Response({
            'error': 'Transaction already exists for this application'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Calculate amounts
    amount = application.offered_price
    platform_fee = amount * Decimal(str(settings.PLATFORM_FEE_PERCENTAGE))
    seller_amount = amount - platform_fee
    
    print(f"💰 Amount: {amount}, Fee: {platform_fee}, Seller: {seller_amount}")
    
    # Generate unique reference
    reference = f"AGRO-{secrets.token_hex(8).upper()}"
    print(f"📝 Reference: {reference}")
    
    # Initialize Paystack via API
    try:
        secret_key = settings.PAYSTACK_SECRET_KEY
        amount_kobo = int(amount * 100)
        email = request.user.email or f"{request.user.id}@agroconnect.com"
        
        print(f"🔑 Secret key present: {bool(secret_key)}")
        print(f"💰 Amount in kobo: {amount_kobo}")
        print(f"📧 Email: {email}")
        
        # Make API call to Paystack
        url = "https://api.paystack.co/transaction/initialize"
        headers = {
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json"
        }
        data = {
            "reference": reference,
            "amount": amount_kobo,
            "email": email,
            "callback_url": f"{request.build_absolute_uri('/')}payment-verify"
        }
        
        print(f"📤 Sending to Paystack: {json.dumps(data)}")
        
        response = requests.post(url, headers=headers, json=data)
        response_data = response.json()
        
        print(f"📥 Paystack Response: {json.dumps(response_data)}")
        
        if response_data.get('status', False):
            # Create transaction record
            transaction = Transaction.objects.create(
                application=application,
                reference=reference,
                amount=amount,
                platform_fee=platform_fee,
                seller_amount=seller_amount,
                status='pending',
                paystack_response=response_data
            )
            
            print(f"✅ Transaction created: {transaction.id}")
            
            return Response({
                'success': True,
                'data': {
                    'transaction': TransactionSerializer(transaction).data,
                    'authorization_url': response_data['data']['authorization_url'],
                    'reference': reference
                },
                'message': 'Payment initialized successfully'
            })
        else:
            print(f"❌ Paystack error: {response_data}")
            return Response({
                'error': response_data.get('message', 'Payment initialization failed')
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        print(f"❌ Payment error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    """Verify payment after callback"""
    reference = request.query_params.get('reference')
    
    if not reference:
        return Response({
            'error': 'reference is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get transaction
    try:
        transaction = Transaction.objects.get(reference=reference)
    except Transaction.DoesNotExist:
        return Response({
            'error': 'Transaction not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Verify with Paystack via API
    try:
        secret_key = settings.PAYSTACK_SECRET_KEY
        
        url = f"https://api.paystack.co/transaction/verify/{reference}"
        headers = {
            "Authorization": f"Bearer {secret_key}"
        }
        
        print(f"📤 Verifying: {reference}")
        response = requests.get(url, headers=headers)
        response_data = response.json()
        
        print(f"📥 Verification Response: {json.dumps(response_data)}")
        
        if response_data.get('status') and response_data['data']['status'] == 'success':
            # Update transaction
            transaction.status = 'held'  # Held in escrow
            transaction.paid_at = datetime.now()
            transaction.paystack_response = response_data
            transaction.save()
            
            # Update application
            application = transaction.application
            application.status = 'paid'
            application.paid_at = datetime.now()
            application.save()
            
            return Response({
                'success': True,
                'data': TransactionSerializer(transaction).data,
                'message': 'Payment verified and held in escrow'
            })
        else:
            transaction.status = 'failed'
            transaction.save()
            return Response({
                'error': 'Payment verification failed'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        print(f"❌ Verification error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def release_payment(request):
    """Release payment from escrow to seller (after delivery confirmation)"""
    transaction_id = request.data.get('transaction_id')
    
    if not transaction_id:
        return Response({
            'error': 'transaction_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get transaction
    try:
        transaction = Transaction.objects.get(id=transaction_id, status='held')
    except Transaction.DoesNotExist:
        return Response({
            'error': 'Transaction not found or not in escrow'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user is the buyer (only buyer can confirm receipt)
    if transaction.application.buyer.id != request.user.id:
        return Response({
            'error': 'Only the buyer can confirm delivery and release payment'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get the seller
    seller = transaction.application.ad.seller
    
    # Check if seller has bank details
    if not seller.paystack_recipient_code:
        return Response({
            'error': 'Seller has not added bank details. Please contact support.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============ TRANSFER FUNDS TO SELLER ============
    try:
        import requests
        from django.conf import settings
        
        url = "https://api.paystack.co/transfer"
        headers = {
            "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        amount_kobo = int(transaction.seller_amount * 100)
        
        data = {
            "source": "balance",
            "amount": amount_kobo,
            "recipient": seller.paystack_recipient_code,
            "reason": f"Payment for {transaction.application.ad.title} - Agro Connect",
            "reference": f"PAYOUT-{secrets.token_hex(8).upper()}"
        }
        
        print(f"📤 Sending transfer to Paystack: {json.dumps(data)}")
        
        response = requests.post(url, headers=headers, json=data)
        result = response.json()
        
        print(f"📥 Transfer Response: {json.dumps(result)}")
        
        if not result.get('status'):
            return Response({
                'error': result.get('message', 'Transfer failed')
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        print(f"❌ Transfer error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Update transaction
    transaction.status = 'released'
    transaction.released_at = datetime.now()
    transaction.save()
    
    # Update application
    application = transaction.application
    application.status = 'completed'
    application.completed_at = datetime.now()
    application.save()
    
    # Update ad
    ad = application.ad
    ad.status = 'sold'
    ad.save()
    
    return Response({
        'success': True,
        'data': TransactionSerializer(transaction).data,
        'message': 'Payment released to seller successfully'
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transactions(request):
    """Get user's transactions"""
    user = request.user
    
    # Get transactions where user is buyer or seller
    transactions = Transaction.objects.filter(
        django_models.Q(application__buyer=user) | django_models.Q(application__ad__seller=user)
    ).select_related('application', 'application__ad', 'application__buyer', 'application__ad__seller')
    
    serializer = TransactionSerializer(transactions, many=True)
    return Response({
        'success': True,
        'data': serializer.data
    })


# ============ BANK DETAILS VIEWS ============

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_bank_details(request):
    """Add or update farmer's bank details"""
    data = request.data
    user = request.user
    
    bank_code = data.get('bank_code')
    account_number = data.get('account_number')
    account_name = data.get('account_name')
    
    if not bank_code or not account_number or not account_name:
        return Response({
            'error': 'bank_code, account_number and account_name are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Save bank details
    user.bank_code = bank_code
    user.account_number = account_number
    user.account_name = account_name
    
    # Create Paystack recipient
    try:
        import requests
        from django.conf import settings
        
        url = "https://api.paystack.co/transferrecipient"
        headers = {
            "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "type": "nuban",
            "name": account_name,
            "account_number": account_number,
            "bank_code": bank_code,
            "currency": "NGN"
        }
        
        response = requests.post(url, headers=headers, json=data)
        result = response.json()
        
        if result.get('status'):
            user.paystack_recipient_code = result['data']['recipient_code']
            print(f"✅ Recipient created: {user.paystack_recipient_code}")
        else:
            print(f"❌ Failed to create recipient: {result}")
            return Response({
                'error': result.get('message', 'Failed to create recipient')
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        print(f"❌ Error creating recipient: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user.save()
    
    return Response({
        'success': True,
        'message': 'Bank details saved successfully',
        'data': {
            'bank_code': user.bank_code,
            'account_number': user.account_number,
            'account_name': user.account_name,
            'recipient_code': user.paystack_recipient_code
        }
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_bank_details(request):
    """Get user's bank details"""
    user = request.user
    
    return Response({
        'success': True,
        'data': {
            'bank_code': user.bank_code,
            'bank_name': user.bank_name,
            'account_number': user.account_number,
            'account_name': user.account_name,
            'recipient_code': user.paystack_recipient_code,
            'has_bank_details': bool(user.bank_code and user.account_number)
        }
    })