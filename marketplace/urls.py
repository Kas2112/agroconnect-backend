# marketplace/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Crop & Ad URLs
    path('crops/', views.get_crops, name='crops'),
    path('ads/', views.get_ads, name='ads'),
    path('ads/create/', views.create_ad, name='create_ad'),
    path('ads/<int:id>/', views.get_ad_detail, name='ad_detail'),
    path('my-ads/', views.my_ads, name='my_ads'),
    
    # Application URLs
    path('applications/create/', views.apply_to_buy, name='apply_to_buy'),
    path('my-applications/', views.my_applications, name='my_applications'),
    path('received-applications/', views.received_applications, name='received_applications'),
    path('applications/<int:id>/status/', views.update_application_status, name='update_status'),
    
    # Chat URLs
    path('conversations/', views.get_conversations, name='get_conversations'),
    path('conversations/create/', views.create_or_get_conversation, name='create_conversation'),
    path('conversations/<int:conversation_id>/messages/', views.get_messages, name='get_messages'),
    path('messages/send/', views.send_message, name='send_message'),
    path('messages/unread-count/', views.get_unread_count, name='unread_count'),
    
    # Gig URLs
    path('gigs/', views.get_gigs, name='get_gigs'),
    path('gigs/<int:id>/', views.get_gig_detail, name='gig_detail'),
    path('gigs/create/', views.create_gig, name='create_gig'),
    path('my-gigs/', views.my_gigs, name='my_gigs'),
    path('gigs/apply/', views.apply_to_gig, name='apply_to_gig'),
    path('my-gig-applications/', views.my_gig_applications, name='my_gig_applications'),
    path('received-gig-applications/', views.received_gig_applications, name='received_gig_applications'),
    path('gig-applications/<int:id>/status/', views.update_gig_application_status, name='update_gig_status'),
    
    # Image Upload URLs
    path('upload-image/', views.upload_image, name='upload_image'),
    path('delete-image/', views.delete_image, name='delete_image'),
    
    # Payment URLs
    path('payment/initialize/', views.initialize_payment, name='initialize_payment'),
    path('payment/verify/', views.verify_payment, name='verify_payment'),
    path('payment/release/', views.release_payment, name='release_payment'),
    path('transactions/', views.get_transactions, name='get_transactions'),
    # Bank Details URLs
    path('bank-details/', views.get_bank_details, name='get_bank_details'),
    path('bank-details/add/', views.add_bank_details, name='add_bank_details'),
]