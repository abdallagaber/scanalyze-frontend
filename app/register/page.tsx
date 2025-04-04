import RegistrationForm from "@/components/registration-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex flex-col scanalyze-gradient">
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center text-scanalyze-600 hover:text-scanalyze-800 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8">
          <Image
            src="/images/scanalyze-logo.png"
            alt="Scanalyze Logo"
            width={250}
            height={83}
            className="mx-auto"
            priority
          />
          <h1 className="text-2xl md:text-3xl font-bold text-center mt-6 mb-8 text-scanalyze-800">
            Account Registration
          </h1>
        </div>
        <RegistrationForm />
      </div>
    </main>
  )
}

