import React from 'react';
import ForfettarioApp from './ForfettarioApp';
import styles from './Home.module.css';

const Home: React.FC = () => {
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <ForfettarioApp />
      </div>
    </main>
  );
};

export default Home;
