"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Update the validation for National ID and phone number
// Replace the existing schema definitions with these:

const nationalIdSchema = z.object({
  nationalId: z
    .string()
    .regex(/^[23][0-9]{13}$/, {
      message: "Egyptian National ID must be 14 digits and start with 2 or 3",
    })
    .refine(
      (val) => {
        // Basic validation for birth date format in the ID (positions 1-7)
        const century = val.charAt(0) === "2" ? "19" : "20"
        const year = val.substring(1, 3)
        const month = val.substring(3, 5)
        const day = val.substring(5, 7)

        // Convert to date and check if valid
        const birthDate = new Date(`${century}${year}-${month}-${day}`)
        const isValidDate = !isNaN(birthDate.getTime())

        // Check if month is between 01-12 and day is valid for that month
        const monthNum = Number.parseInt(month, 10)
        const dayNum = Number.parseInt(day, 10)
        const isValidMonth = monthNum >= 1 && monthNum <= 12

        // Simple check for valid day (not accounting for leap years)
        const daysInMonth = [0, 31, 29, 31, 30, 31, 30, 31, 30, 31, 30, 31]
        const isValidDay = dayNum >= 1 && dayNum <= daysInMonth[monthNum]

        return isValidDate && isValidMonth && isValidDay
      },
      {
        message: "National ID contains an invalid birth date",
      },
    ),
  password: z.string().min(1, { message: "Password is required" }),
})

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
        return ["010", "011", "012", "015"].some((prefix) => val.startsWith(prefix))
      },
      {
        message: "Egyptian phone numbers must start with 010, 011, 012, or 015",
      },
    ),
  password: z.string().min(1, { message: "Password is required" }),
})

export default function LoginForm() {
  const [activeTab, setActiveTab] = useState<string>("nationalId")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  // Form for National ID login
  const nationalIdForm = useForm<z.infer<typeof nationalIdSchema>>({
    resolver: zodResolver(nationalIdSchema),
    defaultValues: {
      nationalId: "",
      password: "",
    },
  })

  // Form for Phone Number login
  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  })

  const onSubmitNationalId = (values: z.infer<typeof nationalIdSchema>) => {
    console.log("Login with National ID:", values)
    // In a real app, you would handle authentication here
    // For now, we'll just simulate a successful login
    router.push("/dashboard")
  }

  const onSubmitPhone = (values: z.infer<typeof phoneSchema>) => {
    console.log("Login with Phone:", values)
    // In a real app, you would handle authentication here
    // For now, we'll just simulate a successful login
    router.push("/dashboard")
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <Card className="scanalyze-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center scanalyze-heading">Sign In</CardTitle>
        <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="nationalId" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="nationalId">National ID</TabsTrigger>
            <TabsTrigger value="phone">Phone Number</TabsTrigger>
          </TabsList>

          <TabsContent value="nationalId">
            <Form {...nationalIdForm}>
              <form onSubmit={nationalIdForm.handleSubmit(onSubmitNationalId)} className="space-y-4">
                <FormField
                  control={nationalIdForm.control}
                  name="nationalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>National ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your 14-digit National ID" {...field} maxLength={14} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={nationalIdForm.control}
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
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-right">
                  <Link href="/forgot-password" className="text-sm text-scanalyze-600 hover:text-scanalyze-800">
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" className="w-full scanalyze-button-primary">
                  Sign In
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="phone">
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onSubmitPhone)} className="space-y-4">
                <FormField
                  control={phoneForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your Egyptian phone number" {...field} />
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
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-right">
                  <Link href="/forgot-password" className="text-sm text-scanalyze-600 hover:text-scanalyze-800">
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" className="w-full scanalyze-button-primary">
                  Sign In
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

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-scanalyze-600 hover:text-scanalyze-800">
              Register now
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            Staff member?{" "}
            <Link href="/login/staff" className="font-medium text-scanalyze-600 hover:text-scanalyze-800">
              Staff login
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}

