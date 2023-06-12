import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => {
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
          404 - Page Not Found
        </Typography>
        <Typography variant="subtitle1" component="p" gutterBottom>
          ページが見つかりませんわ
        </Typography>
        <Box mt={4}>
          <Button
            variant="outlined"
            component={Link}
            to="/"
            color="primary"
            size="large"
          >
            もとのページに戻る
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
