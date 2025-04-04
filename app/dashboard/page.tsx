import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col scanalyze-gradient">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center md:justify-start">
          <Image src="/images/scanalyze-logo.png" alt="Scanalyze Logo" width={180} height={60} priority />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 scanalyze-card p-8 rounded-lg">
          <h1 className="text-3xl font-bold scanalyze-heading">Welcome to Scanalyze</h1>
          <p className="text-gray-600">You have successfully logged in to your account.</p>
          <p className="text-gray-600">This is a placeholder dashboard page.</p>

          <div className="pt-4">
            <Link href="/login">
              <Button variant="outline" className="scanalyze-button-outline">
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

