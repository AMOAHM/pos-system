from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Subscription
import json


class SubscriptionAPITest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username='testuser', password='pass', email='t@example.com')
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_plans_list(self):
        url = reverse('plans-list')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(isinstance(data, list))
        self.assertGreaterEqual(len(data), 1)

    def test_create_trial_subscription(self):
        url = reverse('subscription-create')
        resp = self.client.post(url, {'plan': 'trial'}, format='json')
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data['plan'], 'trial')
        self.assertTrue('trial_ends_at' in data and data['trial_ends_at'] is not None)

    def test_create_monthly_subscription(self):
        url = reverse('subscription-create')
        resp = self.client.post(url, {'plan': 'monthly'}, format='json')
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertIn(data['plan'], ['monthly', 'Monthly', 'monthly'])

    def test_current_cancel_upgrade_flow(self):
        # create monthly
        create_url = reverse('subscription-create')
        resp = self.client.post(create_url, {'plan': 'monthly'}, format='json')
        self.assertEqual(resp.status_code, 201)

        # check current
        current_url = reverse('subscription-current')
        resp = self.client.get(current_url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIsNotNone(data.get('plan'))

        # cancel
        cancel_url = reverse('subscription-cancel')
        resp = self.client.post(cancel_url)
        self.assertEqual(resp.status_code, 200)

        # after cancel, current should return null subscription
        resp = self.client.get(current_url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIsNone(data.get('subscription'))

        # upgrade to yearly
        upgrade_url = reverse('subscription-upgrade')
        resp = self.client.post(upgrade_url, {'plan': 'yearly'}, format='json')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn(data['plan'], ['yearly', 'Yearly', 'yearly'])
from django.test import TestCase

# Create your tests here.
