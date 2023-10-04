import Link from "next/link";
import Image from "next/image";

import { notFound } from "next/navigation";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { fetchRedis } from "@/helpers/redis";

import { chatHrefConstructor } from "@/lib/utils";
import { getFriendsByUserId } from "@/helpers/get-friends-by-userId";

import { Icons } from "@/components/UI/Icons/Icons";

const Dashboard = async () => {
  const session = await getServerSession(authOptions);
  if (!session) notFound();
  const friends = await getFriendsByUserId(session.user.id);

  const friendsWithLastMessages = await Promise.all(
    friends.map(async (friend) => {
      const [lastMessageJSON] = (await fetchRedis(
        "zrange",
        `chat:${chatHrefConstructor(session.user.id, friend.id)}:messages`,
        -1,
        -1
      )) as string[];

      if (lastMessageJSON === undefined) {
        return {
          ...friend,
          lastMessage: {
            id: "",
            senderId: "",
            receiverId: "",
            text: "",
            timestamp: 0,
          },
        };
      }
      const lastMessage = JSON.parse(lastMessageJSON) as Message;
      return {
        ...friend,
        lastMessage,
      };
    })
  );

  return (
    <div className="container py-12">
      <h1 className="font-bold text-xl mb-8">Recent chats</h1>
      {friendsWithLastMessages.length === 0 ? (
        <p className="text-sm text-zinc-500 ">Nothing to show here ...</p>
      ) : (
        friendsWithLastMessages.map((friend) => {
          console.log(friend);
          return (
            <div
              className="relative bg-zinc-50 border-zinc-200 p-3 rounded-md"
              key={friend.id}
            >
              <div className="absolute right-4 inset-y-0 flex items-center">
                <Icons.ChevronRight className="h-7 w-7 text-zinc-400" />
              </div>
              <Link
                href={`/dashboard/chat/${chatHrefConstructor(
                  session.user.id,
                  friend.id
                )}`}
                className="relative sm:flex"
              >
                <div className="mb-4 flex-shrink-0 sm:mb-0 sm:mr-4">
                  <div className="relative h-6 w-6">
                    <Image
                      fill
                      src={friend.image}
                      alt={`${friend.name} profile picture`}
                      referrerPolicy="no-referrer"
                      className="rounded-full"
                    />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold "> {friend.name}</h4>
                  <p className="mt-1 max-w-md">
                    <span className="text-zinc-400 ">
                      {friend.lastMessage.senderId === session.user.id
                        ? "You: "
                        : ""}
                    </span>
                    {friend.lastMessage.text}
                  </p>
                </div>
              </Link>
            </div>
          );
        })
      )}
    </div>
  );
};
export default Dashboard;
