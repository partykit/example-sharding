import type * as Party from "partykit/server";

export default class Main implements Party.Server {
  constructor(readonly party: Party.Party) {}

  // Hibernation helps scale PartyKit servers. Before implementing sharding,
  // read the docs on hibernation to see if it solves your scaling needs:
  // https://docs.partykit.io/guides/scaling-partykit-servers-with-hibernation/
  options: Party.ServerOptions = {
    hibernate: true,
  };

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // This will happen in one of the randomly allocated rooms
    conn.send(`connected to ${this.party.id}`);

    // TODO: Consider signaling current connection counts back to the proxy room,
    // so that it can make better decisions about where to route new connections
  }

  async onRequest(req: Party.Request) {
    // This will happen in all of the rooms
    const message = await req.text();
    this.party.broadcast(`received ${message} (via room ${this.party.id})`);
    return new Response("OK");
  }

  onMessage(message: string) {
    // If client sends a websocket message, it will only be received in this shard
    // and not the others. If you want to broadcast to all shards, the easiest way
    // to do that would be to send an HTTP request to the router room and allow it
    // to do the work of fanning out to all shards.
  }
}

Main satisfies Party.Worker;
