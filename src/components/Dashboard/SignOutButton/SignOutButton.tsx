"use client";

import { useState, ButtonHTMLAttributes, FC } from "react";

import { signOut } from "next-auth/react";

import toast from "react-hot-toast";

import Button from "../../UI/Buttons/Buttons";

import { Icons } from "@/components/UI/Icons/Icons";

interface SignOutButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

const SignOutButton: FC<SignOutButtonProps> = ({ ...props }) => {
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  const signOutHandler = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      toast.error("There was a problem with signing out");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Button {...props} variant="ghost" onClick={signOutHandler}>
      {isSigningOut ? (
        <Icons.Loader2 className="animate-spin h-4 w-4" />
      ) : (
        <Icons.LogOut className="w-4 h4" />
      )}
    </Button>
  );
};
export default SignOutButton;
