import React from 'react';
import styles from './Footer.module.css';

interface FooterProps {
  version?: string;
}

const Footer: React.FC<FooterProps> = ({ version = '1.0.0' }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.left}>
          <p className={styles.copyright}>
            © {currentYear} ForfettAIro - Vibecoded
          </p>
          <p className={styles.description}>
            App per gestire il regime forfettario - P.IVA italiana
          </p>
        </div>
        <div className={styles.right}>
          <span className={styles.version}>v{version}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
