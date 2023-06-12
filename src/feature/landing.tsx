import { Button } from "@tremor/react";
import React from "react";
import { Link } from "react-router-dom";

const LandingPage: React.FC = () => {
  return (
    <>
      <p>すごいカスのSNS</p>
      <Button>Log In</Button>
      <Button>Sign Up</Button>
    </>
  );
};

export default LandingPage;
