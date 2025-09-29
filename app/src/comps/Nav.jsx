import React , { useState } from "react";

function Nav() {
  
  const user = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };
  return (
    <nav class="nav">
      <ul class="nav-links">
        <li>HelpDesk</li>
        
        <li>
          <button onClick={() => logout()}>Logout</button>
        </li>

      </ul>
    </nav>
  );
}

export default Nav;
