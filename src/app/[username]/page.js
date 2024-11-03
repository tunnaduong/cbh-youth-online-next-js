import React, { use } from "react";

export default function UserProfile({ params }) {
  const { username } = use(params);

  return (
    <div>
      <h1>Page for user: {username}</h1>
    </div>
  );
}
