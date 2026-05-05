import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
