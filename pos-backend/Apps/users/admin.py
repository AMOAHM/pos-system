from django.contrib import admin
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.utils.crypto import get_random_string
from django import forms

from shops.models import Shop

User = get_user_model()


class AdminUserCreationForm(UserCreationForm):
	class Meta(UserCreationForm.Meta):
		model = User
		fields = ('username', 'email', 'role', 'assigned_shops')

	assigned_shops = forms.ModelMultipleChoiceField(
		queryset=Shop.objects.filter(is_active=True),
		required=False,
		widget=forms.CheckboxSelectMultiple,
		help_text='Select shops assigned to this user.'
	)


class AdminUserChangeForm(UserChangeForm):
	class Meta(UserChangeForm.Meta):
		model = User
		fields = '__all__'


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
	add_form = AdminUserCreationForm
	form = AdminUserChangeForm
	model = User

	list_display = ('username', 'email', 'role', 'is_active')
	list_filter = ('role', 'is_active')

	fieldsets = (
		(None, {'fields': ('username', 'password')}),
		('Personal info', {'fields': ('first_name', 'last_name', 'email', 'phone', 'profile_picture')}),
		('Permissions', {'fields': ('role', 'is_active', 'groups', 'user_permissions')}),
		('Shops', {'fields': ('assigned_shops',)}),
		('Important dates', {'fields': ('last_login', 'created_at')}),
	)

	add_fieldsets = (
		(None, {
			'classes': ('wide',),
			'fields': ('username', 'email', 'role', 'assigned_shops', 'password1', 'password2'),
		}),
	)

	search_fields = ('username', 'email')
	ordering = ('username',)

	def save_model(self, request, obj, form, change):
		# When creating a new user in admin, capture or generate a raw password
		if not change:
			raw_password = None
			# UserCreationForm uses 'password1'
			if hasattr(form, 'cleaned_data'):
				raw_password = form.cleaned_data.get('password1')

			if not raw_password:
				raw_password = get_random_string(10)
				obj.set_password(raw_password)
			else:
				obj.set_password(raw_password)

			# Save the raw password temporarily on the object so we can show it in response_add
			obj._plain_password = raw_password

		super().save_model(request, obj, form, change)

	def response_add(self, request, obj, post_url_continue=None):
		# After adding, display username and password to the admin user
		raw = getattr(obj, '_plain_password', None)
		if raw:
			# Use message framework so it appears in the admin UI
			messages.success(request, f"User created — username: {obj.username} | password: {raw}")
		return super().response_add(request, obj, post_url_continue)

