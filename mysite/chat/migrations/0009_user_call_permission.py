# Generated by Django 5.0.2 on 2024-02-26 14:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0008_alter_callrecording_recording'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='call_permission',
            field=models.PositiveSmallIntegerField(choices=[(1, 'Call'), (0, 'Cant Call')], default=1),
        ),
    ]
