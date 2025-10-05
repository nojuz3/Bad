import { useState, useEffect } from "react";
import axios from "axios";

function Login() {
  const [data, setdata] = useState("");
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true); // true = Login, false = Register
  const [loggedin, setLoggedin] = useState(false); // true = logged in, false = not logged in
  const [loading, setLoading] = useState(true);

  const fetchApi = async () => {
    const res = await axios.get("http://localhost:8080/api");
    setdata(res.data);
  };

  // Run on load
  useEffect(() => {
    setTimeout(() => {
      if (localStorage.getItem("token")) {
        setLoggedin(true);
      }
      setLoading(false);
    }, 100);

    fetchApi();
  }, []);

  // handle button login and register
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // Login
        const res = await axios.post("http://localhost:8080/login", {
          username,
          password,
        });
        setToken(res.data.token);
        //
        if (res.data.success) {
          alert("Login success")
          localStorage.setItem("token", res.data.token); // save JWT
          setLoggedin(true);
          window.location.reload();
        }
        //
      } else {
        // Register
        await axios.post("http://localhost:8080/register", {
          username,
          email,
          password,
          role: "user",
        });
        window.location.reload();
      }
    } catch (error) {
      alert("Email or Username exists")
      console.error(`${isLogin ? "Login" : "Register"} failed:`, error);
    }
    setUsername("");
    setEmail("")
    setPassword("");
  };
  if (loading || loggedin) {
    return null;
  }
  return (
    <div className="login-container">
      <h2>{isLogin ? "Login" : "Register"}</h2>
      <form class="login-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          minLength={4}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        {isLogin == false && (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}
        <input
          type="password"
          placeholder="Password"
          minLength={5}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button class="login-button" type="submit">
          {isLogin ? "Login" : "Register"}
        </button>
        
      </form>
      <p>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="submit"
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: "none",
              border: "none",
              color: "blue",
              cursor: "pointer",
            }}
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
    </div>
  );
}

export default Login;
