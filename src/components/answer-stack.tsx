export function AnswerStack({ answers }: { answers: string[] }) {
  const lines = answers.map((answer) => answer.trim()).filter(Boolean);
  if (lines.length === 0) return <p className="answer-line">No answer yet.</p>;
  return (
    <div className="answer-stack">
      {lines.map((answer, index) => (
        <div key={`${answer}-${index}`} className="answer-block">
          {index > 0 ? <p className="or-word">or</p> : null}
          <p className="answer-line">{answer}</p>
        </div>
      ))}
    </div>
  );
}
