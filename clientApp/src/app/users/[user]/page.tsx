import UserPage0 from "./page0";

const UserPage = ({ params }: { params: { user: string } }) => {
  return (
    <>
      <UserPage0 params={params} />
    </>
  );
};
export default UserPage;
