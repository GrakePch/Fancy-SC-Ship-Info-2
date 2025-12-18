import styles from './NotFound.module.css'

export default function NotFound() {
  return (
    <div className={styles.root}>
      <h2 className={styles.title}>404 — Page not found</h2>
      <p className={styles.desc}>The page you requested doesn't exist.</p>
    </div>
  )
}
