import { Input as AntdInput } from "antd";

import { cn } from "@/lib/utils"

Input.TextArea = ({ className = "", shadow = true, ...props }) => {
  return (
    <AntdInput.TextArea
      {...props}
      className={`${
        shadow ? "shadow-sm focus:shadow-md-ring" : ""
      } focus:!bg-transparent ${className}`}
    />
  );
};

export default Input;
