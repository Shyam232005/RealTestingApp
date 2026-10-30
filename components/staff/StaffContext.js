"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { joinCaPracticeRoom } from "@/lib/socketClient";

const StaffContext = createContext(null);

export function StaffProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-workspace");

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
      }
    } catch (err) {
      console.error("Failed to refresh Staff profile:", err);
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
          // Join real-time socket room for this CA practice & staff user
          joinCaPracticeRoom(
            data.user.caFirmId || data.user.id,
            data.user.id,
            "CA_STAFF"
          );
        }
      } catch (err) {
        console.error("Failed to load Staff profile:", err);
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

  return (
    <StaffContext.Provider
      value={{
        user,
        setUser,
        loading,
        activeTab,
        setActiveTab,
        refreshProfile,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error("useStaff must be used within a StaffProvider");
  }
  return context;
}
