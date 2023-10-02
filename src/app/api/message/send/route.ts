import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { Database } from "@/lib/db";
import { fetchRedis } from "@/helpers/redis";

import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";

import { messageValidator } from "@/lib/validations/message";

import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const { text, chatId }: { text: string; chatId: string } = await req.json();

    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const sessionId = session.user.id;

    const [userId1, userId2] = chatId.split("--");

    if (sessionId !== userId1 && sessionId !== userId2) {
      return new Response("Unauthorized", { status: 401 });
    }

    const friendId = sessionId === userId1 ? userId2 : userId1; //  if session id === userid1 then second is friend
    const friendList = (await fetchRedis(
      "smembers",
      `user:${session.user.id}:friends `
    )) as string[];

    const isFriend = friendList.includes(friendId);
    if (!isFriend) return new Response("Unauthorized", { status: 401 });

    const senderJSON = (await fetchRedis("get", `user:${sessionId}`)) as string;
    const sender = JSON.parse(senderJSON) as User;

    // all checks passed
    const timestamp = Date.now();
    const messageData: Message = {
      id: nanoid(),
      senderId: sessionId,
      receiverId: friendId,
      text,
      timestamp,
    };
    const message = messageValidator.parse(messageData);

    // notify all connected  chat room clients
    await pusherServer.trigger(
      toPusherKey(`chat:${chatId}`),
      "incoming-message",
      message
    );
    await pusherServer.trigger(
      toPusherKey(`user:${friendId}:chats`),
      "new_message",
      {
        ...message,
        senderName: sender.name,
        senderImg: sender.image,
      }
    );

    // all valid
    await Database.zadd(`chat:${chatId}:messages`, {
      score: timestamp,
      member: JSON.stringify(message),
    });

    return new Response("OK");
  } catch (error) {
    if (error instanceof Error) {
      return new Response(error.message, { status: 500 });
    }
    return new Response("enternal server error", { status: 500 });
  }
}
