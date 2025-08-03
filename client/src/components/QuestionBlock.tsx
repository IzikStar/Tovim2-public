import React from 'react';
import styles from './QuestionBlock.module.css';

interface Props {
  label: string;
  children: React.ReactNode;
}

const QuestionBlock: React.FC<Props> = ({ label, children }) => (
  <div className={styles.block}>
    <label className={styles.label}>{label}</label>
    <div className={styles.content}>{children}</div>
  </div>
);

export default QuestionBlock;
