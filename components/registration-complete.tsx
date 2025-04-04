import { Card, CardContent } from "@/components/ui/card"
import { Clock, CheckCircle2 } from "lucide-react"

export function RegistrationComplete() {
  return (
    <Card className="overflow-hidden scanalyze-card">
      <div className="bg-yellow-50 py-6 px-4 sm:px-6 border-b border-yellow-100">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
            <span className="absolute bottom-0 right-0 block h-6 w-6 rounded-full bg-yellow-400 ring-2 ring-white flex items-center justify-center">
              <span className="text-white font-medium text-xs">24h</span>
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-yellow-800">Account Pending Activation</h2>
          <p className="mt-2 text-sm text-yellow-700">Your registration has been submitted successfully</p>
        </div>
      </div>

      <CardContent className="pt-6 pb-8 px-6">
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              Registration Complete
            </h3>
            <p className="text-sm text-gray-600">
              Your account has been created successfully and is now awaiting activation by our team.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">What happens next?</h3>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-scanalyze-600 flex items-center justify-center text-white font-medium">
                1
              </div>
              <div>
                <p className="text-sm text-gray-700">Our team will review your information within 24 hours</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-scanalyze-600 flex items-center justify-center text-white font-medium">
                2
              </div>
              <div>
                <p className="text-sm text-gray-700">Once approved, your account will be activated</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-scanalyze-600 flex items-center justify-center text-white font-medium">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 flex items-center">
                  You'll receive a notification via WhatsApp
                  <span className="ml-2 inline-flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-600 text-center">
              If you have any questions, please contact our support team at{" "}
              <span className="font-medium">support@example.com</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

