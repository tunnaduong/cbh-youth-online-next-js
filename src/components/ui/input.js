import { forwardRef } from "react";
import { Input as AntdInput } from "antd";

const Input = forwardRef(({ className = "", ...props }, ref) => {
  return (
    <AntdInput
      ref={ref}
      {...props}
      prefix={<></>}
      className={`!pl-2 shadow-sm focus:shadow-md-ring ${className}`}
    />
  );
});
Input.displayName = "Input";

const InputTextArea = ({ className = "", shadow = true, ...props }) => {
  return (
    <AntdInput.TextArea
      {...props}
      className={`${
        shadow ? "shadow-sm focus:shadow-md-ring" : ""
      } focus:!bg-transparent ${className}`}
    />
  );
};
InputTextArea.displayName = "InputTextArea";
Input.TextArea = InputTextArea;

export default Input;
