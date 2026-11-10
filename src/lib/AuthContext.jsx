import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { appApi, supabase, supabaseConfigured } from "@/api/appClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const session = await appApi.auth.getSession();
      if (!session) {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
        return null;
      }

      const currentUser = await appApi.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      return currentUser;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if (error.status === 401 || error.status === 403) {
        setAuthError({ type: "auth_required", message: "Please sign in again." });
      } else {
        setAuthError({
          type: "service_error",
          message: "StudyMate could not connect to its account service. Please try again shortly.",
        });
      }
      return null;
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  const checkAppState = useCallback(async () => {
    if (!supabaseConfigured) {
      setAuthError({
        type: "configuration_error",
        message: "StudyMate's new database connection has not been configured yet.",
      });
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return;
    }
    await checkUserAuth();
  }, [checkUserAuth]);

  useEffect(() => {
    if (!supabase) {
      checkAppState();
      return undefined;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
        setIsLoadingAuth(false);
        setAuthChecked(true);
      } else if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
        window.setTimeout(() => { void checkUserAuth(); }, 0);
      }
    });

    void checkAppState();
    return () => subscription.unsubscribe();
  }, [checkAppState, checkUserAuth]);

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    await appApi.auth.logout(shouldRedirect ? "/login" : undefined);
  };

  const navigateToLogin = () => appApi.auth.redirectToLogin(window.location.href);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
