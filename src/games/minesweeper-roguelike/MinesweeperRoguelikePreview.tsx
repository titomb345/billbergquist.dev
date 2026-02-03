import styles from './MinesweeperRoguelikePreview.module.css';

function MinesweeperRoguelikePreview() {
  // Mini representation of a minesweeper board with roguelike elements
  const cells = [
    '',
    '',
    '1',
    '',
    '',
    '1',
    '1',
    '2',
    '1',
    '1',
    '*',
    '1',
    '',
    '1',
    '*',
    '1',
    '1',
    '',
    '1',
    '1',
    '',
    '',
    '',
    '',
    '',
  ];

  return (
    <div className={styles.minesweeperPreview}>
      <div className={styles.floorIndicator}>F1</div>
      <div className={styles.gridArea}>
        {cells.map((cell, i) => (
          <div
            key={i}
            className={`${styles.mineCell} ${cell ? styles.revealed : ''} ${cell === '*' ? styles.mine : ''} ${cell && cell !== '*' ? styles.number : ''}`}
          >
            {cell === '*' ? '💣' : cell}
          </div>
        ))}
      </div>
      <div className={styles.powerUpIndicator}>🛡️</div>
    </div>
  );
}

export default MinesweeperRoguelikePreview;
