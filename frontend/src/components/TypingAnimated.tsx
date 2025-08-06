import React, { useEffect, useState } from 'react';

interface TypingAnimationProps {
  text: string;
  className?: string;
  speed?: number;
  pauseBetweenWords?: number;
}

const TypingHeader: React.FC<{ text: string }> = ({ text }) => {
  const words = text.split(' ');
  const [displayed, setDisplayed] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    if (wordIdx < words.length) {
      if (charIdx < words[wordIdx].length) {
    const timeout = setTimeout(() => {
      setDisplayed(
        words
          .slice(0, wordIdx)
          .join(' ') +
          (wordIdx > 0 ? ' ' : '') +
          words[wordIdx].slice(0, charIdx + 1)
      );
      setCharIdx(charIdx + 1);
    }, 80);
    return () => clearTimeout(timeout);
      } else {
    const timeout = setTimeout(() => {
      setDisplayed(
        words.slice(0, wordIdx + 1).join(' ')
      );
      setWordIdx(wordIdx + 1);
      setCharIdx(0);
    }, 250);
    return () => clearTimeout(timeout);
      }
    }
  }, [charIdx, wordIdx, words]);

  return (
    <h1 className="text-2xl font-bold text-gray-900">
      {displayed}
      {wordIdx < words.length && <span className="typing-cursor">_</span>}
    </h1>
  );
};

const TypingText: React.FC<TypingAnimationProps> = ({ 
  text, 
  className = '', 
  speed = 80, 
  pauseBetweenWords = 250 
}) => {
  const words = text.split(' ');
  const [displayed, setDisplayed] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    if (wordIdx < words.length) {
      if (charIdx < words[wordIdx].length) {
        const timeout = setTimeout(() => {
          setDisplayed(
            words
              .slice(0, wordIdx)
              .join(' ') +
              (wordIdx > 0 ? ' ' : '') +
              words[wordIdx].slice(0, charIdx + 1)
          );
          setCharIdx(charIdx + 1);
        }, speed);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setDisplayed(
            words.slice(0, wordIdx + 1).join(' ')
          );
          setWordIdx(wordIdx + 1);
          setCharIdx(0);
        }, pauseBetweenWords);
        return () => clearTimeout(timeout);
      }
    }
  }, [charIdx, wordIdx, words, speed, pauseBetweenWords]);

  return (
    <span className={className}>
      {displayed}
      {wordIdx < words.length && <span className="typing-cursor">_</span>}
    </span>
  );
};

export { TypingHeader };
export default TypingText;