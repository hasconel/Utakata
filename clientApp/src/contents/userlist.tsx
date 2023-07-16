import { GetProfileScreen } from "@/feature/hooks";

const ListOfUser = ({ target }: { target: string }) => {
  const TargetUser = GetProfileScreen(target);
};
export default ListOfUser;
