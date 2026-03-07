import { useNavigate } from 'react-router-dom'
import styles from './NotFound.module.css'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>404</h2>
      <p className={styles.desc}>似乎掉到了虫洞外面？</p>
      <button className={styles.homeBtn} onClick={() => navigate('/')}>返回主页</button>
    </div>
  )
}
