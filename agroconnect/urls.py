# agroconnect/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/', include('marketplace.urls')),
    path('payment-verify/', TemplateView.as_view(template_name='payment_verify.html'), name='payment-verify'),
]

# ============ SERVE STATIC & MEDIA FILES ============
# This serves both static and media files in development AND production
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)