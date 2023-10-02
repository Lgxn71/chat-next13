import Image from "next/image";

import { notFound } from "next/navigation";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { Database } from "@/lib/db";
import { fetchRedis } from "@/helpers/redis";

import { messagesArrayValidator } from "@/lib/validations/message";

import Messages from "@/components/Dashboard/Messages/Messages";
import ChatInput from "@/components/Dashboard/Messages/ChatInput/ChatInput";

interface ChatProps {
  params: { chatId: string };
}

async function getChatMessages(chatId: string) {
  try {
    const results: string[] = await fetchRedis(
      "zrange",
      `chat:${chatId}:messages`,
      0,
      -1
    );

    const dbMessages = results.map((message) => JSON.parse(message) as Message);

    const reversedDbMessages = dbMessages.reverse();

    const messages = messagesArrayValidator.parse(reversedDbMessages);

    return messages;
  } catch (error) {
    notFound();
  }
}

const ChatPage = async ({ params }: ChatProps) => {
  const session = await getServerSession(authOptions);
  if (!session) notFound();

  const { chatId } = params;
  const [userId1, userId2] = chatId.split("--");

  const { user } = session;
  if (user.id !== userId1 && user.id !== userId2) notFound();

  const chatPartnerID = user.id === userId1 ? userId2 : userId1; // it will be u or itl will no be u
  const chatPartner = (await Database.get(`user:${chatPartnerID}`)) as User;
  const initialMessages = (await getChatMessages(chatId)) as Message[];

  return (
    <div className="flex-1 justify-between flex flex-col h-full max-h-[calc(100vh-6rem)]">
      <div className="flex sm:items-center justify-between py-3 border-b-2 border-gray-200">
        <div className="relative flex items-center space-x-4 ">
          <div className="relative">
            <div className="relative w-8 h-8 sm:w-12 sm:h-12">
              <Image
                src={chatPartner.image}
                alt={`${chatPartner.name} profile picture `}
                referrerPolicy="no-referrer"
                fill
                className="rounded-full"
              />
            </div>
          </div>

          <div className="flex flex-col leading-tight">
            <div className="text-xl flex items-center">
              <span className="text-gray-700 mr-3 font-semibold ">
                {chatPartner.name}
              </span>
            </div>

            <span className="text-sm text-gray-600">{chatPartner.email}</span>
          </div>
        </div>
      </div>
      <Messages
        initialMessages={initialMessages}
        sessionId={session.user.id}
        sessionImg={session.user.image}
        chatId={chatId}
        chatPartner={chatPartner}
      />
      <ChatInput chatId={chatId} chatPartner={chatPartner} />
    </div>
  );
};

export default ChatPage;
