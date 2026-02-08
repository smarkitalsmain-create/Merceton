import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function DatabaseError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-destructive">Database Connection Required</CardTitle>
          <CardDescription>
            DATABASE_URL is not configured. Please set it up to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Quick Setup:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Create a free PostgreSQL database at{" "}
                <a
                  href="https://neon.tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Neon.tech
                </a>
              </li>
              <li>Copy the connection string from your Neon dashboard</li>
              <li>
                Add it to <code className="bg-muted px-1 py-0.5 rounded">.env.local</code> as:
                <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                  {`DATABASE_URL="your-connection-string-here"`}
                </pre>
              </li>
              <li>Restart your development server</li>
            </ol>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> After adding DATABASE_URL, run:
            </p>
            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
              npx prisma generate{'\n'}
              npx prisma db push
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
