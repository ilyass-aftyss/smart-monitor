import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import GreenSidebar from './GreenSidebar'
import GreenTopBar from './GreenTopBar'

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
      animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -8,   filter: 'blur(3px)' }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function Layout() {
  const location = useLocation()

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#EEF5F8',
    }}>
      {/* Left sidebar */}
      <GreenSidebar />

      {/* Main area */}
      <div style={{
        marginLeft: 72,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        overflow: 'hidden',
      }}>
        <GreenTopBar />

        <main style={{
          flex: 1,
          padding: '20px 20px 32px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
