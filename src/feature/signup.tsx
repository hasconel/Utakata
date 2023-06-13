import { Link } from "react-router-dom";
import api from "./api";
import { fetchState } from "./hooks";
import { AlertMessage } from "../contents/alert";
import { AppwriteException, Models } from "appwrite";

let M: string | null;
const SignupPage: ({
  dispatch,
}: {
  dispatch: React.Dispatch<{
    type: number;
    payload?: Models.User<Models.Preferences>;
  }>;
}) => JSX.Element = ({
  dispatch,
}: {
  dispatch: React.Dispatch<{
    type: number;
    payload?: Models.User<Models.Preferences>;
  }>;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  let navigate = useNavigate();
  let location = useLocation();
  const [error, setError] = useState<string | null>(M);

  let from = location.state?.from?.pathname || "/";

  const handleSignup = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    dispatch({ type: fetchState.init });
    try {
      const user = (await api.createAccount(email, password, username)).User;
      await api.createSession(email, password);
      dispatch({ type: fetchState.success, payload: user });
      navigate(from, { replace: true });
    } catch (e: any) {
      if (typeof e.response.message == "string") {
        M = e.response.message;
      }
      dispatch({ type: fetchState.failure });
    }
  };
  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        textAlign="center"
      >
        <Typography variant="h4" component="h1" gutterBottom>
          新規登録
        </Typography>
        {error && (
          <>
            <AlertMessage message={error} />
          </>
        )}
        <Box maxWidth="300px" width="100%" mt={2}>
          <TextField
            label="UserName"
            type="text"
            variant="outlined"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Box>{" "}
        <Box maxWidth="300px" width="100%" mt={2}>
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Box>
        <Box maxWidth="300px" width="100%" mt={2}>
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Box>
        <Box mt={4}>
          <Button
            variant="contained"
            onClick={handleSignup}
            color="primary"
            size="large"
          >
            登録
          </Button>
        </Box>
        <Box mt={2}>
          <Typography variant="body2">
            すでにアカウントをお持ちですか？ <Link to="/login">ログイン</Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default SignupPage;
