from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponseRedirect
from .forms import CustomUserRegistrationForm
from .decorators import authentication_required, restrict_users, restrict_call_recordings, restrict_admin
from django.contrib.auth import login, authenticate
from django.contrib.auth.views import LoginView
from .forms import CustomLoginForm
from .models import User, ChatMessage, CallRecording
from django.contrib.auth import get_user_model
from django.db.models import Q
User_Model = get_user_model

from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404

PROTECTED = 'portal'





def register(request):
    if request.method == 'POST':
        form = CustomUserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            redirect_url = '/dashboard'
            password = form.cleaned_data.get('password1')
            username = form.cleaned_data.get('username')
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                redirect_url = '/dashboard'
            return JsonResponse({"success": True, "message": "Successfully registered.", "redirect_url": redirect_url})
        else:
            errors = form.errors.as_json()
            return JsonResponse({"success": False, "errors": errors})
    else:
        form = CustomUserRegistrationForm()
    return render(request, 'auth/register.html', {'form': form})

class CustomLoginView(LoginView):
    form_class = CustomLoginForm
    template_name = 'auth/login.html'  # Specify your login template
    
    def form_invalid(self, form):
        # Prepare a dictionary of form errors
        form_errors = form.errors.as_json()
        return JsonResponse({"success": False, "errors": form_errors}, status=400)

@authentication_required
def dashboard(request):
    logged_in_user = request.user
    if logged_in_user.role == User.ADMIN:
       welcome  = f'Hello {logged_in_user.full_name} (Admin)'
    elif logged_in_user.role == User.SUB_ADMIN:
        welcome  = f'Hello {logged_in_user.full_name} (Sub Admin)'
    else:
         welcome  = f'Hello {logged_in_user.full_name} (User)'
    
    regular_users = User.objects.filter(role=User.USER)
    admins = User.objects.filter(Q(role=User.ADMIN) | Q(role=User.SUB_ADMIN))     
    context = {
        'user_model':get_user_model,
        'welcome':welcome,
        'users':regular_users,
        'admins':admins,
        'logged_in_user':logged_in_user
        
    }
    return render(request, f'{PROTECTED}/dashboard.html', context=context)

@authentication_required
@restrict_users
@restrict_admin
def main_chat(request, username):
    logged_in_user = request.user
    
    chat_partner = User.objects.get(username=username)  # The user you're chatting with
    
    if(logged_in_user.role == 3):
        flag = f'flag_{logged_in_user.username}'
    else:
        flag =  f'flag_{chat_partner.username}'   

    # Retrieve chat messages
    # chat_messages = ChatMessage.objects.filter(
    #     sender__in=[logged_in_user, chat_partner],
    #     receiver__in=[logged_in_user, chat_partner]
    # ).order_by('timestamp') 
    chat_messages = ChatMessage.objects.filter(
        flag=flag
    ).order_by('timestamp') 
    
    chat_count = chat_messages.count()
    if(logged_in_user.role == 3): 
            if chat_count > 0:
                if chat_messages.first().admin_flag == 'Flag':
                    receiver_username=username
                else:
                    receiver_username=chat_messages.first().admin_flag
            else:
                receiver_username=username
    else:
        receiver_username=username                       
        
    # Mark unread messages as read
    receiver = User.objects.get(username=logged_in_user.username)
    ChatMessage.objects.filter(receiver=receiver, is_read=False).update(is_read=True)

    # Get messages for the chat to display them
    # messages = ChatMessage.objects.filter(sender=user, receiver=receiver) | ChatMessage.objects.filter(sender=receiver, receiver=user)
    
 
    user_is_admin_or_sub_admin = logged_in_user.role in [User.ADMIN, User.SUB_ADMIN]
    has_chats = chat_count > 0
    admins = User.objects.filter(Q(role=User.ADMIN) | Q(role=User.SUB_ADMIN)) 
    admins_pass = admins.exclude(username=logged_in_user.username)
    context = {
        'user_model':get_user_model,
        'logged_in_user':logged_in_user,
        'username': username,
        'receiver_username':receiver_username,
        'chat_messages': chat_messages,
        'chat_count':chat_count,
        'user_is_admin_or_sub_admin_and_has_chats': user_is_admin_or_sub_admin and has_chats,  
        'admins':admins, 
        'admins_pass':admins_pass,   
    }
    return render(request, 'chat/main.html', context=context)

@csrf_exempt
def delete_chat(request, message_id):
    if request.method == 'POST':
        message = get_object_or_404(ChatMessage, id=message_id)
        message.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False}, status=400)

@authentication_required
def toggle_user_status(request):
    user_id = request.POST.get('user_id')
    try:
        user = User.objects.get(id=user_id, role=User.USER)
        user.is_active = not user.is_active  # Toggle the status
        user.save()
        action = "Unblocked" if user.is_active else "Blocked"
        return JsonResponse({"success": True, "message": f"User {action} successfully.", "is_active": user.is_active})
    except User.DoesNotExist:
        return JsonResponse({"success": False, "message": "User not found or not a regular user."})

@authentication_required
def toggle_admin_call_status(request):
    user_id = request.POST.get('user_id')
    try:
        user = User.objects.get(id=user_id)
        user.call_permission = not user.call_permission  # Toggle the status
        user.save()
        action = "Call Active" if user.call_permission else "Call Deactivated"
        return JsonResponse({"success": True, "message": f"Admin {action} successfully.", "call_permission": user.call_permission})
    except User.DoesNotExist:
        return JsonResponse({"success": False, "message": "Admin not found or not a regular user."})
        
@authentication_required
@restrict_call_recordings   
def call_recordings(request, username):
    logged_in_user = request.user
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        # Handle the case where the user does not exist
        user = None
    
    if user:
        if(logged_in_user.role == 3):
            flag = f'flag_{logged_in_user.username}'
        else:
            flag =  f'flag_{user.username}'
        call_recordings = CallRecording.objects.filter(
            flag=flag
        )
    else:
        # If no user is found, return an empty queryset
        call_recordings = CallRecording.objects.none()
    
    return render(request, f'{PROTECTED}/calls/call-recordings.html', {'call_recordings': call_recordings})


@authentication_required
def accept_message_request(request):
    user_id = request.POST.get('user_id')
    logged_in_user = request.user
    try:
        user = User.objects.get(id=user_id, role=User.USER)
        user_chat = ChatMessage.objects.filter(sender=user)
        user_chat.update(receiver=logged_in_user.id, admin_flag=logged_in_user.username)
        return JsonResponse({"success": True, "message": "Message Request accepted.", "username": user.username})
    except Exception as e:
        return JsonResponse({"success": False, "message": "Failed to update chat messages."})

@authentication_required
def pass_chat(request):
    try:
        flag = f"flag_{request.POST.get('userUsername')}"
        chats = ChatMessage.objects.filter(flag=flag)

        if chats.exists():
            for chat in chats:
                chat.admin_flag = request.POST.get('adminUsername')
                chat.save()
            return JsonResponse({"success": True, "message": f"Chat passed to {request.POST.get('adminUsername')} successfully."})
        else:
            return JsonResponse({"success": False, "message": "No chats found to update."})
    except Exception as e:
        return JsonResponse({"success": False, "message": f"Failed to update chat. Exception: {str(e)}"})
