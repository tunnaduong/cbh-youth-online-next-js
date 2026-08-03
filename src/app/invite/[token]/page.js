import InviteClient from "./InviteClient";

export const metadata = {
  title: "Lời mời tham gia nhóm - Diễn đàn học sinh Chuyên Biên Hòa",
  description: "Bạn đã được mời tham gia một nhóm chat trên Diễn đàn học sinh Chuyên Biên Hòa.",
};

const InvitePage = ({ params }) => {
  const { token } = params;
  return <InviteClient token={token} />;
};

export default InvitePage;
