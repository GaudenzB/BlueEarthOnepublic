import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  return (
    <>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>Dashboard functionality is under development</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The dashboard will provide insights and analytics for company operations.
            </p>
            <Button variant="outline" className="w-full">View Employee Directory</Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
