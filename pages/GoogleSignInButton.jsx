import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const GoogleSignInButton = ({ mode = "login" }) => {
  const navigate = useNavigate();
  const { googleLogin } = useAuth();

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          const credential = credentialResponse?.credential;
          if (!credential) return;

          await googleLogin(credential);

          // If signup mode: redirect to login page
          // If login mode: redirect to onboarding (which will redirect to dashboard if already completed)
          if (mode === "signup") {
            navigate("/login", { replace: true });
          } else {
            navigate("/onboarding", { replace: true });
          }
        }}
        onError={() => alert("Google sign-in failed")}
      />
    </div>
  );
};

export default GoogleSignInButton;
