# Scaling Socket.io with Redis Pub/Sub

To horizontally scale your Node.js application across multiple servers (or instances), you need a way for a user connected to "Server A" to receive messages sent by a user connected to "Server B". The **Redis Adapter** for Socket.io solves this exact problem by using Redis Pub/Sub. When a message is broadcasted, it is sent to Redis, which then publishes it to all other Socket.io servers.

Here are the step-by-step instructions for implementing this:

### Step 1: Install Dependencies
You need the official Socket.io Redis adapter and a Redis client (`redis` or `ioredis`).
```bash
cd server
npm install @socket.io/redis-adapter redis
```

### Step 2: Configure Redis Environment Variables
Add your Redis connection string to your `.env` file. You can get a free Redis database online from providers like Upstash or Redis Labs.
```env
# .env
REDIS_URI=redis://localhost:6379 # Or your production Redis URL
```

### Step 3: Integrate Redis Adapter in `server.js`
Modify your `server.js` file to create the Redis client, set up Publisher and Subscriber clients, and attach the adapter to your `io` instance.

```javascript
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

// ... existing code ...

const io = new Server(server, {
  cors: corsOptions,
  transports: ["polling", "websocket"],
});

// Setup Redis Adapter
const redisUri = process.env.REDIS_URI || "redis://localhost:6379";
const pubClient = createClient({ url: redisUri });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log("🚀 Redis adapter attached to Socket.io");
});

setupSocket(io);

// ...
```

### Step 4: Ensure Sticky Sessions (Important for Production)
If your load balancer uses long-polling initially before upgrading to WebSockets, it **must** route consecutive requests from the same client to the same server. This is known as "sticky sessions". (If you force `transports: ["websocket"]` on the client, you can skip this, but it removes fallback support).

### Step 5: Test Locally
1. Start an instance of Redis locally (e.g., using Docker: `docker run -d -p 6379:6379 redis`).
2. Open two terminals, and start the server on two different ports (e.g., `PORT=8080 npm run dev` and `PORT=8081 npm run dev`).
3. Connect a client to Port 8080 and another to Port 8081. They should be able to collaborate in the same room seamlessly!

> [!TIP]
> This pattern is highly sought after by technical recruiters as it demonstrates an understanding of distributed systems and horizontal scaling!
