import api from "../feature/api";
import { Server } from "../feature/config";
import { Button, TextInput } from "@tremor/react";
const TestButton = () => {
  const [doc, setDoc] = useState<string | undefined>(undefined);
  const Test = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (
        typeof Server.databaseID === "string" &&
        typeof Server.collectionID === "string" &&
        typeof doc === "string"
      ) {
        const data = { data: doc };
        const dataA = JSON.stringify(data);
        const hoge = await api.createDocument(
          Server.databaseID,
          Server.collectionID,
          dataA
        );
        console.log(hoge);
      }
      setDoc("");
    } catch (e) {
      console.log(e);
    }
  };
  return (
    <>
      <form
        onSubmit={(e) => {
          Test(e);
        }}
      >
        <TextInput
          placeholder="ドキュメント"
          value={doc}
          onChange={(e) => setDoc(e.target.value)}
        />
        <Button type="submit" color="slate">
          Push
        </Button>
      </form>
    </>
  );
};

export default TestButton;
