import StaffLoginForm from "@/components/staff-login-form"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function StaffLoginPage() {
  return (
    <main className="min-h-screen flex flex-col scanalyze-gradient">
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/login"
          className="inline-flex items-center text-scanalyze-600 hover:text-scanalyze-800 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patient Login
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Image
              src="/images/scanalyze-logo.png"
              alt="Scanalyze Logo"
              width={300}
              height={100}
              className="mx-auto"
              priority
            />
          </div>

          <StaffLoginForm />
        </div>
      </div>
    </main>
  )
}

