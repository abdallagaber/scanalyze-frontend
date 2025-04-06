import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex-1 w-full h-full flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 w-full scanalyze-gradient">
        <div className="container mx-auto h-full px-4 py-12 md:py-24 flex flex-col items-center justify-center">
          <div className="mb-12">
            <Image
              src="/images/scanalyze-logo.png"
              alt="Scanalyze Logo"
              width={400}
              height={133}
              priority
            />
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-center text-scanalyze-800 mb-6">
            Innovative Healthcare Solutions
          </h1>

          <p className="text-lg text-center text-gray-600 max-w-2xl mb-12">
            Advanced laboratory testing and medical scans with fast, accurate
            results. Your health information at your fingertips.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/login">
              <Button
                size="lg"
                className="scanalyze-button-primary px-8 py-6 text-lg h-auto"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="scanalyze-button-outline px-8 py-6 text-lg h-auto"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
