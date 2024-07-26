import { ArrowLeft } from 'framework7-icons-plus/react'
import Link from 'next/link'
import s from './release-notes.module.scss'

type ReleaseNote = {
  version: string
  date: string
  description: string[]
}

const releaseNotes: ReleaseNote[] = [
  {
    version: '1.2.0',
    date: '2024-07-26',
    description: ['Moved to pp.land'],
  },
  {
    version: '1.1.0',
    date: '2023-08-11',
    description: [
      'Added T-shirt sizing',
      'Improved accessibility',
      'Optimized performance',
      'You can now cancel your vote',
    ],
  },
  {
    version: '1.0.0',
    date: '2023-08-04',
    description: ['Initial release'],
  },
]

const ReleaseNotes = () => {
  return (
    <div className={s.releaseNotes}>
      <Link href="/" className={s.back}>
        <ArrowLeft /> Home
      </Link>

      <h1 className={s.title}>Release Notes</h1>

      <div className={s.releases}>
        {releaseNotes.map(({ version, date, description }, index) => (
          <div key={index} className={s.release}>
            <h2 className={s.version}>{version}</h2>
            <h3 className={s.date}>{date}</h3>
            <ul className={s.description}>
              {description.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ReleaseNotes
