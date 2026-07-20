# marketplace/models.py
from django.db import models
from api.models import User

class Crop(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50)
    sub_category = models.CharField(max_length=50, blank=True, null=True)
    season = models.CharField(max_length=50, blank=True, null=True)
    image_icon = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'crops'

class Advertisement(models.Model):
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ads')
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit = models.CharField(max_length=20, default='kg')
    price_per_unit = models.DecimalField(max_digits=12, decimal_places=2)
    is_negotiable = models.BooleanField(default=True)
    min_order_quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    harvest_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    location_text = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    images = models.JSONField(default=list, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('pending', 'Pending'),
            ('sold', 'Sold'),
            ('expired', 'Expired'),
            ('cancelled', 'Cancelled'),
        ],
        default='active'
    )
    views_count = models.IntegerField(default=0)
    applications_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.seller.username}"
    
    class Meta:
        db_table = 'advertisements'

class Application(models.Model):
    ad = models.ForeignKey(Advertisement, on_delete=models.CASCADE, related_name='applications')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    requested_quantity = models.DecimalField(max_digits=12, decimal_places=2)
    offered_price = models.DecimalField(max_digits=12, decimal_places=2)
    message = models.TextField(blank=True, null=True)
    preferred_delivery_date = models.DateField(null=True, blank=True)
    delivery_method = models.CharField(
        max_length=20,
        choices=[
            ('pickup', 'Pickup'),
            ('delivery', 'Delivery'),
            ('negotiate', 'Negotiate'),
        ],
        default='negotiate'
    )
    delivery_address = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('accepted', 'Accepted'),
            ('declined', 'Declined'),
            ('counter_offered', 'Counter Offered'),
            ('paid', 'Paid'),
            ('completed', 'Completed'),
            ('cancelled', 'Cancelled'),
        ],
        default='pending'
    )
    seller_response_message = models.TextField(blank=True, null=True)
    counter_offer_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    counter_offer_quantity = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Application for {self.ad.title} by {self.buyer.username}"
    
    class Meta:
        db_table = 'applications'

# ============ CHAT MODELS ============

class Conversation(models.Model):
    """A conversation between two users"""
    participants = models.ManyToManyField(User, related_name='conversations')
    ad = models.ForeignKey(Advertisement, on_delete=models.SET_NULL, null=True, blank=True, related_name='conversations')
    last_message = models.TextField(blank=True, null=True)
    last_message_time = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        participants = [user.username for user in self.participants.all()]
        return f"Conversation between {', '.join(participants)}"
    
    class Meta:
        db_table = 'conversations'
        ordering = ['-last_message_time']

class Message(models.Model):
    """Individual messages in a conversation"""
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Message from {self.sender.username} to {self.receiver.username}"
    
    def save(self, *args, **kwargs):
        # Update conversation last message
        if not self.pk:  # Only on creation
            conversation = self.conversation
            conversation.last_message = self.content
            conversation.last_message_time = self.created_at
            conversation.save()
        super().save(*args, **kwargs)
    
    class Meta:
        db_table = 'messages'
        ordering = ['created_at']

# ============ GIG MODELS ============

class Gig(models.Model):
    """A job posted by a farmer for labourers"""
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_gigs')
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(
        max_length=50,
        choices=[
            ('harvesting', 'Harvesting'),
            ('planting', 'Planting'),
            ('pest_control', 'Pest Control'),
            ('irrigation', 'Irrigation'),
            ('transport', 'Transport'),
            ('packaging', 'Packaging'),
            ('other', 'Other'),
        ],
        default='other'
    )
    location_text = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    daily_hours = models.IntegerField(default=8)
    rate_per_day = models.DecimalField(max_digits=12, decimal_places=2)
    number_of_workers_needed = models.IntegerField(default=1)
    skills_required = models.JSONField(default=list, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('filled', 'Filled'),
            ('completed', 'Completed'),
            ('cancelled', 'Cancelled'),
        ],
        default='active'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.farmer.username}"
    
    class Meta:
        db_table = 'gigs'
        ordering = ['-created_at']

class GigApplication(models.Model):
    """Labourer applying to a gig"""
    gig = models.ForeignKey(Gig, on_delete=models.CASCADE, related_name='applications')
    labourer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gig_applications')
    message = models.TextField(blank=True, null=True)
    rate_offered = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('accepted', 'Accepted'),
            ('rejected', 'Rejected'),
            ('completed', 'Completed'),
        ],
        default='pending'
    )
    accepted_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.labourer.username} applying for {self.gig.title}"
    
    class Meta:
        db_table = 'gig_applications'
        ordering = ['-created_at']

class GigReview(models.Model):
    """Review for gig work"""
    gig_application = models.ForeignKey(GigApplication, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_gig_reviews')
    reviewed = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_gig_reviews')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review for {self.reviewed.username} by {self.reviewer.username}"
    
    class Meta:
        db_table = 'gig_reviews'

class Notification(models.Model):
    """Push notifications for users"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(
        max_length=50,
        choices=[
            ('application', 'New Application'),
            ('acceptance', 'Application Accepted'),
            ('payment', 'Payment Received'),
            ('delivery', 'Delivery Confirmed'),
            ('release', 'Funds Released'),
            ('message', 'New Message'),
            ('general', 'General'),
        ],
        default='general'
    )
    link = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.user.username}"

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

class Transaction(models.Model):
    """Payment transaction for an application"""
    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='transaction')
    reference = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    seller_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('paid', 'Paid'),
            ('held', 'Held in Escrow'),
            ('released', 'Released to Seller'),
            ('refunded', 'Refunded'),
            ('failed', 'Failed'),
        ],
        default='pending'
    )
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    paystack_response = models.JSONField(default=dict, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    released_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Transaction {self.reference} - {self.status}"
    
    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']