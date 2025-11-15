// WebSocket handler for real-time updates to UI clients

export default defineWebSocketHandler({
  open(peer) {
    console.log('[ws] Client connected', peer.id);
    addPeer(peer);
    
    try {
      // Send initial connection confirmation
      peer.send(JSON.stringify({ 
        type: 'connected',
        message: 'Connected to OpenTelemetry Viewer' 
      }));
    } catch (error) {
      console.error('[ws] Failed to send connection message:', error);
    }
  },

  message(peer, message) {
    try {
      const text = message.text();
      console.log('[ws] Message from client', peer.id, text);
      
      // Handle ping/pong for keepalive
      if (text === 'ping') {
        peer.send('pong');
      }
    } catch (error) {
      console.error('[ws] Error handling message:', error);
    }
  },

  close(peer, _event) {
    console.log('[ws] Client disconnected', peer.id);
    removePeer(peer);
  },

  error(peer, error) {
    console.error('[ws] Error', peer.id, error);
    removePeer(peer);
  }
});
