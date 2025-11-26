# apps/analytics/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.analytics_dashboard, name='analytics-dashboard'),
    path('trends/', views.analytics_trends, name='analytics-trends'),
    path('predict-demand/', views.predict_demand, name='predict-demand'),
]

