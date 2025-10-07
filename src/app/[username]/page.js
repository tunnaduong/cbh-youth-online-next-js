import React from "react";

export default function UserProfile({ params }) {
  const { username } = params;

  return (
    <div>
      <h1>Page for user: {username}</h1>
    </div>
  );
}
