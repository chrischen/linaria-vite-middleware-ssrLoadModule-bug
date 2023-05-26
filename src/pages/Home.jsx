import { css, cx } from '@linaria/core';
import { addAndMultiply } from '../add'
import { multiplyAndAdd } from '../multiply'
import styles from './Home.module.css';

const header = css`
  text-transform: uppercase;
  font-size: 3em
`;

export default function Home() {
  return (
    <>
      <h1 className={cx(header, styles.test)}>Home</h1>
      <div>{addAndMultiply(1, 2, 3)}</div>
      <div>{multiplyAndAdd(1, 2, 3)}</div>
    </>
  )
}
