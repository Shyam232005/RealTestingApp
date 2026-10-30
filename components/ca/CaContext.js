"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { joinCaPracticeRoom } from "@/lib/socketClient";

const CaContext = createContext(null);

export function CaProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("CA_PARTNER"); // "CA_PARTNER" or "CA_STAFF"
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  const refreshProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/ca/profile");
      if (res.status === 401) {
        router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
        return;
      }
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        if (data.user.role) {
          setRole(data.user.role);
        }
      }
    } catch (err) {
      console.error("Failed to refresh CA profile:", err);
    }
  }, [router]);

  useEffect(() => {
    let ignore = false;
    async function fetchInitialProfile() {
      try {
        const res = await fetch("/api/ca/profile");
        if (res.status === 401) {
          router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
          return;
        }
        const data = await res.json();
        if (!ignore && data?.success && data?.user) {
          setUser(data.user);
          if (data.user.role) {
            setRole(data.user.role);
          }
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.startsWith("/ca/setup") &&
            data.user.isSetupComplete === false &&
            (data.user.role === "CA_PARTNER" || data.user.role === "CA")
          ) {
            router.push("/ca/setup");
            return;
          }
          // Join real-time socket room for this CA practice
          joinCaPracticeRoom(
            data.user.caFirmId || data.user.id,
            data.user.id,
            data.user.role
          );
        }
      } catch (err) {
        console.error("Failed to load CA profile:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchInitialProfile();

    return () => {
      ignore = true;
    };
  }, [router]);

  const switchRole = (newRole) => {
    setRole(newRole);
    // Switch active tab appropriately if staff cannot access partner tab
    if (newRole === "CA_STAFF" && (activeTab === "audit-signoffs" || activeTab === "team" || activeTab === "settings" || activeTab === "data-requests")) {
      setActiveTab("my-workspace");
    } else if (newRole === "CA_PARTNER" && (activeTab === "my-workspace" || activeTab === "discrepancies" || activeTab === "reconciliation")) {
      setActiveTab("dashboard");
    }
  };

  return (
    <CaContext.Provider
      value={{
        user,
        setUser,
        role,
        setRole: switchRole,
        loading,
        activeTab,
        setActiveTab,
        refreshProfile,
      }}
    >
      {children}
    </CaContext.Provider>
  );
}

export function useCa() {
  const context = useContext(CaContext);
  if (!context) {
    throw new Error("useCa must be used within a CaProvider");
  }
  return context;
}
