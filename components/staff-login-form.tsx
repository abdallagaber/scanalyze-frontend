"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/lib/axios";
import Cookies from "js-cookie";
import { toast } from "sonner";

// Create schema for Email login
const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// Create schema for Phone Number login
const phoneSchema = z.object({
  phone: z
    .string()
    .regex(/^01[0125][0-9]{8}$/, {
      message: "Please enter a valid Egyptian phone number (e.g., 01XXXXXXXXX)",
    })
    .refine(
      (val) => {
        // Check if it starts with a valid Egyptian mobile prefix
        return ["010", "011", "012", "015"].some((prefix) =>
          val.startsWith(prefix)
        );
      },
      {
        message: "Egyptian phone numbers must start with 010, 011, 012, or 015",
      }
    ),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function StaffLoginForm() {
  const [activeTab, setActiveTab] = useState<string>("email");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Form for Email login
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Form for Phone Number login
  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const onSubmitEmail = async (values: z.infer<typeof emailSchema>) => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.post(
        "/api/v1/auth/staff/login/email",
        values
      );

      // Set user data in cookies
      Cookies.set("role", response.data.user.role);
      Cookies.set("token", response.data.token);
      Cookies.set(
        "user",
        JSON.stringify({
          name: response.data.user.name,
          email: response.data.user.email,
          imageProfile: response.data.user.imageProfile || "",
        })
      );

      // Redirect based on role
      switch (response.data.user.role) {
        case "Admin":
          router.push("/dashboard/admin");
          break;
        case "Receptionist":
          router.push("/dashboard/receptionist");
          break;
        case "LabTechnician":
          router.push("/dashboard/lab-technician");
          break;
      }

      toast.success("Login successful!", {
        className: "bg-green-500 text-white",
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Login failed. Please try again.",
        {
          className: "bg-red-500 text-white",
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPhone = async (values: z.infer<typeof phoneSchema>) => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.post(
        "/api/v1/auth/staff/login/phone",
        values
      );

      // Set user data in cookies
      Cookies.set("role", response.data.user.role);
      Cookies.set("token", response.data.token);
      Cookies.set(
        "user",
        JSON.stringify({
          name: response.data.user.name,
          email: response.data.user.email,
          imageProfile: response.data.user.imageProfile || "",
        })
      );

      // Redirect based on role
      switch (response.data.user.role) {
        case "Admin":
          router.push("/dashboard/admin");
          break;
        case "Receptionist":
          router.push("/dashboard/receptionist");
          break;
        case "LabTechnician":
          router.push("/dashboard/lab-technician");
          break;
      }

      toast.success("Login successful!", {
        className: "bg-green-500 text-white",
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Login failed. Please try again.",
        {
          className: "bg-red-500 text-white",
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Card className="scanalyze-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center scanalyze-heading">
          Staff Sign In
        </CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access the staff portal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="email"
          onValueChange={setActiveTab}
          value={activeTab}
        >
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone Number</TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <Form {...emailForm}>
              <form
                onSubmit={emailForm.handleSubmit(onSubmitEmail)}
                className="space-y-4"
              >
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            onClick={togglePasswordVisibility}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-scanalyze-600 hover:text-scanalyze-800"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full scanalyze-button-primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="phone">
            <Form {...phoneForm}>
              <form
                onSubmit={phoneForm.handleSubmit(onSubmitPhone)}
                className="space-y-4"
              >
                <FormField
                  control={phoneForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your Egyptian phone number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={phoneForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            onClick={togglePasswordVisibility}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-scanalyze-600 hover:text-scanalyze-800"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full scanalyze-button-primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Are you a patient?{" "}
            <Link
              href="/login"
              className="font-medium text-scanalyze-600 hover:text-scanalyze-800"
            >
              Login here
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
