"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Edit,
  Save,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "@/components/ui/use-toast";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  businessId?: string;
  businessName?: string;
  branchId?: string;
  branchName?: string;
  createdAt: string;
  lastLogin?: string;
}

export default function CashierProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (user) {
      // Simulate fetching user profile data
      const mockProfile: UserProfile = {
        id: user.id || "1",
        name: user.name || "Cashier Name",
        email: user.email || "cashier@example.com",
        phone: "+57 300 123 4567",
        role: "CASHIER",
        businessId: "business-1",
        businessName: "Restaurant Name",
        branchId: "branch-1",
        branchName: "Main Branch",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      setProfile(mockProfile);
      setEditedProfile(mockProfile);
      setIsLoading(false);
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile(profile || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile(profile || {});
  };

  const handleSave = async () => {
    try {
      // Here you would typically make an API call to update the profile
      // For now, we'll just simulate the update
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setProfile((prev) => (prev ? { ...prev, ...editedProfile } : null));
      setIsEditing(false);

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Profile Not Found
            </h1>
            <p className="text-gray-600">Unable to load profile information.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editedProfile.name || ""}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{profile.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editedProfile.email || ""}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{profile.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editedProfile.phone || ""}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {profile.phone || "Not provided"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Badge variant="secondary">{profile.role}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Work Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Work Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Business</Label>
                  <p className="text-sm text-gray-900">
                    {profile.businessName}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Branch</Label>
                  <p className="text-sm text-gray-900">{profile.branchName}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Member Since</Label>
                  <p className="text-sm text-gray-900">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {profile.lastLogin && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Last Login</Label>
                      <p className="text-sm text-gray-900">
                        {new Date(profile.lastLogin).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  View Shift History
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
