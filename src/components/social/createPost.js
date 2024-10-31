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
import { Image, Earth, X, User, AlertCircle, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useAuthContext } from "@/contexts/Support";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createPost, uploadFile } from "@/app/Api";
import { useHomePost } from "@/contexts/HomePostContext";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreatePost({ trigger, type = "feed" }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser, loggedIn } = useAuthContext();
  const router = useRouter();
  const { setPosts } = useHomePost();
  const fileInputRef = React.useRef(null);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // State for image preview URL

  // Handle image selection and preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);

      // Generate image preview
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result); // Set preview URL to file reader result
      reader.readAsDataURL(file); // Read file as a data URL
    }
  };

  // Trigger file input click
  const handleImageUploadClick = () => {
    fileInputRef.current.click();
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      var cdnId = null;

      if (image) {
        const formData = new FormData();
        formData.append("file", image);
        const res = await uploadFile(formData);
        console.log("user_content_id_1", res.data.id);
        cdnId = res.data.id;
      }

      const response = await createPost({
        title,
        description: content,
        user_content_id: cdnId,
      });

      console.log("user_content_id", cdnId);

      // Assuming the newly created post is returned in response.data
      const newPost = response.data;

      setPosts((prevPosts) => [
        newPost, // Add the new post at the beginning of the list
        ...prevPosts,
      ]);
      setOpen(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      setError(error?.response?.data?.message);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        asChild
        onClick={(e) => {
          if (!loggedIn) {
            e.preventDefault();
            router.push("/login");
          }
        }}
      >
        {trigger || (
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground"
          >
            Tạo bài viết mới
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] pt-5">
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
        {error && (
          <Alert variant="destructive" className="text-left">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex items-start space-x-2 pt-4">
          <Avatar className="w-14 h-14">
            <AvatarImage
              src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${currentUser?.username}/avatar`}
            />
            <AvatarFallback>
              <User className="w-8 h-8" />
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
        <form
          action="#"
          method="POST"
          className="space-y-4"
          onSubmit={onSubmit}
        >
          {type == "forum" && (
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn một chuyên mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>North America</SelectLabel>
                  <SelectItem value="est">
                    Eastern Standard Time (EST)
                  </SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Europe & Africa</SelectLabel>
                  <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Asia</SelectLabel>
                  <SelectItem value="msk">Moscow Time (MSK)</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>South America</SelectLabel>
                  <SelectItem value="clt">Chile Standard Time (CLT)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}

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
          {previewUrl && (
            <div>
              <img
                src={previewUrl}
                alt="Preview"
                className="border rounded-md"
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
              />
            </div>
          )}
          <div className="flex flex-row items-center rounded-lg border bg-card text-card-foreground p-3">
            <p className="text-sm font-medium flex-1">
              Thêm ảnh vào bài viết của bạn
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
              style={{ display: "none" }} // Hide the file input
            />
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full"
                type="button"
                onClick={handleImageUploadClick}
              >
                <Image className="h-5 w-5 text-emerald-500" />
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={!content || !title}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đăng...
              </>
            ) : (
              <>Đăng</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
