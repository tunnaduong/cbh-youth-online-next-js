"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, DatePicker, Radio, Select, Switch, message } from "antd";
import { Edit2Icon, User, Bell, Shield, Trash2 } from "lucide-react";
import Input from "@/components/ui/input";
import DefaultLayout from "@/layouts/DefaultLayout";
import dayjs from "dayjs";
import { useAuthContext } from "@/contexts/Support";
import { useTheme } from "@/contexts/themeContext";
import {
  updateProfile,
  updateAvatar,
  deleteAccount,
  resendVerificationEmail,
  getCurrentUser,
  getUserProfile,
  getNotificationSettings,
  updateNotificationSettings,
} from "@/app/Api";
import axiosInstance from "@/services/api/AxiosCustom";

export default function SettingsClient({ initialUser, hasAuthError }) {
  const { currentUser, setCurrentUser, loggedIn, userToken, setUserToken } =
    useAuthContext();
  const { theme, changeTheme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle authentication check on client-side to avoid redirect loops
  useEffect(() => {
    // Only redirect if we don't have initialUser and we're not logged in
    // Give it a small delay to allow cookies to be set after login redirect
    if ((hasAuthError || !initialUser) && !currentUser && !loggedIn) {
      const timer = setTimeout(() => {
        // Double check after delay
        if (!currentUser && !loggedIn) {
          router.push("/login?continue=/settings");
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [hasAuthError, initialUser, currentUser, loggedIn, router]);

  // Get user from initialUser or currentUser
  const userData = initialUser || currentUser;

  // Calculate if user can change username (must be 30 days since last change)
  const canChangeUsername = useMemo(() => {
    if (!userData?.profile?.last_username_change) {
      return true; // Never changed username, can change
    }

    const lastChange = new Date(userData.profile.last_username_change);
    const now = new Date();
    const daysSinceLastChange = Math.floor(
      (now - lastChange) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = 30 - daysSinceLastChange;

    return {
      canChange: daysSinceLastChange >= 30,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      daysSinceLastChange,
    };
  }, [userData?.profile?.last_username_change]);

  // Form data state
  const [data, setData] = useState({
    // Profile settings
    username: "",
    email: "",
    gender: "male",
    location: "",
    bio: "",
    // Account settings
    full_name: "",
    date_of_birth: null,
    language: "vi",
    // Notification settings
    notification_level: "all",
    email_contact: true,
    email_marketing: true,
    email_social: true,
    email_security: true, // Always true, cannot be changed
    // Delete account
    password: "",
    confirm_text: "",
  });

  // Load form data from /v1.0/user endpoint
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userResponse = await getCurrentUser();
        const userData = userResponse?.data || userResponse;

        if (userData && userData.username) {
          // Fetch full profile data
          let profileData = null;
          try {
            const profileResponse = await getUserProfile(userData.username);
            profileData = profileResponse?.data || profileResponse;
          } catch (error) {
            console.error("Error fetching profile data:", error);
          }

          // Merge user and profile data
          const fullUser = {
            ...userData,
            profile: profileData?.profile || userData.profile,
          };

          // Update currentUser if not set
          if (!currentUser || currentUser.username !== fullUser.username) {
            setCurrentUser(fullUser);
          }

          // Update form data
          setData({
            username: fullUser?.username || "",
            email: fullUser?.email || "",
            gender:
              fullUser?.profile?.gender?.toLowerCase() === "male"
                ? "male"
                : fullUser?.profile?.gender?.toLowerCase() === "female"
                  ? "female"
                  : "male",
            location: fullUser?.profile?.location || "",
            bio: fullUser?.profile?.bio || "",
            full_name: fullUser?.profile?.profile_name || "",
            date_of_birth:
              fullUser?.profile?.birthday_raw || fullUser?.profile?.birthday
                ? (() => {
                  const birthDate =
                    fullUser.profile.birthday_raw ||
                    fullUser.profile.birthday;
                  const parsed = dayjs(birthDate);
                  return parsed.isValid() ? parsed : null;
                })()
                : null,
            language: "vi",
            notification_level: "all",
            email_contact: true,
            email_marketing: true,
            email_social: true,
            email_security: true,
            password: "",
            confirm_text: "",
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        // Fallback to initialUser or currentUser if available
        const user = initialUser || currentUser;
        if (user) {
          setData({
            username: user?.username || "",
            email: user?.email || "",
            gender:
              user?.profile?.gender?.toLowerCase() === "male"
                ? "male"
                : user?.profile?.gender?.toLowerCase() === "female"
                  ? "female"
                  : "male",
            location: user?.profile?.location || "",
            bio: user?.profile?.bio || "",
            full_name: user?.profile?.profile_name || "",
            date_of_birth:
              user?.profile?.birthday_raw || user?.profile?.birthday
                ? (() => {
                  const birthDate =
                    user.profile.birthday_raw || user.profile.birthday;
                  const parsed = dayjs(birthDate);
                  return parsed.isValid() ? parsed : null;
                })()
                : null,
            language: "vi",
            notification_level: "all",
            email_contact: true,
            email_marketing: true,
            email_social: true,
            email_security: true,
            password: "",
            confirm_text: "",
          });
        }
      }
    };

    loadUserData();
  }, []); // Only run once on mount

  // Load notification settings from API
  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const response = await getNotificationSettings();
        const settings = response?.data || response;

        if (settings) {
          setData((prev) => ({
            ...prev,
            notification_level: settings.notification_level || "all",
            email_contact: settings.email_contact ?? true,
            email_marketing: settings.email_marketing ?? true,
            email_social: settings.email_social ?? true,
            email_security: true, // Always true, cannot be changed
          }));
        }
      } catch (error) {
        console.error("Error loading notification settings:", error);
        // Keep default values if API call fails
      }
    };

    // Only load if user is logged in
    if (currentUser || loggedIn) {
      loadNotificationSettings();
    }
  }, [currentUser, loggedIn]);

  const updateData = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
    // Clear error for this field
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleResendVerificationEmail = async () => {
    try {
      setResendingEmail(true);
      await resendVerificationEmail();
      message.success(
        "Email xác minh đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn."
      );
    } catch (error) {
      console.error("Error resending verification email:", error);
      message.error(
        error.response?.data?.message ||
        "Có lỗi xảy ra khi gửi lại email xác minh"
      );
    } finally {
      setResendingEmail(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      message.error("Vui lòng chọn file ảnh hợp lệ");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      message.error("Kích thước file không được vượt quá 10MB");
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await updateAvatar(currentUser.username, formData);
      const responseData = response?.data || response;

      message.success(responseData?.message || "Cập nhật avatar thành công!");

      // Refresh user data to get new avatar
      try {
        const userResponse = await getCurrentUser();
        const updatedUserData = userResponse?.data || userResponse;

        if (updatedUserData) {
          setCurrentUser(updatedUserData);
        }
      } catch (error) {
        console.error("Error fetching updated user data:", error);
      }

      // Force reload to update avatar in all places
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      message.error(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật avatar"
      );
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Check if userData is available
      if (!userData && !currentUser) {
        message.error(
          "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại."
        );
        setLoading(false);
        return;
      }

      // Build JSON payload with only changed fields
      const payload = {};

      if (data.username && data.username !== userData?.username) {
        payload.username = data.username;
      }
      if (data.email && data.email !== userData?.email) {
        payload.email = data.email;
      }
      if (data.full_name && data.full_name !== userData?.profile_name) {
        payload.profile_name = data.full_name;
      }
      // Always send gender if it's selected
      if (data.gender && (data.gender === "male" || data.gender === "female")) {
        const genderValue = data.gender === "male" ? "Male" : "Female";
        // Compare with current profile gender (convert to proper format if exists)
        const currentGender = userData?.profile?.gender
          ? String(userData.profile.gender).toLowerCase() === "male"
            ? "Male"
            : String(userData.profile.gender).toLowerCase() === "female"
              ? "Female"
              : null
          : null;

        // Send if different from current value (or if current value is null)
        if (genderValue !== currentGender) {
          payload.gender = genderValue;
        }
      }
      if (data.location && data.location !== userData?.profile?.location) {
        payload.location = data.location;
      }
      if (data.bio !== undefined && data.bio !== userData?.profile?.bio) {
        payload.bio = data.bio;
      }

      // Check if there's anything to update
      if (Object.keys(payload).length === 0) {
        message.info("Không có thay đổi nào để cập nhật.");
        setLoading(false);
        return;
      }

      console.log("Updating profile with payload:", payload);
      console.log(
        "Gender check - data.gender:",
        data.gender,
        "userData.profile.gender:",
        userData?.profile?.gender
      );

      // Send as JSON payload
      const response = await axiosInstance.put(
        `/v1.0/users/${currentUser.username}/profile`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Extract response data (axios wraps it in .data)
      const responseData = response?.data || response;

      // Update token if backend returns a new token
      if (responseData?.token || responseData?.access_token) {
        const newToken = responseData.token || responseData.access_token;
        if (newToken && setUserToken) {
          setUserToken(newToken);
          // Also update localStorage directly to ensure it's saved
          localStorage.setItem("TOKEN", newToken);
        }
      } else if (userToken) {
        // Ensure current token is still in localStorage (in case it was cleared)
        localStorage.setItem("TOKEN", userToken);
      }

      // Optimistic update: Update form state and currentUser immediately with values from payload
      // This ensures UI updates instantly without waiting for server refresh
      const optimisticUpdates = {};
      if (payload.username) optimisticUpdates.username = payload.username;
      if (payload.email) optimisticUpdates.email = payload.email;
      if (payload.profile_name)
        optimisticUpdates.full_name = payload.profile_name;
      if (payload.gender) {
        optimisticUpdates.gender =
          payload.gender.toLowerCase() === "male" ? "male" : "female";
      }
      if (payload.location !== undefined)
        optimisticUpdates.location = payload.location;
      if (payload.bio !== undefined) optimisticUpdates.bio = payload.bio;

      // Update form data immediately
      if (Object.keys(optimisticUpdates).length > 0) {
        setData((prev) => ({
          ...prev,
          ...optimisticUpdates,
        }));
      }

      // Update currentUser immediately with optimistic values
      if (Object.keys(optimisticUpdates).length > 0) {
        setCurrentUser((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            ...(optimisticUpdates.username && {
              username: optimisticUpdates.username,
            }),
            ...(optimisticUpdates.email && { email: optimisticUpdates.email }),
            profile: {
              ...prev.profile,
              ...(optimisticUpdates.full_name && {
                profile_name: optimisticUpdates.full_name,
              }),
              ...(optimisticUpdates.gender && {
                gender: optimisticUpdates.gender === "male" ? "Male" : "Female",
              }),
              ...(optimisticUpdates.location !== undefined && {
                location: optimisticUpdates.location,
              }),
              ...(optimisticUpdates.bio !== undefined && {
                bio: optimisticUpdates.bio,
              }),
            },
          };
          return updated;
        });
      }

      // Show success message with email verification notice if email was changed
      if (responseData?.email_verification_sent) {
        message.success(
          responseData.message ||
          "Cập nhật hồ sơ thành công! Email xác minh đã được gửi đến địa chỉ email mới."
        );
      } else {
        message.success(responseData?.message || "Cập nhật hồ sơ thành công!");
      }

      // Get new username from response if it changed
      const newUsername = responseData?.user?.username;

      // Refresh user data first
      let updatedUserData = null;
      try {
        const userResponse = await getCurrentUser();
        updatedUserData = userResponse?.data || userResponse;
      } catch (error) {
        console.error("Error fetching updated user data:", error);
      }

      // Use new username if available, otherwise use current username
      const usernameToUse =
        newUsername || updatedUserData?.username || currentUser.username;

      // Fetch profile data with the correct username
      let updatedProfileData = null;
      try {
        const profileResponse = await getUserProfile(usernameToUse);
        updatedProfileData = profileResponse?.data || profileResponse;
      } catch (error) {
        console.error("Error fetching updated profile data:", error);
      }

      // Merge user and profile data - ensure we always have a user object
      let mergedUser = null;

      if (updatedUserData) {
        mergedUser = {
          ...updatedUserData,
          // Include username and email from response if available (these are the most up-to-date)
          username:
            newUsername || updatedUserData.username || currentUser.username,
          email: updatedUserData.email || currentUser.email,
          // Merge profile data
          profile:
            updatedProfileData?.profile ||
            updatedUserData.profile ||
            currentUser.profile,
        };

        // Ensure all required fields are present
        if (!mergedUser.id)
          mergedUser.id = updatedUserData.id || currentUser.id;
        if (!mergedUser.email) mergedUser.email = currentUser.email;
      } else if (updatedProfileData) {
        // Fallback: use profile data if user data fetch failed
        mergedUser = {
          ...currentUser,
          username:
            newUsername || updatedProfileData.username || currentUser.username,
          profile: updatedProfileData.profile || currentUser.profile,
        };
      } else if (responseData?.user) {
        // Last resort: use data from response
        mergedUser = {
          ...currentUser,
          ...responseData.user,
          username: responseData.user.username || currentUser.username,
          email: responseData.user.email || currentUser.email,
        };
      }

      // Always update currentUser if we have any data (this will sync with server after optimistic update)
      if (mergedUser && Object.keys(mergedUser).length > 0) {
        setCurrentUser(mergedUser);

        // Update form data with server values (merge with optimistic updates if server data is missing)
        setData((prev) => ({
          ...prev,
          username: mergedUser.username || prev.username,
          email: mergedUser.email || prev.email,
          full_name: mergedUser.profile?.profile_name ?? prev.full_name,
          gender: mergedUser.profile?.gender
            ? mergedUser.profile.gender.toLowerCase() === "male"
              ? "male"
              : mergedUser.profile.gender.toLowerCase() === "female"
                ? "female"
                : prev.gender
            : prev.gender, // Keep optimistic value if server doesn't return gender
          location: mergedUser.profile?.location ?? prev.location,
          bio: mergedUser.profile?.bio ?? prev.bio,
          date_of_birth:
            mergedUser.profile?.birthday_raw || mergedUser.profile?.birthday
              ? (() => {
                const birthDate =
                  mergedUser.profile.birthday_raw ||
                  mergedUser.profile.birthday;
                const parsed = dayjs(birthDate);
                return parsed.isValid() ? parsed : prev.date_of_birth;
              })()
              : prev.date_of_birth,
        }));
      }

      // If username changed, reload the page to sync with new username
      if (newUsername && newUsername !== currentUser.username) {
        // Reload the page to ensure everything is in sync
        window.location.reload();
        return;
      }
    } catch (error) {
      console.error("Update profile error:", error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        message.error(
          error.response?.data?.message || "Có lỗi xảy ra khi cập nhật hồ sơ"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const payload = {
        profile_name: data.full_name || undefined,
        birthday: data.date_of_birth
          ? data.date_of_birth.format("YYYY-MM-DD")
          : undefined,
      };

      await updateProfile(currentUser.username, payload);
      message.success("Cập nhật tài khoản thành công!");

      // Refresh user data
      const response = await getCurrentUser();
      if (response?.data) {
        setCurrentUser(response.data);
      }
    } catch (error) {
      console.error("Update account error:", error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        message.error(
          error.response?.data?.message ||
          "Có lỗi xảy ra khi cập nhật tài khoản"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNotifications = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const payload = {
        notification_level: data.notification_level,
        email_contact: data.email_contact,
        email_marketing: data.email_marketing,
        email_social: data.email_social,
        // email_security is always true and not sent to API
      };

      const response = await updateNotificationSettings(payload);
      const responseData = response?.data || response;

      message.success(
        responseData?.message || "Cập nhật thông báo thành công!"
      );

      // Update form data with response data
      if (responseData) {
        setData((prev) => ({
          ...prev,
          notification_level:
            responseData.notification_level || prev.notification_level,
          email_contact: responseData.email_contact ?? prev.email_contact,
          email_marketing: responseData.email_marketing ?? prev.email_marketing,
          email_social: responseData.email_social ?? prev.email_social,
          email_security: true, // Always true, cannot be changed
        }));
      }
    } catch (error) {
      console.error("Update notifications error:", error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        message.error(
          error.response?.data?.message ||
          "Có lỗi xảy ra khi cập nhật thông báo"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDelete = async (e) => {
    e.preventDefault();

    if (data.confirm_text !== "XÓA TÀI KHOẢN") {
      message.error("Vui lòng nhập đúng 'XÓA TÀI KHOẢN' để xác nhận");
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Call delete account API
      await deleteAccount({
        password: data.password,
        confirm_text: data.confirm_text,
      });

      message.success("Tài khoản đã được xóa thành công");

      // Clear auth-related info
      setCurrentUser(null);
      localStorage.removeItem("TOKEN");
      localStorage.removeItem("CURRENT_USER");

      // Also clear cookies
      if (typeof document !== "undefined") {
        document.cookie = "auth_token=; Max-Age=0; path=/; SameSite=Lax;";
        document.cookie = "refresh_token=; Max-Age=0; path=/; SameSite=Lax;";
        // Reload page and then navigate to login
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Delete account error:", error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        message.error(
          error.response?.data?.message ||
          "Có lỗi xảy ra khi xóa tài khoản. Vui lòng kiểm tra mật khẩu."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        console.log("Rendering profile tab");
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Trang cá nhân
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Đây là cách người khác sẽ nhìn thấy bạn trên trang web.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                handleSubmitProfile(e);
              }}
              className="space-y-6 md:space-y-0 flex flex-col-reverse md:flex-row gap-4"
            >
              {/* Username */}
              <div className="flex flex-col gap-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tên đăng nhập
                  </label>
                  <Input
                    type="text"
                    value={data.username}
                    onChange={(e) => updateData("username", e.target.value)}
                    disabled={
                      typeof canChangeUsername === "object" &&
                      !canChangeUsername.canChange
                    }
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${typeof canChangeUsername === "object" &&
                        !canChangeUsername.canChange
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      }`}
                    placeholder="Nhập tên đăng nhập"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Đây là tên hiển thị công khai của bạn. Nó có thể là tên thật
                    hoặc biệt danh của bạn. Bạn chỉ có thể thay đổi tên đăng
                    nhập mỗi 30 ngày một lần.
                  </p>
                  {typeof canChangeUsername === "object" &&
                    !canChangeUsername.canChange && (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                        Bạn đã đổi tên đăng nhập{" "}
                        {canChangeUsername.daysSinceLastChange} ngày trước. Vui
                        lòng thử lại sau {canChangeUsername.daysRemaining} ngày
                        nữa.
                      </p>
                    )}
                  {errors.username && (
                    <p className="mt-1 text-xs text-red-500">
                      {Array.isArray(errors.username)
                        ? errors.username[0]
                        : errors.username}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email đăng ký
                  </label>
                  <Input
                    type="email"
                    value={data.email}
                    onChange={(e) => updateData("email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Email đăng ký"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Email phải là duy nhất. Sau khi đổi email, bạn sẽ nhận được
                    email xác minh để xác nhận địa chỉ email mới.
                  </p>
                  {userData && !userData.email_verified_at && (
                    <div className="mt-1 space-y-2">
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        ⚠️ Email của bạn chưa được xác minh. Vui lòng kiểm tra
                        hộp thư và xác minh email để hoàn tất.
                      </p>
                      <Button
                        type="button"
                        size="small"
                        onClick={handleResendVerificationEmail}
                        loading={resendingEmail}
                        className="text-xs h-7 px-3 bg-amber-500 hover:bg-amber-600 text-white border-0 rounded-md"
                      >
                        Gửi lại thư xác minh
                      </Button>
                    </div>
                  )}
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">
                      {Array.isArray(errors.email)
                        ? errors.email[0]
                        : errors.email}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Giới tính
                  </label>
                  <Radio.Group
                    value={data.gender}
                    options={[
                      { value: "male", label: "Nam" },
                      { value: "female", label: "Nữ" },
                    ]}
                    onChange={(e) => updateData("gender", e.target.value)}
                    className="text-gray-700 dark:text-gray-300"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quê quán
                  </label>
                  <Input
                    type="text"
                    value={data.location}
                    onChange={(e) => updateData("location", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nhập quê quán"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tiểu sử
                  </label>
                  <Input.TextArea
                    value={data.bio}
                    onChange={(e) => updateData("bio", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nhập tiểu sử của bạn"
                    rows={4}
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    loading={loading}
                    onClick={(e) => {
                      // Ensure form submission is triggered
                      e.preventDefault();
                      handleSubmitProfile(e);
                    }}
                    className="bg-primary-500 hover:bg-green-600 text-white border-0 px-6 py-2 rounded-md font-medium"
                  >
                    Cập nhật hồ sơ
                  </Button>
                </div>
              </div>
              {/* Profile Picture */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ảnh đại diện
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${currentUser?.username || userData?.username
                        }/avatar?t=${Date.now()}`}
                      alt="Avatar"
                      className="border border-gray-300 dark:!border-[#737373] w-52 h-52 rounded-full object-cover"
                    />
                    <Button
                      loading={uploadingAvatar}
                      disabled={uploadingAvatar}
                      onClick={() =>
                        document.getElementById("avatar-upload")?.click()
                      }
                      className="flex items-center dark:border-[#737373] absolute left-0 bottom-0 ml-2 mb-2 h-[36px] !px-3 text-[13px] font-semibold cursor-pointer"
                    >
                      <Edit2Icon className="w-4 h-4" />
                      <span>Sửa</span>
                    </Button>
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      style={{ display: "none" }}
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
        );

      case "account":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Tài khoản
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Cập nhật cài đặt tài khoản của bạn. Đặt ngôn ngữ và múi giờ ưa
                thích của bạn.
              </p>
            </div>

            <form onSubmit={handleSubmitAccount} className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Họ và tên
                </label>
                <Input
                  type="text"
                  value={data.full_name}
                  onChange={(e) => updateData("full_name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Dương Tùng Anh (Tunna Duong)"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Đây là tên sẽ được hiển thị công khai trên hồ sơ của bạn, bảng
                  tin và diễn đàn.
                </p>
                {errors.full_name && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.full_name}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngày tháng năm sinh
                </label>
                <div className="relative">
                  <DatePicker
                    value={data.date_of_birth}
                    onChange={(date) => updateData("date_of_birth", date)}
                    placeholder="Chọn ngày sinh"
                    format="DD/MM/YYYY"
                    className="w-full"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Ngày sinh của bạn được sử dụng để tính toán tuổi của bạn.
                </p>
                {errors.date_of_birth && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.date_of_birth}
                  </p>
                )}
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngôn ngữ
                </label>

                <Select
                  value={data.language}
                  onChange={(value) => updateData("language", value)}
                  style={{ width: "100%" }}
                  options={[{ label: "Tiếng Việt", value: "vi" }]}
                  placeholder="Chọn ngôn ngữ"
                  className="shadow-sm"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Đây là ngôn ngữ sẽ được sử dụng trên website
                </p>
                {errors.language && (
                  <p className="mt-1 text-xs text-red-500">{errors.language}</p>
                )}
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Giao diện
                </label>

                <Radio.Group
                  value={theme}
                  onChange={(e) => {
                    const newTheme = e.target.value;
                    changeTheme(newTheme);
                  }}
                  className="w-full"
                >
                  <div className="flex flex-col gap-3">
                    <Radio
                      value="light"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Sáng
                    </Radio>
                    <Radio
                      value="dark"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Tối
                    </Radio>
                    <Radio
                      value="auto"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Theo hệ thống
                    </Radio>
                  </div>
                </Radio.Group>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Chọn giao diện bạn muốn sử dụng trên website
                </p>
                {errors.theme && (
                  <p className="mt-1 text-xs text-red-500">{errors.theme}</p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <Button
                  type="submit"
                  loading={loading}
                  onClick={(e) => {
                    // Ensure form submission is triggered
                    e.preventDefault();
                    handleSubmitAccount(e);
                  }}
                  className="text-white border-0 px-6 py-2 rounded-md font-medium"
                >
                  Cập nhật tài khoản
                </Button>
              </div>
            </form>

            {/* Delete Account Section */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                    Xóa tài khoản
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Xóa vĩnh viễn tài khoản và tất cả dữ liệu của bạn. Hành động
                    này không thể hoàn tác.
                  </p>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Trash2 className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                        Cảnh báo quan trọng
                      </h3>
                      <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                        <ul className="list-disc list-inside space-y-1">
                          <li>
                            Tất cả bài viết, bình luận và tương tác của bạn sẽ
                            bị xóa vĩnh viễn
                          </li>
                          <li>Bạn sẽ mất quyền truy cập vào tài khoản này</li>
                          <li>Không thể khôi phục dữ liệu sau khi xóa</li>
                          <li>
                            Email của bạn có thể được sử dụng để tạo tài khoản
                            mới
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmitDelete} className="space-y-6">
                  {/* Password Confirmation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      value={data.password}
                      onChange={(e) => updateData("password", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Nhập mật khẩu hiện tại"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Chúng tôi cần xác nhận mật khẩu để xóa tài khoản
                    </p>
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirmation Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Xác nhận xóa tài khoản
                    </label>
                    <input
                      type="text"
                      value={data.confirm_text}
                      onChange={(e) =>
                        updateData("confirm_text", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Gõ 'XÓA TÀI KHOẢN' để xác nhận"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Gõ chính xác &quot;XÓA TÀI KHOẢN&quot; (viết hoa) để xác
                      nhận
                    </p>
                    {errors.confirm_text && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.confirm_text}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div>
                    <Button
                      type="submit"
                      loading={loading}
                      disabled={
                        data.confirm_text !== "XÓA TÀI KHOẢN" || loading
                      }
                      className="bg-red-600 hover:bg-red-700 text-white border-0 px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      htmlType="submit"
                    >
                      Xóa vĩnh viễn tài khoản
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-8">
            <form onSubmit={handleSubmitNotifications} className="space-y-8">
              {/* General Notifications */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Thông báo
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Cấu hình cách bạn nhận thông báo.
                </p>

                <Radio.Group
                  value={data.notification_level}
                  onChange={(e) =>
                    updateData("notification_level", e.target.value)
                  }
                  className="space-y-3"
                >
                  <div className="flex flex-col space-y-3">
                    <Radio
                      value="all"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Tất cả thông báo
                    </Radio>
                    <Radio
                      value="mentions"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Tin nhắn trực tiếp và đề cập
                    </Radio>
                    <Radio
                      value="none"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Không có thông báo
                    </Radio>
                  </div>
                </Radio.Group>
              </div>

              {/* Email Notifications */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Thông báo qua email
                </h3>

                <div className="space-y-6">
                  {/* Contact Email */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Email liên lạc
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Nhận email về hoạt động tài khoản của bạn.
                      </p>
                    </div>
                    <Switch
                      checked={data.email_contact}
                      onChange={(checked) =>
                        updateData("email_contact", checked)
                      }
                      className="ml-4"
                    />
                  </div>

                  {/* Marketing Email */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Email marketing
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Nhận email về sản phẩm mới, tính năng, và nhiều hơn nữa.
                      </p>
                    </div>
                    <Switch
                      checked={data.email_marketing}
                      onChange={(checked) =>
                        updateData("email_marketing", checked)
                      }
                      className="ml-4"
                    />
                  </div>

                  {/* Social Email */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Email xã hội
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Nhận email về yêu cầu kết bạn, theo dõi, và nhiều hơn
                        nữa.
                      </p>
                    </div>
                    <Switch
                      checked={data.email_social}
                      onChange={(checked) =>
                        updateData("email_social", checked)
                      }
                      className="ml-4"
                    />
                  </div>

                  {/* Security Email */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Email bảo mật
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Nhận email về hoạt động và bảo mật tài khoản của bạn.
                        <span className="block mt-1 text-xs text-gray-500 dark:text-gray-500">
                          (Luôn bật để đảm bảo an toàn tài khoản)
                        </span>
                      </p>
                    </div>
                    <Switch checked={true} disabled={true} className="ml-4" />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <Button
                  type="submit"
                  loading={loading}
                  onClick={(e) => {
                    // Ensure form submission is triggered
                    e.preventDefault();
                    handleSubmitNotifications(e);
                  }}
                  className="text-white border-0 px-6 py-2 rounded-md font-medium"
                >
                  Cập nhật thông báo
                </Button>
              </div>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  // Show loading or redirect message while checking auth
  if ((hasAuthError || !initialUser) && !currentUser && !loggedIn) {
    return (
      <DefaultLayout activeNav="settings">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#319527] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Đang xác thực...</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  const user = initialUser || currentUser;

  // Still show page even if initialUser is null but currentUser exists
  // This allows the page to work after login redirect
  if (!user) {
    return (
      <DefaultLayout activeNav="settings">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Vui lòng đăng nhập để truy cập cài đặt.
            </p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout activeNav="settings">
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Cài đặt
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Quản lý cài đặt tài khoản và thiết lập thông báo email.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "profile"
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-r-2 border-green-600 dark:border-green-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-800"
                    }`}
                >
                  <User className="w-5 h-5 mr-3" />
                  Trang cá nhân
                </button>
                <button
                  onClick={() => setActiveTab("account")}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "account"
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-r-2 border-green-600 dark:border-green-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-800"
                    }`}
                >
                  <Shield className="w-5 h-5 mr-3" />
                  Tài khoản
                </button>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "notifications"
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-r-2 border-green-600 dark:border-green-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-800"
                    }`}
                >
                  <Bell className="w-5 h-5 mr-3" />
                  Thông báo
                </button>
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-white dark:!bg-[#3c3c3c] rounded-lg shadow-sm border border-gray-200 dark:!border-[#737373] p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
