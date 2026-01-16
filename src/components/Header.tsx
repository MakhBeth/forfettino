import React from 'react';
import { Github } from 'lucide-react';
import styles from './Header.module.css';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'ForfettAIro' }) => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <h1 className={styles.logoText}>{title}</h1>
          <p className={styles.logoSubtext}>Vibecoded Gestione P.IVA Semplificata</p>
        </div>
        <nav className={styles.nav}>
          <a 
            href="https://github.com/MakhBeth/forfettAIro" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.githubLink}
            aria-label="View on GitHub"
          >
            <Github size={20} />
            <span>GitHub</span>
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
