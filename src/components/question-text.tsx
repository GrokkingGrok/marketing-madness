export function QuestionText({ text }: { text: string }) {
  if (!text.trim()) return <p className="question-copy empty-clue">This clue has no question yet.</p>;
  const parts = text.split(/_{3,}/);
  return (
    <p className="question-copy">
      {parts.map((part, index) => (
        <span key={index}>
          {part}
          {index < parts.length - 1 ? <span className="blank" aria-hidden="true" /> : null}
        </span>
      ))}
    </p>
  );
}
