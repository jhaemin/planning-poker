import dynamic from 'next/dynamic'
import s from './cards.page.module.scss'

const CardsCSR = dynamic(() => import('./CardsCSRWrapper'), {
  ssr: false,
})

export default function CardsWindow() {
  return (
    <div className={s.container}>
      <CardsCSR />
    </div>
  )
}
