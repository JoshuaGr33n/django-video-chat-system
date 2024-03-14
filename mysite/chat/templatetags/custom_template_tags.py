from django import template
from ..models import User, ChatMessage
from django.db.models import Q

register = template.Library()

@register.simple_tag()
def message_request(username):
    user = User.objects.get(username=username)
    result = ChatMessage.objects.filter(sender=user, admin_flag="Flag").count()
    return result 

@register.simple_tag()
def message_permission(admin_username, username):
    user = User.objects.get(username=username)
    result = ChatMessage.objects.filter(
    Q(sender=user) | Q(receiver=user),
    admin_flag=admin_username).count()
    return result 

@register.simple_tag()
def user_chats(username):
    user = User.objects.get(username=username)
    result = ChatMessage.objects.filter(
    Q(sender=user) | Q(receiver=user)).count()
    return result 

@register.simple_tag()
def chat_is_read_status(username):
    user = User.objects.get(username=username)
    result = ChatMessage.objects.filter(receiver=user, is_read=False).count()
    return result 

@register.simple_tag()
def chat_is_read_status2(receiver_username, sender_username):
    receiver = User.objects.get(username=receiver_username)
    sender = User.objects.get(username=sender_username)
    result = ChatMessage.objects.filter(receiver=receiver, sender=sender, is_read=False).count()
    return result 