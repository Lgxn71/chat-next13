"use client";
import { useState, useEffect, FC, MouseEventHandler } from "react";

import { useRouter } from "next/navigation";

import axios from "axios";

import { pusherClient } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";

import { Icons } from "@/components/UI/Icons/Icons";

interface FriendRequestsProps {
  incomingFriendRequest: IncomingFriendRequests[];
  sessionId: string;
}

const FriendRequests: FC<FriendRequestsProps> = ({
  incomingFriendRequest,
  sessionId,
}) => {
  const router = useRouter();

  const [friendRequest, setFriendRequests] = useState<IncomingFriendRequests[]>(
    incomingFriendRequest
  );

  useEffect(() => {
    pusherClient.subscribe(
      toPusherKey(`user:${sessionId}:incoming_friend_requests`)
    );

    const friendRequestHandler = ({
      senderId,
      senderEmail,
    }: IncomingFriendRequests) =>
      setFriendRequests((prev) => [...prev, { senderEmail, senderId }]);

    pusherClient.bind("incoming_friend_requests", friendRequestHandler);

    return () => {
      pusherClient.unsubscribe(
        toPusherKey(`user:${sessionId}:incoming_friend_requests`)
      );
      pusherClient.unbind("incoming_friend_requests", friendRequestHandler);
    };
  }, [sessionId]);

  const answerOnFriendRequest: MouseEventHandler<HTMLButtonElement> = async (
    event
  ) => {
    const { id: senderId, name } = event.currentTarget;

    await axios.post(`/api/friends/${name}`, { id: senderId });

    setFriendRequests((prev) =>
      prev.filter((request) => request.senderId !== senderId)
    );

    router.refresh();
  };

  return (
    <>
      {friendRequest.length === 0 ? (
        <p className="text-sm text-zinc-500">Nothing to show here..... </p>
      ) : (
        friendRequest.map((request) => (
          <div key={request.senderId} className=" flex gap-4 items-center ">
            <Icons.UserPlus className="text-black" />

            <p className="font-medium text-lg">{request.senderEmail} </p>

            <button
              name="accept"
              id={request.senderId}
              onClick={answerOnFriendRequest}
              aria-label="accept friend"
              className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 grid place-items-center rounded-full transition hover:shadow-md"
            >
              <Icons.Check className="font-semibold text-white w-3/4 h-3/4" />
            </button>

            <button
              name="deny"
              id={request.senderId}
              onClick={answerOnFriendRequest}
              data-id={request.senderId}
              aria-label="deny friend"
              className="w-8 h-8 bg-red-600 hover:bg-red-700 grid place-items-center rounded-full transition hover:shadow-md"
            >
              <Icons.X className="font-semibold text-white w-3/4 h-3/4" />
            </button>
          </div>
        ))
      )}
    </>
  );
};
export default FriendRequests;
