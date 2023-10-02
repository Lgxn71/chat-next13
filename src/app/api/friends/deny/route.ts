import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { Database } from "@/lib/db";

import { z } from "zod";

import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const session = await getServerSession(authOptions);

    if (!session) return new Response("Unauthorized", { status: 400 });

    const { id: idToDeny } = z.object({ id: z.string() }).parse(body);

    await Database.srem(
      `user:${session.user.id}:incoming_friend_requests`,
      idToDeny
    );

    // pusherServer.trigger(
    //   toPusherKey(`user:${idToDeny}:incoming_friend_requests`),
    //   "incoming_friend_requests",
    //   {
    //     senderId: session.user.id,
    //     senderEmail: session.user.email,
    //   }
    // );

    return new Response("ok");
  } catch (error) {
    console.log(error);

    if (error instanceof z.ZodError) {
      return new Response("invalid request payload", { status: 422 });
    }

    return new Response("Invalid request", { status: 400 });
  }
}
