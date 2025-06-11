"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

interface CashierProfile {
  id: string;
  name: string;
  email: string;
  business_id: string;
  created_at: string;
  updated_at: string;
}

export default function CashierProfilePage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<CashierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCashierProfile = async () => {
      if (!token || !user?.id) return;

      try {
        setLoading(true);
        const response = await api.get(`/auth/getRegister/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProfile(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching cashier profile:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch cashier profile"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCashierProfile();
  }, [token, user?.id]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
          <p className="text-muted-foreground">
            Please wait while we load your profile
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-500">{error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground">No profile found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Cashier Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Name
              </h3>
              <p className="text-lg">{profile.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Email
              </h3>
              <p className="text-lg">{profile.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Business ID
              </h3>
              <p className="text-lg">{profile.business_id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Member Since
              </h3>
              <p className="text-lg">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Last Updated
              </h3>
              <p className="text-lg">
                {new Date(profile.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
