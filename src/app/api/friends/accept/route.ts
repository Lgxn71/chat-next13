import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { fetchRedis } from "@/helpers/redis";
import { Database } from "@/lib/db";

import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { id: idToAdd } = z.object({ id: z.string() }).parse(body);

    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    // verify if both are already friends

    const isAlreadyFriends = await fetchRedis(
      "sismember",
      `user:${session.user.id}:friends`,
      idToAdd
    );
    if (isAlreadyFriends) {
      return new Response("Already friends", { status: 400 });
    }

    const hasFriendRequest = await fetchRedis(
      "sismember",
      `user:${session.user.id}:incoming_friend_requests`,
      idToAdd
    );

    if (!hasFriendRequest) {
      return new Response("No friend requests", { status: 400 });
    }

    //* add each other as a friend in db
    // !combine at 1 promise
    // await Promise.all([]);

    await Database.sadd(`user:${session.user.id}:friends`, idToAdd);
    await Database.sadd(`user:${idToAdd}:friends`, session.user.id);

    // await Database.srem(
    //   `user:${idToAdd}:outbound_friend_requests`,
    //   session.user.id
    // );

    await Database.srem(
      `user:${session.user.id}:incoming_friend_requests`,
      idToAdd
    );

    return new Response("ok");
  } catch (error) {
    console.log(error);

    if (error instanceof z.ZodError) {
      return new Response("invalid request payload", { status: 422 });
    }

    return new Response("Invalid request", { status: 400 });
  }
}
