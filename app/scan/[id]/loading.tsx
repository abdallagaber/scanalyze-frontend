import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ScanLoading() {
  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient info skeleton */}
          <div className="p-4 border rounded-md bg-muted/30">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Scan image skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-full h-[400px] bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Report skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="p-4 border rounded-md">
              <div className="space-y-2">
                <div className="h-5 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-4/5 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
