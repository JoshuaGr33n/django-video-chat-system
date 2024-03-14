from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
# Create your models here.

COUNTRY_CHOICES = (
    ('india', 'India'),
    ('bangladesh', 'Bangladesh'),
    ('malaysia', 'Malaysia'),
    ('singapore', 'Singapore'),
)


class User(AbstractUser):
    full_name = models.CharField(max_length=255)
    gender = models.CharField(max_length=10, choices=(('male', 'Male'), ('female', 'Female')))
    country = models.CharField(max_length=100, choices=COUNTRY_CHOICES)
    email = models.EmailField(unique=True)
    ADMIN = 1
    SUB_ADMIN = 2
    USER = 3
    ROLE_CHOICES = (
        (ADMIN, 'Admin'),
        (SUB_ADMIN, 'Sub Admin'),
        (USER, 'User'),
    )
    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=USER)
    CALL = 1
    CANT_CALL = 0
    CALL_PERMISSION_CHOICES = (
        (CALL, 'Call'),
        (CANT_CALL, 'Cant Call'),
    )
    call_permission = models.PositiveSmallIntegerField(choices=CALL_PERMISSION_CHOICES, default=CALL)
    


class ChatMessage(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_messages', on_delete=models.CASCADE)
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_messages', on_delete=models.CASCADE)
    message = models.TextField()
    flag = models.CharField(max_length=255, default="Flag")
    admin_flag = models.CharField(max_length=255, default="Flag")
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return self.message
    
    
class CallRecording(models.Model):
    caller = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='call_recordings_made', on_delete=models.CASCADE)
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='call_recordings_received', on_delete=models.CASCADE)
    recording = models.FileField(upload_to='static/call_recordings/')
    duration = models.DurationField()
    timestamp = models.DateTimeField(auto_now_add=True)
    flag = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Call from {self.caller} to {self.receiver} on {self.timestamp.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        ordering = ['-timestamp']    
    