import { globalStore } from '@/store'
import { Provider } from 'jotai'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { PlanningPokerLayout } from './PlanningPokerLayout'
import './fonts.css'
import './globals.scss'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Planning Poker</title>
        <meta
          name="description"
          content="The world's simplest Planning Poker."
        />
        <meta property="og:title" content="Planning Poker" />
        <meta
          property="og:description"
          content="The world's simplest Planning Poker."
        />
        <meta property="og:image" content="https://pp.land/og/og-image.png" />
      </Head>
      <Provider store={globalStore}>
        <PlanningPokerLayout>
          <Component {...pageProps} />
        </PlanningPokerLayout>
      </Provider>
    </>
  )
}
