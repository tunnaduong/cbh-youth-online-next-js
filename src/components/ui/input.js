"use client";

import React, { forwardRef } from "react";
import { Input as AntdInput, InputNumber as AntdInputNumber } from "antd";

const Input = forwardRef((props, ref) => {
  const { className = "", ...rest } = props;
  return (
    <AntdInput
      {...rest}
      ref={ref}
      className={`!pl-2 shadow-sm focus:shadow-md-ring border-none ${className}`}
    />
  );
});

const InputNumber = forwardRef((props, ref) => {
  const { className = "", ...rest } = props;
  return (
    <AntdInputNumber
      {...rest}
      ref={ref}
      className={`shadow-sm focus:shadow-md-ring ${className}`}
    />
  );
});

const TextArea = forwardRef((props, ref) => {
  const { className = "", shadow = true, ...rest } = props;
  return (
    <AntdInput.TextArea
      {...rest}
      ref={ref}
      className={`${shadow ? "shadow-sm focus:shadow-md-ring" : ""
        } focus:!bg-transparent ${className}`}
    />
  );
});

Input.displayName = "Input";
InputNumber.displayName = "InputNumber";
TextArea.displayName = "TextArea";

// Attach properties for compatibility with Input.Number/Input.TextArea
Input.Number = InputNumber;
Input.TextArea = TextArea;

// Named exports
export { Input, InputNumber, TextArea };

// Default export
export default Input;
