import { FC } from "react";

import Image from "next/image";

import toast, { Toast } from "react-hot-toast";

import { chatHrefConstructor, cn } from "@/lib/utils";

interface IUnseenChatToastsProps {
  t: Toast;
  sessionId: string;
  senderId: string;
  senderImg: string;
  senderName: string;
  senderMessage: string;
}

interface IToasts {
  UnseenChatToasts: FC<IUnseenChatToastsProps>;
}

const Toasts: IToasts = {
  UnseenChatToasts: ({
    t,
    sessionId,
    senderId,
    senderImg,
    senderName,
    senderMessage,
  }) => {
    const closeToastHandler = () => toast.dismiss(t.id);

    return (
      <div
        className={cn(
          "max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 ",
          { "animate-enter": t.visible, "animate-leave": !t.visible }
        )}
      >
        <a
          onClick={closeToastHandler}
          href={`/dashboard/chat/${chatHrefConstructor(sessionId, senderId)}`}
          className="flex-1 w-0 p-4 "
        >
          <div className="flex items-start">
            <div className=" flex-shrink-0 pt-0.5">
              <div className="relative h-10 w-10">
                <Image
                  src={senderImg}
                  className="rounded-full"
                  alt={`profile picture of ${senderName}`}
                  referrerPolicy="no-referrer"
                  fill
                />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{senderName}</p>
              <p className="mt-1 text-sm text-gray-500">{senderMessage}</p>
            </div>
          </div>
        </a>
        <div className="flex border-l border-gray-200">
          <button
            onClick={closeToastHandler}
            className="w-full border-transparent rounded-none rounded-r-lg  p-4 justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500  focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
    );
  },
};

export default Toasts;
