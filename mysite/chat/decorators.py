from django.shortcuts import HttpResponseRedirect, get_object_or_404
from django.db.models import Q
from .models import User, ChatMessage

def authentication_required(view_func):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return HttpResponseRedirect("/login")
        # if request.user.status == "Pending":
        #     return HttpResponseRedirect("/sign-up-suc")
        return view_func(request, *args, **kwargs)

    return wrapper

def restrict_users(view_func):  # Add any additional parameters you need
    def wrapper(request, *args, **kwargs):
        username = kwargs.get('username')
        if request.user.role == 3:
            if not request.user.username == username:
                return HttpResponseRedirect("/dashboard")
        return view_func(request, *args, **kwargs)
    return wrapper

def restrict_call_recordings(view_func):  # Add any additional parameters you need
    def wrapper(request, *args, **kwargs):
        username = kwargs.get('username')
        if request.user.role == 3:
            return HttpResponseRedirect("/dashboard")
        return view_func(request, *args, **kwargs)
    return wrapper

def restrict_admin(view_func):  # Add any additional parameters you need
    def wrapper(request, *args, **kwargs):
        username = kwargs.get('username')
        user = User.objects.get(username=username)
        if request.user.role == 1 or request.user.role == 2:
            chats = ChatMessage.objects.filter(
                    Q(sender=user) | Q(receiver=user),
                    admin_flag=request.user.username).count()
            user_chats = ChatMessage.objects.filter(
                    Q(sender=user) | Q(receiver=user)).count()
            if (chats == 0 and user_chats > 0):
                return HttpResponseRedirect("/dashboard")
        return view_func(request, *args, **kwargs)
    return wrapper