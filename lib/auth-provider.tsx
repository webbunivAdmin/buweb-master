"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/api-service"
import { toast } from "sonner"

type User = {
  id: string
  name: string
  email: string
  role: string
  isVerified: boolean
  profileImageUrl?: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  register: (userData: any) => Promise<void>
  verifyOTP: (email: string, otp: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  resetPasswordRequest: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token")
      const storedUser = localStorage.getItem("user")

      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        setIsAuthenticated(true)
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [])

  // Register a new user
  const register = async (userData: any) => {
    setIsLoading(true)
    try {
      await authService.register(userData)
      toast.success("Registration successful", {
        description: "Please check your email for OTP verification.",
      })
      router.push("/verify-otp")
    } catch (error: any) {
      toast.error("Registration failed", {
        description: error.response?.data || "An error occurred during registration.",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Verify OTP
  const verifyOTP = async (email: string, otp: string) => {
    setIsLoading(true)
    try {
      const response = await authService.verifyOTP(email, otp)
      setToken(response.token)
      localStorage.setItem("token", response.token)

      // Fetch user data or decode from token
      const userData = {
        id: response.id,
        name: response.name,
        email: email,
        role: response.role,
        isVerified: true,
        avatar: response.avatar,
      }

      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      setIsAuthenticated(true)

      toast.success("Verification successful", {
        description: "Your account has been verified.",
      })

      router.push("/dashboard")
    } catch (error: any) {
      toast.error("Verification failed", {
        description: error.response?.data || "Invalid OTP. Please try again.",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Login user
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // This endpoint isn't explicitly shown in your API, but I'm assuming it exists
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error("Login failed")
      }

      const data = await response.json()
      setToken(data.token)
      localStorage.setItem("token", data.token)

      // Fetch user data or decode from token
      const userData = {
        id: data.id,
        name: data.name,
        email: email,
        role: data.role,
        isVerified: true,
        avatar: data.avatar,
      }

      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      setIsAuthenticated(true)

      toast.success("Login successful", {
        description: "You have been logged in successfully.",
      })

      router.push("/dashboard")
    } catch (error: any) {
      toast.error("Login failed", {
        description: error.message || "Invalid credentials. Please try again.",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Logout user
  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    router.push("/login")

    toast.success("Logged out", {
      description: "You have been logged out successfully.",
    })
  }

  // Request password reset
  const resetPasswordRequest = async (email: string) => {
    setIsLoading(true)
    try {
      await authService.resetPasswordRequest(email)
      toast.success("Password reset email sent", {
        description: "Please check your email for password reset instructions.",
      })
    } catch (error: any) {
      toast.error("Request failed", {
        description: error.response?.data || "Failed to send password reset email.",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Reset password
  const resetPassword = async (resetToken: string, newPassword: string) => {
    setIsLoading(true)
    try {
      await authService.resetPassword(resetToken, newPassword)
      toast.success("Password reset successful", {
        description: "Your password has been reset successfully. Please login with your new password.",
      })
      router.push("/login")
    } catch (error: any) {
      toast.error("Reset failed", {
        description: error.response?.data || "Failed to reset password.",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    register,
    verifyOTP,
    login,
    logout,
    resetPasswordRequest,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

