import React, { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const { login, signup } = useAuth();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError("");
            setLoading(true);
            if (isLogin) {
                await login(emailRef.current.value, passwordRef.current.value);
            } else {
                await signup(emailRef.current.value, passwordRef.current.value);
            }
            navigate("/");
        } catch (err) {
            console.error(err);
            setError("Failed to " + (isLogin ? "log in" : "create an account"));
        }

        setLoading(false);
    }

    return (
        <div className="container flex-center" style={{ minHeight: "100vh" }}>
            <div className="card" style={{ maxWidth: "400px", width: "100%" }}>
                <h2 className="text-center mb-4">{isLogin ? "Welcome Back" : "Create Account"}</h2>
                {error && <div className="error-alert">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" ref={emailRef} required placeholder="Enter your email" />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" ref={passwordRef} required placeholder="Enter your password" />
                    </div>
                    <button disabled={loading} className="btn btn-primary w-full" type="submit">
                        {isLogin ? "Log In" : "Sign Up"}
                    </button>
                </form>
                <div className="w-full text-center mt-4">
                    <span style={{ color: "#94a3b8" }}>
                        {isLogin ? "Need an account? " : "Already have an account? "}
                    </span>
                    <button
                        className="btn-link"
                        style={{
                            background: "none",
                            border: "none",
                            color: "var(--primary-color)",
                            cursor: "pointer",
                            textDecoration: "underline"
                        }}
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? "Sign Up" : "Log In"}
                    </button>
                </div>
            </div>
        </div>
    );
}
