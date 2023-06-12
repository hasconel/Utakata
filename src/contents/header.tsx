import React from "react";

const Header: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton edge="start" color="inherit" aria-label="menu">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6">すごいカスのSNS</Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
