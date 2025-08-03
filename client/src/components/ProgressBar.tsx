import React from 'react';
import styles from './ProgressBar.module.css';

interface Props {
  percent: number;
}

const ProgressBar: React.FC<Props> = ({ percent }) => (
  <div className={styles.wrapper}>
    <div className={styles.bar} style={{ width: `${percent}%` }} />
  </div>
);

export default ProgressBar;
