# marketplace/utils.py
import firebase_admin
from firebase_admin import credentials, messaging
from django.conf import settings
from .models import Notification
import json
import os

# Initialize Firebase Admin SDK (only once)
if not firebase_admin._apps:
    try:
        # Try to load from environment variable
        firebase_cred = os.getenv('FIREBASE_CREDENTIALS')
        if firebase_cred:
            cred_dict = json.loads(firebase_cred)
            cred = credentials.Certificate(cred_dict)
        else:
            # Fallback to service account file
            cred_path = os.path.join(settings.BASE_DIR, 'firebase-service-account.json')
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
            else:
                print("⚠️ No Firebase credentials found!")
                cred = None
        
        if cred:
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin initialized!")
    except Exception as e:
        print(f"❌ Failed to initialize Firebase: {str(e)}")

def send_push_notification(user, title, message, type='general', link=None):
    """
    Send push notification to a user using Firebase Admin SDK
    """
    # Save notification to database
    notification = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        type=type,
        link=link
    )
    
    print(f"📝 Notification saved: {notification.id}")
    
    # Check if Firebase is initialized
    if not firebase_admin._apps:
        print("⚠️ Firebase not initialized. Notification saved but not sent.")
        return None
    
    # Send push notification if user has FCM token
    if hasattr(user, 'fcm_token') and user.fcm_token:
        try:
            # Create message
            message_obj = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=message,
                ),
                data={
                    "type": type,
                    "link": link or "",
                    "notification_id": str(notification.id)
                },
                token=user.fcm_token,
                android=messaging.AndroidConfig(
                    priority="high"
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            sound="default"
                        )
                    )
                )
            )
            
            response = messaging.send(message_obj)
            print(f"📤 Push notification sent to {user.username}: {response}")
            return response
            
        except Exception as e:
            print(f"❌ Failed to send push notification: {str(e)}")
    else:
        print(f"⚠️ No FCM token for user {user.username}")
    
    return None