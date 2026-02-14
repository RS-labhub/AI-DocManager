"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Clock, Mail } from "lucide-react"

export default function PendingApprovalPage() {
  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 mx-auto mb-4">
            <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-xl font-semibold">Approval Pending</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your organization membership is awaiting approval
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="pt-6 pb-4 space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Your account has been created successfully, but you need to be approved
                by a <strong className="text-foreground">Super Admin</strong> of your organization
                before you can access the dashboard.
              </p>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="font-medium text-foreground text-sm">What happens next?</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Contact your organization&apos;s Super Admin to approve your request</li>
                  <li>Once approved, you can log in and access the dashboard</li>
                  <li>You&apos;ll be able to see all organization documents and features</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium mb-1">Are you a Super Admin?</p>
                    <p>
                      To get Super Admin access, contact the platform administrator
                      at <strong>rs4101976@gmail.com</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pb-6 flex flex-col gap-3">
            <Button asChild variant="outline" className="w-full h-10">
              <Link href="/login">Back to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
