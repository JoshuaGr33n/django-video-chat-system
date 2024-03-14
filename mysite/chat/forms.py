from django import forms
from django.core.exceptions import ValidationError
from .models import User
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.forms import AuthenticationForm

from django.contrib.auth import get_user_model
User = get_user_model()

class CustomUserRegistrationForm(forms.ModelForm):
    password1 = forms.CharField(label='Password', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Confirm Password', widget=forms.PasswordInput)
    
    username = forms.CharField(
        max_length=150,
        help_text=_(''),
        # help_text=_('150 characters or fewer. Letters, digits and @/./+/-/_ only.'),
        error_messages={
            'required': _('Username is required.'),
            'invalid': _('This value may contain only letters, numbers, and @/./+/-/_ characters.'),
            'max_length': _('This value may contain at most 150 characters.'),
        }
    )

    class Meta:
        model = User
        fields = ['username', 'full_name', 'email', 'gender', 'country']
        
        
    def __init__(self, *args, **kwargs):
        super(CustomUserRegistrationForm, self).__init__(*args, **kwargs)
        # Set required=False for all fields
        for field in self.fields.values():
            field.required = False
            field.widget.attrs.pop('required', None) 
            
    def clean_username(self):
        username = self.cleaned_data.get('username')
        if not username:
            raise ValidationError("Username is required.")
        # Add any additional validation logic here

        return username
    
    def clean_full_name(self):
        full_name = self.cleaned_data.get('full_name')
        if not full_name:
            raise ValidationError("Full Name is required.")
        return full_name
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if not email:
            raise ValidationError("Email is required.")
        return email
    
    def clean_gender(self):
        gender = self.cleaned_data.get('gender')
        if not gender:
            raise ValidationError("Gender is required.")
        return gender
    
    def clean_country(self):
        country = self.cleaned_data.get('country')
        if not country:
            raise ValidationError("Select your country")
        return country
    
    def clean_password1(self):
        password1 = self.cleaned_data.get('password1')
        if not password1:
            raise ValidationError("Password is required.")
        return password1
            
    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        if not password2:
            raise ValidationError("Confirm password is required.")
        if password1 and password2 and password1 != password2:
            raise ValidationError("Passwords don't match.")
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password1'])
        if commit:
            user.save()
        return user


class CustomLoginForm(AuthenticationForm):

  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.fields['username'].widget.attrs.update(
      {'class': 'form-control', }
    )
    self.fields['password'].widget.attrs.update(
      {'class': 'form-control'}
    )