# apps/currencies/urls.py
from django.urls import path
from .views import (
    CurrencyListView, 
    DefaultCurrencyView, 
    CurrencyConvertView,
    UpdateRatesView
)

app_name = 'currencies'

urlpatterns = [
    path("", CurrencyListView.as_view(), name='currency-list'),
    path("default/", DefaultCurrencyView.as_view(), name="currency-default"),
    path('currencies/convert/', CurrencyConvertView.as_view(), name='currency-convert'),
    path('currencies/update-rates/', UpdateRatesView.as_view(), name='update-rates'),
]