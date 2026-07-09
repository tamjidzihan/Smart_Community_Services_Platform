import json
from channels.generic.websocket import AsyncWebsocketConsumer


class EmergencyTrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.emergency_id = self.scope['url_route']['kwargs']['emergency_id']
        self.group_name = f'emergency_{self.emergency_id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send(text_data=json.dumps({
            'type': 'connected',
            'message': f'Tracking emergency {self.emergency_id}',
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        pass  # read-only consumer

    async def status_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'status': event['status'],
            'message': event['message'],
        }))

    async def location_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'location_update',
            'latitude': event['latitude'],
            'longitude': event['longitude'],
            'status': event['status'],
        }))


class AmbulanceTrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.ambulance_id = self.scope['url_route']['kwargs']['ambulance_id']
        self.group_name = f'ambulance_{self.ambulance_id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def location_update(self, event):
        await self.send(text_data=json.dumps(event))
