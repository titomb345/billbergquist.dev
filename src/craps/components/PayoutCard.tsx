import { PAYOUT_TABLE } from '../constants';
import styles from './PayoutCard.module.css';

export function PayoutCard() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>Payouts & Odds</div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Bet</th>
            <th>Payout</th>
            <th>Edge</th>
          </tr>
        </thead>
        <tbody>
          {PAYOUT_TABLE.map((row) => (
            <tr key={row.type}>
              <td>{row.label}</td>
              <td>{row.payout}</td>
              <td className={styles.edge}>{row.edge}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
