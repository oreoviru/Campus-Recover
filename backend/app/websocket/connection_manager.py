"""
Campus Recover — Real-Time WebSocket Connection Manager (Phase 9)

Manages active WebSocket sessions for connected users, allowing instantaneous
notification delivery and unread badge count updates across browser tabs.
"""

import asyncio
import logging
from typing import Dict, Set, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class NotificationConnectionManager:
    """Manages active WebSockets keyed by user ID."""

    def __init__(self):
        # Maps user_id (str) -> Set of active WebSocket instances
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        """Accept WebSocket connection and store in user group."""
        await websocket.accept()
        async with self._lock:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = set()
            self.active_connections[user_id].add(websocket)
        logger.info(f"WebSocket connected for user {user_id}. Active tabs: {len(self.active_connections[user_id])}")

    async def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        """Remove WebSocket instance upon client disconnect."""
        async with self._lock:
            if user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected for user {user_id}.")

    async def send_to_user(self, user_id: str, message: Dict[str, Any]) -> None:
        """Deliver JSON payload to all active client tabs for a given user."""
        sockets = list(self.active_connections.get(user_id, set()))
        if not sockets:
            return

        dead_sockets = []
        for ws in sockets:
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.warning(f"Error sending message to user {user_id}: {e}")
                dead_sockets.append(ws)

        if dead_sockets:
            async with self._lock:
                for ws in dead_sockets:
                    if user_id in self.active_connections:
                        self.active_connections[user_id].discard(ws)

    async def broadcast_all(self, message: Dict[str, Any]) -> None:
        """Broadcast payload to all currently connected users."""
        tasks = [
            self.send_to_user(user_id, message)
            for user_id in list(self.active_connections.keys())
        ]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    def dispatch_push(self, user_id: str, message: Dict[str, Any]) -> None:
        """
        Thread-safe / sync dispatcher to trigger real-time push from synchronous services.
        """
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.send_to_user(user_id, message))
        except RuntimeError:
            # If no running event loop in current thread, attempt to get or create
            pass


ws_manager = NotificationConnectionManager()
