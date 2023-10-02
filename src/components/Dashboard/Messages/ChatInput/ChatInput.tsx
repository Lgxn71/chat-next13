"use client";
import { useRef, useState, FC, ChangeEvent, KeyboardEvent } from "react";

import Button from "@/components/UI/Buttons/Buttons";
import TextareaAutosize from "react-textarea-autosize";

import axios from "axios";

import toast from "react-hot-toast";

interface ChatInputProps {
  chatPartner: User;
  chatId: string;
}

const ChatInput: FC<ChatInputProps> = ({ chatPartner, chatId }) => {
  const [textareaInput, setTextareaInput] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const sendMessage = async () => {
    if (!textareaInput || textareaInput.trim() === "") return;
    try {
      setIsLoading(true);

      await axios.post("/api/message/send", {
        text: textareaInput,
        chatId: chatId,
      });

      setTextareaInput("");
      textareaRef.current?.focus();
    } catch (error) {
      toast.error("Something went wrong. Please try again later");
    } finally {
      setIsLoading(false);
    }
  };

  const textareaInputHandler = (event: ChangeEvent<HTMLTextAreaElement>) =>
    setTextareaInput(event.target.value);

  const textareaOnKeyDownHandler = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };
  return (
    <div className=" border-t border-gray-200 px-4 pt-4 mb-2 sm:mb-0">
      <div className="relative flex-1 overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600">
        <TextareaAutosize
          ref={textareaRef}
          onKeyDown={textareaOnKeyDownHandler}
          rows={1}
          value={textareaInput}
          onChange={textareaInputHandler}
          placeholder={`Message ${chatPartner.name}`}
          className="block w-full resize-none border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:py-1.5 sm:text-sm sm:leading-6"
        />

        <div
          onClick={() => textareaRef.current?.focus()}
          className="py-2"
          aria-hidden="true"
        >
          <div className="py-px">
            <div className="h-9" />
          </div>
        </div>

        <div className="absolute right-0 bottom-0 flex justify-between py-2 pl-3 pr-2">
          <div className="flex-shrink-0">
            <Button onClick={sendMessage} type="submit" isLoading={isLoading}>
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
