import AppLayout from '@/components/layout/AppLayout'

export default function DevLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  )
}
