# from django.urls import re_path
# from . import consumers

# websocket_urlpatterns = [
#     re_path(r'', consumers.ChatConsumer.as_asgi()),
# ]


# call/routing.py
from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/call/', consumers.CallConsumer.as_asgi()),
]