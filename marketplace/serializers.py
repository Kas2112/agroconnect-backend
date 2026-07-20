# marketplace/serializers.py
from rest_framework import serializers
from .models import Crop, Advertisement, Application, Conversation, Message, Gig, GigApplication, GigReview, Transaction
from api.serializers import UserSerializer

class CropSerializer(serializers.ModelSerializer):
    class Meta:
        model = Crop
        fields = ['id', 'name', 'category', 'sub_category']

class AdvertisementSerializer(serializers.ModelSerializer):
    seller = UserSerializer(read_only=True)
    crop = CropSerializer(read_only=True)
    
    class Meta:
        model = Advertisement
        fields = [
            'id', 'seller', 'crop',
            'title', 'description', 'quantity', 'unit',
            'price_per_unit', 'is_negotiable', 'min_order_quantity',
            'harvest_date', 'expiry_date', 'location_text',
            'latitude', 'longitude', 'images', 'status',
            'views_count', 'applications_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['seller', 'crop', 'views_count', 'applications_count', 'status']

class ApplicationSerializer(serializers.ModelSerializer):
    buyer = UserSerializer(read_only=True)
    ad = AdvertisementSerializer(read_only=True)
    ad_id = serializers.IntegerField(write_only=True, required=True)
    buyer_id = serializers.IntegerField(write_only=True, required=False)
    # NO transaction field here to avoid circular reference
    
    class Meta:
        model = Application
        fields = [
            'id', 'ad', 'ad_id', 'buyer', 'buyer_id',
            'requested_quantity', 'offered_price', 'message',
            'preferred_delivery_date', 'delivery_method',
            'delivery_address', 'status', 'seller_response_message',
            'counter_offer_price', 'counter_offer_quantity',
            'accepted_at', 'paid_at', 'completed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['buyer', 'status', 'created_at', 'updated_at']

# ============ CHAT SERIALIZERS ============

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    sender_id = serializers.IntegerField(write_only=True, required=False)
    receiver_id = serializers.IntegerField(write_only=True, required=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'receiver',
            'sender_id', 'receiver_id', 'content',
            'is_read', 'read_at', 'created_at'
        ]
        read_only_fields = ['sender', 'is_read', 'read_at', 'created_at']

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    ad = AdvertisementSerializer(read_only=True)
    ad_id = serializers.IntegerField(write_only=True, required=False)
    last_message = serializers.CharField(read_only=True)
    last_message_time = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'ad', 'ad_id',
            'last_message', 'last_message_time',
            'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        ad_id = validated_data.pop('ad_id', None)
        conversation = Conversation.objects.create(**validated_data)
        
        if ad_id:
            from .models import Advertisement
            try:
                ad = Advertisement.objects.get(id=ad_id)
                conversation.ad = ad
                conversation.save()
            except Advertisement.DoesNotExist:
                pass
        
        return conversation

# ============ GIG SERIALIZERS ============

class GigSerializer(serializers.ModelSerializer):
    farmer = UserSerializer(read_only=True)
    farmer_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Gig
        fields = [
            'id', 'farmer', 'farmer_id', 'title', 'description',
            'category', 'location_text', 'latitude', 'longitude',
            'start_date', 'end_date', 'daily_hours', 'rate_per_day',
            'number_of_workers_needed', 'skills_required', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['farmer', 'status', 'created_at', 'updated_at']

class GigApplicationSerializer(serializers.ModelSerializer):
    labourer = UserSerializer(read_only=True)
    gig = GigSerializer(read_only=True)
    gig_id = serializers.IntegerField(write_only=True, required=True)
    labourer_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = GigApplication
        fields = [
            'id', 'gig', 'gig_id', 'labourer', 'labourer_id',
            'message', 'rate_offered', 'status',
            'accepted_at', 'started_at', 'completed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['labourer', 'status', 'created_at', 'updated_at']

class GigReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = GigReview
        fields = ['id', 'gig_application', 'reviewer', 'reviewed', 'rating', 'comment', 'created_at']
        read_only_fields = ['reviewer', 'created_at']

# ============ PAYMENT SERIALIZERS ============

class TransactionSerializer(serializers.ModelSerializer):
    application = ApplicationSerializer(read_only=True)
    application_id = serializers.IntegerField(write_only=True, required=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'application', 'application_id', 'reference',
            'amount', 'platform_fee', 'seller_amount', 'status',
            'payment_method', 'paystack_response',
            'paid_at', 'released_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['reference', 'status', 'paid_at', 'released_at', 'created_at']