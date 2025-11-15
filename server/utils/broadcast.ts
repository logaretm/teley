// Store connected WebSocket peers
const peers = new Set<any>();

export function addPeer(peer: any) {
  peers.add(peer);
  console.log('[broadcast] Peer added, total peers:', peers.size);
}

export function removePeer(peer: any) {
  peers.delete(peer);
  console.log('[broadcast] Peer removed, total peers:', peers.size);
}

export function broadcastTraceUpdate(data: any) {
  console.log('[broadcast] Broadcasting trace update, peers:', peers.size);

  if (peers.size === 0) {
    console.log('[broadcast] No peers connected, skipping broadcast');
    return;
  }

  const message = JSON.stringify({
    type: 'trace_update',
    data,
  });

  console.log('[broadcast] Sending message to', peers.size, 'peers');

  const disconnectedPeers: any[] = [];
  let sentCount = 0;

  for (const peer of peers) {
    try {
      peer.send(message);
      sentCount++;
      console.log('[broadcast] Message sent to peer', peer.id);
    } catch (error) {
      console.error('[broadcast] Failed to send to peer:', error);
      disconnectedPeers.push(peer);
    }
  }

  console.log('[broadcast] Successfully sent to', sentCount, 'peers');

  // Clean up disconnected peers
  for (const peer of disconnectedPeers) {
    peers.delete(peer);
  }

  if (disconnectedPeers.length > 0) {
    console.log(
      '[broadcast] Cleaned up',
      disconnectedPeers.length,
      'disconnected peers',
    );
  }
}

export function broadcastClearData() {
  if (peers.size === 0) {
    return;
  }

  const message = JSON.stringify({
    type: 'clear_data',
  });

  const disconnectedPeers: any[] = [];

  for (const peer of peers) {
    try {
      peer.send(message);
    } catch (error) {
      console.error('[broadcast] Failed to send to peer:', error);
      disconnectedPeers.push(peer);
    }
  }

  // Clean up disconnected peers
  for (const peer of disconnectedPeers) {
    peers.delete(peer);
  }

  if (disconnectedPeers.length > 0) {
    console.log(
      '[broadcast] Cleaned up',
      disconnectedPeers.length,
      'disconnected peers',
    );
  }
}
