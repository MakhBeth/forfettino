import React from 'react';
import Footer from './components/Footer';
import Home from './components/Home';
import styles from './App.module.css';

const App: React.FC = () => {
  return (
    <div className={styles.app}>
      <Home />
      <Footer />
    </div>
  );
};

export default App;
