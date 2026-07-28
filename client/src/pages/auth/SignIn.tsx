import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import apiCommand, { setStoredAccessToken } from "../../api/apiClient";
import "./SignIn.css";

type SignInProps = {
  onSignIn: () => void;
  onCreateAccount: () => void;
  onForgotPassword?: () => void;
};

const SignIn = ({ onSignIn, onCreateAccount, onForgotPassword }: SignInProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setError("");

    try {
      const data = await apiCommand<{
        access_token?: string;
        token_type?: string;
        user?: {
          email?: string;
          username?: string;
          full_name?: string;
        };
      }>({
        endpoint: "/auth/login",
        method: "POST",
        payload: {
          identifier: email.trim(),
          password,
        },
      });

      if (data.access_token) {
        setStoredAccessToken(data.access_token);
      }

      const signedInUser = data.user?.email || email.trim();
      localStorage.setItem(
        "ingester-current-user",
        signedInUser
      );

      localStorage.setItem(
        "ingester-session",
        JSON.stringify({
          accessToken: data.access_token,
          user: data.user || {
            email: signedInUser,
          },
        })
      );

      onSignIn();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Sign in failed"
      );
    }
  };

  return (
    <div className="signin-page">
      <div className="background-grid"></div>

      <div className="glow glow-one"></div>
      <div className="glow glow-two"></div>

      <div className="signin-card">
        {/* Brand */}
        <div className="signin-brand">
          <div className="signin-logo">I</div>
          <span>Ingester Platform</span>
        </div>

        {/* Header */}
        <div className="signin-header">
          <p className="eyebrow">
            WELCOME BACK
          </p>

          <h1>
            Sign in to <span>Ingester.</span>
          </h1>

          <p>
            Continue your data workflow journey.
          </p>
        </div>

        {/* Form */}
        <form
          className="signin-form"
          onSubmit={handleSubmit}
        >
          {/* Email */}
          <div className="signin-input-group">
            <label>Email</label>

            <div className="signin-input-wrapper">
              <span className="signin-input-icon">
                @
              </span>

              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="signin-input-group">
            <div className="password-label-row">
              <label>Password</label>

              <button
                type="button"
                className="forgot-password"
                onClick={() => onForgotPassword && onForgotPassword()}
              >
                Forgot password?
              </button>
            </div>

            <div className="signin-input-wrapper">
              <span className="signin-input-icon">
                ⌁
              </span>

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
              />

              <button
                type="button"
                className="password-icon"
                onClick={() =>
                  setShowPassword(
                    (previousValue) =>
                      !previousValue
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="signin-error">
              {error}
            </p>
          )}

          {/* Button */}
          <button
            type="submit"
            className="signin-btn"
          >
            <span>Sign In</span>
            <span className="arrow">→</span>
          </button>
        </form>

        {/* Create Account */}
        <p className="create-account-text">
  Don't have an account?

  <button
    type="button"
    className="create-account-link"
    onClick={onCreateAccount}
  >
    Create account
  </button>
</p>

        {/* Footer */}
        <p className="signin-footer">
          Secure data ingestion. Built for modern workflows.
        </p>
      </div>
    </div>
  );
};

export default SignIn;