from django.urls import path
from .views import main_chat, CustomLoginView
from . import views
from django.contrib.auth.views import LoginView, LogoutView
from .forms import CustomLoginForm

urlpatterns = [
    path('', views.register, name="register"),
    path('dashboard', views.dashboard, name="dashboard"),
    path('login/', CustomLoginView.as_view(), name="login"),
    path('chat/<str:username>', main_chat, name='main_view'),
    path('delete-chat/<int:message_id>/', views.delete_chat, name='delete_chat'),
    path('toggle-user-status/', views.toggle_user_status, name='toggle_user_status'),
    path('toggle-admin-call-status/', views.toggle_admin_call_status, name='toggle_admin_call_status'),
    path('accept-message-request/', views.accept_message_request, name='accept_message_request'),
    path('call-recordings/<str:username>', views.call_recordings, name='call_recordings'),
    path('pass-chat/', views.pass_chat, name='pass_chat'),
    path('logout/', LogoutView.as_view(), name='logout'),
]