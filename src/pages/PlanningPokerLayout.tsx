import { LogoGithub } from 'framework7-icons-plus/react'
import { useRouter } from 'next/router'
import s from './PlanningPokerLayout.module.scss'
import { SocketProvider } from './SocketProvider'

export const PlanningPokerLayout = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const router = useRouter()

  return (
    <>
      <div className={s.container}>
        <SocketProvider>{children}</SocketProvider>
      </div>
      {router.pathname !== '/cards' && (
        <a
          className={s.footer}
          href="https://github.com/jhaemin/planning-poker"
          target="_blank"
        >
          <LogoGithub />
          GitHub
        </a>
      )}
    </>
  )
}
