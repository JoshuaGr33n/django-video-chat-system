from django import template


register = template.Library()

@register.filter(name='is_base64_image')
def is_base64_image(value):
    """Check if the value is a base64 encoded image."""
    return value.startswith('data:image')

@register.filter(name='is_base64_audio')
def is_base64_audio(value):
    """Check if the value is a base64 encoded image."""
    return value.startswith('data:audio')

