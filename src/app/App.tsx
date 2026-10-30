import { AppShell } from '@/components/layout/AppShell'
import ComingSoon from '@/pages/ComingSoon'
import ComposePage from '@/pages/ComposePage/ComposePage'
import ExplorePage from '@/pages/ExplorePage/ExplorePage'
import ImportPage from '@/pages/ImportPage/ImportPage'
import { useSessionStore } from '@/state/sessionStore'
import { ErrorBoundary } from './ErrorBoundary'

export default function App() {
  const stage = useSessionStore((s) => s.stage)
  const hasData = useSessionStore((s) => s.result !== null)

  const page =
    stage === 'import' || !hasData ? (
      <ImportPage />
    ) : stage === 'explore' ? (
      <ExplorePage />
    ) : stage === 'compose' ? (
      <ComposePage />
    ) : (
      <ComingSoon stage={stage} />
    )

  return (
    <ErrorBoundary>
      <AppShell>{page}</AppShell>
    </ErrorBoundary>
  )
}