#!/usr/bin/env node
/* C² DEFENSE relay — a deliberately dumb WebSocket room server.
 * Zero game logic: first joiner is host (authoritative sim), everyone after
 * is a guest. Host messages broadcast to guests (or target one with {to}),
 * guest messages forward to the host tagged with {from}.
 *
 *   npm install && node relay.js          # listens on :8090
 *   PORT=9000 node relay.js
 *
 * Clients connect:  ws://host:8090/?room=garage&name=thomas
 */
const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 8090;
const wss = new WebSocketServer({ port: PORT });
const rooms = new Map();
const send = (s, o) => { try { s.send(JSON.stringify(o)); } catch (e) {} };

wss.on('connection', (sock, req) => {
  const url = new URL(req.url, 'http://x');
  const roomName = (url.searchParams.get('room') || 'main').slice(0, 24);
  const name = (url.searchParams.get('name') || 'guest').slice(0, 16);
  let room = rooms.get(roomName);
  if (!room) { room = { host: null, guests: new Map(), nextId: 1 }; rooms.set(roomName, room); }
  const me = { id: room.nextId++, name, sock };

  if (!room.host) {
    room.host = me;
    send(sock, { t: 'role', role: 'host', id: me.id, name });
    console.log(`[${roomName}] host: ${name}`);
  } else {
    room.guests.set(me.id, me);
    send(sock, { t: 'role', role: 'guest', id: me.id, name });
    send(room.host.sock, { t: 'join', id: me.id, name });
    console.log(`[${roomName}] guest: ${name} (#${me.id})`);
  }

  sock.on('message', data => {
    let msg; try { msg = JSON.parse(data); } catch (e) { return; }
    if (room.host === me) {
      if (msg.to != null) { const g = room.guests.get(msg.to); if (g) send(g.sock, msg); }
      else for (const g of room.guests.values()) send(g.sock, msg);
    } else if (room.host) {
      msg.from = me.id;
      send(room.host.sock, msg);
    }
  });

  sock.on('close', () => {
    if (room.host === me) {
      for (const g of room.guests.values()) send(g.sock, { t: 'hostgone' });
      rooms.delete(roomName);
      console.log(`[${roomName}] host left — room closed`);
    } else {
      room.guests.delete(me.id);
      if (room.host) send(room.host.sock, { t: 'leave', id: me.id });
    }
  });
});
console.log('C² DEFENSE relay listening on :' + PORT);
