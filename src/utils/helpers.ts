export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const QUICK_ACTIONS = [
  { label: 'Mathématiques', prompt: 'Je veux apprendre les mathématiques', icon: '📐' },
  { label: 'Programmation', prompt: 'Je veux apprendre la programmation', icon: '💻' },
  { label: 'Langues', prompt: 'Je veux apprendre une nouvelle langue', icon: '🌍' },
  { label: 'Sciences', prompt: 'Je veux apprendre les sciences', icon: '🔬' },
  { label: 'Histoire', prompt: 'Je veux apprendre l\'histoire', icon: '📚' },
  { label: 'Philosophie', prompt: 'Je veux apprendre la philosophie', icon: '🤔' },
];

export const SUGGESTIONS = [
  "Explique-moi ce concept avec un exemple",
  "Donne-moi un exercice pratique",
  "Résume ce que j'ai appris",
  "Quel est le niveau suivant ?",
  "Je n'ai pas compris, reformule",
];
