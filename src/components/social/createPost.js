"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Image, Earth, X, User } from "lucide-react";
import { useState } from "react";
import { useAuthContext } from "@/contexts/Support";
import { Input } from "@/components/ui/input";

export default function CreatePost({ trigger }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const { currentUser } = useAuthContext();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground"
          >
            What's on your mind?
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] pt-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-center flex-1">
              Tạo bài viết
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full absolute right-3"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex items-start space-x-2 pt-4">
          <Avatar className="w-14 h-14">
            <AvatarImage
              src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${currentUser?.username}/avatar`}
            />
            <AvatarFallback>
              <User />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold">{currentUser?.profile_name}</h3>
            <Button variant="secondary" size="sm" className="h-6">
              <Earth className="h-3 w-3 -mr-1" />
              Công khai
            </Button>
          </div>
        </div>
        <Input
          type="text"
          placeholder="Tiêu đề bài viết"
          className="focus-visible:ring-0"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Nội dung bài viết"
          className="min-h-[120px] border focus-visible:ring-0"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex flex-row items-center rounded-lg border bg-card text-card-foreground p-3">
          <p className="text-sm font-medium flex-1">
            Thêm ảnh vào bài viết của bạn
          </p>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full"
            >
              <Image className="h-5 w-5 text-emerald-500" />
            </Button>
          </div>
        </div>
        <Button
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={!content || !title}
        >
          Đăng
        </Button>
      </DialogContent>
    </Dialog>
  );
}
