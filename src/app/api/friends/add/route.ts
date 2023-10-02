import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { addFriendValidator } from "@/lib/validations/add-friend";

import { fetchRedis } from "@/helpers/redis";
import { Database } from "@/lib/db";

import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";

import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: emailToAdd } = addFriendValidator.parse(body.email);

    if (!emailToAdd) {
      throw new Error("Email not provided in the request body.");
    }

    const idToAdd = (await fetchRedis(
      "get",
      `user:email:${emailToAdd}`
    )) as string;

    if (!idToAdd) {
      return new Response("This person does not exist", { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });

    if (idToAdd === session.user.id)
      return new Response("You cannot add yourself as a friend", {
        status: 400,
      }); // trying to add itself

    // check if user is added and already in friends

    const isAlreadyAdded = (await fetchRedis(
      "sismember",
      `user:${idToAdd}:incoming_friend_requests`,
      session.user.id
    )) as 0 | 1;
    if (isAlreadyAdded)
      return new Response("Already added this user", { status: 400 });

    const isAlreadyFriends = (await fetchRedis(
      "sismember",
      `user:${session.user.id}:friends`,
      idToAdd
    )) as 0 | 1;
    if (isAlreadyFriends)
      return new Response("Already friends with this user", { status: 400 });

    // * valid request, send friend request

    // trigger server on event "incoming_friend_requests"
    await pusherServer.trigger(
      toPusherKey(`user:${idToAdd}:incoming_friend_requests`),
      "incoming_friend_requests",
      {
        senderId: session.user.id,
        senderEmail: session.user.email,
      }
    );

    await Database.sadd(
      `user:${idToAdd}:incoming_friend_requests`,
      session.user.id
    );

    return new Response("OK");
  } catch (error) {
    if (error instanceof z.ZodError)
      return new Response("Invalid request payload", { status: 422 });

    return new Response("Invalid Request", { status: 400 });
  }
}
