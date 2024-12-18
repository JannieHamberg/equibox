import styles from "./scrolltext.module.css";

const ScrollTextBar = () => {
  const textContent = [
    "En box för varje ryttare – Hobby, junior och tävlingsryttaren!",
    "En box för varje ryttare – Hobby, junior och tävlingsryttaren!",
    "En box för varje ryttare – Hobby, junior och tävlingsryttaren!",
  
  ];

  return (
    <section className={styles["scrolltext-container"]}>
      <div className={styles.scrolltext}>
        {textContent.map((text, index) => (
          <span key={index}>{text}</span>
        ))}
        {/* Duplicate spans to make scrolling seamless */}
        {textContent.map((text, index) => (
          <span key={`duplicate-${index}`}>{text}</span>
        ))}
      </div>
    </section>
  );
};

export default ScrollTextBar;
