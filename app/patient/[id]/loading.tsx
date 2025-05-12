import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PatientProfileLoading() {
  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-8">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-40" />
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="tests">Lab Tests</TabsTrigger>
          <TabsTrigger value="scans">Scans</TabsTrigger>
        </TabsList>

        {/* Loading state for information tab */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-5 w-64" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-5 w-64" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-3">
                      <Skeleton className="h-6 w-36" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-5 w-full mb-2" />
                      <Skeleton className="h-5 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loading state for tests tab */}
        <TabsContent value="tests">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-5 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-[200px]" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <Skeleton className="h-5 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-4" />
                          <div className="flex gap-2 mt-4">
                            <Skeleton className="h-9 flex-1" />
                            <Skeleton className="h-9 flex-1" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Loading state for scans tab */}
        <TabsContent value="scans">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-5 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-[200px]" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <Skeleton className="h-48 w-full" />
                        <CardContent className="p-4">
                          <Skeleton className="h-5 w-1/2 mb-2" />
                          <Skeleton className="h-4 w-1/3 mb-4" />
                          <div className="flex gap-2 mt-4">
                            <Skeleton className="h-9 flex-1" />
                            <Skeleton className="h-9 flex-1" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
