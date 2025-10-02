import React , { useState, useEffect } from "react";

function Nav() {
  
  const user = localStorage.getItem("token");


  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };
  return (
    <nav class="nav">
      <ul class="nav-links">
        <li>HelpDesk</li>
        <li>{time.toLocaleTimeString()}</li>
        <li>
          <button onClick={() => logout()}>Logout</button>
        </li>

      </ul>
    </nav>
  );
}

export default Nav;
