import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HomeCards() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow overflow-hidden">
          <div className="h-48 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2L3 7v11h14V7l-7-5z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 font-medium">Wavy Planter</p>
            </div>
          </div>
          <CardHeader>
            <CardTitle>Wavy Planter</CardTitle>
            <CardDescription>
              Create beautiful wavy planters with customizable wave patterns and dimensions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full">
              <a href="/planter/wavy/top">Top Part</a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href="/planter/wavy/bottom">Bottom Part</a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href="/planter/wavy/connector">Connector</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
