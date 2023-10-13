import type * as Party from "partykit/server";

// TODO: Implement a better load balancing solution
const rooms = [1, 2, 3, 4, 5];

const getRoomId = (namespace: string, n: number) => {
  return `${namespace}-${n}`;
};

const getNextRoom = (namespace: string) => {
  return getRoomId(namespace, rooms[Math.floor(Math.random() * rooms.length)]);
};

export default class Router {
  constructor(readonly party: Party.Party) {}

  static onBeforeConnect(req: Party.Request, lobby: Party.Lobby) {
    // Catch all connection attempts to /parties/router/:namespace and redirect them to a random room
    const namespace = lobby.id;
    return lobby.parties.main
      .get(getNextRoom(namespace))
      .fetch(req as unknown as RequestInit);
  }

  static async onBeforeRequest(req: Party.Request, lobby: Party.Lobby) {
    // Catch all HTTP requests to /parties/router/:namespace and fan-out to all rooms
    const namespace = lobby.id;
    const body = await req.text();

    // TODO: Implement retry logic for robustness
    await rooms.map((roomId) =>
      lobby.parties.main.get(getRoomId(namespace, roomId)).fetch({
        // TODO: add any missing fields
        method: req.method,
        headers: req.headers,
        body,
      })
    );
    return new Response("Proxied request to all rooms");
  }
}

Router satisfies Party.Worker;
