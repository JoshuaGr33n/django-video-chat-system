# Generated by Django 5.0.2 on 2024-02-27 13:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0010_chatmessage_admin_flag'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatmessage',
            name='is_read',
            field=models.BooleanField(default=False),
        ),
    ]
