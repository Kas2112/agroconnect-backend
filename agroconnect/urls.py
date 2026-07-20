# agroconnect/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.views.generic import TemplateView
from django.urls import re_path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/', include('marketplace.urls')),
    path('payment-verify/', TemplateView.as_view(template_name='payment_verify.html'), name='payment_verify'),
]

# ============ SERVE MEDIA FILES ============
if settings.DEBUG:
    # For development
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # For production
    urlpatterns += [
        re_path(r'media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]

# Also add a direct route for media files
urlpatterns += static('/media/', document_root=settings.MEDIA_ROOT)